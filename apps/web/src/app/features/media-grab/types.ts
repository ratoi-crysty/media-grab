export type Platform =
  | 'youtube'
  | 'vimeo'
  | 'tiktok'
  | 'twitch'
  | 'soundcloud'
  | 'twitter';

export type ItemStatus =
  | 'downloading'
  | 'queued'
  | 'completed'
  | 'failed'
  | 'paused';

export type Density = 'compact' | 'comfy';

export type FilterId = 'all' | 'downloading' | 'queued' | 'completed' | 'failed';

export interface DownloadItem {
  id: string;
  platform: Platform;
  title: string;
  uploader: string;
  duration: string;
  format: string;
  quality: string;
  size: number;
  status: ItemStatus;
  downloaded: number;
  speed: number;
  hue: number;
  url: string;
  completedAt?: number;
  error?: string;
  errorDetail?: string;
  queuePosition?: number;
}

export interface Toast {
  id: string;
  kind?: 'info' | 'ok' | 'err';
  title: string;
  sub?: string;
}

export interface AddItemInput {
  url: string;
  platform: Platform | null;
  format: string;
  quality: string;
  subs?: boolean;
  subLang?: string;
  filenameTpl?: string;
}

export type ItemAction =
  | 'pause'
  | 'resume'
  | 'start'
  | 'retry'
  | 'cancel'
  | 'remove'
  | 'open'
  | 'play';

export type BulkAction = 'pause' | 'resume' | 'retry' | 'remove';

export interface StatusCounts {
  all: number;
  downloading: number;
  queued: number;
  completed: number;
  failed: number;
  paused: number;
}
