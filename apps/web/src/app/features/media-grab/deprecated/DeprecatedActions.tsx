// DEPRECATED — see ./README.md
// JSX for pause / resume / start / open / play actions extracted from
// ItemRow.tsx before v1 shipped without those features (interview Q5).

import { memo, useCallback } from 'react';
import { Icons } from '../components/Icon/Icon';

export type DeprecatedAction = 'pause' | 'resume' | 'start' | 'open' | 'play';

export interface DeprecatedActionsProps {
  id: string;
  status: 'downloading' | 'queued' | 'paused' | 'completed' | string;
  onAction: (id: string, action: DeprecatedAction) => void;
}

export const DeprecatedActions = memo(function DeprecatedActions({
  id,
  status,
  onAction,
}: DeprecatedActionsProps) {
  const act = useCallback(
    (action: DeprecatedAction): void => onAction(id, action),
    [id, onAction],
  );
  return (
    <>
      {status === 'downloading' && (
        <button className="mg-action" onClick={() => act('pause')} title="Pause">
          <Icons.Pause size={14} />
        </button>
      )}
      {status === 'paused' && (
        <button
          className="mg-action mg-action--primary"
          onClick={() => act('resume')}
          title="Resume"
        >
          <Icons.Play size={13} />
        </button>
      )}
      {status === 'queued' && (
        <button
          className="mg-action mg-action--primary"
          onClick={() => act('start')}
          title="Start now"
        >
          <Icons.Play size={13} />
        </button>
      )}
      {status === 'completed' && (
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
    </>
  );
});
