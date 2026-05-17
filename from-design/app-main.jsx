// MediaGrab — main App
const { useState: useS, useEffect: useE, useRef: useR, useMemo: useM, useCallback: useC } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#5b8cff",
  "dark": true,
  "density": "comfy",
  "sampleState": "mixed",
  "showThumbs": true
}/*EDITMODE-END*/;

const ACCENT_PRESETS = {
  "#5b8cff": { name: "Linear Blue", a: "#5b8cff", b: "#8b5cf6" },
  "#8b5cf6": { name: "Electric Purple", a: "#8b5cf6", b: "#ec4899" },
  "#22d3ee": { name: "Cyan", a: "#22d3ee", b: "#3b82f6" },
  "#f59e0b": { name: "Amber", a: "#f59e0b", b: "#ef4444" },
  "#10b981": { name: "Emerald", a: "#10b981", b: "#06b6d4" },
};

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [items, setItems] = useS(() => initialItemsMixed());
  const [filter, setFilter] = useS("all");
  const [selected, setSelected] = useS(new Set());
  const [search, setSearch] = useS("");
  const [toasts, setToasts] = useS([]);
  const [shortcutsOpen, setShortcutsOpen] = useS(false);
  const [settingsOpen, setSettingsOpen] = useS(false);
  const [dragOver, setDragOver] = useS(false);

  const sampleStateRef = useR(t.sampleState);

  // React to sample-state tweak changes
  useE(() => {
    if (sampleStateRef.current === t.sampleState) return;
    sampleStateRef.current = t.sampleState;
    if (t.sampleState === "empty") setItems([]);
    else if (t.sampleState === "busy") {
      setItems(initialItemsMixed().map((it, i) => ({
        ...it,
        status: i < 3 ? "downloading" : i < 4 ? "queued" : "downloading",
        downloaded: i < 3 ? it.size * 0.4 : 0,
        speed: i < 3 ? (1_500_000 + i * 800_000) : 0,
      })));
    } else {
      setItems(initialItemsMixed());
    }
    setSelected(new Set());
  }, [t.sampleState]);

  // Theme + accent CSS vars on root
  useE(() => {
    const root = document.documentElement;
    const accent = ACCENT_PRESETS[t.accent] || ACCENT_PRESETS["#5b8cff"];
    root.style.setProperty("--accent", accent.a);
    root.style.setProperty("--accent-2", accent.b);
    root.dataset.theme = t.dark ? "dark" : "light";
  }, [t.accent, t.dark]);

  // Simulated download tick — only when there are active downloads
  useE(() => {
    const hasActive = items.some(i => i.status === "downloading");
    if (!hasActive) return;
    const id = setInterval(() => {
      setItems(prev => {
        let toastsToAdd = [];
        const updated = prev.map(it => {
          if (it.status !== "downloading") return it;
          // jitter speed
          const speed = Math.max(300_000, it.speed * (0.85 + Math.random() * 0.3));
          const next = Math.min(it.size, it.downloaded + speed * 0.6);
          if (next >= it.size) {
            toastsToAdd.push({
              id: `dl-${it.id}-${Date.now()}`,
              kind: "ok",
              title: "Download complete",
              sub: it.title,
            });
            return { ...it, status: "completed", downloaded: it.size, speed: 0, completedAt: Date.now() };
          }
          return { ...it, downloaded: next, speed };
        });
        if (toastsToAdd.length) {
          setTimeout(() => setToasts(t => [...t, ...toastsToAdd]), 0);
        }
        return updated;
      });
    }, 600);
    return () => clearInterval(id);
  }, [items.some(i => i.status === "downloading")]);

  // Auto-dismiss toasts
  useE(() => {
    if (!toasts.length) return;
    const tm = setTimeout(() => setToasts(ts => ts.slice(1)), 4000);
    return () => clearTimeout(tm);
  }, [toasts]);

  // Global keyboard shortcuts
  useE(() => {
    const onKey = (e) => {
      const tag = document.activeElement?.tagName;
      const inField = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
      if (e.key === "?" && !inField) { e.preventDefault(); setShortcutsOpen(s => !s); }
      if (e.key === "Escape") { setShortcutsOpen(false); setSettingsOpen(false); setSelected(new Set()); }
      if ((e.metaKey || e.ctrlKey) && e.key === "," && !inField) { e.preventDefault(); setSettingsOpen(s => !s); }
      if ((e.metaKey || e.ctrlKey) && e.key === "k" && !inField) {
        e.preventDefault();
        setItems(prev => prev.filter(i => i.status !== "completed"));
        addToast({ title: "Cleared completed downloads" });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Drag and drop URL
  useE(() => {
    const onDragOver = (e) => { e.preventDefault(); setDragOver(true); };
    const onDragLeave = (e) => {
      if (e.target === document.documentElement || e.clientX === 0) setDragOver(false);
    };
    const onDrop = (e) => {
      e.preventDefault();
      setDragOver(false);
      const url = e.dataTransfer.getData("text/uri-list") || e.dataTransfer.getData("text/plain");
      if (url && isValidUrl(url)) {
        handleAdd({ url, platform: detectPlatform(url), format: "best", quality: "1080p" });
      } else {
        addToast({ kind: "err", title: "Couldn't read that URL", sub: "Try copying the link first." });
      }
    };
    window.addEventListener("dragover", onDragOver);
    window.addEventListener("dragleave", onDragLeave);
    window.addEventListener("drop", onDrop);
    return () => {
      window.removeEventListener("dragover", onDragOver);
      window.removeEventListener("dragleave", onDragLeave);
      window.removeEventListener("drop", onDrop);
    };
  }, []);

  const addToast = (toast) => {
    setToasts(prev => [...prev, { id: `t-${Date.now()}-${Math.random()}`, ...toast }]);
  };

  const handleAdd = ({ url, platform, format, quality }) => {
    const synthTitles = [
      "New video from clipboard — fetching metadata…",
      "Untitled stream",
      "Live capture",
      "Recently added video",
    ];
    const hue = Math.floor(Math.random() * 360);
    const newItem = {
      id: `n-${Date.now()}`,
      url, platform: platform || "youtube",
      title: synthTitles[Math.floor(Math.random() * synthTitles.length)],
      uploader: "Resolving…",
      duration: "—:—",
      format: format === "mp3" || format === "m4a" ? format.toUpperCase() : "MP4",
      quality: format === "mp3" || format === "m4a" ? "320kbps" : quality,
      size: 100_000_000 + Math.random() * 400_000_000,
      status: "queued",
      downloaded: 0,
      speed: 0,
      hue,
    };
    setItems(prev => [newItem, ...prev]);
    addToast({ title: "Added to queue", sub: url });
    // Simulate metadata resolution
    setTimeout(() => {
      setItems(prev => prev.map(i => i.id === newItem.id ? {
        ...i,
        title: ["A wonderful video about something interesting", "Untitled · Resolved from URL", "Latest upload — Click to preview"][Math.floor(Math.random() * 3)],
        uploader: ["Channel name", "creator.handle", "Studio"][Math.floor(Math.random() * 3)],
        duration: `${Math.floor(Math.random() * 30) + 1}:${String(Math.floor(Math.random() * 60)).padStart(2, "0")}`,
      } : i));
    }, 1500);
    // Auto-start it after a moment
    setTimeout(() => {
      setItems(prev => prev.map(i => i.id === newItem.id ? {
        ...i, status: "downloading", speed: 2_000_000 + Math.random() * 3_000_000,
      } : i));
    }, 2500);
  };

  const handleAction = (id, action) => {
    if (action === "pause") {
      setItems(prev => prev.map(i => i.id === id ? { ...i, status: "paused", speed: 0 } : i));
    } else if (action === "resume" || action === "start" || action === "retry") {
      setItems(prev => prev.map(i => i.id === id ? {
        ...i,
        status: "downloading",
        speed: 2_000_000 + Math.random() * 3_000_000,
        downloaded: action === "retry" ? 0 : i.downloaded,
        error: undefined,
      } : i));
      if (action === "retry") addToast({ title: "Retrying download" });
    } else if (action === "cancel") {
      setItems(prev => prev.map(i => i.id === id ? {
        ...i, status: "failed", speed: 0, error: "Cancelled by user",
      } : i));
    } else if (action === "remove") {
      setItems(prev => prev.filter(i => i.id !== id));
      setSelected(s => { const n = new Set(s); n.delete(id); return n; });
    } else if (action === "open" || action === "play") {
      addToast({ title: action === "open" ? "Opening file location" : "Opening file" });
    }
  };

  const toggleSelect = (id) => {
    setSelected(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  const handleBulk = (action) => {
    if (action === "remove") {
      setItems(prev => prev.filter(i => !selected.has(i.id)));
      addToast({ title: `Removed ${selected.size} items` });
      setSelected(new Set());
      return;
    }
    selected.forEach(id => handleAction(id, action));
  };

  // Filter + search items
  const counts = useM(() => {
    const c = { all: items.length, downloading: 0, queued: 0, completed: 0, failed: 0, paused: 0 };
    items.forEach(i => { c[i.status] = (c[i.status] || 0) + 1; });
    c.downloading += c.paused; // group paused with downloading visually
    return c;
  }, [items]);

  const visible = useM(() => {
    let r = items;
    if (filter !== "all") {
      r = r.filter(i => i.status === filter || (filter === "downloading" && i.status === "paused"));
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter(i => i.title.toLowerCase().includes(q) || i.uploader.toLowerCase().includes(q));
    }
    // Sort: downloading -> queued -> failed -> completed
    const order = { downloading: 0, paused: 1, queued: 2, failed: 3, completed: 4 };
    return [...r].sort((a, b) => (order[a.status] || 9) - (order[b.status] || 9));
  }, [items, filter, search]);

  const downloadingCount = items.filter(i => i.status === "downloading").length;

  return (
    <div className={`mg-app mg-density-${t.density} ${dragOver ? "is-drag-over" : ""}`}>
      <Header
        dark={t.dark}
        onToggleTheme={() => setTweak("dark", !t.dark)}
        downloadingCount={downloadingCount}
        totalCount={items.length}
        onShowShortcuts={() => setShortcutsOpen(true)}
        onShowSettings={() => setSettingsOpen(true)}
      />

      <main className="mg-main">
        <UrlInput onAdd={handleAdd} />

        <Tabs
          counts={counts}
          value={filter}
          onChange={setFilter}
          search={search}
          onSearch={setSearch}
          density={t.density}
          onDensity={(d) => setTweak("density", d)}
        />

        {visible.length === 0 ? (
          <EmptyState filter={filter} />
        ) : (
          <div className="mg-list" data-show-thumbs={t.showThumbs ? "1" : "0"}>
            {visible.map(item => (
              <ItemRow
                key={item.id}
                item={item}
                selected={selected.has(item.id)}
                onSelect={toggleSelect}
                onAction={handleAction}
                density={t.density}
              />
            ))}
          </div>
        )}
      </main>

      {selected.size > 0 && (
        <BulkBar count={selected.size} onAction={handleBulk} onClear={() => setSelected(new Set())} />
      )}

      <Toasts toasts={toasts} onDismiss={(id) => setToasts(ts => ts.filter(x => x.id !== id))} />
      <ShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
      <SettingsSheet open={settingsOpen} onClose={() => setSettingsOpen(false)} />

      {dragOver && (
        <div className="mg-drop-overlay">
          <div className="mg-drop-card">
            <Icons.Download size={42} />
            <div className="mg-drop-title">Drop URL to queue</div>
            <div className="mg-drop-sub">Release to add it to MediaGrab</div>
          </div>
        </div>
      )}

      <TweaksPanel>
        <TweakSection label="Theme" />
        <TweakToggle label="Dark mode" value={t.dark} onChange={(v) => setTweak("dark", v)} />
        <TweakColor
          label="Accent"
          value={t.accent}
          options={Object.keys(ACCENT_PRESETS)}
          onChange={(v) => setTweak("accent", v)}
        />
        <TweakSection label="Layout" />
        <TweakRadio
          label="Density"
          value={t.density}
          options={["compact", "comfy"]}
          onChange={(v) => setTweak("density", v)}
        />
        <TweakToggle label="Thumbnails" value={t.showThumbs} onChange={(v) => setTweak("showThumbs", v)} />
        <TweakSection label="Demo data" />
        <TweakSelect
          label="Sample state"
          value={t.sampleState}
          options={[
            { value: "mixed", label: "Mixed (default)" },
            { value: "busy", label: "Busy — all downloading" },
            { value: "empty", label: "Empty list" },
          ]}
          onChange={(v) => setTweak("sampleState", v)}
        />
      </TweaksPanel>
    </div>
  );
}

function SettingsSheet({ open, onClose }) {
  if (!open) return null;
  return (
    <div className="mg-modal-scrim" onClick={onClose}>
      <div className="mg-modal mg-modal--wide" onClick={(e) => e.stopPropagation()}>
        <div className="mg-modal-hd">
          <h3>Settings</h3>
          <button className="mg-icon-btn" onClick={onClose}><Icons.X size={14} /></button>
        </div>
        <div className="mg-modal-body">
          <div className="mg-settings-row">
            <div className="mg-settings-label">
              <div>Default download folder</div>
              <div className="mg-muted mg-small">Where files are saved after completion.</div>
            </div>
            <div className="mg-settings-control mg-mono">~/Downloads/MediaGrab</div>
          </div>
          <div className="mg-settings-row">
            <div className="mg-settings-label">
              <div>Max parallel downloads</div>
              <div className="mg-muted mg-small">Active downloads run simultaneously.</div>
            </div>
            <div className="mg-settings-control"><span className="mg-mono">3</span></div>
          </div>
          <div className="mg-settings-row">
            <div className="mg-settings-label">
              <div>Bandwidth limit</div>
              <div className="mg-muted mg-small">Cap total download speed.</div>
            </div>
            <div className="mg-settings-control mg-mono">Unlimited</div>
          </div>
          <div className="mg-settings-row">
            <div className="mg-settings-label">
              <div>yt-dlp binary</div>
              <div className="mg-muted mg-small">Auto-updates checked daily.</div>
            </div>
            <div className="mg-settings-control mg-mono">2026.04.17 ✓</div>
          </div>
          <div className="mg-settings-row">
            <div className="mg-settings-label">
              <div>Cookies file</div>
              <div className="mg-muted mg-small">For age-restricted or subscriber content.</div>
            </div>
            <div className="mg-settings-control mg-muted">Not set</div>
          </div>
          <div className="mg-settings-row">
            <div className="mg-settings-label">
              <div>Notifications</div>
              <div className="mg-muted mg-small">Toast on download completion.</div>
            </div>
            <div className="mg-settings-control"><span className="mg-chip mg-chip--ok"><Icons.Check size={11}/>Enabled</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
