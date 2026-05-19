import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DownloadController } from './download.controller';
import { DownloadEntity } from './download.entity';
import { DownloadEventsService } from './download.events';
import { DownloadQueueService } from './download.queue';
import { DownloadRepository } from './download.repository';
import { YtdlpService } from './ytdlp.service';

@Module({
  imports: [TypeOrmModule.forFeature([DownloadEntity])],
  controllers: [DownloadController],
  providers: [
    DownloadRepository,
    YtdlpService,
    DownloadEventsService,
    DownloadQueueService,
  ],
  exports: [
    DownloadRepository,
    YtdlpService,
    DownloadEventsService,
    DownloadQueueService,
  ],
})
export class DownloadModule {}
