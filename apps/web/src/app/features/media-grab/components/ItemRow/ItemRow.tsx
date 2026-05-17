import { memo, useCallback, useState } from 'react';
import type { Density, DownloadItem, ItemAction } from '../../types';
import { fmtBytes, fmtEta, fmtRelative, fmtSpeed } from '../../utils/format';
import { PLATFORMS } from '../../utils/platform';
import { thumbSvg } from '../../utils/thumb';
import { Icons } from '../Icon';
import { PlatformGlyph } from '../PlatformGlyph';

export interface ItemRowProps {
  item: DownloadItem;
  selected: boolean;
  onSelect: (id: string) => void;
  onAction: (id: string, action: ItemAction) => void;
  density: Density;
}

export const ItemRow = memo(function ItemRow({
  item,
  selected,
  onSelect,
  onAction,
  density,
}: ItemRowProps) {
  const pct = item.size ? Math.min(100, (item.downloaded / item.size) * 100) : 0;
  const eta = item.speed ? (item.size - item.downloaded) / item.speed : null;
  const platMeta = PLATFORMS[item.platform] ?? { name: 'Web', color: '#888' };
  const [showErr, setShowErr] = useState(false);

  const isActive = item.status === 'downloading';
  const isCompleted = item.status === 'completed';
  const isFailed = item.status === 'failed';
  const isQueued = item.status === 'queued';
  const isPaused = item.status === 'paused';

  const toggle = useCallback(() => onSelect(item.id), [item.id, onSelect]);
  const act = useCallback(
    (action: ItemAction) => onAction(item.id, action),
    [item.id, onAction],
  );

  return (
    <div
      className={`mg-item mg-item--${item.status} ${
        selected ? 'is-selected' : ''
      } ${density === 'compact' ? 'is-compact' : ''}`}
    >
      <label className="mg-item-check" onClick={(e) => e.stopPropagation()}>
        <input type="checkbox" checked={selected} onChange={toggle} />
        <span className="mg-check-box">
          <Icons.Check size={11} />
        </span>
      </label>

      <div className="mg-thumb">
        <img src={thumbSvg(item.title, item.hue)} alt="" />
        <span className="mg-thumb-duration mg-mono">{item.duration}</span>
        {isActive && <div className="mg-thumb-shimmer" />}
      </div>

      <div className="mg-item-main">
        <div className="mg-item-top">
          <div className="mg-item-title" title={item.title}>
            {item.title}
          </div>
          <div className="mg-item-chips">
            <span
              className="mg-chip mg-chip--platform"
              style={{ ['--chip-c' as string]: platMeta.color }}
            >
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
          {isCompleted && item.completedAt != null && (
            <>
              <span className="mg-dot-sep">·</span>
              <span className="mg-mono mg-muted">
                {fmtRelative(item.completedAt)}
              </span>
            </>
          )}
        </div>

        {(isActive || isPaused) && (
          <div className="mg-progress-block">
            <div className={`mg-progress ${isPaused ? 'is-paused' : ''}`}>
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
                  <span className="mg-progress-speed">
                    {fmtSpeed(item.speed)}
                  </span>
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
            <span className="mg-muted">
              Waiting in queue · position #{item.queuePosition ?? '—'}
            </span>
          </div>
        )}

        {isCompleted && (
          <div className="mg-status-line">
            <Icons.CheckCircle size={13} style={{ color: 'var(--ok)' }} />
            <span className="mg-muted">
              Saved to{' '}
              <span className="mg-mono mg-path">~/Downloads/MediaGrab</span>
            </span>
          </div>
        )}

        {isFailed && (
          <div className="mg-status-line mg-status-line--err">
            <Icons.AlertCircle size={13} />
            <span
              className="mg-error-msg"
              onMouseEnter={() => setShowErr(true)}
              onMouseLeave={() => setShowErr(false)}
            >
              {item.error ?? 'Download failed'}
              {showErr && item.errorDetail && (
                <span className="mg-tooltip">{item.errorDetail}</span>
              )}
            </span>
          </div>
        )}
      </div>

      <div className="mg-item-actions">
        {isActive && (
          <button
            className="mg-action"
            onClick={() => act('pause')}
            title="Pause"
          >
            <Icons.Pause size={14} />
          </button>
        )}
        {isPaused && (
          <button
            className="mg-action mg-action--primary"
            onClick={() => act('resume')}
            title="Resume"
          >
            <Icons.Play size={13} />
          </button>
        )}
        {isQueued && (
          <button
            className="mg-action mg-action--primary"
            onClick={() => act('start')}
            title="Start now"
          >
            <Icons.Play size={13} />
          </button>
        )}
        {isFailed && (
          <button
            className="mg-action mg-action--primary"
            onClick={() => act('retry')}
            title="Retry"
          >
            <Icons.RotateCw size={14} />
          </button>
        )}
        {isCompleted && (
          <>
            <button
              className="mg-action"
              onClick={() => act('open')}
              title="Open file location"
            >
              <Icons.Folder size={14} />
            </button>
            <button
              className="mg-action"
              onClick={() => act('play')}
              title="Open file"
            >
              <Icons.ExternalLink size={14} />
            </button>
          </>
        )}
        {(isActive || isQueued || isPaused) && (
          <button
            className="mg-action"
            onClick={() => act('cancel')}
            title="Cancel"
          >
            <Icons.X size={14} />
          </button>
        )}
        <button
          className="mg-action mg-action--muted"
          onClick={() => act('remove')}
          title="Remove from list"
        >
          <Icons.Trash size={14} />
        </button>
      </div>
    </div>
  );
});
