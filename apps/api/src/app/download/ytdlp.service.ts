import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { spawnSync, SpawnSyncReturns } from 'node:child_process';
import { helpers, VideoInfo, YtDlp } from 'ytdlp-nodejs';
import type { DownloadPreviewModel } from '@media-grab/common';

export interface InstallationStatus {
  readonly ytdlpVersion: string | null;
  readonly ffmpegAvailable: boolean;
}

function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0:00';
  const total: number = Math.floor(seconds);
  const h: number = Math.floor(total / 3600);
  const m: number = Math.floor((total % 3600) / 60);
  const s: number = total % 60;
  const ss: string = String(s).padStart(2, '0');
  if (h > 0) {
    const mm: string = String(m).padStart(2, '0');
    return `${h}:${mm}:${ss}`;
  }
  return `${m}:${ss}`;
}

@Injectable()
export class YtdlpService implements OnModuleInit {
  private readonly logger: Logger = new Logger(YtdlpService.name);
  private ytdlp: YtDlp | null = null;
  private binaryPath: string | null = null;
  private cachedVersion: string | null = null;
  private cachedFfmpegAvailable: boolean = false;

  async onModuleInit(): Promise<void> {
    await this.ensureYtdlpBinary();
    await this.refreshInstallationStatus();
  }

  getInstallationStatus(): InstallationStatus {
    return {
      ytdlpVersion: this.cachedVersion,
      ffmpegAvailable: this.cachedFfmpegAvailable,
    };
  }

  async getPreview(url: string): Promise<DownloadPreviewModel> {
    if (!this.ytdlp) {
      throw new Error('yt-dlp binary unavailable; preview cannot be fetched.');
    }
    const info: VideoInfo = await this.ytdlp.getInfoAsync<'video'>(url);
    return {
      url,
      platform: info.extractor,
      title: info.title,
      uploader: info.uploader,
      duration: info.duration_string ?? formatDuration(info.duration),
      thumbnailUrl: info.thumbnail ?? null,
    };
  }

  private async ensureYtdlpBinary(): Promise<void> {
    let path: string | undefined = helpers.findYtdlpBinary();
    if (!path) {
      this.logger.log('yt-dlp binary not found; downloading…');
      try {
        path = await helpers.downloadYtDlp();
        this.logger.log(`yt-dlp binary downloaded to ${path}`);
      } catch (err: unknown) {
        this.logger.error(
          `Failed to download yt-dlp binary: ${err instanceof Error ? err.message : String(err)}`,
        );
        return;
      }
    }
    this.binaryPath = path ?? null;
    try {
      this.ytdlp = new YtDlp({ binaryPath: path });
    } catch (err: unknown) {
      this.logger.error(
        `Failed to construct YtDlp wrapper: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  private async refreshInstallationStatus(): Promise<void> {
    this.cachedVersion = this.detectYtdlpVersion();
    this.cachedFfmpegAvailable = this.detectFfmpeg();
    if (this.cachedVersion) {
      this.logger.log(`yt-dlp version: ${this.cachedVersion}`);
    } else {
      this.logger.warn('yt-dlp binary not available');
    }
    this.logger.log(
      `ffmpeg available: ${this.cachedFfmpegAvailable ? 'yes' : 'no'}`,
    );
  }

  private detectYtdlpVersion(): string | null {
    if (!this.binaryPath) return null;
    try {
      const result: SpawnSyncReturns<string> = spawnSync(
        this.binaryPath,
        ['--version'],
        { encoding: 'utf-8' },
      );
      if (result.status !== 0) return null;
      const out: string = (result.stdout ?? '').trim();
      return out.length > 0 ? out : null;
    } catch {
      return null;
    }
  }

  private detectFfmpeg(): boolean {
    const bundled: string | undefined = helpers.findFFmpegBinary();
    if (bundled) return true;
    try {
      const result: SpawnSyncReturns<string> = spawnSync('ffmpeg', ['-version'], {
        encoding: 'utf-8',
      });
      return result.status === 0;
    } catch {
      return false;
    }
  }
}
