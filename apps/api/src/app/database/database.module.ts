import { Module } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { appConfig } from '../config/app.config';
import { DownloadEntity } from '../download/download.entity';

async function buildOptions(
  config: ConfigType<typeof appConfig>,
): Promise<TypeOrmModuleOptions> {
  await mkdir(dirname(config.dbPath), { recursive: true });
  return {
    type: 'better-sqlite3',
    database: config.dbPath,
    entities: [DownloadEntity],
    synchronize: true,
  };
}

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [appConfig.KEY],
      useFactory: buildOptions,
    }),
  ],
})
export class DatabaseModule {}
