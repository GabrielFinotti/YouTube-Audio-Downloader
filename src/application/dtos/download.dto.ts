export interface CreateDownloadJobDto {
  url: string;
  socketId: string;
  quality?: string;
  format?: string;
  priority?: number;
}

export interface JobStatusDto {
  id: string;
  status: string;
  progress: number;
  metadata?: {
    title: string;
    artist?: string;
    duration: number;
    thumbnail: string;
    quality: string;
    fileSize?: number;
    videoId: string;
  };
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  retryCount: number;
  estimatedTimeRemaining?: number;
}

export interface QueueStatsDto {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  totalProcessed: number;
  averageProcessingTime: number;
}

export interface DownloadProgressDto {
  jobId: string;
  progress: number;
  downloaded: number;
  total: number;
  speed: number;
  estimatedTimeRemaining: number;
  currentPhase: 'fetching' | 'downloading' | 'converting' | 'completed';
}
