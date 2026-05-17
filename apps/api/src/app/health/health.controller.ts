import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { YtdlpService } from '../download/ytdlp.service';
import { HealthResponseDto } from './health.dto';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly ytdlp: YtdlpService) {}

  @Get()
  @ApiOperation({
    summary: 'Binary installation status',
    description:
      'Reports the bundled yt-dlp version and whether ffmpeg is available on PATH.',
  })
  @ApiOkResponse({ type: HealthResponseDto })
  getHealth(): HealthResponseDto {
    const status = this.ytdlp.getInstallationStatus();
    return {
      ytdlpVersion: status.ytdlpVersion,
      ffmpegAvailable: status.ffmpegAvailable,
    };
  }
}
