import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { modalBackdrop, modalPanel } from '../../lib/animations';

const SIZES = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  footer,
  closeOnBackdrop = true,
}) {
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          key="modal-root"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          variants={modalBackdrop}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeOnBackdrop ? onClose : undefined}
            aria-hidden="true"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={typeof title === 'string' ? title : undefined}
            variants={modalPanel}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={[
              'relative w-full bg-white dark:bg-ink-900 rounded-2xl shadow-elevated',
              'border border-ink-100 dark:border-ink-700',
              'flex flex-col max-h-[90vh]',
              SIZES[size] ?? SIZES.md,
            ].join(' ')}
          >
            <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4">
              <div className="flex-1 min-w-0">
                {typeof title === 'string' ? (
                  <h3 className="text-xl font-semibold text-ink-900 dark:text-ink-50">
                    {title}
                  </h3>
                ) : (
                  title
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 -m-2 p-2 rounded-lg text-ink-400 hover:text-ink-900 dark:hover:text-ink-50 hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors"
                aria-label="Đóng"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 pb-6 overflow-y-auto">{children}</div>

            {footer ? (
              <div className="px-6 py-4 border-t border-ink-100 dark:border-ink-700 flex justify-end gap-3">
                {footer}
              </div>
            ) : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}

export default Modal;
