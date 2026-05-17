import { Controller, Get, HttpException, Logger, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ErrorResponseDto, PreviewQueryDto, PreviewResponseDto } from './dto/preview.dto';
import { classifyYtdlpError, ClassifiedYtdlpError } from './ytdlp-error';
import { YtdlpService } from './ytdlp.service';

@ApiTags('download')
@Controller('download')
export class DownloadController {
  private readonly logger: Logger = new Logger(DownloadController.name);

  constructor(private readonly ytdlp: YtdlpService) {}

  @Get('preview')
  @ApiOperation({
    summary: 'Preview metadata for a URL before creating a Download',
    description:
      'Lightweight, non-persisted lookup. Used as step 1 of the two-step add flow (ADR-0001).',
  })
  @ApiOkResponse({ type: PreviewResponseDto })
  @ApiBadRequestResponse({ type: ErrorResponseDto })
  async getPreview(@Query() query: PreviewQueryDto): Promise<PreviewResponseDto> {
    try {
      return await this.ytdlp.getPreview(query.url);
    } catch (err: unknown) {
      const classified: ClassifiedYtdlpError = classifyYtdlpError(err);
      this.logger.warn(
        `preview failed (${classified.kind}) for ${query.url}: ${classified.errorDetail}`,
      );
      const body: ErrorResponseDto = {
        error: classified.error,
        errorDetail: classified.errorDetail,
      };
      throw new HttpException(body, classified.httpStatus);
    }
  }
}
