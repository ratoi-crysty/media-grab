import type { DownloadFormat, DownloadQuality } from '@media-grab/common';

export interface YtDlpFormatArgs {
  readonly format: string;
  readonly extractAudio: boolean;
  readonly audioFormat: string | null;
}

const RESOLUTION_HEIGHTS: Record<Exclude<DownloadQuality, 'audio'>, number> = {
  '2160p': 2160,
  '1440p': 1440,
  '1080p': 1080,
  '720p': 720,
  '480p': 480,
};

function videoSelector(format: DownloadFormat, height: number): string {
  if (format === 'mp4') {
    return (
      `bv*[ext=mp4][height<=${height}]+ba[ext=m4a]/` +
      `b[ext=mp4][height<=${height}]`
    );
  }
  return `bv*[height<=${height}]+ba/b[height<=${height}]`;
}

export function mapToYtDlpFormat(
  format: DownloadFormat,
  quality: DownloadQuality,
): YtDlpFormatArgs {
  if (format === 'mp3' || format === 'm4a') {
    return {
      format: 'bestaudio/best',
      extractAudio: true,
      audioFormat: format,
    };
  }
  if (quality === 'audio') {
    throw new Error(
      `Quality 'audio' requires format 'mp3' or 'm4a' (got format='${format}').`,
    );
  }
  const height: number = RESOLUTION_HEIGHTS[quality];
  return {
    format: videoSelector(format, height),
    extractAudio: false,
    audioFormat: null,
  };
}
