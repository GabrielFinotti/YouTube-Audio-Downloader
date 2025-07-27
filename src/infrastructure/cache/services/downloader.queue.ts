import { Queue, Worker, QueueEvents, Job } from 'bullmq';
import { Server as SocketIOServer } from 'socket.io';
import redis from '@infrastructure/cache/config/index.js';
import logger from '@infrastructure/logging/index.js';
import {
  DownloadJob,
  DownloadStatus,
} from '@domain/entities/download-job.entity.js';
import { IDownloadQueueRepository } from '@domain/repositories/download-queue.repository.js';

interface DownloadJobData {
  jobId: string;
  url: string;
  socketId: string;
  quality: string;
  format: string;
  retryCount?: number;
}

export class DownloaderQueue implements IDownloadQueueRepository {
  private queue: Queue;
  private worker: Worker;
  private queueEvents: QueueEvents;
  private io?: SocketIOServer;
  private activeDownloads = new Map<string, { signal: boolean }>();

  constructor() {
    // Configuração da fila com retry inteligente
    this.queue = new Queue('download-queue', {
      connection: redis,
      defaultJobOptions: {
        removeOnComplete: 50, // Manter apenas 50 jobs completos
        removeOnFail: 20, // Manter apenas 20 jobs falhados
        attempts: 3, // 3 tentativas máximas
        backoff: {
          type: 'exponential',
          delay: 10000, // 10 segundos base, vai para 20s, depois 40s
        },
        delay: 2000, // Delay de 2s entre jobs (anti-rate-limit)
      },
    });

    // Worker com concorrência baixa para evitar bloqueio do YouTube
    this.worker = new Worker(
      'download-queue',
      this.processDownload.bind(this),
      {
        connection: redis,
        concurrency: 2, // MÁXIMO 2 simultâneos (conservador)
      }
    );

    // Eventos da fila
    this.queueEvents = new QueueEvents('download-queue', {
      connection: redis,
    });

    this.setupEventListeners();
  }

  setSocketIO(io: SocketIOServer): void {
    this.io = io;
  }

  private setupEventListeners(): void {
    // Job iniciado
    this.queueEvents.on('active', ({ jobId }) => {
      logger.info({ jobId }, 'Job iniciado');
    });

    // Job completado
    this.queueEvents.on('completed', ({ jobId, returnvalue }) => {
      logger.info({ jobId, result: returnvalue }, 'Job completado com sucesso');
      this.activeDownloads.delete(jobId);
    });

    // Job falhado
    this.queueEvents.on('failed', ({ jobId, failedReason }) => {
      logger.error({ jobId, error: failedReason }, 'Job falhou');
      this.activeDownloads.delete(jobId);
    });

    // Job travado
    this.queueEvents.on('stalled', ({ jobId }) => {
      logger.warn({ jobId }, 'Job travado - cancelando');
      this.activeDownloads.delete(jobId);
    });

    // Progresso do job
    this.queueEvents.on('progress', ({ jobId, data }) => {
      if (this.io) {
        this.io.emit(`download-progress-${jobId}`, {
          jobId,
          progress: typeof data === 'number' ? data : 0,
          phase: 'processing',
          speed: undefined,
          estimatedTime: undefined,
        });
      }
    });
  }

  async addJob(job: DownloadJob): Promise<string> {
    try {
      const jobData: DownloadJobData = {
        jobId: job.id,
        url: job.youtubeUrl,
        socketId: job.socketId,
        quality: job.quality,
        format: job.format,
        retryCount: job.retryCount,
      };

      const bullJob = await this.queue.add('download-audio', jobData, {
        jobId: job.id,
        priority: job.priority,
        delay: this.calculateDelay(),
      });

      logger.info(
        { jobId: job.id, url: job.youtubeUrl },
        'Job adicionado à fila'
      );
      return bullJob.id as string;
    } catch (error) {
      logger.error({ error, jobId: job.id }, 'Erro ao adicionar job à fila');
      throw error;
    }
  }

  async getJobById(jobId: string): Promise<DownloadJob | null> {
    try {
      const job = await this.queue.getJob(jobId);
      if (!job) {
        return null;
      }

      const downloadJob = new DownloadJob(
        job.id as string,
        job.data.url,
        job.data.socketId,
        this.mapBullStatusToDownloadStatus(await job.getState()),
        job.progress || 0,
        job.returnvalue?.metadata,
        job.opts.priority,
        job.data.quality,
        job.data.format,
        new Date(job.timestamp),
        job.processedOn ? new Date(job.processedOn) : undefined,
        job.finishedOn ? new Date(job.finishedOn) : undefined,
        job.failedReason,
        job.attemptsMade || 0
      );

      return downloadJob;
    } catch (error) {
      logger.error({ error, jobId }, 'Erro ao buscar job');
      return null;
    }
  }

  async updateJobProgress(jobId: string, progress: number): Promise<void> {
    try {
      const job = await this.queue.getJob(jobId);
      if (job) {
        await job.updateProgress(progress);
      }
    } catch (error) {
      logger.error({ error, jobId, progress }, 'Erro ao atualizar progresso');
    }
  }

