export type Platform = string;

export type DownloadStatus = 'queued' | 'downloading' | 'completed' | 'failed';

export type DownloadFormat = 'best' | 'mp4' | 'mp3' | 'm4a';

export type DownloadQuality =
  | '2160p'
  | '1440p'
  | '1080p'
  | '720p'
  | '480p'
  | 'audio';

export interface DownloadModel {
  readonly id: string;
  readonly url: string;
  readonly platform: Platform;
  readonly title: string;
  readonly uploader: string;
  readonly duration: string;
  readonly format: DownloadFormat;
  readonly quality: DownloadQuality;
  readonly size: number;
  readonly downloaded: number;
  readonly status: DownloadStatus;
  readonly error: string | null;
  readonly errorDetail: string | null;
  readonly filePath: string | null;
  readonly hue: number;
  readonly createdAt: number;
  readonly completedAt: number | null;
}

export interface DownloadPreviewModel {
  readonly url: string;
  readonly platform: Platform;
  readonly title: string;
  readonly uploader: string;
  readonly duration: string;
  readonly thumbnailUrl: string | null;
}

export interface CreateDownloadInput {
  readonly url: string;
  readonly format: DownloadFormat;
  readonly quality: DownloadQuality;
}
