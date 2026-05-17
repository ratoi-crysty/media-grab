import { memo } from 'react';
import type { BulkAction } from '../../types';
import { Icons } from '../Icon/Icon';

export interface BulkBarProps {
  count: number;
  onAction: (action: BulkAction) => void;
  onClear: () => void;
}

export const BulkBar = memo(function BulkBar({
  count,
  onAction,
  onClear,
}: BulkBarProps) {
  return (
    <div className="mg-bulk">
      <div className="mg-bulk-left">
        <span className="mg-bulk-count">
          <span className="mg-mono">{count}</span> selected
        </span>
        <button className="mg-link-btn" onClick={onClear}>
          Clear selection
        </button>
      </div>
      <div className="mg-bulk-actions">
        <button className="mg-btn-ghost" onClick={() => onAction('pause')}>
          <Icons.Pause size={13} /> Pause
        </button>
        <button className="mg-btn-ghost" onClick={() => onAction('resume')}>
          <Icons.Play size={13} /> Resume
        </button>
        <button className="mg-btn-ghost" onClick={() => onAction('retry')}>
          <Icons.RotateCw size={13} /> Retry
        </button>
        <button
          className="mg-btn-ghost mg-btn-ghost--danger"
          onClick={() => onAction('remove')}
        >
          <Icons.Trash size={13} /> Remove
        </button>
      </div>
    </div>
  );
});