  async updateJobStatus(
    jobId: string,
    status: DownloadStatus,
    error?: string
  ): Promise<void> {
    // BullMQ gerencia status automaticamente, mas podemos registrar
    logger.info({ jobId, status, error }, 'Status do job atualizado');
  }

  async pauseJob(jobId: string): Promise<void> {
    try {
      const job = await this.queue.getJob(jobId);
      if (job) {
        // Remover download ativo
        this.activeDownloads.delete(jobId);

        // Pausar job
        await this.queue.pause();
        logger.info({ jobId }, 'Job pausado');
      }
    } catch (error) {
      logger.error({ error, jobId }, 'Erro ao pausar job');
      throw error;
    }
  }

  async resumeJob(jobId: string): Promise<void> {
    try {
      await this.queue.resume();
      logger.info({ jobId }, 'Job retomado');
    } catch (error) {
      logger.error({ error, jobId }, 'Erro ao retomar job');
      throw error;
    }
  }

  async cancelJob(jobId: string): Promise<void> {
    try {
      const job = await this.queue.getJob(jobId);
      if (job) {
        // Remover download ativo
        this.activeDownloads.delete(jobId);

        // Remover job
        await job.remove();

        logger.info({ jobId }, 'Job cancelado');
      }
    } catch (error) {
      logger.error({ error, jobId }, 'Erro ao cancelar job');
      throw error;
    }
  }

  async getActiveJobs(): Promise<DownloadJob[]> {
    try {
      const [waiting, active] = await Promise.all([
        this.queue.getWaiting(),
        this.queue.getActive(),
      ]);

      const allJobs = [...waiting, ...active];
      const downloadJobs: DownloadJob[] = [];

      for (const job of allJobs) {
        const downloadJob = await this.getJobById(job.id as string);
        if (downloadJob) {
          downloadJobs.push(downloadJob);
        }
      }

      return downloadJobs;
    } catch (error) {
      logger.error({ error }, 'Erro ao buscar jobs ativos');
      return [];
    }
  }

  async getQueueStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
  }> {
    try {
      const stats = await this.queue.getJobCounts(
        'waiting',
        'active',
        'completed',
        'failed'
      );
      return {
        waiting: stats.waiting || 0,
        active: stats.active || 0,
        completed: stats.completed || 0,
        failed: stats.failed || 0,
      };
    } catch (error) {
      logger.error({ error }, 'Erro ao buscar estatísticas da fila');
      return { waiting: 0, active: 0, completed: 0, failed: 0 };
    }
  }

  async cleanupOldJobs(): Promise<void> {
    try {
      // Remove jobs completos mais antigos que 1 hora
      await this.queue.clean(60 * 60 * 1000, 100, 'completed');
      // Remove jobs falhados mais antigos que 24 horas
      await this.queue.clean(24 * 60 * 60 * 1000, 50, 'failed');

      logger.info('Limpeza de jobs antigos realizada');
    } catch (error) {
      logger.error({ error }, 'Erro na limpeza de jobs antigos');
    }
  }

  /**
   * Processa um job de download
   * @param job Job do BullMQ contendo dados do download
   * @returns Promise com resultado do processamento
   */
  private async processDownload(job: Job<DownloadJobData>): Promise<void> {
    const { jobId, socketId } = job.data;

    // Registrar download ativo
    this.activeDownloads.set(jobId, { signal: false });

    try {
      // Aqui será implementado o download real
      // Por agora, vou simular o processo

      await job.updateProgress(5);
      await this.emitProgress(socketId, {
        jobId,
        progress: 5,
        phase: 'fetching',
        message: 'Obtendo informações do vídeo...',
      });

      // Simular delay anti-rate-limit
      await this.sleep(2000);

      await job.updateProgress(100);
      await this.emitProgress(socketId, {
        jobId,
        progress: 100,
        phase: 'completed',
        message: 'Download concluído!',
      });

      logger.info({ jobId }, 'Download processado com sucesso');
    } catch (error) {
      logger.error({ error, jobId }, 'Erro no processamento do download');
      throw error;
    } finally {
      this.activeDownloads.delete(jobId);
    }
  }

  /**
   * Emite progresso para o cliente via WebSocket
   * @param socketId ID do socket do cliente
   * @param data Dados de progresso do download
   */
  private async emitProgress(
    socketId: string,
    data: Record<string, unknown>
  ): Promise<void> {
    if (this.io) {
      this.io.to(socketId).emit('download-progress', data);
    }
  }

  private mapBullStatusToDownloadStatus(bullStatus: string): DownloadStatus {
    switch (bullStatus) {
      case 'waiting':
        return DownloadStatus.QUEUED;
      case 'active':
        return DownloadStatus.DOWNLOADING;
      case 'completed':
        return DownloadStatus.COMPLETED;
      case 'failed':
        return DownloadStatus.FAILED;
      default:
        return DownloadStatus.QUEUED;
    }
  }

  private calculateDelay(): number {
    // Delay progressivo baseado na carga atual
    const baseDelay = 2000; // 2 segundos base
    const randomJitter = Math.random() * 1000; // Jitter de 0-1s
    return baseDelay + randomJitter;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async close(): Promise<void> {
    await this.worker.close();
    await this.queue.close();
    await this.queueEvents.close();
  }
}
