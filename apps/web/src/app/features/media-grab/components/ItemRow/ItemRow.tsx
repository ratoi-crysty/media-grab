import { memo, useCallback, useState } from 'react';
import type { Density, Download, ItemAction } from '../../types';
import { fmtBytes, fmtEta, fmtRelative, fmtSpeed } from '../../utils/format';
import { platformMeta } from '../../utils/platform';
import { thumbSvg } from '../../utils/thumb';
import { Icons } from '../Icon/Icon';
import { PlatformGlyph } from '../PlatformGlyph/PlatformGlyph';

export interface ItemRowProps {
  item: Download;
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
  const pct: number = item.size
    ? Math.min(100, (item.downloaded / item.size) * 100)
    : 0;
  const platMeta = platformMeta(item.platform);
  const [showErr, setShowErr] = useState<boolean>(false);

  const isActive: boolean = item.status === 'downloading';
  const isCompleted: boolean = item.status === 'completed';
  const isFailed: boolean = item.status === 'failed';
  const isQueued: boolean = item.status === 'queued';

  const speed: number = 0;
  const eta: number | null = null;

  const toggle = useCallback(() => onSelect(item.id), [item.id, onSelect]);
  const act = useCallback(
    (action: ItemAction): void => onAction(item.id, action),
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

        {isActive && (
          <div className="mg-progress-block">
            <div className="mg-progress">
              <div className="mg-progress-bar" style={{ width: `${pct}%` }}>
                <div className="mg-progress-shimmer" />
              </div>
            </div>
            <div className="mg-progress-stats mg-mono">
              <span className="mg-progress-pct">{pct.toFixed(1)}%</span>
              <span className="mg-muted">
                {fmtBytes(item.downloaded)} / {fmtBytes(item.size)}
              </span>
              <span className="mg-spacer" />
              <span className="mg-progress-speed">{fmtSpeed(speed)}</span>
              <span className="mg-muted">ETA {fmtEta(eta)}</span>
            </div>
          </div>
        )}

        {isQueued && (
          <div className="mg-status-line">
            <span className="mg-status-dot" />
            <span className="mg-muted">Waiting in queue</span>
          </div>
        )}

        {isCompleted && (
          <div className="mg-status-line">
            <Icons.CheckCircle size={13} style={{ color: 'var(--ok)' }} />
            <span className="mg-muted">
              Saved to{' '}
              <span className="mg-mono mg-path">
                {item.filePath ?? '~/Downloads/MediaGrab'}
              </span>
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
        {isFailed && (
          <button
            className="mg-action mg-action--primary"
            onClick={() => act('retry')}
            title="Retry"
          >
            <Icons.RotateCw size={14} />
          </button>
        )}
        {(isActive || isQueued) && (
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
