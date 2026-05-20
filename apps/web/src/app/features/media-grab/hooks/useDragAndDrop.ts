import { useEffect } from 'react';
import { isValidUrl } from '../utils/platform';

export interface DragAndDropHandlers {
  setDragOver: (over: boolean) => void;
  onDropUrl: (url: string) => void;
  onError: () => void;
}

export const useDragAndDrop = (h: DragAndDropHandlers): void => {
  const { setDragOver, onDropUrl, onError } = h;
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
        onDropUrl(url);
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
  }, [setDragOver, onDropUrl, onError]);
};
