import {
  DownloadJob,
  DownloadStatus,
} from '../entities/download-job.entity.js';

export interface IDownloadQueueRepository {
  /**
   * Adiciona um novo job na fila
   */
  addJob(job: DownloadJob): Promise<string>;

  /**
   * Obtém o status de um job específico
   */
  getJobById(jobId: string): Promise<DownloadJob | null>;

  /**
   * Atualiza o progresso de um job
   */
  updateJobProgress(jobId: string, progress: number): Promise<void>;

  /**
   * Atualiza o status de um job
   */
  updateJobStatus(
    jobId: string,
    status: DownloadStatus,
    error?: string
  ): Promise<void>;

  /**
   * Pausa um job específico
   */
  pauseJob(jobId: string): Promise<void>;

  /**
   * Retoma um job pausado
   */
  resumeJob(jobId: string): Promise<void>;

  /**
   * Cancela um job
   */
  cancelJob(jobId: string): Promise<void>;

  /**
   * Obtém jobs ativos (em execução ou na fila)
   */
  getActiveJobs(): Promise<DownloadJob[]>;

  /**
   * Remove jobs antigos completados
   */
  cleanupOldJobs(): Promise<void>;

  /**
   * Obtém estatísticas da fila
   */
  getQueueStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
  }>;
}
