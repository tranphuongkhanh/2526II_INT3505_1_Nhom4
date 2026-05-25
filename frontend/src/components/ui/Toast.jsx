import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import { springs } from '../../lib/animations';

const TOAST_DURATION = 4000;
const ToastContext = createContext(null);

const TYPE_CONFIG = {
  success: {
    icon: CheckCircle2,
    accent: 'text-green-500',
    border: 'border-green-500/40',
    bg: 'bg-white dark:bg-ink-800',
  },
  error: {
    icon: XCircle,
    accent: 'text-error',
    border: 'border-error/40',
    bg: 'bg-white dark:bg-ink-800',
  },
  warning: {
    icon: AlertTriangle,
    accent: 'text-warning',
    border: 'border-warning/40',
    bg: 'bg-white dark:bg-ink-800',
  },
  info: {
    icon: Info,
    accent: 'text-info',
    border: 'border-info/40',
    bg: 'bg-white dark:bg-ink-800',
  },
};

function ToastItem({ toast, onDismiss }) {
  const cfg = TYPE_CONFIG[toast.type] ?? TYPE_CONFIG.info;
  const Icon = cfg.icon;
  const timerRef = useRef(null);
  const remainingRef = useRef(toast.duration ?? TOAST_DURATION);
  const startedAtRef = useRef(Date.now());

  const start = useCallback(() => {
    startedAtRef.current = Date.now();
    timerRef.current = setTimeout(() => onDismiss(toast.id), remainingRef.current);
  }, [onDismiss, toast.id]);

  const pause = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
      remainingRef.current -= Date.now() - startedAtRef.current;
    }
  }, []);

  useEffect(() => {
    start();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [start]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 100, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1, transition: springs.smooth }}
      exit={{ opacity: 0, x: 120, height: 0, marginTop: 0, transition: { duration: 0.2 } }}
      onMouseEnter={pause}
      onMouseLeave={start}
      className={[
        'pointer-events-auto w-80 max-w-[calc(100vw-2rem)] rounded-xl border shadow-elevated',
        cfg.bg,
        cfg.border,
      ].join(' ')}
      role="status"
    >
      <div className="flex items-start gap-3 p-4">
        <Icon className={['h-5 w-5 mt-0.5 shrink-0', cfg.accent].join(' ')} aria-hidden="true" />
        <div className="flex-1 min-w-0">
          {toast.title ? (
            <p className="text-sm font-semibold text-ink-900 dark:text-ink-50">{toast.title}</p>
          ) : null}
          {toast.message ? (
            <p className="text-sm text-ink-600 dark:text-ink-200 mt-0.5">{toast.message}</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => onDismiss(toast.id)}
          className="shrink-0 -m-1 p-1 rounded-md text-ink-400 hover:text-ink-900 dark:hover:text-ink-50 hover:bg-ink-100 dark:hover:bg-ink-700 transition-colors"
          aria-label="Đóng"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((type, input) => {
    const next =
      typeof input === 'string'
        ? { message: input }
        : { ...input };
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { id, type, ...next }]);
    return id;
  }, []);

  const toast = useMemo(
    () => ({
      success: (input) => push('success', input),
      error: (input) => push('error', input),
      warning: (input) => push('warning', input),
      info: (input) => push('info', input),
      dismiss,
    }),
    [push, dismiss]
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {typeof document !== 'undefined'
        ? createPortal(
            <div className="fixed top-4 right-4 z-[60] flex flex-col gap-3 pointer-events-none">
              <AnimatePresence initial={false}>
                {toasts.map((t) => (
                  <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
                ))}
              </AnimatePresence>
            </div>,
            document.body
          )
        : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside a <ToastProvider>');
  return ctx;
}

export default ToastProvider;
