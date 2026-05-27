import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { notificationApi } from '../lib/api';
import { socketService } from '../lib/socket';
import { useAuth } from './AuthContext';
import { useToast } from '../components/ui/Toast';

const DESTINATION = '/user/queue/notifications';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const toast = useToast();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(false);

  const notificationsRef = useRef(notifications);
  useEffect(() => {
    notificationsRef.current = notifications;
  }, [notifications]);

  const reset = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
    setNextCursor(null);
  }, []);

  const load = useCallback(async (cursor) => {
    setLoading(true);
    try {
      const page = await notificationApi.list(cursor ? { cursor } : undefined);
      const items = Array.isArray(page?.items) ? page.items : [];
      setNotifications((prev) => (cursor ? [...prev, ...items] : items));
      setNextCursor(page?.nextCursor ?? null);
    } catch {
      // surface via caller / page
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshUnread = useCallback(async () => {
    try {
      const count = await notificationApi.getUnreadCount();
      setUnreadCount(Number(count) || 0);
    } catch {
      /* noop */
    }
  }, []);

  // Initial fetch + cleanup on auth change
  useEffect(() => {
    if (!isAuthenticated) {
      reset();
      return undefined;
    }
    load();
    refreshUnread();
    return undefined;
  }, [isAuthenticated, load, refreshUnread, reset]);

  // Real-time subscription
  useEffect(() => {
    if (!isAuthenticated) return undefined;

    socketService.connect(() => {
      socketService.subscribe(DESTINATION, (notif) => {
        if (!notif || typeof notif !== 'object') return;
        setNotifications((prev) => {
          if (prev.some((n) => n.id === notif.id)) return prev;
          return [notif, ...prev];
        });
        if (!notif.isRead) setUnreadCount((c) => c + 1);
        toast.info({
          title: notif.title || 'Thông báo mới',
          message: notif.content || '',
        });
      });
    });

    return () => {
      socketService.unsubscribe(DESTINATION);
    };
  }, [isAuthenticated, toast]);

  const markRead = useCallback(async (id) => {
    const target = notificationsRef.current.find((n) => n.id === id);
    if (!target || target.isRead) return;
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
    try {
      await notificationApi.markRead(id);
    } catch {
      // rollback
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: false } : n))
      );
      setUnreadCount((c) => c + 1);
    }
  }, []);

  const markAllRead = useCallback(async () => {
    const prev = notificationsRef.current;
    setNotifications(prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    try {
      await notificationApi.markAllRead();
    } catch {
      setNotifications(prev);
      refreshUnread();
    }
  }, [refreshUnread]);

  const dismiss = useCallback(async (id) => {
    const target = notificationsRef.current.find((n) => n.id === id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (target && !target.isRead) {
      setUnreadCount((c) => Math.max(0, c - 1));
    }
    try {
      await notificationApi.delete(id);
    } catch {
      if (target) {
        setNotifications((prev) => [target, ...prev]);
        if (!target.isRead) setUnreadCount((c) => c + 1);
      }
    }
  }, []);

  const loadMore = useCallback(() => {
    if (nextCursor && !loading) load(nextCursor);
  }, [nextCursor, loading, load]);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      hasMore: Boolean(nextCursor),
      loading,
      markRead,
      markAllRead,
      dismiss,
      loadMore,
      refresh: () => {
        load();
        refreshUnread();
      },
    }),
    [
      notifications,
      unreadCount,
      nextCursor,
      loading,
      markRead,
      markAllRead,
      dismiss,
      loadMore,
      load,
      refreshUnread,
    ]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotifications must be used inside a <NotificationProvider>');
  }
  return ctx;
}

export default NotificationContext;
