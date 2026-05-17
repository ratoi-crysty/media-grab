import { useEffect } from 'react';
import type { AddItemInput } from '../types';
import { detectPlatform, isValidUrl } from '../utils/platform';

export interface DragAndDropHandlers {
  setDragOver: (over: boolean) => void;
  onAdd: (item: AddItemInput) => void;
  onError: () => void;
}

export const useDragAndDrop = (h: DragAndDropHandlers): void => {
  const { setDragOver, onAdd, onError } = h;
  useEffect(() => {
    const onDragOver = (e: DragEvent) => {
      e.preventDefault();
      setDragOver(true);
    };
    const onDragLeave = (e: DragEvent) => {
      if (e.target === document.documentElement || e.clientX === 0)
        setDragOver(false);
    };
    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const url =
        e.dataTransfer?.getData('text/uri-list') ||
        e.dataTransfer?.getData('text/plain') ||
        '';
      if (url && isValidUrl(url)) {
        onAdd({
          url,
          platform: detectPlatform(url),
          format: 'best',
          quality: '1080p',
        });
      } else {
        onError();
      }
    };
    window.addEventListener('dragover', onDragOver);
    window.addEventListener('dragleave', onDragLeave);
    window.addEventListener('drop', onDrop);
    return () => {
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('dragleave', onDragLeave);
      window.removeEventListener('drop', onDrop);
    };
  }, [setDragOver, onAdd, onError]);
};
