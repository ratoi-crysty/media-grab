import { memo } from 'react';
import { Icons } from '../Icon/Icon';

export interface ShortcutsModalProps {
  open: boolean;
  onClose: () => void;
}

const GROUPS: { title: string; items: [string, string][] }[] = [
  {
    title: 'Global',
    items: [
      ['/', 'Focus URL input'],
      ['⌘ V', 'Paste URL into input'],
      ['⌘ O', 'Open downloads folder'],
      ['⌘ ,', 'Settings'],
      ['?', 'Show shortcuts'],
    ],
  },
  {
    title: 'List',
    items: [
      ['⌘ A', 'Select all visible'],
      ['Space', 'Pause / resume selected'],
      ['Delete', 'Remove selected'],
      ['⌘ K', 'Clear completed'],
    ],
  },
];

export const ShortcutsModal = memo(function ShortcutsModal({
  open,
  onClose,
}: ShortcutsModalProps) {
  if (!open) return null;
  return (
    <div className="mg-modal-scrim" onClick={onClose}>
      <div className="mg-modal" onClick={(e) => e.stopPropagation()}>
        <div className="mg-modal-hd">
          <h3>Keyboard shortcuts</h3>
          <button className="mg-icon-btn" onClick={onClose}>
            <Icons.X size={14} />
          </button>
        </div>
        <div className="mg-modal-body">
          {GROUPS.map((g) => (
            <div className="mg-kbd-group" key={g.title}>
              <div className="mg-kbd-title">{g.title}</div>
              {g.items.map(([k, l]) => (
                <div className="mg-kbd-row" key={k}>
                  <span className="mg-kbd-label">{l}</span>
                  <span className="mg-kbd-keys">
                    {k.split(' ').map((p, i) => (
                      <kbd key={i}>{p}</kbd>
                    ))}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});
