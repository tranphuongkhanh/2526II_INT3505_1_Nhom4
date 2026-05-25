import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle, XCircle, Clock, MessageCircle, Star,
  Shield, UserCheck, UserX, Receipt, Bell, CheckCheck,
  Trash2, Loader2,
} from 'lucide-react';
import { notificationApi } from '../lib/api';
import { useToast } from '../components/ui/Toast';
import Button from '../components/ui/Button';
import { springs } from '../lib/animations';

// ─── Type config ──────────────────────────────────────────────────────────────

const TYPE_CONFIG = {
  BOOKING_APPROVED:  { icon: CheckCircle,   color: 'text-success',     bg: 'bg-green-100 dark:bg-green-900/30' },
  BOOKING_REJECTED:  { icon: XCircle,       color: 'text-error',       bg: 'bg-red-100 dark:bg-red-900/30' },
  BOOKING_PENDING:   { icon: Clock,         color: 'text-warning',     bg: 'bg-amber-100 dark:bg-amber-900/30' },
  MESSAGE:           { icon: MessageCircle, color: 'text-info',        bg: 'bg-blue-100 dark:bg-blue-900/30' },
  REVIEW:            { icon: Star,          color: 'text-accent-500',  bg: 'bg-amber-100 dark:bg-amber-900/30' },
  ADMIN:             { icon: Shield,        color: 'text-primary-500', bg: 'bg-primary-50 dark:bg-primary-900/30' },
  USER_VERIFIED:     { icon: UserCheck,     color: 'text-success',     bg: 'bg-green-100 dark:bg-green-900/30' },
  USER_BANNED:       { icon: UserX,         color: 'text-error',       bg: 'bg-red-100 dark:bg-red-900/30' },
  PAYMENT:           { icon: Receipt,       color: 'text-primary-500', bg: 'bg-primary-50 dark:bg-primary-900/30' },
};

const DEFAULT_CONFIG = { icon: Bell, color: 'text-ink-400', bg: 'bg-ink-100 dark:bg-ink-800' };

// ─── Time formatter ───────────────────────────────────────────────────────────

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

// ─── Navigate target ─────────────────────────────────────────────────────────

function resolveLink(notif) {
  const id = notif.relatedEntityId;
  switch (notif.type) {
    case 'MESSAGE': return id ? `/chat/${id}` : '/chat';
    case 'REVIEW': return id ? `/posts/${id}` : null;
    case 'BOOKING_APPROVED':
    case 'BOOKING_REJECTED':
    case 'BOOKING_PENDING': return '/my-contracts';
    case 'PAYMENT': return '/my-contracts';
    default: return notif.link || null;
  }
}

// ─── Notification item ────────────────────────────────────────────────────────

