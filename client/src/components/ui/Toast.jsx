import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X, Loader2 } from 'lucide-react';

const CONFIGS = {
  success: {
    icon:      CheckCircle2,
    classes:   'bg-emerald-50 border-emerald-200 text-emerald-800',
    iconClass: 'text-emerald-500',
    track:     'bg-emerald-500',
  },
  error: {
    icon:      AlertCircle,
    classes:   'bg-red-50 border-red-200 text-red-800',
    iconClass: 'text-red-500',
    track:     'bg-red-500',
  },
  warning: {
    icon:      AlertTriangle,
    classes:   'bg-amber-50 border-amber-200 text-amber-800',
    iconClass: 'text-amber-500',
    track:     'bg-amber-500',
  },
  info: {
    icon:      Info,
    classes:   'bg-sky-50 border-sky-200 text-sky-800',
    iconClass: 'text-sky-500',
    track:     'bg-sky-500',
  },
  loading: {
    icon:      Loader2,
    classes:   'bg-white border-outline-variant text-on-surface',
    iconClass: 'text-primary',
    track:     'bg-primary',
  },
};

const Toast = ({ id, message, type = 'info', duration = 4000, onDismiss }) => {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const cfg = CONFIGS[type] ?? CONFIGS.info;
  const Icon = cfg.icon;

  const dismiss = useCallback(() => {
    setLeaving(true);
    setTimeout(() => onDismiss(id), 300);
  }, [id, onDismiss]);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    if (type === 'loading') return;
    const timer = setTimeout(dismiss, duration);
    return () => clearTimeout(timer);
  }, [dismiss, duration, type]);

  return (
    <div
      className={[
        'relative flex items-start gap-3 w-full max-w-sm px-4 py-3.5 rounded-2xl border shadow-ambient-lg overflow-hidden',
        cfg.classes,
        'transition-all duration-300 pointer-events-auto',
        visible && !leaving ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4',
      ].join(' ')}
      role="alert"
    >
      {type !== 'loading' && (
        <div className="absolute bottom-0 left-0 h-0.5 w-full bg-current/10">
          <div
            className={`h-full ${cfg.track} rounded-full`}
            style={{
              animation: `shrinkWidth ${duration}ms linear forwards`,
            }}
          />
        </div>
      )}

      <div className={`shrink-0 mt-0.5 ${cfg.iconClass}`}>
        <Icon className={`w-4 h-4 ${type === 'loading' ? 'animate-spin' : ''}`} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold leading-snug">{message}</p>
      </div>

      {type !== 'loading' && (
        <button
          onClick={dismiss}
          className="shrink-0 p-0.5 rounded-lg hover:bg-current/10 transition-colors"
          aria-label="Dismiss notification"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type, duration }]);
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = {
    success: (msg, dur) => addToast(msg, 'success', dur),
    error:   (msg, dur) => addToast(msg, 'error', dur),
    warning: (msg, dur) => addToast(msg, 'warning', dur),
    info:    (msg, dur) => addToast(msg, 'info', dur),
    loading: (msg)      => addToast(msg, 'loading'),
    dismiss: removeToast,
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 items-end pointer-events-none">
        {toasts.map(t => (
          <Toast key={t.id} {...t} onDismiss={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
};

/* Style for progress bar */
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `@keyframes shrinkWidth { from { width: 100%; } to { width: 0%; } }`;
  document.head.appendChild(style);
}

export default Toast;
