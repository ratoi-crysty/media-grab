import { memo, useCallback, useEffect, useMemo, useState } from 'react';
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
import { useDownloadSimulation } from './hooks/useDownloadSimulation';
import { useDragAndDrop } from './hooks/useDragAndDrop';
import { useGlobalShortcuts } from './hooks/useGlobalShortcuts';
import { useThemeVars } from './hooks/useThemeVars';
import type {
  AddItemInput,
  BulkAction,
  Density,
  DownloadItem,
  FilterId,
  ItemAction,
  Platform,
  StatusCounts,
  Toast,
} from './types';
import { initialItemsMixed } from './utils/samples';
import './styles.scss';

const SORT_ORDER: Record<string, number> = {
  downloading: 0,
  paused: 1,
  queued: 2,
  failed: 3,
  completed: 4,
};

const SYNTH_TITLES = [
  'New video from clipboard — fetching metadata…',
  'Untitled stream',
  'Live capture',
  'Recently added video',
];

const RESOLVED_TITLES = [
  'A wonderful video about something interesting',
  'Untitled · Resolved from URL',
  'Latest upload — Click to preview',
];

const RESOLVED_UPLOADERS = ['Channel name', 'creator.handle', 'Studio'];

const pickRandom = <T,>(arr: readonly T[]): T =>
  arr[Math.floor(Math.random() * arr.length)] as T;

