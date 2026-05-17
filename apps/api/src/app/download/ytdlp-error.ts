export type YtdlpErrorKind =
  | 'private'
  | 'geo-blocked'
  | 'not-found'
  | 'network'
  | 'unsupported'
  | 'unknown';

export interface ClassifiedYtdlpError {
  readonly kind: YtdlpErrorKind;
  readonly error: string;
  readonly errorDetail: string;
  readonly httpStatus: number;
}

const MAX_DETAIL_CHARS = 600;

function trimTail(text: string): string {
  const trimmed: string = text.trim();
  if (trimmed.length <= MAX_DETAIL_CHARS) return trimmed;
  return `…${trimmed.slice(trimmed.length - MAX_DETAIL_CHARS)}`;
}

export function classifyYtdlpError(err: unknown): ClassifiedYtdlpError {
  const raw: string = err instanceof Error ? err.message : String(err);
  const detail: string = trimTail(raw);
  const lower: string = raw.toLowerCase();

  if (
    lower.includes('private video') ||
    lower.includes('login required') ||
    lower.includes('sign in') ||
    lower.includes('members-only') ||
    lower.includes('age-restricted') ||
    lower.includes('age restricted')
  ) {
    return {
      kind: 'private',
      error: 'Video is private or requires sign-in',
      errorDetail: detail,
      httpStatus: 400,
    };
  }

  if (
    lower.includes('geo') ||
    lower.includes('not available in your country') ||
    lower.includes('blocked in your country') ||
    lower.includes('region')
  ) {
    return {
      kind: 'geo-blocked',
      error: 'Video is geo-blocked',
      errorDetail: detail,
      httpStatus: 400,
    };
  }

  if (
    lower.includes('http error 404') ||
    lower.includes('video unavailable') ||
    lower.includes('does not exist') ||
    lower.includes('removed by the uploader') ||
    lower.includes('this video is unavailable')
  ) {
    return {
      kind: 'not-found',
      error: 'Video not found or removed',
      errorDetail: detail,
      httpStatus: 400,
    };
  }

  if (
    lower.includes('unsupported url') ||
    lower.includes('no suitable extractor') ||
    lower.includes('is not a valid url')
  ) {
    return {
      kind: 'unsupported',
      error: 'URL is not supported by yt-dlp',
      errorDetail: detail,
      httpStatus: 400,
    };
  }

  if (
    lower.includes('http error 5') ||
    lower.includes('unable to download') ||
    lower.includes('timed out') ||
    lower.includes('connection reset') ||
    lower.includes('network is unreachable') ||
    lower.includes('name or service not known') ||
    lower.includes('getaddrinfo') ||
    lower.includes('econnrefused')
  ) {
    return {
      kind: 'network',
      error: 'Network error while fetching metadata',
      errorDetail: detail,
      httpStatus: 502,
    };
  }

  return {
    kind: 'unknown',
    error: 'Failed to fetch metadata',
    errorDetail: detail,
    httpStatus: 400,
  };
}
