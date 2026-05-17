import { ApiProperty } from '@nestjs/swagger';

export class HealthResponseDto {
  @ApiProperty({
    nullable: true,
    description: 'Version reported by the bundled yt-dlp binary, or null if unavailable.',
    example: '2026.04.17',
  })
  ytdlpVersion!: string | null;

  @ApiProperty({
    description: 'Whether an ffmpeg binary is available on PATH (system-installed).',
  })
  ffmpegAvailable!: boolean;
}
