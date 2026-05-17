import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Logger,
  NotFoundException,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type {
  DownloadModel,
  DownloadPreviewModel,
  DownloadStatus,
} from '@media-grab/common';
import { CreateDownloadDto } from './dto/create-download.dto';
import { DownloadResponseDto } from './dto/download.dto';
import {
  ErrorResponseDto,
  PreviewQueryDto,
  PreviewResponseDto,
} from './dto/preview.dto';
import { DownloadEntity } from './download.entity';
import { DownloadQueueService } from './download.queue';
import { DownloadRepository } from './download.repository';
import { classifyYtdlpError, ClassifiedYtdlpError } from './ytdlp-error';
import { YtdlpService } from './ytdlp.service';

@ApiTags('download')
@Controller('download')
export class DownloadController {
  private readonly logger: Logger = new Logger(DownloadController.name);

  constructor(
    private readonly ytdlp: YtdlpService,
    private readonly repo: DownloadRepository,
    private readonly queue: DownloadQueueService,
  ) {}

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

  @Get()
  @ApiOperation({ summary: 'List all downloads (snapshot)' })
  @ApiOkResponse({ type: DownloadResponseDto, isArray: true })
  async list(): Promise<DownloadResponseDto[]> {
    const rows: DownloadEntity[] = await this.repo.findAll();
    return rows.map((row: DownloadEntity): DownloadResponseDto =>
      this.toResponse(row),
    );
  }

  @Post()
  @ApiOperation({
    summary: 'Create a Download',
    description:
      'Re-fetches preview metadata server-side, persists the Download, and enqueues it.',
  })
  @ApiCreatedResponse({ type: DownloadResponseDto })
  @ApiBadRequestResponse({ type: ErrorResponseDto })
  async create(@Body() body: CreateDownloadDto): Promise<DownloadResponseDto> {
    let preview: DownloadPreviewModel;
    try {
      preview = await this.ytdlp.getPreview(body.url);
    } catch (err: unknown) {
      const classified: ClassifiedYtdlpError = classifyYtdlpError(err);
      const errBody: ErrorResponseDto = {
        error: classified.error,
        errorDetail: classified.errorDetail,
      };
      throw new HttpException(errBody, classified.httpStatus);
    }
    const row: DownloadEntity = await this.queue.enqueue(body, preview);
    return this.toResponse(row);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cancel a queued or running Download' })
  @ApiNoContentResponse()
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  async cancel(@Param('id') id: string): Promise<void> {
    const row: DownloadEntity | null = await this.repo.findById(id);
    if (!row) throw new NotFoundException();
    if (row.status !== 'queued' && row.status !== 'downloading') return;
    await this.queue.cancel(id);
  }

  @Post(':id/retry')
  @ApiOperation({
    summary: 'Retry a failed Download',
    description: 'Creates a new Download row with the same url/format/quality. Original row is untouched.',
  })
  @ApiCreatedResponse({ type: DownloadResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  async retry(@Param('id') id: string): Promise<DownloadResponseDto> {
    const row: DownloadEntity | null = await this.queue.retry(id);
    if (!row) throw new NotFoundException();
    return this.toResponse(row);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Remove a Download from the list',
    description:
      'If downloading, cancels first. Completed file is kept on disk; partial files are removed.',
  })
  @ApiNoContentResponse()
  async remove(@Param('id') id: string): Promise<void> {
    await this.queue.remove(id);
  }

  private toResponse(row: DownloadEntity): DownloadResponseDto {
    const runningProgress = this.queue.getRunningProgress(row.id);
    const live: { downloaded: number; size: number } = runningProgress
      ? { downloaded: runningProgress.downloaded, size: runningProgress.total || row.size }
      : { downloaded: row.downloaded, size: row.size };
    const response: DownloadResponseDto = {
      id: row.id,
      url: row.url,
      platform: row.platform,
      title: row.title,
      uploader: row.uploader,
      duration: row.duration,
      format: row.format,
      quality: row.quality,
      size: live.size,
      downloaded: live.downloaded,
      status: row.status as DownloadStatus,
      error: row.error,
      errorDetail: row.errorDetail,
      filePath: row.filePath,
      hue: row.hue,
      createdAt: row.createdAt,
      completedAt: row.completedAt,
    };
    void (response satisfies DownloadModel);
    return response;
  }
}
