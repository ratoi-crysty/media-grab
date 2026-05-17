import { memo } from 'react';
import { Icons } from '../Icon';

export const DropOverlay = memo(function DropOverlay() {
  return (
    <div className="mg-drop-overlay">
      <div className="mg-drop-card">
        <Icons.Download size={42} />
        <div className="mg-drop-title">Drop URL to queue</div>
        <div className="mg-drop-sub">Release to add it to MediaGrab</div>
      </div>
    </div>
  );
});
