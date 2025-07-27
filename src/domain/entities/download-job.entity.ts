export interface AudioMetadata {
  title: string;
  artist?: string;
  duration: number;
  thumbnail: string;
  quality: string;
  fileSize?: number;
  videoId: string;
}

export enum DownloadStatus {
  QUEUED = 'queued',
  DOWNLOADING = 'downloading',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum DownloadPriority {
  LOW = 1,
  NORMAL = 2,
  HIGH = 3,
}

export class DownloadJob {
  constructor(
    public readonly id: string,
    public readonly youtubeUrl: string,
    public readonly socketId: string,
    public status: DownloadStatus = DownloadStatus.QUEUED,
    public progress: number = 0,
    public metadata?: AudioMetadata,
    public readonly priority: DownloadPriority = DownloadPriority.NORMAL,
    public readonly quality: string = 'highest',
    public readonly format: string = 'mp3',
    public readonly createdAt: Date = new Date(),
    public startedAt?: Date,
    public completedAt?: Date,
    public error?: string,
    public retryCount: number = 0,
    public lastRetryAt?: Date
  ) {}

  markAsStarted(): void {
    this.status = DownloadStatus.DOWNLOADING;
    this.startedAt = new Date();
  }

  markAsCompleted(): void {
    this.status = DownloadStatus.COMPLETED;
    this.completedAt = new Date();
    this.progress = 100;
  }

  markAsFailed(error: string): void {
    this.status = DownloadStatus.FAILED;
    this.error = error;
  }

  markAsPaused(): void {
    this.status = DownloadStatus.PAUSED;
  }

  markAsCancelled(): void {
    this.status = DownloadStatus.CANCELLED;
  }

  updateProgress(progress: number): void {
    this.progress = Math.max(0, Math.min(100, progress));
  }

  incrementRetry(): void {
    this.retryCount++;
    this.lastRetryAt = new Date();
  }

  canRetry(): boolean {
    return this.retryCount < 3 && this.status === DownloadStatus.FAILED;
  }

  isActive(): boolean {
    return [DownloadStatus.QUEUED, DownloadStatus.DOWNLOADING].includes(
      this.status
    );
  }

  getDurationSinceCreated(): number {
    return Date.now() - this.createdAt.getTime();
  }
}
