import { ApiProperty } from '@nestjs/swagger';
import { IsUrl } from 'class-validator';

export class PreviewQueryDto {
  @ApiProperty({
    description: 'Media URL to preview (any yt-dlp-supported origin).',
    example: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  })
  @IsUrl({ require_protocol: true, protocols: ['http', 'https'] })
  url!: string;
}

export class PreviewResponseDto {
  @ApiProperty()
  url!: string;

  @ApiProperty({ description: 'yt-dlp extractor key (e.g. "youtube").' })
  platform!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  uploader!: string;

  @ApiProperty({ description: 'Human-readable duration string, e.g. "12:34".' })
  duration!: string;

  @ApiProperty({
    nullable: true,
    description: 'Origin-hosted thumbnail URL; hotlinked by the UI.',
  })
  thumbnailUrl!: string | null;
}

export class ErrorResponseDto {
  @ApiProperty({
    description: 'Short human-readable error label suitable for UI display.',
  })
  error!: string;

  @ApiProperty({
    nullable: true,
    description: 'Raw stderr tail / underlying message (for tooltip / logs).',
  })
  errorDetail!: string | null;
}
