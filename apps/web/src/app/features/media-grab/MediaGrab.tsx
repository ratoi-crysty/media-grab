import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { BulkBar } from './components/BulkBar/BulkBar';
import { DropOverlay } from './components/DropOverlay/DropOverlay';
import { EmptyState } from './components/EmptyState/EmptyState';
import { Header } from './components/Header/Header';
import { ItemRow } from './components/ItemRow/ItemRow';
import { SettingsSheet } from './components/SettingsSheet/SettingsSheet';
import { ShortcutsModal } from './components/ShortcutsModal/ShortcutsModal';
import { Tabs } from './components/Tabs/Tabs';
import { Toasts } from './components/Toasts/Toasts';
import { UrlInput } from './components/UrlInput/UrlInput';
import { useDragAndDrop } from './hooks/useDragAndDrop';
import { useGlobalShortcuts } from './hooks/useGlobalShortcuts';
import { useThemeVars } from './hooks/useThemeVars';
import {
  useDownloadActions,
  useDownloads,
} from '../../shared/api/api.hooks';
import type {
  AddItemInput,
  BulkAction,
  Density,
  Download,
  FilterId,
  ItemAction,
  StatusCounts,
  Toast,
} from './types';
import './styles.scss';

const SORT_ORDER: Record<string, number> = {
  downloading: 0,
  queued: 1,
  failed: 2,
  completed: 3,
};

