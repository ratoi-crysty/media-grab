import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsUrl } from 'class-validator';
import type {
  CreateDownloadInput,
  DownloadFormat,
  DownloadQuality,
} from '@media-grab/common';

const FORMAT_VALUES: readonly DownloadFormat[] = ['best', 'mp4', 'mp3', 'm4a'];
const QUALITY_VALUES: readonly DownloadQuality[] = [
  '2160p',
  '1440p',
  '1080p',
  '720p',
  '480p',
  'audio',
];

export class CreateDownloadDto implements CreateDownloadInput {
  @ApiProperty({
    description: 'Media URL — must be the same one that produced a successful Preview.',
    example: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  })
  @IsUrl({ require_protocol: true, protocols: ['http', 'https'] })
  url!: string;

  @ApiProperty({ enum: FORMAT_VALUES })
  @IsIn(FORMAT_VALUES)
  format!: DownloadFormat;

  @ApiProperty({ enum: QUALITY_VALUES })
  @IsIn(QUALITY_VALUES)
  quality!: DownloadQuality;
}
