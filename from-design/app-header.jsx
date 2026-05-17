// MediaGrab — main UI components
const { useState: useState2, useEffect: useEffect2, useRef: useRef2, useMemo: useMemo2, useCallback: useCallback2 } = React;

// ─────────────────────────────────────────────────────────────────────────────
// Header
// ─────────────────────────────────────────────────────────────────────────────
function Header({ dark, onToggleTheme, downloadingCount, totalCount, onShowShortcuts, onShowSettings }) {
  return (
    <header className="mg-header">
      <div className="mg-brand">
        <div className="mg-logo">
          <svg viewBox="0 0 32 32" width="22" height="22">
            <defs>
              <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="var(--accent)"/>
                <stop offset="1" stopColor="var(--accent-2)"/>
              </linearGradient>
            </defs>
            <rect x="2" y="2" width="28" height="28" rx="8" fill="url(#lg)"/>
            <path d="M10 13v4a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-4M16 7v9M12 12l4 4 4-4"
                  stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          </svg>
        </div>
        <div className="mg-brand-text">
          <div className="mg-brand-name">MediaGrab</div>
          <div className="mg-brand-sub">
            <span className="mg-mono">yt-dlp</span> · 2026.04.17
          </div>
        </div>
      </div>

      <div className="mg-header-status">
        {downloadingCount > 0 ? (
          <>
            <span className="mg-status-dot mg-status-dot--active" />
            <span className="mg-mono">{downloadingCount} active · {totalCount} total</span>
          </>
        ) : (
          <>
            <span className="mg-status-dot" />
            <span className="mg-mono">idle · {totalCount} item{totalCount === 1 ? "" : "s"}</span>
          </>
        )}
      </div>

      <div className="mg-header-actions">
        <button className="mg-icon-btn" title="Keyboard shortcuts (?)" onClick={onShowShortcuts}>
          <Icons.Command size={16} />
        </button>
        <button className="mg-icon-btn" title="Open downloads folder (⌘O)">
          <Icons.Folder size={16} />
          <span className="mg-icon-btn-label">Downloads</span>
        </button>
        <button className="mg-icon-btn" title={dark ? "Light mode" : "Dark mode"} onClick={onToggleTheme}>
          {dark ? <Icons.Sun size={16} /> : <Icons.Moon size={16} />}
        </button>
        <button className="mg-icon-btn" title="Settings" onClick={onShowSettings}>
          <Icons.Settings size={16} />
        </button>
      </div>
    </header>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// URL Input
// ─────────────────────────────────────────────────────────────────────────────
function UrlInput({ onAdd }) {
  const [value, setValue] = useState2("");
  const [advanced, setAdvanced] = useState2(false);
  const [format, setFormat] = useState2("best");
  const [quality, setQuality] = useState2("1080p");
  const [subs, setSubs] = useState2(false);
  const [subLang, setSubLang] = useState2("en");
  const [filenameTpl, setFilenameTpl] = useState2("%(uploader)s - %(title)s.%(ext)s");
  const inputRef = useRef2(null);

  const platform = detectPlatform(value);
  const valid = isValidUrl(value);
  const trimmed = value.trim();

  useEffect2(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "v") {
        // Just focus the input — let the browser handle paste
        setTimeout(() => inputRef.current?.focus(), 0);
      }
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const submit = () => {
    if (!valid) return;
    onAdd({ url: trimmed, platform, format, quality, subs, subLang, filenameTpl });
    setValue("");
  };

  return (
    <section className="mg-url">
      <div className={`mg-url-row ${valid ? "is-valid" : ""}`}>
        <div className="mg-url-icon">
          {platform ? <PlatformGlyph platform={platform} size={18} /> : <Icons.Link size={18} />}
        </div>
        <input
          ref={inputRef}
          className="mg-url-input"
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Paste a YouTube, Vimeo, TikTok, or other media URL…"
          spellCheck={false}
          autoComplete="off"
        />
        {value && (
          <button className="mg-url-clear" onClick={() => setValue("")} title="Clear">
            <Icons.X size={14} />
          </button>
        )}
        <div className="mg-url-kbd">
          <kbd>/</kbd>
        </div>
        <button
          className="mg-btn-primary mg-url-add"
          onClick={submit}
          disabled={!valid}
        >
          <Icons.Plus size={16} />
          Add to Queue
        </button>
      </div>

      <div className="mg-url-meta">
        <button
          className={`mg-link-btn ${advanced ? "is-open" : ""}`}
          onClick={() => setAdvanced(!advanced)}
        >
          <Icons.ChevronDown size={14} />
          Advanced options
        </button>

        {value && !valid && (
          <span className="mg-url-hint mg-url-hint--warn">
            <Icons.AlertCircle size={13} /> Not a valid URL
          </span>
        )}
        {valid && platform && (
          <span className="mg-url-hint mg-url-hint--ok">
            <Icons.Check size={13} /> {PLATFORMS[platform].name} detected
          </span>
        )}
        {valid && !platform && (
          <span className="mg-url-hint">
            <Icons.Globe size={13} /> Generic extractor
          </span>
        )}
      </div>

      {advanced && (
        <div className="mg-advanced">
          <div className="mg-adv-grid">
            <label className="mg-field">
              <span className="mg-field-label">Format</span>
              <select className="mg-select" value={format} onChange={(e) => setFormat(e.target.value)}>
                <option value="best">Best available (video + audio)</option>
                <option value="mp4">MP4 (H.264)</option>
                <option value="mp3">MP3 — audio only</option>
                <option value="m4a">M4A — audio only</option>
                <option value="custom">Custom yt-dlp format string…</option>
              </select>
            </label>

            <label className="mg-field">
              <span className="mg-field-label">Quality</span>
              <select className="mg-select" value={quality} onChange={(e) => setQuality(e.target.value)}
                      disabled={format === "mp3" || format === "m4a"}>
                <option value="2160p">2160p (4K)</option>
                <option value="1440p">1440p (2K)</option>
                <option value="1080p">1080p</option>
                <option value="720p">720p</option>
                <option value="480p">480p</option>
                <option value="audio">Audio only</option>
              </select>
            </label>

            <label className="mg-field mg-field--check">
              <span className="mg-field-label">Subtitles</span>
              <div className="mg-check-row">
                <label className="mg-toggle">
                  <input type="checkbox" checked={subs} onChange={(e) => setSubs(e.target.checked)} />
                  <span className="mg-toggle-track"><span className="mg-toggle-dot"/></span>
                </label>
                <select className="mg-select mg-select--inline" value={subLang}
                        onChange={(e) => setSubLang(e.target.value)} disabled={!subs}>
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                  <option value="de">Deutsch</option>
                  <option value="ja">日本語</option>
                  <option value="all">All available</option>
                </select>
              </div>
            </label>

            <label className="mg-field mg-field--wide">
              <span className="mg-field-label">Output template</span>
              <input className="mg-input mg-mono" value={filenameTpl}
                     onChange={(e) => setFilenameTpl(e.target.value)} spellCheck={false}/>
            </label>
          </div>
        </div>
      )}
    </section>
  );
}

Object.assign(window, { Header, UrlInput });