export const MediaGrab = memo(function MediaGrab() {
  const [items, setItems] = useState<DownloadItem[]>(() => initialItemsMixed());
  const [filter, setFilter] = useState<FilterId>('all');
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [search, setSearch] = useState('');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [dark, setDark] = useState(true);
  const [density, setDensity] = useState<Density>('comfy');
  const [accent] = useState('#5b8cff');

  useThemeVars(accent, dark);

  const pushToast = useCallback((toast: Omit<Toast, 'id'>) => {
    setToasts((prev) => [
      ...prev,
      { id: `t-${Date.now()}-${Math.random()}`, ...toast },
    ]);
  }, []);

  const pushSimpleToast = useCallback(
    (title: string) => pushToast({ title }),
    [pushToast],
  );

  useDownloadSimulation(items, setItems, setToasts);

  useEffect(() => {
    if (!toasts.length) return undefined;
    const tm = setTimeout(() => setToasts((ts) => ts.slice(1)), 4000);
    return () => clearTimeout(tm);
  }, [toasts]);

  const toggleShortcuts = useCallback(
    () => setShortcutsOpen((s) => !s),
    [],
  );
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

  useGlobalShortcuts({
    onToggleShortcuts: toggleShortcuts,
    onCloseOverlays: closeOverlays,
    onToggleSettings: toggleSettings,
    setItems,
    addToast: pushSimpleToast,
  });

  const handleAdd = useCallback(
    ({ url, platform, format, quality }: AddItemInput) => {
      const hue = Math.floor(Math.random() * 360);
      const resolvedPlatform: Platform = platform ?? 'youtube';
      const isAudio = format === 'mp3' || format === 'm4a';
      const newItem: DownloadItem = {
        id: `n-${Date.now()}`,
        url,
        platform: resolvedPlatform,
        title: pickRandom(SYNTH_TITLES),
        uploader: 'Resolving…',
        duration: '—:—',
        format: isAudio ? format.toUpperCase() : 'MP4',
        quality: isAudio ? '320kbps' : quality,
        size: 100_000_000 + Math.random() * 400_000_000,
        status: 'queued',
        downloaded: 0,
        speed: 0,
        hue,
      };
      setItems((prev) => [newItem, ...prev]);
      pushToast({ title: 'Added to queue', sub: url });
      setTimeout(() => {
        setItems((prev) =>
          prev.map((i) =>
            i.id === newItem.id
              ? {
                  ...i,
                  title: pickRandom(RESOLVED_TITLES),
                  uploader: pickRandom(RESOLVED_UPLOADERS),
                  duration: `${Math.floor(Math.random() * 30) + 1}:${String(
                    Math.floor(Math.random() * 60),
                  ).padStart(2, '0')}`,
                }
              : i,
          ),
        );
      }, 1500);
      setTimeout(() => {
        setItems((prev) =>
          prev.map((i) =>
            i.id === newItem.id
              ? {
                  ...i,
                  status: 'downloading',
                  speed: 2_000_000 + Math.random() * 3_000_000,
                }
              : i,
          ),
        );
      }, 2500);
    },
    [pushToast],
  );

  const handleAction = useCallback(
    (id: string, action: ItemAction) => {
      if (action === 'pause') {
        setItems((prev) =>
          prev.map((i) =>
            i.id === id ? { ...i, status: 'paused', speed: 0 } : i,
          ),
        );
      } else if (
        action === 'resume' ||
        action === 'start' ||
        action === 'retry'
      ) {
        setItems((prev) =>
          prev.map((i) =>
            i.id === id
              ? {
                  ...i,
                  status: 'downloading',
                  speed: 2_000_000 + Math.random() * 3_000_000,
                  downloaded: action === 'retry' ? 0 : i.downloaded,
                  error: undefined,
                }
              : i,
          ),
        );
        if (action === 'retry') pushToast({ title: 'Retrying download' });
      } else if (action === 'cancel') {
        setItems((prev) =>
          prev.map((i) =>
            i.id === id
              ? { ...i, status: 'failed', speed: 0, error: 'Cancelled by user' }
              : i,
          ),
        );
      } else if (action === 'remove') {
        setItems((prev) => prev.filter((i) => i.id !== id));
        setSelected((s) => {
          const n = new Set(s);
          n.delete(id);
          return n;
        });
      } else if (action === 'open' || action === 'play') {
        pushToast({
          title: action === 'open' ? 'Opening file location' : 'Opening file',
        });
      }
    },
    [pushToast],
  );

  const toggleSelect = useCallback((id: string) => {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }, []);

  const handleBulk = useCallback(
    (action: BulkAction) => {
      if (action === 'remove') {
        setItems((prev) => prev.filter((i) => !selected.has(i.id)));
        pushToast({ title: `Removed ${selected.size} items` });
        setSelected(new Set());
        return;
      }
      selected.forEach((id) => handleAction(id, action));
    },
    [selected, pushToast, handleAction],
  );

  const counts = useMemo<StatusCounts>(() => {
    const c: StatusCounts = {
      all: items.length,
      downloading: 0,
      queued: 0,
      completed: 0,
      failed: 0,
      paused: 0,
    };
    items.forEach((i) => {
      c[i.status] = (c[i.status] ?? 0) + 1;
    });
    c.downloading += c.paused;
    return c;
  }, [items]);

  const visible = useMemo<DownloadItem[]>(() => {
    let r = items;
    if (filter !== 'all') {
      r = r.filter(
        (i) =>
          i.status === filter ||
          (filter === 'downloading' && i.status === 'paused'),
      );
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.uploader.toLowerCase().includes(q),
      );
    }
    return [...r].sort(
      (a, b) => (SORT_ORDER[a.status] ?? 9) - (SORT_ORDER[b.status] ?? 9),
    );
  }, [items, filter, search]);

  const downloadingCount = items.filter(
    (i) => i.status === 'downloading',
  ).length;

  const onDropError = useCallback(() => {
    pushToast({
      kind: 'err',
      title: "Couldn't read that URL",
      sub: 'Try copying the link first.',
    });
  }, [pushToast]);

  useDragAndDrop({ setDragOver, onAdd: handleAdd, onError: onDropError });

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
        totalCount={items.length}
        onShowShortcuts={openShortcuts}
        onShowSettings={openSettings}
      />

      <main className="mg-main">
        <UrlInput onAdd={handleAdd} />

        <Tabs
          counts={counts}
          value={filter}
          onChange={setFilter}
          search={search}
          onSearch={setSearch}
          density={density}
          onDensity={setDensity}
        />

        {visible.length === 0 ? (
          <EmptyState filter={filter} />
        ) : (
          <div className="mg-list" data-show-thumbs="1">
            {visible.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                selected={selected.has(item.id)}
                onSelect={toggleSelect}
                onAction={handleAction}
                density={density}
              />
            ))}
          </div>
        )}
      </main>

      {selected.size > 0 && (
        <BulkBar
          count={selected.size}
          onAction={handleBulk}
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
