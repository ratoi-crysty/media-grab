import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ChildProcess, spawn, spawnSync, SpawnSyncReturns } from 'node:child_process';
import { helpers, stringToProgress, VideoInfo, VideoProgress, YtDlp } from 'ytdlp-nodejs';
import type {
  DownloadFormat,
  DownloadPreviewModel,
  DownloadQuality,
} from '@media-grab/common';
import { mapToYtDlpFormat, YtDlpFormatArgs } from './format-mapper';

const FILEPATH_MARKER: string = '[MEDIA-GRAB-FILEPATH]';

export interface SpawnInput {
  readonly url: string;
  readonly format: DownloadFormat;
  readonly quality: DownloadQuality;
  readonly downloadDir: string;
}

export interface SpawnProgress {
  readonly downloaded: number;
  readonly total: number;
  readonly speed: number;
}

export interface SpawnResult {
  readonly filePath: string;
  readonly size: number;
}

export interface SpawnFailure {
  readonly exitCode: number | null;
  readonly stderr: string;
  readonly killed: boolean;
}

export interface SpawnHandle {
  readonly kill: () => void;
  readonly result: Promise<SpawnResult>;
}

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

  spawn(
    input: SpawnInput,
    onProgress: (p: SpawnProgress) => void,
  ): SpawnHandle {
    if (!this.binaryPath) {
      throw new Error('yt-dlp binary unavailable; spawn is not possible.');
    }
    const formatArgs: YtDlpFormatArgs = mapToYtDlpFormat(input.format, input.quality);
    const outputTemplate: string =
      '%(extractor)s/%(uploader)s - %(title)s [%(id)s].%(ext)s';
    const args: string[] = [
      input.url,
      '-f',
      formatArgs.format,
      '-o',
      outputTemplate,
      '-P',
      input.downloadDir,
      '--newline',
      '--no-warnings',
      '--no-overwrites',
      '--print',
      `after_move:${FILEPATH_MARKER}%(filepath)s`,
    ];
    if (formatArgs.extractAudio && formatArgs.audioFormat) {
      args.push('--extract-audio', '--audio-format', formatArgs.audioFormat);
    }

    const child: ChildProcess = spawn(this.binaryPath, args);
    let stderrBuf: string = '';
    let stdoutBuf: string = '';
    let filePath: string = '';
    let lastTotal: number = 0;
    let lastDownloaded: number = 0;
    let killed: boolean = false;

    child.stdout?.on('data', (chunk: Buffer): void => {
      const text: string = chunk.toString();
      stdoutBuf += text;
      let nl: number = stdoutBuf.indexOf('\n');
      while (nl !== -1) {
        const line: string = stdoutBuf.slice(0, nl);
        stdoutBuf = stdoutBuf.slice(nl + 1);
        nl = stdoutBuf.indexOf('\n');
        const markerIdx: number = line.indexOf(FILEPATH_MARKER);
        if (markerIdx !== -1) {
          filePath = line.slice(markerIdx + FILEPATH_MARKER.length).trim();
          continue;
        }
        const progress: VideoProgress | undefined = stringToProgress(line);
        if (progress) {
          const downloaded: number = progress.downloaded ?? lastDownloaded;
          const total: number = progress.total ?? lastTotal;
          lastDownloaded = downloaded;
          if (total > 0) lastTotal = total;
          onProgress({ downloaded, total: lastTotal, speed: progress.speed ?? 0 });
        }
      }
    });

    child.stderr?.on('data', (chunk: Buffer): void => {
      stderrBuf += chunk.toString();
    });

    const result: Promise<SpawnResult> = new Promise<SpawnResult>(
      (resolve, reject) => {
        child.on('error', (err: Error): void => reject(err));
        child.on('close', (code: number | null): void => {
          if (code === 0 && filePath) {
            resolve({ filePath, size: lastTotal });
            return;
          }
          const failure: SpawnFailure = {
            exitCode: code,
            stderr: stderrBuf.trim(),
            killed,
          };
          const err: Error & { failure?: SpawnFailure } = new Error(
            killed
              ? 'Cancelled by user'
              : `yt-dlp exited with code ${code}: ${stderrBuf.trim().split('\n').slice(-3).join(' ')}`,
          );
          err.failure = failure;
          reject(err);
        });
      },
    );

    const kill = (): void => {
      if (child.killed || child.exitCode !== null) return;
      killed = true;
      child.kill('SIGTERM');
      setTimeout((): void => {
        if (child.killed || child.exitCode !== null) return;
        child.kill('SIGKILL');
      }, 3000).unref();
    };

    return { kill, result };
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
