import type {
  CreateDownloadInput,
  DownloadModel,
  DownloadPreviewModel,
} from '@media-grab/common';

export interface ApiError {
  readonly status: number;
  readonly error: string;
  readonly errorDetail?: string;
}

export class ApiException extends Error {
  readonly status: number;
  readonly errorDetail?: string;
  constructor(status: number, message: string, errorDetail?: string) {
    super(message);
    this.status = status;
    this.errorDetail = errorDetail;
  }
}

async function request<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res: Response = await fetch(input, init);
  if (!res.ok) {
    let detail: string | undefined;
    let msg: string = `HTTP ${res.status}`;
    try {
      const body: { error?: string; errorDetail?: string; message?: string } =
        await res.json();
      msg = body.error ?? body.message ?? msg;
      detail = body.errorDetail;
    } catch {
      // body wasn't JSON
    }
    throw new ApiException(res.status, msg, detail);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  listDownloads: (): Promise<DownloadModel[]> => request('/api/download'),
  getPreview: (url: string): Promise<DownloadPreviewModel> =>
    request(`/api/download/preview?url=${encodeURIComponent(url)}`),
  createDownload: (input: CreateDownloadInput): Promise<DownloadModel> =>
    request('/api/download', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(input),
    }),
  cancelDownload: (id: string): Promise<void> =>
    request(`/api/download/${encodeURIComponent(id)}/cancel`, { method: 'POST' }),
  retryDownload: (id: string): Promise<DownloadModel> =>
    request(`/api/download/${encodeURIComponent(id)}/retry`, { method: 'POST' }),
  removeDownload: (id: string): Promise<void> =>
    request(`/api/download/${encodeURIComponent(id)}`, { method: 'DELETE' }),
};
