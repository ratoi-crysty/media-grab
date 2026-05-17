import { memo } from 'react';
import { Icons } from '../Icon/Icon';

export interface SettingsSheetProps {
  open: boolean;
  onClose: () => void;
}

export const SettingsSheet = memo(function SettingsSheet({
  open,
  onClose,
}: SettingsSheetProps) {
  if (!open) return null;
  return (
    <div className="mg-modal-scrim" onClick={onClose}>
      <div
        className="mg-modal mg-modal--wide"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mg-modal-hd">
          <h3>Settings</h3>
          <button className="mg-icon-btn" onClick={onClose}>
            <Icons.X size={14} />
          </button>
        </div>
        <div className="mg-modal-body">
          <div className="mg-settings-row">
            <div className="mg-settings-label">
              <div>Default download folder</div>
              <div className="mg-muted mg-small">
                Where files are saved after completion.
              </div>
            </div>
            <div className="mg-settings-control mg-mono">
              ~/Downloads/MediaGrab
            </div>
          </div>
          <div className="mg-settings-row">
            <div className="mg-settings-label">
              <div>Max parallel downloads</div>
              <div className="mg-muted mg-small">
                Active downloads run simultaneously.
              </div>
            </div>
            <div className="mg-settings-control">
              <span className="mg-mono">3</span>
            </div>
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
              <div className="mg-muted mg-small">
                Auto-updates checked daily.
              </div>
            </div>
            <div className="mg-settings-control mg-mono">2026.04.17 ✓</div>
          </div>
          <div className="mg-settings-row">
            <div className="mg-settings-label">
              <div>Cookies file</div>
              <div className="mg-muted mg-small">
                For age-restricted or subscriber content.
              </div>
            </div>
            <div className="mg-settings-control mg-muted">Not set</div>
          </div>
          <div className="mg-settings-row">
            <div className="mg-settings-label">
              <div>Notifications</div>
              <div className="mg-muted mg-small">
                Toast on download completion.
              </div>
            </div>
            <div className="mg-settings-control">
              <span className="mg-chip mg-chip--ok">
                <Icons.Check size={11} />
                Enabled
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
