import { AudioMetadata } from '@domain/entities/download-job.entity.js';

export interface IYouTubeService {
  /**
   * Valida se a URL é do YouTube
   */
  validateUrl(url: string): boolean;

  /**
   * Extrai informações do vídeo
   */
  getVideoInfo(url: string): Promise<AudioMetadata>;

  /**
   * Baixa o áudio do vídeo
   */
  downloadAudio(
    url: string,
    quality: string,
    progressCallback: (progress: number) => void,
    abortSignal?: unknown
  ): Promise<Buffer>;

  /**
   * Converte o áudio para o formato especificado
   */
  convertAudio(
    audioBuffer: Buffer,
    format: string,
    quality?: string
  ): Promise<Buffer>;
}
