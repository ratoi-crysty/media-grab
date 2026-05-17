import { memo, useMemo } from 'react';
import type { Density, FilterId, StatusCounts } from '../../types';
import { Icons } from '../Icon';

export interface TabsProps {
  counts: StatusCounts;
  value: FilterId;
  onChange: (id: FilterId) => void;
  search: string;
  onSearch: (s: string) => void;
  density: Density;
  onDensity: (d: Density) => void;
}

interface TabDef {
  id: FilterId;
  label: string;
  count: number;
  dot?: 'active' | 'ok' | 'err';
}

export const Tabs = memo(function Tabs({
  counts,
  value,
  onChange,
  search,
  onSearch,
  density,
  onDensity,
}: TabsProps) {
  const tabs = useMemo<TabDef[]>(
    () => [
      { id: 'all', label: 'All', count: counts.all },
      {
        id: 'downloading',
        label: 'Downloading',
        count: counts.downloading,
        dot: 'active',
      },
      { id: 'queued', label: 'Queued', count: counts.queued },
      {
        id: 'completed',
        label: 'Completed',
        count: counts.completed,
        dot: 'ok',
      },
      { id: 'failed', label: 'Failed', count: counts.failed, dot: 'err' },
    ],
    [counts],
  );

  return (
    <div className="mg-tabs-row">
      <div className="mg-tabs" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={value === t.id}
            className={`mg-tab ${value === t.id ? 'is-active' : ''}`}
            onClick={() => onChange(t.id)}
          >
            {t.dot && (
              <span className={`mg-status-dot mg-status-dot--${t.dot}`} />
            )}
            <span>{t.label}</span>
            <span className="mg-tab-count mg-mono">{t.count}</span>
          </button>
        ))}
      </div>
      <div className="mg-tabs-right">
        <div className="mg-search">
          <Icons.Search size={14} />
          <input
            type="text"
            placeholder="Filter by title, channel…"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
        <div className="mg-density-toggle" title="Row density">
          <button
            className={density === 'compact' ? 'is-active' : ''}
            onClick={() => onDensity('compact')}
            title="Compact"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <rect x="2" y="3" width="12" height="2" rx="1" />
              <rect x="2" y="7" width="12" height="2" rx="1" />
              <rect x="2" y="11" width="12" height="2" rx="1" />
            </svg>
          </button>
          <button
            className={density === 'comfy' ? 'is-active' : ''}
            onClick={() => onDensity('comfy')}
            title="Comfortable"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <rect x="2" y="2" width="12" height="3" rx="1" />
              <rect x="2" y="6.5" width="12" height="3" rx="1" />
              <rect x="2" y="11" width="12" height="3" rx="1" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
});
