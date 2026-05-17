import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import type { DownloadStatus } from '@media-grab/common';
import { DownloadEntity } from './download.entity';

export type DownloadInsertInput = Omit<DownloadEntity, 'completedAt'> &
  Partial<Pick<DownloadEntity, 'completedAt'>>;

export interface StatusUpdate {
  readonly status: DownloadStatus;
  readonly error?: string | null;
  readonly errorDetail?: string | null;
  readonly filePath?: string | null;
  readonly completedAt?: number | null;
  readonly size?: number;
}

@Injectable()
export class DownloadRepository {
  constructor(
    @InjectRepository(DownloadEntity)
    private readonly repo: Repository<DownloadEntity>,
  ) {}

  async insert(input: DownloadInsertInput): Promise<DownloadEntity> {
    const entity: DownloadEntity = this.repo.create({
      completedAt: null,
      ...input,
    });
    return this.repo.save(entity);
  }

  async updateStatus(id: string, patch: StatusUpdate): Promise<void> {
    await this.repo.update({ id }, patch);
  }

  async findById(id: string): Promise<DownloadEntity | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findAll(): Promise<DownloadEntity[]> {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  async findByStatus(
    status: DownloadStatus | DownloadStatus[],
  ): Promise<DownloadEntity[]> {
    const where = Array.isArray(status) ? { status: In(status) } : { status };
    return this.repo.find({ where, order: { createdAt: 'ASC' } });
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete({ id });
  }

  async markInterruptedOnBoot(): Promise<DownloadEntity[]> {
    const active: DownloadEntity[] = await this.findByStatus('downloading');
    if (active.length === 0) return [];
    const ids: string[] = active.map((row: DownloadEntity): string => row.id);
    await this.repo.update(
      { id: In(ids) },
      {
        status: 'failed',
        error: 'Interrupted by restart',
        errorDetail: null,
      },
    );
    return active;
  }
}
