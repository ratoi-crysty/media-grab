import { useEffect } from 'react';
import type { DownloadItem } from '../types';

export interface ShortcutHandlers {
  onToggleShortcuts: () => void;
  onCloseOverlays: () => void;
  onToggleSettings: () => void;
  setItems: React.Dispatch<React.SetStateAction<DownloadItem[]>>;
  addToast: (title: string) => void;
}

export const useGlobalShortcuts = (h: ShortcutHandlers): void => {
  const {
    onToggleShortcuts,
    onCloseOverlays,
    onToggleSettings,
    setItems,
    addToast,
  } = h;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (document.activeElement as HTMLElement | null)?.tagName;
      const inField = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
      if (e.key === '?' && !inField) {
        e.preventDefault();
        onToggleShortcuts();
      }
      if (e.key === 'Escape') onCloseOverlays();
      if ((e.metaKey || e.ctrlKey) && e.key === ',' && !inField) {
        e.preventDefault();
        onToggleSettings();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k' && !inField) {
        e.preventDefault();
        setItems((prev) => prev.filter((i) => i.status !== 'completed'));
        addToast('Cleared completed downloads');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onToggleShortcuts, onCloseOverlays, onToggleSettings, setItems, addToast]);
};
