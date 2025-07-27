import { Request, Response } from 'express';
import { Server as SocketIOServer } from 'socket.io';
import { AddDownloadJobUseCase } from '@application/use-cases/add-download-job.use-case.js';
import { DownloaderQueue } from '@infrastructure/cache/services/downloader.queue.js';
import { YouTubeService } from '@infrastructure/youtube/youtube.service.js';
import logger from '@infrastructure/logging/index.js';

/**
 * Controller responsável por gerenciar downloads de áudio do YouTube
 * Inclui operações de criação, controle e monitoramento de jobs de download
 */
export class DownloadController {
  private addDownloadJobUseCase: AddDownloadJobUseCase;
  private downloaderQueue: DownloaderQueue;

  constructor() {
    this.downloaderQueue = new DownloaderQueue();
    const youtubeService = new YouTubeService();
    this.addDownloadJobUseCase = new AddDownloadJobUseCase(
      this.downloaderQueue,
      youtubeService
    );
  }

  /**
   * Configura a instância do Socket.IO para comunicação em tempo real
   * @param io - Instância do servidor Socket.IO
   */
  setSocketIO(io: SocketIOServer): void {
    this.downloaderQueue.setSocketIO(io);
  }

  /**
   * Cria um novo job de download de áudio do YouTube
   * @param req - Request do Express contendo URL, qualidade e formato
   * @param res - Response do Express
   */
  async createDownload(req: Request, res: Response): Promise<void> {
    try {
      const { url, quality = 'highest', format = 'mp3' } = req.body;
      const socketId = req.headers['x-socket-id'] as string;

      if (!socketId) {
        res.status(400).json({
          success: false,
          message: 'Socket ID e obrigatorio',
        });
        return;
      }

      const result = await this.addDownloadJobUseCase.execute({
        url,
        socketId,
        quality,
        format,
      });

      logger.info(
        { jobId: result.id, url, socketId },
        'Download iniciado com sucesso'
      );

      res.status(201).json({
        success: true,
        message: 'Download adicionado a fila',
        data: result,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erro desconhecido';
      logger.error(
        { error: errorMessage, url: req.body.url },
        'Erro ao criar download'
      );

      res.status(400).json({
        success: false,
        message: errorMessage,
      });
    }
  }

  /**
   * Obtém o status de um job de download específico
   * @param req - Request do Express contendo o jobId nos parâmetros
   * @param res - Response do Express
   */
  async getJobStatus(req: Request, res: Response): Promise<void> {
    try {
      const { jobId } = req.params;
      const job = await this.downloaderQueue.getJobById(jobId);

      if (!job) {
        res.status(404).json({
          success: false,
          message: 'Job nao encontrado',
        });
        return;
      }

      res.json({
        success: true,
        data: {
          id: job.id,
          status: job.status,
          progress: job.progress,
          metadata: job.metadata,
          createdAt: job.createdAt,
          startedAt: job.startedAt,
          completedAt: job.completedAt,
          error: job.error,
          retryCount: job.retryCount,
        },
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erro desconhecido';
      logger.error(
        { error: errorMessage, jobId: req.params.jobId },
        'Erro ao buscar status do job'
      );

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
      });
    }
  }

  /**
   * Pausa um job de download em andamento
   * @param req - Request do Express contendo o jobId nos parâmetros
   * @param res - Response do Express
   */
  async pauseJob(req: Request, res: Response): Promise<void> {
    try {
      const { jobId } = req.params;
      await this.downloaderQueue.pauseJob(jobId);

      logger.info({ jobId }, 'Job pausado');

      res.json({
        success: true,
        message: 'Download pausado',
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erro desconhecido';
      logger.error(
        { error: errorMessage, jobId: req.params.jobId },
        'Erro ao pausar job'
      );

      res.status(500).json({
        success: false,
        message: 'Erro ao pausar download',
      });
    }
  }

  /**
   * Retoma um job de download pausado
   * @param req - Request do Express contendo o jobId nos parâmetros
   * @param res - Response do Express
   */
  async resumeJob(req: Request, res: Response): Promise<void> {
    try {
      const { jobId } = req.params;
      await this.downloaderQueue.resumeJob(jobId);

      logger.info({ jobId }, 'Job retomado');

      res.json({
        success: true,
        message: 'Download retomado',
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erro desconhecido';
      logger.error(
        { error: errorMessage, jobId: req.params.jobId },
        'Erro ao retomar job'
      );

      res.status(500).json({
        success: false,
        message: 'Erro ao retomar download',
      });
    }
  }

  /**
   * Cancela um job de download
   * @param req - Request do Express contendo o jobId nos parâmetros
   * @param res - Response do Express
   */
  async cancelJob(req: Request, res: Response): Promise<void> {
    try {
      const { jobId } = req.params;
      await this.downloaderQueue.cancelJob(jobId);

      logger.info({ jobId }, 'Job cancelado');

      res.json({
        success: true,
        message: 'Download cancelado',
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erro desconhecido';
      logger.error(
        { error: errorMessage, jobId: req.params.jobId },
        'Erro ao cancelar job'
      );

      res.status(500).json({
        success: false,
        message: 'Erro ao cancelar download',
      });
    }
  }

  /**
   * Obtém estatísticas da fila de downloads
   * @param _req - Request do Express (não utilizado)
   * @param res - Response do Express
   */
  async getQueueStats(_req: Request, res: Response): Promise<void> {
    try {
      const stats = await this.downloaderQueue.getQueueStats();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erro desconhecido';
      logger.error(
        { error: errorMessage },
        'Erro ao buscar estatisticas da fila'
      );

      res.status(500).json({
        success: false,
        message: 'Erro ao buscar estatisticas',
      });
    }
  }

  /**
   * Processa o download do arquivo de áudio
   * @param req - Request do Express contendo o jobId nos parâmetros
   * @param res - Response do Express
   */
  async downloadFile(req: Request, res: Response): Promise<void> {
    try {
      const { jobId } = req.params;
      const job = await this.downloaderQueue.getJobById(jobId);

      if (!job) {
        res.status(404).json({
          success: false,
          message: 'Job nao encontrado',
        });
        return;
      }

      if (job.status !== 'completed') {
        res.status(400).json({
          success: false,
          message: 'Download ainda nao foi concluido',
        });
        return;
      }

      // Por enquanto, retornar URL de download
      // Na implementação completa, seria o buffer do arquivo
      res.json({
        success: true,
        message: 'Arquivo pronto para download',
        downloadUrl: `/api/downloads/${jobId}/file`,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erro desconhecido';
      logger.error(
        { error: errorMessage, jobId: req.params.jobId },
        'Erro ao processar download do arquivo'
      );

      res.status(500).json({
        success: false,
        message: 'Erro ao processar download',
      });
    }
  }
}
