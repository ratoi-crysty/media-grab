import { memo } from 'react';
import type { FilterId } from '../../types';

export interface EmptyStateProps {
  filter: FilterId;
}

const MESSAGES: Record<FilterId, { t: string; s: string }> = {
  all: {
    t: 'No downloads yet',
    s: 'Paste a URL above to start downloading.',
  },
  downloading: {
    t: 'Nothing downloading',
    s: 'Active downloads will appear here with progress.',
  },
  queued: { t: 'Queue is empty', s: 'Add URLs to queue them for download.' },
  completed: {
    t: 'No completed downloads',
    s: 'Finished files will appear here.',
  },
  failed: {
    t: 'No failures — nice',
    s: 'Failed downloads with error details will appear here.',
  },
};

export const EmptyState = memo(function EmptyState({
  filter,
}: EmptyStateProps) {
  const m = MESSAGES[filter];
  return (
    <div className="mg-empty">
      <div className="mg-empty-art">
        <svg viewBox="0 0 200 140" width="180" height="126">
          <defs>
            <linearGradient id="eg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="var(--accent)" stopOpacity=".18" />
              <stop offset="1" stopColor="var(--accent-2)" stopOpacity=".05" />
            </linearGradient>
          </defs>
          <path
            d="M30 80 L50 120 L150 120 L170 80 Z"
            fill="url(#eg)"
            stroke="var(--accent)"
            strokeWidth="1.5"
            strokeOpacity=".4"
            strokeLinejoin="round"
          />
          <line
            x1="30"
            y1="80"
            x2="170"
            y2="80"
            stroke="var(--accent)"
            strokeWidth="1.5"
            strokeOpacity=".5"
          />
          <g style={{ animation: 'mg-bob 2.4s ease-in-out infinite' }}>
            <line
              x1="100"
              y1="20"
              x2="100"
              y2="65"
              stroke="var(--accent)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <polyline
              points="86,55 100,72 114,55"
              fill="none"
              stroke="var(--accent)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
          <circle cx="50" cy="40" r="2" fill="var(--accent-2)" opacity=".6" />
          <circle
            cx="160"
            cy="50"
            r="1.5"
            fill="var(--accent-2)"
            opacity=".5"
          />
          <circle cx="40" cy="60" r="1" fill="var(--accent)" opacity=".5" />
          <circle cx="170" cy="30" r="1" fill="var(--accent)" opacity=".5" />
        </svg>
      </div>
      <h3 className="mg-empty-title">{m.t}</h3>
      <p className="mg-empty-sub">{m.s}</p>
      <div className="mg-empty-shortcuts">
        <span>
          <kbd>/</kbd> focus input
        </span>
        <span>
          <kbd>⌘</kbd>
          <kbd>V</kbd> paste URL
        </span>
        <span>drop a link anywhere</span>
      </div>
    </div>
  );
});
