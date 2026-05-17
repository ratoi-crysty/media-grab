import { memo } from 'react';
import { Icons } from '../Icon/Icon';

export interface HeaderProps {
  dark: boolean;
  onToggleTheme: () => void;
  downloadingCount: number;
  totalCount: number;
  onShowShortcuts: () => void;
  onShowSettings: () => void;
}

export const Header = memo(function Header({
  dark,
  onToggleTheme,
  downloadingCount,
  totalCount,
  onShowShortcuts,
  onShowSettings,
}: HeaderProps) {
  return (
    <header className="mg-header">
      <div className="mg-brand">
        <div className="mg-logo">
          <svg viewBox="0 0 32 32" width="22" height="22">
            <defs>
              <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="var(--accent)" />
                <stop offset="1" stopColor="var(--accent-2)" />
              </linearGradient>
            </defs>
            <rect x="2" y="2" width="28" height="28" rx="8" fill="url(#lg)" />
            <path
              d="M10 13v4a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-4M16 7v9M12 12l4 4 4-4"
              stroke="white"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
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
            <span className="mg-mono">
              {downloadingCount} active · {totalCount} total
            </span>
          </>
        ) : (
          <>
            <span className="mg-status-dot" />
            <span className="mg-mono">
              idle · {totalCount} item{totalCount === 1 ? '' : 's'}
            </span>
          </>
        )}
      </div>

      <div className="mg-header-actions">
        <button
          className="mg-icon-btn"
          title="Keyboard shortcuts (?)"
          onClick={onShowShortcuts}
        >
          <Icons.Command size={16} />
        </button>
        <button className="mg-icon-btn" title="Open downloads folder (⌘O)">
          <Icons.Folder size={16} />
          <span className="mg-icon-btn-label">Downloads</span>
        </button>
        <button
          className="mg-icon-btn"
          title={dark ? 'Light mode' : 'Dark mode'}
          onClick={onToggleTheme}
        >
          {dark ? <Icons.Sun size={16} /> : <Icons.Moon size={16} />}
        </button>
        <button
          className="mg-icon-btn"
          title="Settings"
          onClick={onShowSettings}
        >
          <Icons.Settings size={16} />
        </button>
      </div>
    </header>
  );
});
