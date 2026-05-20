import { useEffect } from 'react';
import type { DownloadItem, Toast } from '../types';

export const useDownloadSimulation = (
  items: DownloadItem[],
  setItems: React.Dispatch<React.SetStateAction<DownloadItem[]>>,
  setToasts: React.Dispatch<React.SetStateAction<Toast[]>>,
): void => {
  const hasActive = items.some((i) => i.status === 'downloading');
  useEffect(() => {
    if (!hasActive) return;
    const id = setInterval(() => {
      setItems((prev) => {
        const completions: Toast[] = [];
        const updated = prev.map((it) => {
          if (it.status !== 'downloading') return it;
          const speed = Math.max(300_000, it.speed * (0.85 + Math.random() * 0.3));
          const next = Math.min(it.size, it.downloaded + speed * 0.6);
          if (next >= it.size) {
            completions.push({
              id: `dl-${it.id}-${Date.now()}`,
              kind: 'ok',
              title: 'Download complete',
              sub: it.title,
            });
            return {
              ...it,
              status: 'completed' as const,
              downloaded: it.size,
              speed: 0,
              completedAt: Date.now(),
            };
          }
          return { ...it, downloaded: next, speed };
        });
        if (completions.length) {
          setTimeout(() => setToasts((ts) => [...ts, ...completions]), 0);
        }
        return updated;
      });
    }, 600);
    return () => clearInterval(id);
  }, [hasActive, setItems, setToasts]);
};
