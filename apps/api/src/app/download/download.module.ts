import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DownloadController } from './download.controller';
import { DownloadEntity } from './download.entity';
import { DownloadRepository } from './download.repository';
import { YtdlpService } from './ytdlp.service';

@Module({
  imports: [TypeOrmModule.forFeature([DownloadEntity])],
  controllers: [DownloadController],
  providers: [DownloadRepository, YtdlpService],
  exports: [DownloadRepository, YtdlpService],
})
export class DownloadModule {}
