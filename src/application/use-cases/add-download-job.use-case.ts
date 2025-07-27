import { v4 as uuidv4 } from 'uuid';
import {
  DownloadJob,
  DownloadPriority,
} from '@domain/entities/download-job.entity.js';
import { IDownloadQueueRepository } from '@domain/repositories/download-queue.repository.js';
import { IYouTubeService } from '@domain/services/youtube.service.js';
import {
  CreateDownloadJobDto,
  JobStatusDto,
} from '@application/dtos/download.dto.js';
import logger from '@infrastructure/logging/index.js';

/**
 * Use case responsável por adicionar novos jobs de download na fila
 * Valida URLs, verifica limites e cria jobs com metadados do vídeo
 */
export class AddDownloadJobUseCase {
  constructor(
    private readonly downloadQueueRepository: IDownloadQueueRepository,
    private readonly youtubeService: IYouTubeService
  ) {}

  /**
   * Executa a criação de um novo job de download
   * @param dto - Dados do job de download a ser criado
   * @returns Promise com o status do job criado
   * @throws Error se a URL for inválida ou limite de downloads atingido
   */
  async execute(dto: CreateDownloadJobDto): Promise<JobStatusDto> {
    try {
      // Validar URL do YouTube
      if (!this.youtubeService.validateUrl(dto.url)) {
        throw new Error('URL invalida. Deve ser um link do YouTube.');
      }

      // Verificar se não há muitos downloads ativos
      const activeJobs = await this.downloadQueueRepository.getActiveJobs();
      if (activeJobs.length >= 5) {
        throw new Error(
          'Limite de downloads simultaneos atingido (5). Tente novamente em alguns minutos.'
        );
      }

      // Extrair metadados do vídeo
      const metadata = await this.youtubeService.getVideoInfo(dto.url);

      // Criar job
      const jobId = uuidv4();
      const downloadJob = new DownloadJob(
        jobId,
        dto.url,
        dto.socketId,
        undefined, // status padrão
        0, // progress inicial
        metadata,
        (dto.priority as DownloadPriority) || DownloadPriority.NORMAL,
        dto.quality || 'highest',
        dto.format || 'mp3'
      );

      // Adicionar na fila
      await this.downloadQueueRepository.addJob(downloadJob);

      logger.info(
        {
          jobId,
          url: dto.url,
          title: metadata.title,
          socketId: dto.socketId,
        },
        'Job de download adicionado a fila'
      );

      // Retornar status do job
      return {
        id: downloadJob.id,
        status: downloadJob.status,
        progress: downloadJob.progress,
        metadata: downloadJob.metadata,
        createdAt: downloadJob.createdAt,
        retryCount: downloadJob.retryCount,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erro desconhecido';
      logger.error(
        { error: errorMessage, url: dto.url },
        'Erro ao adicionar job na fila'
      );
      throw error;
    }
  }
}
