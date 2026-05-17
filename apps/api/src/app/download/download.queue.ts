import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { rm } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { appConfig } from '../config/app.config';
import { DownloadEntity } from './download.entity';
import { DownloadInsertInput, DownloadRepository } from './download.repository';
import {
  SpawnHandle,
  SpawnProgress,
  SpawnResult,
  YtdlpService,
} from './ytdlp.service';
import type {
  CreateDownloadInput,
  DownloadPreviewModel,
} from '@media-grab/common';

export interface RunningJob {
  readonly id: string;
  readonly handle: SpawnHandle;
  downloaded: number;
  total: number;
  speed: number;
}

@Injectable()
export class DownloadQueueService implements OnModuleInit {
  private readonly logger: Logger = new Logger(DownloadQueueService.name);
  private readonly running: Map<string, RunningJob> = new Map();
  private draining: boolean = false;

  constructor(
    private readonly repo: DownloadRepository,
    private readonly ytdlp: YtdlpService,
    @Inject(appConfig.KEY) private readonly config: ConfigType<typeof appConfig>,
  ) {}

  async onModuleInit(): Promise<void> {
    void this.tryDrain();
  }

  getRunningProgress(id: string): SpawnProgress | null {
    const job: RunningJob | undefined = this.running.get(id);
    if (!job) return null;
    return { downloaded: job.downloaded, total: job.total, speed: job.speed };
  }

  async enqueue(
    input: CreateDownloadInput,
    preview: DownloadPreviewModel,
  ): Promise<DownloadEntity> {
    const id: string = `d-${randomUUID()}`;
    const insertInput: DownloadInsertInput = {
      id,
      url: input.url,
      platform: preview.platform,
      title: preview.title,
      uploader: preview.uploader,
      duration: preview.duration,
      format: input.format,
      quality: input.quality,
      size: 0,
      downloaded: 0,
      status: 'queued',
      error: null,
      errorDetail: null,
      filePath: null,
      hue: Math.floor(Math.random() * 360),
      createdAt: Date.now(),
      completedAt: null,
    };
    const row: DownloadEntity = await this.repo.insert(insertInput);
    void this.tryDrain();
    return row;
  }

  async cancel(id: string): Promise<void> {
    const job: RunningJob | undefined = this.running.get(id);
    if (job) {
      job.handle.kill();
      return;
    }
    const row: DownloadEntity | null = await this.repo.findById(id);
    if (!row) return;
    if (row.status === 'queued') {
      await this.repo.updateStatus(id, {
        status: 'failed',
        error: 'Cancelled by user',
        errorDetail: null,
      });
    }
  }

  async retry(id: string): Promise<DownloadEntity | null> {
    const row: DownloadEntity | null = await this.repo.findById(id);
    if (!row) return null;
    const preview: DownloadPreviewModel = {
      url: row.url,
      platform: row.platform,
      title: row.title,
      uploader: row.uploader,
      duration: row.duration,
      thumbnailUrl: null,
    };
    return this.enqueue(
      { url: row.url, format: row.format, quality: row.quality },
      preview,
    );
  }

  async remove(id: string): Promise<void> {
    const job: RunningJob | undefined = this.running.get(id);
    if (job) {
      await new Promise<void>((resolve: () => void): void => {
        job.handle.result.finally((): void => resolve());
        job.handle.kill();
      });
    }
    await this.repo.delete(id);
  }

  async tryDrain(): Promise<void> {
    if (this.draining) return;
    this.draining = true;
    try {
      while (this.running.size < this.config.maxParallel) {
        const queued: DownloadEntity[] = await this.repo.findByStatus('queued');
        const next: DownloadEntity | undefined = queued.find(
          (d: DownloadEntity): boolean => !this.running.has(d.id),
        );
        if (!next) break;
        await this.startJob(next);
      }
    } finally {
      this.draining = false;
    }
  }

  private async startJob(row: DownloadEntity): Promise<void> {
    await this.repo.updateStatus(row.id, { status: 'downloading' });
    const job: RunningJob = {
      id: row.id,
      handle: undefined as unknown as SpawnHandle,
      downloaded: 0,
      total: 0,
      speed: 0,
    };
    job.handle = this.ytdlp.spawn(
      {
        url: row.url,
        format: row.format,
        quality: row.quality,
        downloadDir: this.config.downloadDir,
      },
      (p: SpawnProgress): void => {
        job.downloaded = p.downloaded;
        job.total = p.total;
        job.speed = p.speed;
      },
    );
    this.running.set(row.id, job);

    void job.handle.result.then(
      async (result: SpawnResult): Promise<void> => {
        this.running.delete(row.id);
        await this.repo.updateStatus(row.id, {
          status: 'completed',
          filePath: result.filePath,
          size: result.size,
          completedAt: Date.now(),
        });
        this.logger.log(`completed ${row.id} → ${result.filePath}`);
        void this.tryDrain();
      },
      async (err: unknown): Promise<void> => {
        this.running.delete(row.id);
        const failure: { stderr?: string; killed?: boolean } =
          (err as { failure?: { stderr?: string; killed?: boolean } }).failure ?? {};
        const isCancelled: boolean = failure.killed === true;
        const errorMsg: string = isCancelled
          ? 'Cancelled by user'
          : 'Download failed';
        const errorDetail: string = failure.stderr
          ? failure.stderr.split('\n').slice(-5).join('\n')
          : err instanceof Error
            ? err.message
            : String(err);
        await this.repo.updateStatus(row.id, {
          status: 'failed',
          error: errorMsg,
          errorDetail,
        });
        if (isCancelled) {
          await this.cleanupPartial(row.id);
        }
        this.logger.warn(`failed ${row.id}: ${errorMsg}`);
        void this.tryDrain();
      },
    );
  }

  private async cleanupPartial(id: string): Promise<void> {
    const row: DownloadEntity | null = await this.repo.findById(id);
    if (!row || !row.filePath) return;
    try {
      await rm(row.filePath, { force: true });
      await rm(`${row.filePath}.part`, { force: true });
    } catch (err: unknown) {
      this.logger.warn(
        `Failed to clean partial for ${id}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}
