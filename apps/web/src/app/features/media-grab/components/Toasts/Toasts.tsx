import { memo } from 'react';
import type { Toast } from '../../types';
import { Icons } from '../Icon/Icon';

export interface ToastsProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

export const Toasts = memo(function Toasts({
  toasts,
  onDismiss,
}: ToastsProps) {
  return (
    <div className="mg-toasts">
      {toasts.map((t) => (
        <div key={t.id} className={`mg-toast mg-toast--${t.kind ?? 'info'}`}>
          <div className="mg-toast-icon">
            {t.kind === 'ok' && <Icons.CheckCircle size={16} />}
            {t.kind === 'err' && <Icons.AlertCircle size={16} />}
            {(!t.kind || t.kind === 'info') && <Icons.Download size={16} />}
          </div>
          <div className="mg-toast-body">
            <div className="mg-toast-title">{t.title}</div>
            {t.sub && <div className="mg-toast-sub">{t.sub}</div>}
          </div>
          <button className="mg-toast-x" onClick={() => onDismiss(t.id)}>
            <Icons.X size={12} />
          </button>
        </div>
      ))}
    </div>
  );
});
