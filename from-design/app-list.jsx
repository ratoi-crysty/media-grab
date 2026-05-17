// MediaGrab — download list components
const { useState: useState3, useEffect: useEffect3, useRef: useRef3, useMemo: useMemo3 } = React;

// ─────────────────────────────────────────────────────────────────────────────
// Tabs
// ─────────────────────────────────────────────────────────────────────────────
function Tabs({ counts, value, onChange, onSearch, search, density, onDensity }) {
  const tabs = [
    { id: "all", label: "All", count: counts.all },
    { id: "downloading", label: "Downloading", count: counts.downloading, dot: "active" },
    { id: "queued", label: "Queued", count: counts.queued },
    { id: "completed", label: "Completed", count: counts.completed, dot: "ok" },
    { id: "failed", label: "Failed", count: counts.failed, dot: "err" },
  ];
  return (
    <div className="mg-tabs-row">
      <div className="mg-tabs" role="tablist">
        {tabs.map(t => (
          <button
            key={t.id}
            role="tab"
            aria-selected={value === t.id}
            className={`mg-tab ${value === t.id ? "is-active" : ""}`}
            onClick={() => onChange(t.id)}
          >
            {t.dot && <span className={`mg-status-dot mg-status-dot--${t.dot === "active" ? "active" : t.dot === "ok" ? "ok" : "err"}`} />}
            <span>{t.label}</span>
            <span className="mg-tab-count mg-mono">{t.count}</span>
          </button>
        ))}
      </div>
      <div className="mg-tabs-right">
        <div className="mg-search">
          <Icons.Search size={14} />
          <input
            type="text"
            placeholder="Filter by title, channel…"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
        <div className="mg-density-toggle" title="Row density">
          <button className={density === "compact" ? "is-active" : ""} onClick={() => onDensity("compact")} title="Compact">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <rect x="2" y="3" width="12" height="2" rx="1"/>
              <rect x="2" y="7" width="12" height="2" rx="1"/>
              <rect x="2" y="11" width="12" height="2" rx="1"/>
            </svg>
          </button>
          <button className={density === "comfy" ? "is-active" : ""} onClick={() => onDensity("comfy")} title="Comfortable">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <rect x="2" y="2" width="12" height="3" rx="1"/>
              <rect x="2" y="6.5" width="12" height="3" rx="1"/>
              <rect x="2" y="11" width="12" height="3" rx="1"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Item row
// ─────────────────────────────────────────────────────────────────────────────
function ItemRow({ item, selected, onSelect, onAction, density }) {
  const pct = item.size ? Math.min(100, (item.downloaded / item.size) * 100) : 0;
  const eta = item.speed ? (item.size - item.downloaded) / item.speed : null;
  const platMeta = PLATFORMS[item.platform] || { name: "Web", color: "#888" };
  const [showErr, setShowErr] = useState3(false);

  const statusClass = `mg-item--${item.status}`;
  const isActive = item.status === "downloading";
  const isCompleted = item.status === "completed";
  const isFailed = item.status === "failed";
  const isQueued = item.status === "queued";
  const isPaused = item.status === "paused";

  return (
    <div className={`mg-item ${statusClass} ${selected ? "is-selected" : ""} ${density === "compact" ? "is-compact" : ""}`}>
      <label className="mg-item-check" onClick={(e) => e.stopPropagation()}>
        <input type="checkbox" checked={selected} onChange={() => onSelect(item.id)} />
        <span className="mg-check-box"><Icons.Check size={11} /></span>
      </label>

      <div className="mg-thumb">
        <img src={thumbSvg(item.title, item.hue)} alt="" />
        <span className="mg-thumb-duration mg-mono">{item.duration}</span>
        {isActive && <div className="mg-thumb-shimmer" />}
      </div>

      <div className="mg-item-main">
        <div className="mg-item-top">
          <div className="mg-item-title" title={item.title}>{item.title}</div>
          <div className="mg-item-chips">
            <span className="mg-chip mg-chip--platform" style={{ "--chip-c": platMeta.color }}>
              <PlatformGlyph platform={item.platform} size={11} />
              <span>{platMeta.name}</span>
            </span>
            <span className="mg-chip mg-mono">
              {item.format} · {item.quality}
            </span>
          </div>
        </div>

        <div className="mg-item-meta">
          <span className="mg-item-uploader">{item.uploader}</span>
          <span className="mg-dot-sep">·</span>
          <span className="mg-mono mg-muted">{fmtBytes(item.size)}</span>
          {isCompleted && (
            <>
              <span className="mg-dot-sep">·</span>
              <span className="mg-mono mg-muted">{fmtRelative(item.completedAt)}</span>
            </>
          )}
        </div>

        {(isActive || isPaused) && (
          <div className="mg-progress-block">
            <div className={`mg-progress ${isPaused ? "is-paused" : ""}`}>
              <div className="mg-progress-bar" style={{ width: `${pct}%` }}>
                {isActive && <div className="mg-progress-shimmer" />}
              </div>
            </div>
            <div className="mg-progress-stats mg-mono">
              <span className="mg-progress-pct">{pct.toFixed(1)}%</span>
              <span className="mg-muted">
                {fmtBytes(item.downloaded)} / {fmtBytes(item.size)}
              </span>
              <span className="mg-spacer" />
              {isActive ? (
                <>
                  <span className="mg-progress-speed">{fmtSpeed(item.speed)}</span>
                  <span className="mg-muted">ETA {fmtEta(eta)}</span>
                </>
              ) : (
                <span className="mg-muted">Paused</span>
              )}
            </div>
          </div>
        )}

        {isQueued && (
          <div className="mg-status-line">
            <span className="mg-status-dot" />
            <span className="mg-muted">Waiting in queue · position #{item.queuePosition || "—"}</span>
          </div>
        )}

        {isCompleted && (
          <div className="mg-status-line">
            <Icons.CheckCircle size={13} style={{ color: "var(--ok)" }} />
            <span className="mg-muted">Saved to <span className="mg-mono mg-path">~/Downloads/MediaGrab</span></span>
          </div>
        )}

        {isFailed && (
          <div className="mg-status-line mg-status-line--err">
            <Icons.AlertCircle size={13} />
            <span className="mg-error-msg" onMouseEnter={() => setShowErr(true)} onMouseLeave={() => setShowErr(false)}>
              {item.error || "Download failed"}
              {showErr && item.errorDetail && (
                <span className="mg-tooltip">{item.errorDetail}</span>
              )}
            </span>
          </div>
        )}
      </div>

      <div className="mg-item-actions">
        {isActive && (
          <button className="mg-action" onClick={() => onAction(item.id, "pause")} title="Pause">
            <Icons.Pause size={14} />
          </button>
        )}
        {isPaused && (
          <button className="mg-action mg-action--primary" onClick={() => onAction(item.id, "resume")} title="Resume">
            <Icons.Play size={13} />
          </button>
        )}
        {isQueued && (
          <button className="mg-action mg-action--primary" onClick={() => onAction(item.id, "start")} title="Start now">
            <Icons.Play size={13} />
          </button>
        )}
        {isFailed && (
          <button className="mg-action mg-action--primary" onClick={() => onAction(item.id, "retry")} title="Retry">
            <Icons.RotateCw size={14} />
          </button>
        )}
        {isCompleted && (
          <>
            <button className="mg-action" onClick={() => onAction(item.id, "open")} title="Open file location">
              <Icons.Folder size={14} />
            </button>
            <button className="mg-action" onClick={() => onAction(item.id, "play")} title="Open file">
              <Icons.ExternalLink size={14} />
            </button>
          </>
        )}
        {(isActive || isQueued || isPaused) && (
          <button className="mg-action" onClick={() => onAction(item.id, "cancel")} title="Cancel">
            <Icons.X size={14} />
          </button>
        )}
        <button className="mg-action mg-action--muted" onClick={() => onAction(item.id, "remove")} title="Remove from list">
          <Icons.Trash size={14} />
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Empty state
// ─────────────────────────────────────────────────────────────────────────────
function EmptyState({ filter }) {
  const messages = {
    all: { t: "No downloads yet", s: "Paste a URL above to start downloading." },
    downloading: { t: "Nothing downloading", s: "Active downloads will appear here with progress." },
    queued: { t: "Queue is empty", s: "Add URLs to queue them for download." },
    completed: { t: "No completed downloads", s: "Finished files will appear here." },
    failed: { t: "No failures — nice", s: "Failed downloads with error details will appear here." },
  };
  const m = messages[filter] || messages.all;
  return (
    <div className="mg-empty">
      <div className="mg-empty-art">
        <svg viewBox="0 0 200 140" width="180" height="126">
          <defs>
            <linearGradient id="eg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="var(--accent)" stopOpacity=".18"/>
              <stop offset="1" stopColor="var(--accent-2)" stopOpacity=".05"/>
            </linearGradient>
          </defs>
          {/* tray */}
          <path d="M30 80 L50 120 L150 120 L170 80 Z"
                fill="url(#eg)" stroke="var(--accent)" strokeWidth="1.5" strokeOpacity=".4" strokeLinejoin="round"/>
          <line x1="30" y1="80" x2="170" y2="80" stroke="var(--accent)" strokeWidth="1.5" strokeOpacity=".5"/>
          {/* down arrow */}
          <g style={{ animation: "mg-bob 2.4s ease-in-out infinite" }}>
            <line x1="100" y1="20" x2="100" y2="65" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round"/>
            <polyline points="86,55 100,72 114,55" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </g>
          {/* sparkles */}
          <circle cx="50" cy="40" r="2" fill="var(--accent-2)" opacity=".6"/>
          <circle cx="160" cy="50" r="1.5" fill="var(--accent-2)" opacity=".5"/>
          <circle cx="40" cy="60" r="1" fill="var(--accent)" opacity=".5"/>
          <circle cx="170" cy="30" r="1" fill="var(--accent)" opacity=".5"/>
        </svg>
      </div>
      <h3 className="mg-empty-title">{m.t}</h3>
      <p className="mg-empty-sub">{m.s}</p>
      <div className="mg-empty-shortcuts">
        <span><kbd>/</kbd> focus input</span>
        <span><kbd>⌘</kbd><kbd>V</kbd> paste URL</span>
        <span>drop a link anywhere</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Bulk actions bar
// ─────────────────────────────────────────────────────────────────────────────
function BulkBar({ count, onAction, onClear }) {
  return (
    <div className="mg-bulk">
      <div className="mg-bulk-left">
        <span className="mg-bulk-count"><span className="mg-mono">{count}</span> selected</span>
        <button className="mg-link-btn" onClick={onClear}>Clear selection</button>
      </div>
      <div className="mg-bulk-actions">
        <button className="mg-btn-ghost" onClick={() => onAction("pause")}>
          <Icons.Pause size={13} /> Pause
        </button>
        <button className="mg-btn-ghost" onClick={() => onAction("resume")}>
          <Icons.Play size={13} /> Resume
        </button>
        <button className="mg-btn-ghost" onClick={() => onAction("retry")}>
          <Icons.RotateCw size={13} /> Retry
        </button>
        <button className="mg-btn-ghost mg-btn-ghost--danger" onClick={() => onAction("remove")}>
          <Icons.Trash size={13} /> Remove
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Toast
// ─────────────────────────────────────────────────────────────────────────────
function Toasts({ toasts, onDismiss }) {
  return (
    <div className="mg-toasts">
      {toasts.map(t => (
        <div key={t.id} className={`mg-toast mg-toast--${t.kind || "info"}`}>
          <div className="mg-toast-icon">
            {t.kind === "ok" && <Icons.CheckCircle size={16} />}
            {t.kind === "err" && <Icons.AlertCircle size={16} />}
            {(!t.kind || t.kind === "info") && <Icons.Download size={16} />}
          </div>
          <div className="mg-toast-body">
            <div className="mg-toast-title">{t.title}</div>
            {t.sub && <div className="mg-toast-sub">{t.sub}</div>}
          </div>
          <button className="mg-toast-x" onClick={() => onDismiss(t.id)}><Icons.X size={12} /></button>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Shortcuts overlay
// ─────────────────────────────────────────────────────────────────────────────
function ShortcutsModal({ open, onClose }) {
  if (!open) return null;
  const groups = [
    { title: "Global", items: [
      ["/", "Focus URL input"],
      ["⌘ V", "Paste URL into input"],
      ["⌘ O", "Open downloads folder"],
      ["⌘ ,", "Settings"],
      ["?", "Show shortcuts"],
    ]},
    { title: "List", items: [
      ["⌘ A", "Select all visible"],
      ["Space", "Pause / resume selected"],
      ["Delete", "Remove selected"],
      ["⌘ K", "Clear completed"],
    ]},
  ];
  return (
    <div className="mg-modal-scrim" onClick={onClose}>
      <div className="mg-modal" onClick={(e) => e.stopPropagation()}>
        <div className="mg-modal-hd">
          <h3>Keyboard shortcuts</h3>
          <button className="mg-icon-btn" onClick={onClose}><Icons.X size={14} /></button>
        </div>
        <div className="mg-modal-body">
          {groups.map(g => (
            <div className="mg-kbd-group" key={g.title}>
              <div className="mg-kbd-title">{g.title}</div>
              {g.items.map(([k, l]) => (
                <div className="mg-kbd-row" key={k}>
                  <span className="mg-kbd-label">{l}</span>
                  <span className="mg-kbd-keys">
                    {k.split(" ").map((p, i) => <kbd key={i}>{p}</kbd>)}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Tabs, ItemRow, EmptyState, BulkBar, Toasts, ShortcutsModal });