export const MediaGrab = memo(function MediaGrab() {
  const { downloads, isLoading, error } = useDownloads();
  const actions = useDownloadActions();

  const [filter, setFilter] = useState<FilterId>('all');
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [search, setSearch] = useState<string>('');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [shortcutsOpen, setShortcutsOpen] = useState<boolean>(false);
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [dragOver, setDragOver] = useState<boolean>(false);
  const [dark, setDark] = useState<boolean>(true);
  const [density, setDensity] = useState<Density>('comfy');
  const [accent] = useState<string>('#5b8cff');
  const [prefillUrl, setPrefillUrl] = useState<string | null>(null);

  useThemeVars(accent, dark);

  const pushToast = useCallback((toast: Omit<Toast, 'id'>) => {
    setToasts((prev) => [
      ...prev,
      { id: `t-${Date.now()}-${Math.random()}`, ...toast },
    ]);
  }, []);

  const prevStatusesRef = useRef<Map<string, Download['status']>>(new Map());
  useEffect(() => {
    const next: Map<string, Download['status']> = new Map();
    for (const d of downloads) {
      next.set(d.id, d.status);
      const before = prevStatusesRef.current.get(d.id);
      if (before && before !== 'completed' && d.status === 'completed') {
        pushToast({ kind: 'ok', title: 'Download complete', sub: d.title });
      } else if (
        before &&
        before !== 'failed' &&
        d.status === 'failed' &&
        d.error !== 'Cancelled by user'
      ) {
        pushToast({
          kind: 'err',
          title: 'Download failed',
          sub: d.error ?? d.title,
        });
      }
    }
    prevStatusesRef.current = next;
  }, [downloads, pushToast]);

  useEffect(() => {
    if (!toasts.length) return undefined;
    const tm = setTimeout(() => setToasts((ts) => ts.slice(1)), 4000);
    return () => clearTimeout(tm);
  }, [toasts]);

  const toggleShortcuts = useCallback(() => setShortcutsOpen((s) => !s), []);
  const toggleSettings = useCallback(() => setSettingsOpen((s) => !s), []);
  const closeOverlays = useCallback(() => {
    setShortcutsOpen(false);
    setSettingsOpen(false);
    setSelected(new Set());
  }, []);
  const openShortcuts = useCallback(() => setShortcutsOpen(true), []);
  const openSettings = useCallback(() => setSettingsOpen(true), []);
  const closeShortcuts = useCallback(() => setShortcutsOpen(false), []);
  const closeSettings = useCallback(() => setSettingsOpen(false), []);
  const toggleTheme = useCallback(() => setDark((d) => !d), []);

  const handleAdd = useCallback(
    async ({ url, format, quality }: AddItemInput): Promise<void> => {
      try {
        await actions.add({ url, format, quality });
        pushToast({ title: 'Added to queue', sub: url });
        setPrefillUrl(null);
      } catch (err: unknown) {
        pushToast({
          kind: 'err',
          title: 'Failed to add',
          sub: err instanceof Error ? err.message : String(err),
        });
      }
    },
    [actions, pushToast],
  );

  const handleAction = useCallback(
    async (id: string, action: ItemAction): Promise<void> => {
      try {
        if (action === 'cancel') {
          await actions.cancel(id);
        } else if (action === 'retry') {
          await actions.retry(id);
          pushToast({ title: 'Retrying download' });
        } else if (action === 'remove') {
          await actions.remove(id);
          setSelected((s) => {
            const n = new Set(s);
            n.delete(id);
            return n;
          });
        }
      } catch (err: unknown) {
        pushToast({
          kind: 'err',
          title: `${action} failed`,
          sub: err instanceof Error ? err.message : String(err),
        });
      }
    },
    [actions, pushToast],
  );

  const clearCompleted = useCallback(async (): Promise<void> => {
    const completed: Download[] = downloads.filter(
      (d: Download): boolean => d.status === 'completed',
    );
    if (completed.length === 0) return;
    await Promise.all(
      completed.map((d: Download): Promise<void> => actions.remove(d.id)),
    );
    pushToast({ title: `Cleared ${completed.length} completed downloads` });
  }, [downloads, actions, pushToast]);

  useGlobalShortcuts({
    onToggleShortcuts: toggleShortcuts,
    onCloseOverlays: closeOverlays,
    onToggleSettings: toggleSettings,
    onClearCompleted: (): void => void clearCompleted(),
  });

  const toggleSelect = useCallback((id: string) => {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }, []);

  const handleBulk = useCallback(
    async (action: BulkAction): Promise<void> => {
      const ids: string[] = Array.from(selected);
      if (ids.length === 0) return;
      if (action === 'remove') {
        await Promise.all(
          ids.map((id: string): Promise<void> => actions.remove(id)),
        );
        pushToast({ title: `Removed ${ids.length} items` });
        setSelected(new Set());
        return;
      }
      if (action === 'retry') {
        await Promise.all(
          ids.map(async (id: string): Promise<void> => {
            const row: Download | undefined = downloads.find(
              (d: Download): boolean => d.id === id,
            );
            if (row?.status === 'failed') await actions.retry(id);
          }),
        );
        pushToast({ title: `Retrying ${ids.length} downloads` });
      }
    },
    [selected, actions, downloads, pushToast],
  );

  const counts = useMemo<StatusCounts>(() => {
    const c: StatusCounts = {
      all: downloads.length,
      downloading: 0,
      queued: 0,
      completed: 0,
      failed: 0,
    };
    for (const d of downloads) {
      const k: keyof StatusCounts = d.status;
      c[k] = (c[k] ?? 0) + 1;
    }
    return c;
  }, [downloads]);

  const visible = useMemo<Download[]>(() => {
    let r: Download[] = downloads;
    if (filter !== 'all') {
      r = r.filter((d: Download): boolean => d.status === filter);
    }
    if (search.trim()) {
      const q: string = search.toLowerCase();
      r = r.filter(
        (d: Download): boolean =>
          d.title.toLowerCase().includes(q) ||
          d.uploader.toLowerCase().includes(q),
      );
    }
    return [...r].sort(
      (a: Download, b: Download): number =>
        (SORT_ORDER[a.status] ?? 9) - (SORT_ORDER[b.status] ?? 9),
    );
  }, [downloads, filter, search]);

  const downloadingCount: number = useMemo(
    (): number =>
      downloads.filter((d: Download): boolean => d.status === 'downloading')
        .length,
    [downloads],
  );

  const onDropError = useCallback(() => {
    pushToast({
      kind: 'err',
      title: "Couldn't read that URL",
      sub: 'Try copying the link first.',
    });
  }, [pushToast]);

  const onDropUrl = useCallback((url: string): void => {
    setPrefillUrl(url);
  }, []);

  useDragAndDrop({ setDragOver, onDropUrl, onError: onDropError });

  const clearSelection = useCallback(() => setSelected(new Set()), []);
  const dismissToast = useCallback(
    (id: string) => setToasts((ts) => ts.filter((x) => x.id !== id)),
    [],
  );

  return (
    <div
      className={`mg-app mg-density-${density} ${
        dragOver ? 'is-drag-over' : ''
      }`}
    >
      <Header
        dark={dark}
        onToggleTheme={toggleTheme}
        downloadingCount={downloadingCount}
        totalCount={downloads.length}
        onShowShortcuts={openShortcuts}
        onShowSettings={openSettings}
      />

      <main className="mg-main">
        <UrlInput onAdd={handleAdd} prefillUrl={prefillUrl} />

        <Tabs
          counts={counts}
          value={filter}
          onChange={setFilter}
          search={search}
          onSearch={setSearch}
          density={density}
          onDensity={setDensity}
        />

        {isLoading && downloads.length === 0 ? (
          <div className="mg-muted" style={{ padding: 24 }}>
            Loading…
          </div>
        ) : error ? (
          <div className="mg-status-line mg-status-line--err" style={{ padding: 24 }}>
            Failed to load: {error.message}
          </div>
        ) : visible.length === 0 ? (
          <EmptyState filter={filter} />
        ) : (
          <div className="mg-list" data-show-thumbs="1">
            {visible.map((item: Download) => (
              <ItemRow
                key={item.id}
                item={item}
                selected={selected.has(item.id)}
                onSelect={toggleSelect}
                onAction={(id: string, action: ItemAction): void =>
                  void handleAction(id, action)
                }
                density={density}
              />
            ))}
          </div>
        )}
      </main>

      {selected.size > 0 && (
        <BulkBar
          count={selected.size}
          onAction={(a: BulkAction): void => void handleBulk(a)}
          onClear={clearSelection}
        />
      )}

      <Toasts toasts={toasts} onDismiss={dismissToast} />
      <ShortcutsModal open={shortcutsOpen} onClose={closeShortcuts} />
      <SettingsSheet open={settingsOpen} onClose={closeSettings} />

      {dragOver && <DropOverlay />}
    </div>
  );
});
