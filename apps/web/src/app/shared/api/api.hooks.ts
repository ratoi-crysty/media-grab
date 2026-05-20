import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import useSWR from 'swr';
import type {
  CreateDownloadInput,
  DownloadModel,
  DownloadPreviewModel,
} from '@media-grab/common';
import { ApiException, api } from './api.client';

const PREVIEW_DEBOUNCE_MS = 350;

export interface UseDownloadsResult {
  downloads: DownloadModel[];
  isLoading: boolean;
  error: Error | null;
}

export function useDownloads(): UseDownloadsResult {
  const { data, error, isLoading, mutate } = useSWR<DownloadModel[]>(
    '/api/download',
    api.listDownloads,
    { revalidateOnFocus: false },
  );
  const itemsRef = useRef<DownloadModel[]>([]);
  itemsRef.current = data ?? [];

  useEffect((): (() => void) => {
    const source: EventSource = new EventSource('/api/download/stream');
    source.onmessage = (e: MessageEvent): void => {
      try {
        const snap: DownloadModel = JSON.parse(e.data) as DownloadModel;
        const idx: number = itemsRef.current.findIndex(
          (d: DownloadModel): boolean => d.id === snap.id,
        );
        const next: DownloadModel[] =
          idx >= 0
            ? itemsRef.current.map(
                (d: DownloadModel): DownloadModel =>
                  d.id === snap.id ? snap : d,
              )
            : [snap, ...itemsRef.current];
        itemsRef.current = next;
        void mutate(next, { revalidate: false });
      } catch {
        // ignore malformed events
      }
    };
    source.onerror = (): void => {
      // EventSource auto-reconnects; nothing to do here.
    };
    return (): void => source.close();
  }, [mutate]);

  return {
    downloads: data ?? [],
    isLoading,
    error: (error as Error | undefined) ?? null,
  };
}

export interface UsePreviewResult {
  preview: DownloadPreviewModel | null;
  isLoading: boolean;
  error: ApiException | null;
}

export function usePreview(url: string): UsePreviewResult {
  const [preview, setPreview] = useState<DownloadPreviewModel | null>(null);
  const [error, setError] = useState<ApiException | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect((): (() => void) => {
    const trimmed: string = url.trim();
    if (!trimmed) {
      setPreview(null);
      setError(null);
      setIsLoading(false);
      return (): void => {};
    }
    let cancelled: boolean = false;
    setIsLoading(true);
    setError(null);
    const handle: ReturnType<typeof setTimeout> = setTimeout((): void => {
      api
        .getPreview(trimmed)
        .then((p: DownloadPreviewModel): void => {
          if (cancelled) return;
          setPreview(p);
          setIsLoading(false);
        })
        .catch((err: unknown): void => {
          if (cancelled) return;
          setPreview(null);
          setError(
            err instanceof ApiException
              ? err
              : new ApiException(0, (err as Error)?.message ?? 'Preview failed'),
          );
          setIsLoading(false);
        });
    }, PREVIEW_DEBOUNCE_MS);
    return (): void => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [url]);

  return useMemo(
    (): UsePreviewResult => ({ preview, isLoading, error }),
    [preview, isLoading, error],
  );
}

export interface DownloadActions {
  add: (input: CreateDownloadInput) => Promise<DownloadModel>;
  cancel: (id: string) => Promise<void>;
  retry: (id: string) => Promise<DownloadModel>;
  remove: (id: string) => Promise<void>;
}

export function useDownloadActions(): DownloadActions {
  const add = useCallback(
    (input: CreateDownloadInput): Promise<DownloadModel> =>
      api.createDownload(input),
    [],
  );
  const cancel = useCallback(
    (id: string): Promise<void> => api.cancelDownload(id),
    [],
  );
  const retry = useCallback(
    (id: string): Promise<DownloadModel> => api.retryDownload(id),
    [],
  );
  const remove = useCallback(
    (id: string): Promise<void> => api.removeDownload(id),
    [],
  );
  return { add, cancel, retry, remove };
}
