import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { spawnSync, SpawnSyncReturns } from 'node:child_process';
import youtubeDl from 'youtube-dl-exec';
import type { Flags, Payload } from 'youtube-dl-exec';
import type {
  DownloadFormat,
  DownloadPreviewModel,
  DownloadQuality,
} from '@media-grab/common';
import { mapToYtDlpFormat, YtDlpFormatArgs } from './format-mapper';

const FILEPATH_MARKER = '[MEDIA-GRAB-FILEPATH]';
const PROGRESS_MARKER = '[MEDIA-GRAB-PROG]';
const PROGRESS_TEMPLATE = `download:${PROGRESS_MARKER}%(progress.downloaded_bytes)s|%(progress.total_bytes)s|%(progress.total_bytes_estimate)s|%(progress.speed)s`;

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

interface TinyspawnSubprocess extends Promise<TinyspawnChild> {
  readonly stdout: NodeJS.ReadableStream | null;
  readonly stderr: NodeJS.ReadableStream | null;
  kill(signal?: NodeJS.Signals): boolean;
  killed: boolean;
  exitCode: number | null;
}

interface TinyspawnChild {
  readonly stdout: string;
  readonly stderr: string;
  readonly exitCode: number | null;
  readonly signalCode: NodeJS.Signals | null;
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

function toNum(v: string | undefined): number {
  if (!v) return 0;
  const n: number = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function parseProgress(line: string): SpawnProgress | null {
  const idx: number = line.indexOf(PROGRESS_MARKER);
  if (idx < 0) return null;
  const payload: string = line.slice(idx + PROGRESS_MARKER.length).trim();
  const parts: string[] = payload.split('|');
  const downloaded: number = toNum(parts[0]);
  const total: number = toNum(parts[1]) || toNum(parts[2]);
  const speed: number = toNum(parts[3]);
  return { downloaded, total, speed };
}

@Injectable()
export class YtdlpService implements OnModuleInit {
  private readonly logger: Logger = new Logger(YtdlpService.name);
  private cachedVersion: string | null = null;
  private cachedFfmpegAvailable = false;

  async onModuleInit(): Promise<void> {
    await this.refreshInstallationStatus();
  }

  getInstallationStatus(): InstallationStatus {
    return {
      ytdlpVersion: this.cachedVersion,
      ffmpegAvailable: this.cachedFfmpegAvailable,
    };
  }

  async getPreview(url: string): Promise<DownloadPreviewModel> {
    const info: Payload = (await youtubeDl(url, {
      dumpSingleJson: true,
      noWarnings: true,
      skipDownload: true,
    } as Flags)) as Payload;
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
    const formatArgs: YtDlpFormatArgs = mapToYtDlpFormat(input.format, input.quality);
    const flags: Flags & Record<string, unknown> = {
      format: formatArgs.format,
      output: '%(extractor)s/%(uploader)s - %(title)s [%(id)s].%(ext)s',
      paths: input.downloadDir,
      newline: true,
      noWarnings: true,
      noOverwrites: true,
      progressTemplate: PROGRESS_TEMPLATE,
      print: `after_move:${FILEPATH_MARKER}%(filepath)s`,
    };
    if (formatArgs.extractAudio && formatArgs.audioFormat) {
      flags.extractAudio = true;
      flags.audioFormat = formatArgs.audioFormat;
    }

    const sub: TinyspawnSubprocess = youtubeDl.exec(
      input.url,
      flags as Flags,
    ) as unknown as TinyspawnSubprocess;

    let stdoutBuf = '';
    let filePath = '';
    let lastTotal = 0;
    let lastDownloaded = 0;
    let killed = false;

    sub.stdout?.on('data', (chunk: Buffer): void => {
      stdoutBuf += chunk.toString();
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
        const progress: SpawnProgress | null = parseProgress(line);
        if (progress) {
          lastDownloaded = progress.downloaded || lastDownloaded;
          if (progress.total > 0) lastTotal = progress.total;
          onProgress({
            downloaded: lastDownloaded,
            total: lastTotal,
            speed: progress.speed,
          });
        }
      }
    });

    const result: Promise<SpawnResult> = sub.then(
      (child: TinyspawnChild): SpawnResult => {
        if (child.exitCode === 0 && filePath) {
          return { filePath, size: lastTotal };
        }
        const failure: SpawnFailure = {
          exitCode: child.exitCode,
          stderr: (child.stderr ?? '').trim(),
          killed,
        };
        const err: Error & { failure?: SpawnFailure } = new Error(
          killed
            ? 'Cancelled by user'
            : `yt-dlp exited with code ${child.exitCode}: ${(child.stderr ?? '').trim().split('\n').slice(-3).join(' ')}`,
        );
        err.failure = failure;
        throw err;
      },
      (err: unknown): never => {
        const stderrText: string =
          (err as { stderr?: string }).stderr?.trim() ??
          (err instanceof Error ? err.message : String(err));
        const failure: SpawnFailure = {
          exitCode: (err as { exitCode?: number | null }).exitCode ?? null,
          stderr: stderrText,
          killed,
        };
        const wrapped: Error & { failure?: SpawnFailure } = new Error(
          killed ? 'Cancelled by user' : stderrText.split('\n').slice(-3).join(' '),
        );
        wrapped.failure = failure;
        throw wrapped;
      },
    );

    const kill = (): void => {
      if (sub.killed || sub.exitCode !== null) return;
      killed = true;
      sub.kill('SIGTERM');
      setTimeout((): void => {
        if (sub.killed || sub.exitCode !== null) return;
        sub.kill('SIGKILL');
      }, 3000).unref();
    };

    return { kill, result };
  }

  private async refreshInstallationStatus(): Promise<void> {
    this.cachedVersion = await this.detectYtdlpVersion();
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

  private async detectYtdlpVersion(): Promise<string | null> {
    try {
      const out: string | Payload = await youtubeDl(undefined as unknown as string, {
        version: true,
      } as Flags);
      const text: string = typeof out === 'string' ? out : '';
      const trimmed: string = text.trim();
      return trimmed.length > 0 ? trimmed : null;
    } catch (err: unknown) {
      this.logger.warn(
        `youtubeDl({version:true}) failed: ${err instanceof Error ? err.message : String(err)}`,
      );
      return null;
    }
  }

  private detectFfmpeg(): boolean {
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
