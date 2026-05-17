import {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from 'react';
import type { AddItemInput } from '../../types';
import { detectPlatform, isValidUrl, PLATFORMS } from '../../utils/platform';
import { Icons } from '../Icon';
import { PlatformGlyph } from '../PlatformGlyph';

export interface UrlInputProps {
  onAdd: (item: AddItemInput) => void;
}

export const UrlInput = memo(function UrlInput({ onAdd }: UrlInputProps) {
  const [value, setValue] = useState('');
  const [advanced, setAdvanced] = useState(false);
  const [format, setFormat] = useState('best');
  const [quality, setQuality] = useState('1080p');
  const [subs, setSubs] = useState(false);
  const [subLang, setSubLang] = useState('en');
  const [filenameTpl, setFilenameTpl] = useState(
    '%(uploader)s - %(title)s.%(ext)s',
  );
  const inputRef = useRef<HTMLInputElement>(null);

  const platform = detectPlatform(value);
  const valid = isValidUrl(value);
  const trimmed = value.trim();

  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'v') {
        setTimeout(() => inputRef.current?.focus(), 0);
      }
      if (
        e.key === '/' &&
        (document.activeElement as HTMLElement | null)?.tagName !== 'INPUT'
      ) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const submit = useCallback(() => {
    if (!valid) return;
    onAdd({
      url: trimmed,
      platform,
      format,
      quality,
      subs,
      subLang,
      filenameTpl,
    });
    setValue('');
  }, [valid, onAdd, trimmed, platform, format, quality, subs, subLang, filenameTpl]);

  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') submit();
    },
    [submit],
  );

  const onChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => setValue(e.target.value),
    [],
  );

  const clear = useCallback(() => setValue(''), []);
  const toggleAdvanced = useCallback(() => setAdvanced((v) => !v), []);

  return (
    <section className="mg-url">
      <div className={`mg-url-row ${valid ? 'is-valid' : ''}`}>
        <div className="mg-url-icon">
          {platform ? (
            <PlatformGlyph platform={platform} size={18} />
          ) : (
            <Icons.Link size={18} />
          )}
        </div>
        <input
          ref={inputRef}
          className="mg-url-input"
          type="text"
          value={value}
          onChange={onChange}
          onKeyDown={onKeyDown}
          placeholder="Paste a YouTube, Vimeo, TikTok, or other media URL…"
          spellCheck={false}
          autoComplete="off"
        />
        {value && (
          <button className="mg-url-clear" onClick={clear} title="Clear">
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
          className={`mg-link-btn ${advanced ? 'is-open' : ''}`}
          onClick={toggleAdvanced}
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
              <select
                className="mg-select"
                value={format}
                onChange={(e) => setFormat(e.target.value)}
              >
                <option value="best">Best available (video + audio)</option>
                <option value="mp4">MP4 (H.264)</option>
                <option value="mp3">MP3 — audio only</option>
                <option value="m4a">M4A — audio only</option>
                <option value="custom">Custom yt-dlp format string…</option>
              </select>
            </label>

            <label className="mg-field">
              <span className="mg-field-label">Quality</span>
              <select
                className="mg-select"
                value={quality}
                onChange={(e) => setQuality(e.target.value)}
                disabled={format === 'mp3' || format === 'm4a'}
              >
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
                  <input
                    type="checkbox"
                    checked={subs}
                    onChange={(e) => setSubs(e.target.checked)}
                  />
                  <span className="mg-toggle-track">
                    <span className="mg-toggle-dot" />
                  </span>
                </label>
                <select
                  className="mg-select mg-select--inline"
                  value={subLang}
                  onChange={(e) => setSubLang(e.target.value)}
                  disabled={!subs}
                >
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
              <input
                className="mg-input mg-mono"
                value={filenameTpl}
                onChange={(e) => setFilenameTpl(e.target.value)}
                spellCheck={false}
              />
            </label>
          </div>
        </div>
      )}
    </section>
  );
});
