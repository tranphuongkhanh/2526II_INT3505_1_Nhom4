import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, CheckCircle, XCircle, Clock, Star, Shield,
  UserCheck, UserX, Receipt, FileText, PenLine, CheckCheck, Loader2,
} from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';
import { springs } from '../../lib/animations';

const TYPE_CONFIG = {
  POST_APPROVED:    { icon: CheckCircle,   color: 'text-success',     bg: 'bg-green-100 dark:bg-green-900/30' },
  POST_REJECTED:    { icon: XCircle,       color: 'text-error',       bg: 'bg-red-100 dark:bg-red-900/30' },
  POST_EXPIRING:    { icon: Clock,         color: 'text-warning',     bg: 'bg-amber-100 dark:bg-amber-900/30' },
  REVIEW_APPROVED:  { icon: Star,          color: 'text-accent-500',  bg: 'bg-amber-100 dark:bg-amber-900/30' },
  REPORT_RESOLVED:  { icon: Shield,        color: 'text-primary-500', bg: 'bg-primary-50 dark:bg-primary-900/30' },
  ACCOUNT_APPROVED: { icon: UserCheck,     color: 'text-success',     bg: 'bg-green-100 dark:bg-green-900/30' },
  ACCOUNT_BANNED:   { icon: UserX,         color: 'text-error',       bg: 'bg-red-100 dark:bg-red-900/30' },
  NEW_BILL:         { icon: Receipt,       color: 'text-primary-500', bg: 'bg-primary-50 dark:bg-primary-900/30' },
  CONTRACT_CREATED: { icon: FileText,      color: 'text-primary-500', bg: 'bg-primary-50 dark:bg-primary-900/30' },
  CONTRACT_SIGNED:  { icon: PenLine,       color: 'text-success',     bg: 'bg-green-100 dark:bg-green-900/30' },
};
const DEFAULT_CONFIG = { icon: Bell, color: 'text-ink-400', bg: 'bg-ink-100 dark:bg-ink-800' };

function formatNotifTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const diff = Math.floor((Date.now() - d) / 1000);
  if (diff < 60) return 'Vừa xong';
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} ngày trước`;
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function resolveLink(notif, role) {
  const id = notif.relatedEntityId;
  const relType = notif.relatedEntityType;
  switch (notif.type) {

    case 'REVIEW_APPROVED':
      if (relType === 'post' && id) return `/posts/${id}`;
      return '/reviews-forum';
    case 'POST_APPROVED':
    case 'POST_REJECTED':
    case 'POST_EXPIRING': return id ? `/posts/${id}` : (role === 'OWNER' ? '/owner/posts' : null);
    case 'NEW_BILL':
    case 'CONTRACT_CREATED':
    case 'CONTRACT_SIGNED': return role === 'OWNER' ? '/owner/contracts' : '/my-contracts';
    case 'REPORT_RESOLVED': return '/my-reports';
    case 'ACCOUNT_APPROVED':
    case 'ACCOUNT_BANNED': return '/profile';
    default: return null;
  }
}

export default function NotificationsDropdown({ role }) {
  const navigate = useNavigate();
  const { notifications, unreadCount, loading, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onClick = (e) => {
      if (!wrapperRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const handleItemClick = (notif) => {
    if (!notif.isRead) markRead(notif.id);
    const link = resolveLink(notif, role);
    setOpen(false);
    if (link) navigate(link);
  };

  const visible = notifications.slice(0, 8);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-ink-600 dark:text-ink-200 hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors"
        aria-label="Thông báo"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 ? (
          <span className="absolute top-1 right-1 inline-flex items-center justify-center h-4 min-w-[16px] rounded-full bg-error text-white text-[10px] font-bold px-1 ring-2 ring-white dark:ring-ink-900">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        ) : null}
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={springs.snappy}
            className="absolute right-0 mt-2 w-[360px] origin-top-right rounded-2xl border border-ink-100 dark:border-ink-700 bg-white dark:bg-ink-900 shadow-elevated overflow-hidden z-50"
            role="menu"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-ink-100 dark:border-ink-700">
              <div>
                <p className="text-sm font-semibold text-ink-900 dark:text-ink-50">Thông báo</p>
                {unreadCount > 0 ? (
                  <p className="text-xs text-ink-400">{unreadCount} chưa đọc</p>
                ) : null}
              </div>
              {unreadCount > 0 ? (
                <button
                  type="button"
                  onClick={() => markAllRead()}
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary-500 hover:text-primary-700 transition-colors"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Đánh dấu đã đọc
                </button>
              ) : null}
            </div>

            <div className="max-h-[420px] overflow-y-auto">
              {loading && notifications.length === 0 ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
                </div>
              ) : visible.length === 0 ? (
                <div className="text-center py-10 text-ink-400">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Chưa có thông báo nào</p>
                </div>
              ) : (
                visible.map((notif) => {
                  const cfg = TYPE_CONFIG[notif.type] || DEFAULT_CONFIG;
                  const Icon = cfg.icon;
                  return (
                    <button
                      key={notif.id}
                      type="button"
                      onClick={() => handleItemClick(notif)}
                      className={[
                        'w-full text-left flex items-start gap-3 px-4 py-3 transition-colors',
                        'border-b border-ink-100 dark:border-ink-700 last:border-b-0',
                        notif.isRead
                          ? 'hover:bg-ink-50 dark:hover:bg-ink-800'
                          : 'bg-primary-50/60 dark:bg-primary-900/15 hover:bg-primary-50 dark:hover:bg-primary-900/25 border-l-2 border-l-primary-500',
                      ].join(' ')}
                      role="menuitem"
                    >
                      <div className={['p-1.5 rounded-lg shrink-0', cfg.bg].join(' ')}>
                        <Icon className={['h-4 w-4', cfg.color].join(' ')} />
                      </div>
                      <div className="flex-1 min-w-0">
                        {notif.title ? (
                          <p className={[
                            'text-sm leading-snug truncate',
                            notif.isRead
                              ? 'text-ink-600 dark:text-ink-200'
                              : 'font-semibold text-ink-900 dark:text-ink-50',
                          ].join(' ')}>
                            {notif.title}
                          </p>
                        ) : null}
                        {notif.content ? (
                          <p className="text-xs text-ink-500 dark:text-ink-300 mt-0.5 line-clamp-2">
                            {notif.content}
                          </p>
                        ) : null}
                        <p className="text-[11px] text-ink-400 mt-1">{formatNotifTime(notif.createdAt)}</p>
                      </div>
                      {!notif.isRead ? (
                        <span className="h-2 w-2 rounded-full bg-primary-500 shrink-0 mt-2" />
                      ) : null}
                    </button>
                  );
                })
              )}
            </div>

            {notifications.length > 0 ? (
              <button
                type="button"
                onClick={() => { setOpen(false); navigate('/notifications'); }}
                className="block w-full text-center px-4 py-2.5 text-sm font-medium text-primary-500 hover:bg-ink-50 dark:hover:bg-ink-800 border-t border-ink-100 dark:border-ink-700 transition-colors"
              >
                Xem tất cả
              </button>
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
