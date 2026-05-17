import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DownloadEntity } from './download.entity';
import { DownloadRepository } from './download.repository';

@Module({
  imports: [TypeOrmModule.forFeature([DownloadEntity])],
  providers: [DownloadRepository],
  exports: [DownloadRepository],
})
export class DownloadModule {}
