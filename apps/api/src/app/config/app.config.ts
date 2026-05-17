import { registerAs } from '@nestjs/config';
import { homedir } from 'node:os';
import { isAbsolute, resolve } from 'node:path';

export interface AppConfig {
  readonly downloadDir: string;
  readonly maxParallel: number;
  readonly dbPath: string;
}

const DEFAULT_DOWNLOAD_DIR = '~/Downloads/MediaGrab';
const DEFAULT_MAX_PARALLEL = 3;
const DEFAULT_DB_PATH = './data/media-grab.sqlite';

function expandHome(value: string): string {
  if (value === '~') return homedir();
  if (value.startsWith('~/')) return resolve(homedir(), value.slice(2));
  return value;
}

function resolvePath(value: string): string {
  const expanded: string = expandHome(value);
  return isAbsolute(expanded) ? expanded : resolve(process.cwd(), expanded);
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed: number = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) return fallback;
  return parsed;
}

export const appConfig = registerAs<AppConfig>('app', (): AppConfig => ({
  downloadDir: resolvePath(process.env['DOWNLOAD_DIR'] ?? DEFAULT_DOWNLOAD_DIR),
  maxParallel: parsePositiveInt(process.env['MAX_PARALLEL'], DEFAULT_MAX_PARALLEL),
  dbPath: resolvePath(process.env['DB_PATH'] ?? DEFAULT_DB_PATH),
}));

export const APP_CONFIG_KEY = 'app';
