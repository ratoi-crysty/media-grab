import { ApiProperty } from '@nestjs/swagger';
import type {
  DownloadFormat,
  DownloadModel,
  DownloadQuality,
  DownloadStatus,
} from '@media-grab/common';

export class DownloadResponseDto implements DownloadModel {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  url!: string;

  @ApiProperty({ description: 'yt-dlp extractor key.' })
  platform!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  uploader!: string;

  @ApiProperty()
  duration!: string;

  @ApiProperty({ enum: ['best', 'mp4', 'mp3', 'm4a'] })
  format!: DownloadFormat;

  @ApiProperty({ enum: ['2160p', '1440p', '1080p', '720p', '480p', 'audio'] })
  quality!: DownloadQuality;

  @ApiProperty()
  size!: number;

  @ApiProperty()
  downloaded!: number;

  @ApiProperty({ enum: ['queued', 'downloading', 'completed', 'failed'] })
  status!: DownloadStatus;

  @ApiProperty({ nullable: true })
  error!: string | null;

  @ApiProperty({ nullable: true })
  errorDetail!: string | null;

  @ApiProperty({ nullable: true })
  filePath!: string | null;

  @ApiProperty()
  hue!: number;

  @ApiProperty({ description: 'Unix epoch ms.' })
  createdAt!: number;

  @ApiProperty({ nullable: true, description: 'Unix epoch ms.' })
  completedAt!: number | null;
}
