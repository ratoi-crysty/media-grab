import type {
  DownloadFormat,
  DownloadModel,
  DownloadPreviewModel,
  DownloadQuality,
  DownloadStatus,
} from '@media-grab/common';

export type Download = DownloadModel;
export type Preview = DownloadPreviewModel;
export type Format = DownloadFormat;
export type Quality = DownloadQuality;
export type ItemStatus = DownloadStatus;

export type KnownPlatform =
  | 'youtube'
  | 'vimeo'
  | 'tiktok'
  | 'twitch'
  | 'soundcloud'
  | 'twitter';

export type Density = 'compact' | 'comfy';

export type FilterId = 'all' | 'downloading' | 'queued' | 'completed' | 'failed';

export interface Toast {
  id: string;
  kind?: 'info' | 'ok' | 'err';
  title: string;
  sub?: string;
}

export interface AddItemInput {
  url: string;
  format: Format;
  quality: Quality;
}

export type ItemAction = 'retry' | 'cancel' | 'remove';

export type BulkAction = 'retry' | 'remove';

export interface StatusCounts {
  all: number;
  downloading: number;
  queued: number;
  completed: number;
  failed: number;
}
