import { useCallback, useMemo, useRef, useState } from 'react';
import { CircleAlert, Check, X } from 'lucide-react';
import { ToastContext } from './toastContext.js';

const DURATION = 4000;

/** Small toast stack, bottom-right. tone: 'info' | 'success' | 'danger'. */
export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const seq = useRef(0);

  const dismiss = useCallback((id) => setToasts((list) => list.filter((t) => t.id !== id)), []);
  const notify = useCallback(
    (message, { tone = 'info' } = {}) => {
      const id = ++seq.current;
      setToasts((list) => [...list.slice(-2), { id, message, tone }]);
      setTimeout(() => dismiss(id), DURATION);
    },
    [dismiss],
  );
  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-region" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.tone}`}>
            {t.tone === 'danger' ? (
              <CircleAlert size={16} strokeWidth={1.5} aria-hidden="true" />
            ) : (
              <Check size={16} strokeWidth={1.5} aria-hidden="true" />
            )}
            <span>{t.message}</span>
            <button
              type="button"
              className="toast-close"
              aria-label="Dismiss notification"
              onClick={() => dismiss(t.id)}
            >
              <X size={14} strokeWidth={1.5} aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