function NotificationItem({ notif, index, markingAll, onRead, onDismiss }) {
  const cfg = TYPE_CONFIG[notif.type] || DEFAULT_CONFIG;
  const Icon = cfg.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, height: 0 }}
      animate={{ opacity: 1, y: 0, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ ...springs.smooth, height: { duration: 0.25 } }}
      className="overflow-hidden"
    >
      <div className="relative overflow-hidden">
        {/* Swipe-reveal dismiss action */}
        <div className="absolute right-0 top-0 bottom-0 w-20 flex items-center justify-center bg-error">
          <Trash2 className="h-5 w-5 text-white" />
        </div>

        <motion.div
          drag="x"
          dragConstraints={{ left: -80, right: 0 }}
          dragElastic={0.08}
          onDragEnd={(_, info) => {
            if (info.offset.x < -60) onDismiss(notif.id);
          }}
          onClick={() => onRead(notif)}
          className={[
            'relative cursor-pointer select-none',
            'border-b border-ink-100 dark:border-ink-700 last:border-b-0',
            notif.read
              ? 'bg-white dark:bg-ink-900'
              : 'bg-primary-50 dark:bg-primary-900/20 border-l-2 border-primary-500',
          ].join(' ')}
          style={{ touchAction: 'pan-y' }}
        >
          <div className="flex items-start gap-3 px-4 py-4">
            <div className={['p-2 rounded-xl shrink-0', cfg.bg].join(' ')}>
              <Icon className={['h-5 w-5', cfg.color].join(' ')} />
            </div>

            <div className="flex-1 min-w-0">
              <p
                className={[
                  'text-sm leading-snug',
                  notif.read
                    ? 'text-ink-600 dark:text-ink-200'
                    : 'font-medium text-ink-900 dark:text-ink-50',
                ].join(' ')}
              >
                {notif.message || notif.content || notif.title}
              </p>
              <p className="text-xs text-ink-400 mt-1">{formatNotifTime(notif.createdAt)}</p>
            </div>

            {/* Unread dot — shrinks out on mark-all */}
            {!notif.read ? (
              <AnimatePresence>
                {!markingAll ? (
                  <motion.div
                    key="dot"
                    exit={{
                      scale: 0,
                      transition: { delay: index * 0.02, duration: 0.15 },
                    }}
                    className="h-2 w-2 rounded-full bg-primary-500 shrink-0 mt-1.5"
                  />
                ) : null}
              </AnimatePresence>
            ) : null}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const TABS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'unread', label: 'Chưa đọc' },
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [markingAll, setMarkingAll] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await notificationApi.getAll();
      setNotifications(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Không thể tải thông báo');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const handleRead = async (notif) => {
    if (!notif.read) {
      notificationApi.markRead(notif.id).catch(() => {});
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
      );
    }
    const link = resolveLink(notif);
    if (link) navigate(link);
  };

  const handleDismiss = async (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    notificationApi.delete(id).catch(() => {
      toast.error('Không thể xoá thông báo');
      load();
    });
  };

  const handleMarkAll = async () => {
    setMarkingAll(true);
    try {
      await notificationApi.markAllRead();
      // Brief delay so the dot-shrink animation is visible before they disappear
      setTimeout(() => {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setMarkingAll(false);
      }, notifications.filter((n) => !n.read).length * 20 + 200);
    } catch {
      toast.error('Không thể đánh dấu tất cả đã đọc');
      setMarkingAll(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;
  const filtered =
    activeTab === 'unread' ? notifications.filter((n) => !n.read) : notifications;

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ink-900 dark:text-ink-50">Thông báo</h1>
          {unreadCount > 0 ? (
            <p className="text-sm text-ink-400 mt-0.5">{unreadCount} chưa đọc</p>
          ) : null}
        </div>
        {unreadCount > 0 ? (
          <Button
            variant="ghost"
            size="sm"
            icon={CheckCheck}
            loading={markingAll}
            onClick={handleMarkAll}
          >
            Đánh dấu tất cả đã đọc
          </Button>
        ) : null}
      </div>

      {/* Tabs */}
      <div className="relative flex border-b border-ink-200 dark:border-ink-700 mb-4">
        {TABS.map(({ key, label }) => {
          const count = key === 'unread' ? unreadCount : notifications.length;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={[
                'relative flex items-center gap-1.5 px-4 py-3 text-sm font-medium transition-colors',
                activeTab === key
                  ? 'text-primary-500'
                  : 'text-ink-600 dark:text-ink-200 hover:text-primary-500',
              ].join(' ')}
            >
              {label}
              {count > 0 ? (
                <span
                  className={[
                    'inline-flex items-center justify-center h-5 min-w-[20px] rounded-full text-xs font-bold px-1.5',
                    activeTab === key
                      ? 'bg-primary-500 text-white'
                      : 'bg-ink-200 dark:bg-ink-700 text-ink-600 dark:text-ink-200',
                  ].join(' ')}
                >
                  {count > 99 ? '99+' : count}
                </span>
              ) : null}
              {activeTab === key ? (
                <motion.div
                  layoutId="notif-tab-underline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500 rounded-full"
                  transition={springs.snappy}
                />
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-ink-400">
          <Bell className="h-12 w-12 mx-auto mb-3 opacity-20" />
          <p className="text-sm">
            {activeTab === 'unread' ? 'Không có thông báo chưa đọc' : 'Chưa có thông báo nào'}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden border border-ink-100 dark:border-ink-700">
          <AnimatePresence initial={false}>
            {filtered.map((notif, i) => (
              <NotificationItem
                key={notif.id}
                notif={notif}
                index={i}
                markingAll={markingAll}
                onRead={handleRead}
                onDismiss={handleDismiss}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
