import { useEffect } from 'react';

export interface ShortcutHandlers {
  onToggleShortcuts: () => void;
  onCloseOverlays: () => void;
  onToggleSettings: () => void;
  onClearCompleted: () => void;
}

export const useGlobalShortcuts = (h: ShortcutHandlers): void => {
  const { onToggleShortcuts, onCloseOverlays, onToggleSettings, onClearCompleted } = h;
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
        onClearCompleted();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onToggleShortcuts, onCloseOverlays, onToggleSettings, onClearCompleted]);
};
