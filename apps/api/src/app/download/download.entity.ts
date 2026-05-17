import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, Index, PrimaryColumn } from 'typeorm';
import type {
  DownloadFormat,
  DownloadModel,
  DownloadQuality,
  DownloadStatus,
  Platform,
} from '@media-grab/common';

@Entity('download')
export class DownloadEntity implements DownloadModel {
  @ApiProperty({ description: 'UUID assigned by the API on creation.' })
  @PrimaryColumn({ type: 'text' })
  id!: string;

  @ApiProperty()
  @Column({ type: 'text' })
  url!: string;

  @ApiProperty({ description: 'yt-dlp extractor key (e.g. "youtube", "vimeo").' })
  @Column({ type: 'text' })
  platform!: Platform;

  @ApiProperty()
  @Column({ type: 'text', default: '' })
  title!: string;

  @ApiProperty()
  @Column({ type: 'text', default: '' })
  uploader!: string;

  @ApiProperty({ description: 'Human-readable duration string, e.g. "12:34".' })
  @Column({ type: 'text', default: '' })
  duration!: string;

  @ApiProperty({ enum: ['best', 'mp4', 'mp3', 'm4a'] })
  @Column({ type: 'text' })
  format!: DownloadFormat;

  @ApiProperty({ enum: ['2160p', '1440p', '1080p', '720p', '480p', 'audio'] })
  @Column({ type: 'text' })
  quality!: DownloadQuality;

  @ApiProperty({ description: 'Total bytes (0 until known).' })
  @Column({ type: 'integer', default: 0 })
  size!: number;

  @ApiProperty({ description: 'Bytes downloaded so far (memory-only at runtime).' })
  @Column({ type: 'integer', default: 0 })
  downloaded!: number;

  @ApiProperty({ enum: ['queued', 'downloading', 'completed', 'failed'] })
  @Index()
  @Column({ type: 'text' })
  status!: DownloadStatus;

  @ApiProperty({ nullable: true })
  @Column({ type: 'text', nullable: true })
  error!: string | null;

  @ApiProperty({ nullable: true })
  @Column({ type: 'text', nullable: true })
  errorDetail!: string | null;

  @ApiProperty({ nullable: true, description: 'Absolute path on disk after completion.' })
  @Column({ type: 'text', nullable: true })
  filePath!: string | null;

  @ApiProperty({ description: 'Decorative hue (0-360) for the synthetic thumbnail.' })
  @Column({ type: 'integer' })
  hue!: number;

  @ApiProperty({ description: 'Unix epoch ms.' })
  @Index()
  @Column({ type: 'integer' })
  createdAt!: number;

  @ApiProperty({ nullable: true, description: 'Unix epoch ms; set on success.' })
  @Column({ type: 'integer', nullable: true })
  completedAt!: number | null;
}
