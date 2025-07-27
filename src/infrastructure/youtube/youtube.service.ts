import ytdl from '@distube/ytdl-core';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import { PassThrough } from 'stream';
import { AudioMetadata } from '@domain/entities/download-job.entity.js';
import { IYouTubeService } from '@domain/services/youtube.service.js';
import logger from '@infrastructure/logging/index.js';

// Configurar FFmpeg - usa o binário estático ou o FFmpeg do sistema
if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic);
}

export class YouTubeService implements IYouTubeService {
  private readonly userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  ];

  validateUrl(url: string): boolean {
    const youtubeRegex =
      /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)/;
    return youtubeRegex.test(url);
  }

  async getVideoInfo(url: string, attempt: number = 1): Promise<AudioMetadata> {
    try {
      logger.info({ url, attempt }, 'Obtendo informacoes do video');

      const info = await ytdl.getInfo(url, {
        requestOptions: {
          headers: {
            'User-Agent': this.getRandomUserAgent(),
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate',
            DNT: '1',
            Connection: 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
          },
          // timeout: 30000, // Removido - não suportado pela versão atual
        },
      });

      const videoDetails = info.videoDetails;
      const audioFormats = info.formats.filter(
        format => format.hasAudio && !format.hasVideo
      );
      const bestAudio = audioFormats[0];

      const metadata: AudioMetadata = {
        title: videoDetails.title,
        artist: videoDetails.author?.name || 'Unknown',
        duration: parseInt(videoDetails.lengthSeconds || '0'),
        thumbnail: videoDetails.thumbnails[0]?.url || '',
        quality: bestAudio?.audioBitrate
          ? `${bestAudio.audioBitrate}kbps`
          : 'unknown',
        fileSize: bestAudio?.contentLength
          ? parseInt(bestAudio.contentLength)
          : undefined,
        videoId: videoDetails.videoId,
      };

      logger.info(
        { videoId: metadata.videoId, title: metadata.title },
        'Metadados obtidos com sucesso'
      );
      return metadata;
    } catch (error) {
      if (attempt < 3) {
        const delay = 10000 * attempt; // 10s, 20s, 30s
        logger.warn(
          { url, attempt, delay },
          `Tentativa ${attempt} falhou, tentando novamente em ${delay / 1000}s`
        );
        await this.sleep(delay);
        return this.getVideoInfo(url, attempt + 1);
      }

      const errorMessage =
        error instanceof Error ? error.message : 'Erro desconhecido';
      logger.error(
        { url, error: errorMessage, attempt },
        'Erro ao obter informacoes do video apos 3 tentativas'
      );
      throw new Error(`Erro ao obter informacoes do video: ${errorMessage}`);
    }
  }

  async downloadAudio(
    url: string,
    quality: string,
    progressCallback: (progress: number) => void,
    abortSignal?: unknown,
    attempt: number = 1
  ): Promise<Buffer> {
    try {
      logger.info({ url, quality, attempt }, 'Iniciando download de audio');

      // Delay anti-rate-limit progressivo
      if (attempt > 1) {
        const delay = Math.min(10000 * attempt, 60000); // Max 1 minuto
        logger.info(
          { delay: delay / 1000 },
          `Aguardando ${delay / 1000}s antes da tentativa ${attempt}`
        );
        await this.sleep(delay);
      }

      // Verificar se foi cancelado
      if (abortSignal && (abortSignal as any)?.aborted) {
        throw new Error('Download cancelado');
      }

      const info = await ytdl.getInfo(url);
      const audioFormat = this.selectBestAudioFormat(info.formats, quality);

      if (!audioFormat) {
        throw new Error('Nenhum formato de audio disponivel');
      }

      return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        let downloaded = 0;
        const totalSize = parseInt(audioFormat.contentLength || '0');

        const stream = ytdl(url, {
          format: audioFormat,
          requestOptions: {
            headers: {
              'User-Agent': this.getRandomUserAgent(),
              Range: 'bytes=0-',
            },
            // timeout: 60000, // Removido - não suportado pela versão atual
          },
          highWaterMark: 1024 * 512, // 512KB chunks (mais estável)
        });

        // Handler para cancelamento (simplificado - implementação básica)
        // Em uma implementação completa, seria necessário um AbortController adequado

        stream.on('data', (chunk: Buffer) => {
          chunks.push(chunk);
          downloaded += chunk.length;

          if (totalSize > 0) {
            const progress = (downloaded / totalSize) * 80; // 80% para download, 20% para conversão
            progressCallback(Math.round(progress));
          }
        });

        stream.on('end', () => {
          const audioBuffer = Buffer.concat(chunks);
          logger.info(
            {
              url,
              size: audioBuffer.length,
              totalSize,
            },
            'Download de audio concluido'
          );
          resolve(audioBuffer);
        });

        stream.on('error', error => {
          logger.error(
            { url, attempt, error: (error as Error).message },
            `Erro no stream (tentativa ${attempt})`
          );
          reject(error);
        });

        // Timeout de segurança
        setTimeout(() => {
          stream.destroy();
          reject(new Error('Timeout no download apos 5 minutos'));
        }, 300000); // 5 minutos máximo
      });
    } catch (error) {
      if (attempt < 3 && this.isRetryableError(error)) {
        logger.warn(
          { url, attempt, error: (error as Error).message },
          'Tentativa de download falhou, tentando novamente'
        );
        return this.downloadAudio(
          url,
          quality,
          progressCallback,
          abortSignal,
          attempt + 1
        );
      }

      logger.error(
        { url, attempt, error: (error as Error).message },
        'Download falhou apos todas as tentativas'
      );
      throw error;
    }
  }

  async convertAudio(
    audioBuffer: Buffer,
    format: string,
    quality?: string
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        logger.info(
          { format, quality, inputSize: audioBuffer.length },
          'Iniciando conversao de audio'
        );

        const inputStream = new PassThrough();
        const outputChunks: Buffer[] = [];
        const outputStream = new PassThrough();

        outputStream.on('data', (chunk: Buffer) => {
          outputChunks.push(chunk);
        });

        outputStream.on('end', () => {
          const convertedBuffer = Buffer.concat(outputChunks);
          logger.info(
            {
              format,
              inputSize: audioBuffer.length,
              outputSize: convertedBuffer.length,
            },
            'Conversao de audio concluida'
          );
          resolve(convertedBuffer);
        });

        ffmpeg(inputStream)
          .format(format)
          .audioCodec('libmp3lame')
          .audioBitrate(this.getAudioBitrate(quality))
          .audioFrequency(44100)
          .audioChannels(2)
          .on('error', error => {
            logger.error(
              { error: (error as Error).message, format },
              'Erro na conversao de audio'
            );
            reject(new Error(`Erro na conversao: ${(error as Error).message}`));
          })
          .pipe(outputStream);

        // Enviar dados para o stream de entrada
        inputStream.end(audioBuffer);
      } catch (error) {
        logger.error(
          { error: (error as Error).message, format },
          'Erro ao configurar conversao'
        );
        reject(error);
      }
    });
  }

  // @ts-ignore - Permitir any temporariamente para compatibilidade com ytdl-core
  private selectBestAudioFormat(formats: any[], quality: string): any {
    const audioFormats = formats.filter(
      format => format.hasAudio && !format.hasVideo
    );

    if (quality === 'highest') {
      return audioFormats.reduce((best, current) => {
        const bestBitrate = parseInt(best?.audioBitrate || '0');
        const currentBitrate = parseInt(current?.audioBitrate || '0');
        return currentBitrate > bestBitrate ? current : best;
      });
    }

    if (quality === 'lowest') {
      return audioFormats.reduce((best, current) => {
        const bestBitrate = parseInt(best?.audioBitrate || '999999');
        const currentBitrate = parseInt(current?.audioBitrate || '999999');
        return currentBitrate < bestBitrate ? current : best;
      });
    }

    // Procurar qualidade específica (ex: "128kbps")
    const targetBitrate = parseInt(quality.replace(/\D/g, ''));
    return (
      audioFormats.find(
        format =>
          Math.abs(parseInt(format.audioBitrate || '0') - targetBitrate) <= 32
      ) || audioFormats[0]
    );
  }

  private getAudioBitrate(quality?: string): number {
    if (!quality) {
      return 192;
    }

    const bitrate = parseInt(quality.replace(/\D/g, ''));
    return bitrate || 192;
  }

  // @ts-ignore - Permitir any temporariamente para compatibilidade com error handling
  private isRetryableError(error: unknown): boolean {
    const retryableErrors = [
      'ECONNRESET',
      'ENOTFOUND',
      'ECONNREFUSED',
      'ETIMEDOUT',
      'EAI_AGAIN',
      '429', // Rate limit
      '503', // Service unavailable
      '502', // Bad gateway
      'Status code: 429',
      'Status code: 503',
      'Status code: 502',
    ];

    const errorMessage = (error as Error)?.message || '';
    return retryableErrors.some(
      code =>
        errorMessage.includes(code) ||
        (error as { code?: string })?.code === code
    );
  }

  private getRandomUserAgent(): string {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
