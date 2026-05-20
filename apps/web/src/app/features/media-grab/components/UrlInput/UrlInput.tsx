import {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from 'react';
import type { AddItemInput, Format, Quality } from '../../types';
import { usePreview } from '../../../../shared/api/api.hooks';
import { detectPlatform, isValidUrl, PLATFORMS } from '../../utils/platform';
import { Icons } from '../Icon/Icon';
import { PlatformGlyph } from '../PlatformGlyph/PlatformGlyph';

export interface UrlInputProps {
  onAdd: (item: AddItemInput) => void | Promise<void>;
  prefillUrl?: string | null;
}

export const UrlInput = memo(function UrlInput({
  onAdd,
  prefillUrl,
}: UrlInputProps) {
  const [value, setValue] = useState<string>('');

  useEffect(() => {
    if (prefillUrl) setValue(prefillUrl);
  }, [prefillUrl]);
  const [advanced, setAdvanced] = useState<boolean>(false);
  const [format, setFormat] = useState<Format>('best');
  const [quality, setQuality] = useState<Quality>('1080p');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const platform = detectPlatform(value);
  const valid: boolean = isValidUrl(value);
  const trimmed: string = value.trim();

  const { preview, isLoading: previewLoading, error: previewError } =
    usePreview(valid ? trimmed : '');

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

  const canSubmit: boolean = valid && !!preview && !submitting;

  const submit = useCallback(async (): Promise<void> => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await onAdd({ url: trimmed, format, quality });
      setValue('');
    } finally {
      setSubmitting(false);
    }
  }, [canSubmit, onAdd, trimmed, format, quality]);

  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') void submit();
    },
    [submit],
  );

  const onChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => setValue(e.target.value),
    [],
  );

  const clear = useCallback(() => setValue(''), []);
  const toggleAdvanced = useCallback(() => setAdvanced((v) => !v), []);

  const audioOnly: boolean = format === 'mp3' || format === 'm4a';

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
          onClick={(): void => void submit()}
          disabled={!canSubmit}
        >
          <Icons.Plus size={16} />
          {submitting ? 'Adding…' : 'Add to Queue'}
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

      {valid && (previewLoading || preview || previewError) && (
        <div className="mg-preview">
          {previewLoading && (
            <div className="mg-preview-loading mg-muted">
              <Icons.Globe size={13} /> Fetching preview…
            </div>
          )}
          {preview && (
            <div className="mg-preview-card">
              {preview.thumbnailUrl ? (
                <img
                  className="mg-preview-thumb"
                  src={preview.thumbnailUrl}
                  alt=""
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="mg-preview-thumb mg-preview-thumb--empty" />
              )}
              <div className="mg-preview-info">
                <div className="mg-preview-title" title={preview.title}>
                  {preview.title}
                </div>
                <div className="mg-preview-meta mg-muted">
                  <span>{preview.uploader}</span>
                  <span className="mg-dot-sep">·</span>
                  <span className="mg-mono">{preview.duration}</span>
                  <span className="mg-dot-sep">·</span>
                  <span className="mg-mono">{preview.platform}</span>
                </div>
              </div>
            </div>
          )}
          {previewError && (
            <div className="mg-preview-error">
              <Icons.AlertCircle size={13} /> {previewError.message}
              {previewError.errorDetail && (
                <div className="mg-mono mg-muted mg-preview-error-detail">
                  {previewError.errorDetail}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {advanced && (
        <div className="mg-advanced">
          <div className="mg-adv-grid">
            <label className="mg-field">
              <span className="mg-field-label">Format</span>
              <select
                className="mg-select"
                value={format}
                onChange={(e) => setFormat(e.target.value as Format)}
              >
                <option value="best">Best available (video + audio)</option>
                <option value="mp4">MP4 (H.264)</option>
                <option value="mp3">MP3 — audio only</option>
                <option value="m4a">M4A — audio only</option>
              </select>
            </label>

            <label className="mg-field">
              <span className="mg-field-label">Quality</span>
              <select
                className="mg-select"
                value={audioOnly ? 'audio' : quality}
                onChange={(e) => setQuality(e.target.value as Quality)}
                disabled={audioOnly}
              >
                <option value="2160p">2160p (4K)</option>
                <option value="1440p">1440p (2K)</option>
                <option value="1080p">1080p</option>
                <option value="720p">720p</option>
                <option value="480p">480p</option>
                <option value="audio">Audio only</option>
              </select>
            </label>
          </div>
        </div>
      )}
    </section>
  );
});
