import { TypeOrmModule } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { DownloadEntity } from './download.entity';
import { DownloadRepository, DownloadInsertInput } from './download.repository';

function buildInput(overrides: Partial<DownloadInsertInput> = {}): DownloadInsertInput {
  return {
    id: 'd-1',
    url: 'https://example.com/v/1',
    platform: 'youtube',
    title: '',
    uploader: '',
    duration: '',
    format: 'best',
    quality: '1080p',
    size: 0,
    downloaded: 0,
    status: 'queued',
    error: null,
    errorDetail: null,
    filePath: null,
    hue: 200,
    createdAt: Date.now(),
    completedAt: null,
    ...overrides,
  };
}

describe('DownloadRepository', () => {
  let module: TestingModule;
  let repository: DownloadRepository;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'better-sqlite3',
          database: ':memory:',
          entities: [DownloadEntity],
          synchronize: true,
          dropSchema: true,
        }),
        TypeOrmModule.forFeature([DownloadEntity]),
      ],
      providers: [DownloadRepository],
    }).compile();
    repository = module.get(DownloadRepository);
  });

  afterEach(async () => {
    await module.close();
  });

  it('inserts and finds by id', async () => {
    const inserted: DownloadEntity = await repository.insert(buildInput());
    expect(inserted.id).toBe('d-1');

    const found: DownloadEntity | null = await repository.findById('d-1');
    expect(found).not.toBeNull();
    expect(found?.url).toBe('https://example.com/v/1');
    expect(found?.status).toBe('queued');
  });

  it('updates status with patch fields', async () => {
    await repository.insert(buildInput());
    await repository.updateStatus('d-1', {
      status: 'completed',
      filePath: '/tmp/file.mp4',
      size: 1024,
      completedAt: 1700000000000,
    });
    const found: DownloadEntity | null = await repository.findById('d-1');
    expect(found?.status).toBe('completed');
    expect(found?.filePath).toBe('/tmp/file.mp4');
    expect(found?.size).toBe(1024);
    expect(found?.completedAt).toBe(1700000000000);
  });

  it('findAll returns rows in createdAt desc order', async () => {
    await repository.insert(buildInput({ id: 'a', createdAt: 100 }));
    await repository.insert(buildInput({ id: 'b', createdAt: 200 }));
    await repository.insert(buildInput({ id: 'c', createdAt: 150 }));
    const all: DownloadEntity[] = await repository.findAll();
    expect(all.map((d: DownloadEntity): string => d.id)).toEqual(['b', 'c', 'a']);
  });

  it('findByStatus filters by status', async () => {
    await repository.insert(buildInput({ id: 'q1', status: 'queued', createdAt: 100 }));
    await repository.insert(buildInput({ id: 'd1', status: 'downloading', createdAt: 200 }));
    await repository.insert(buildInput({ id: 'q2', status: 'queued', createdAt: 300 }));
    const queued: DownloadEntity[] = await repository.findByStatus('queued');
    expect(queued.map((d: DownloadEntity): string => d.id)).toEqual(['q1', 'q2']);
  });

  it('delete removes the row', async () => {
    await repository.insert(buildInput());
    await repository.delete('d-1');
    const found: DownloadEntity | null = await repository.findById('d-1');
    expect(found).toBeNull();
  });

  it('markInterruptedOnBoot flips downloading rows to failed', async () => {
    await repository.insert(buildInput({ id: 'd1', status: 'downloading' }));
    await repository.insert(buildInput({ id: 'd2', status: 'downloading' }));
    await repository.insert(buildInput({ id: 'q1', status: 'queued' }));
    await repository.insert(buildInput({ id: 'c1', status: 'completed' }));

    const interrupted: DownloadEntity[] = await repository.markInterruptedOnBoot();
    expect(interrupted.map((d: DownloadEntity): string => d.id).sort()).toEqual(['d1', 'd2']);

    const failed: DownloadEntity[] = await repository.findByStatus('failed');
    expect(failed.map((d: DownloadEntity): string => d.id).sort()).toEqual(['d1', 'd2']);
    failed.forEach((d: DownloadEntity): void => {
      expect(d.error).toBe('Interrupted by restart');
    });
    const stillQueued: DownloadEntity[] = await repository.findByStatus('queued');
    expect(stillQueued.map((d: DownloadEntity): string => d.id)).toEqual(['q1']);
  });
});
