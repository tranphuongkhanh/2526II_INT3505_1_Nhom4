import { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle,
  X,
  Send,
  ArrowLeft,
  Search,
  Loader2,
  ChevronDown,
} from 'lucide-react';
import { chatApi } from '../../lib/api';
import { socketService } from '../../lib/socket';
import { useAuth } from '../../contexts/AuthContext';
import Avatar from './Avatar';
import { springs } from '../../lib/animations';

const MSG_LIMIT = 30;

function formatTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

function formatConvTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const now = new Date();
  const diffDays = Math.floor((now - d) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Hôm qua';
  if (diffDays < 7) return ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][d.getDay()];
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 px-3 py-1">
      <div className="flex gap-1 px-3 py-2 bg-ink-100 dark:bg-ink-800 rounded-2xl rounded-bl-sm">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-ink-400"
            animate={{ scaleY: [1, 1.8, 1] }}
            transition={{ repeat: Infinity, duration: 0.9, delay: i * 0.15, ease: 'easeInOut' }}
          />
        ))}
      </div>
    </div>
  );
}

function MessageBubble({ message, isOwn }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: isOwn ? 20 : -20 }}
      animate={{ opacity: message._optimistic ? 0.6 : 1, x: 0 }}
      transition={springs.snappy}
      className={['flex items-end gap-1.5 px-3', isOwn ? 'flex-row-reverse' : 'flex-row'].join(' ')}
    >
      {!isOwn && (
        <Avatar
          src={message.senderAvatarUrl || message.senderAvatar}
          name={message.senderName || '?'}
          size="sm"
        />
      )}
      <div
        className={[
          'max-w-[75%] px-3 py-2 rounded-2xl text-sm',
          isOwn
            ? 'bg-primary-500 text-white rounded-br-sm'
            : 'bg-ink-100 dark:bg-ink-800 text-ink-900 dark:text-ink-50 rounded-bl-sm',
        ].join(' ')}
      >
        <p className="whitespace-pre-wrap break-words leading-relaxed text-[13px]">{message.content}</p>
        <p className={['text-[10px] mt-0.5', isOwn ? 'text-primary-100/80' : 'text-ink-400'].join(' ')}>
          {formatTime(message.createdAt || message.sentAt)}
        </p>
      </div>
    </motion.div>
  );
}

function ConvItem({ conv, isActive, onClick }) {
  const otherName =
    conv.partnerName || conv.otherUserName || conv.recipientName || conv.title || 'Cuộc trò chuyện';
  const otherAvatar =
    conv.partnerAvatar || conv.otherUserAvatarUrl || conv.otherUserAvatar || conv.recipientAvatarUrl;
  const lastMsg = conv.lastMessage || conv.lastMessageContent || '';
  const lastTime = conv.lastMessageAt || conv.updatedAt;
  const unread = conv.unreadCount || 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-colors text-left',
        isActive
          ? 'bg-primary-50 dark:bg-primary-900/30'
          : 'hover:bg-ink-50 dark:hover:bg-ink-800',
      ].join(' ')}
    >
      <Avatar src={otherAvatar} name={otherName} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <p className="text-sm font-semibold text-ink-900 dark:text-ink-50 truncate">{otherName}</p>
          <span className="text-[10px] text-ink-400 shrink-0">{formatConvTime(lastTime)}</span>
        </div>
        <div className="flex items-center justify-between gap-1 mt-0.5">
          <p className="text-xs text-ink-400 truncate">{lastMsg || 'Bắt đầu trò chuyện'}</p>
          {unread > 0 && (
            <span className="shrink-0 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary-500 text-[10px] font-bold text-white px-1">
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

export default function ChatPopup() {
  const { isAuthenticated } = useAuth();
  const { pathname } = useLocation();
  if (
    !isAuthenticated ||
    pathname.startsWith('/chat') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/owner')
  ) return null;
  return <ChatPopupInner />;
}

function ChatPopupInner() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState('list'); // 'list' | 'chat'

  const [conversations, setConversations] = useState([]);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [search, setSearch] = useState('');

  const [activeConvId, setActiveConvId] = useState(null);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [beforeCursor, setBeforeCursor] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [typing] = useState(false);

  const messagesRef = useRef(null);
  const textareaRef = useRef(null);
  const loadingMoreRef = useRef(false);
  const activeConvIdRef = useRef(activeConvId);

  useEffect(() => {
    activeConvIdRef.current = activeConvId;
  }, [activeConvId]);

  const totalUnread = conversations.reduce((s, c) => s + (c.unreadCount || 0), 0);

  // ── Load conversations ────────────────────────────────────────────────────────

  const loadConversations = useCallback(async () => {
    try {
      const data = await chatApi.getConversations();
      setConversations(Array.isArray(data) ? data : data?.content || []);
    } catch { /* swallow */ }
    finally { setLoadingConvs(false); }
  }, []);

  // ── Load messages ─────────────────────────────────────────────────────────────

  const loadMessages = useCallback(async (convId, cursor = null, prepend = false) => {
    if (!convId) return;
    if (prepend) {
      if (loadingMoreRef.current) return;
      loadingMoreRef.current = true;
      setLoadingMore(true);
    } else {
      setLoadingMsgs(true);
    }
    try {
      const params = { limit: MSG_LIMIT };
      if (cursor) params.cursor = cursor;
      const data = await chatApi.getMessages(convId, params);
      const msgs = Array.isArray(data) ? data : data?.items || data?.content || data?.messages || [];
      if (prepend) {
        setMessages((prev) => [...prev, ...msgs]);
      } else {
        setMessages(msgs);
      }
      const nextCursor = data?.nextCursor ?? null;
      setHasMore(Boolean(nextCursor));
      if (nextCursor) setBeforeCursor(nextCursor);
      chatApi.markRead(convId).catch(() => {});
    } catch { /* swallow */ }
    finally {
      if (prepend) {
        loadingMoreRef.current = false;
        setLoadingMore(false);
      } else {
        setLoadingMsgs(false);
      }
    }
  }, []);

  // ── WebSocket + initial load ──────────────────────────────────────────────────

  useEffect(() => {
    loadConversations();

    socketService.connect(() => {
      socketService.subscribe('/user/queue/messages', (msg) => {
        const currentConvId = activeConvIdRef.current;

        if (msg.type === 'READ_RECEIPT') {
          if (String(msg.conversationId) === String(currentConvId)) {
            setMessages((prev) => prev.map((m) => ({ ...m, isRead: true })));
          }
          return;
        }

        if (String(msg.conversationId) === String(currentConvId)) {
          setMessages((prev) => {
            if (prev.find((m) => String(m.id) === String(msg.id))) return prev;
            if (String(msg.senderId) === String(user?.id)) return prev;
            return [msg, ...prev];
          });
          chatApi.markRead(msg.conversationId).catch(() => {});
        }

        setConversations((prev) => {
          let found = false;
          const next = prev.map((c) => {
            if (String(c.id) === String(msg.conversationId)) {
              found = true;
              return {
                ...c,
                lastMessage: msg.content,
                lastMessageContent: msg.content,
                lastMessageAt: msg.createdAt,
                unreadCount:
                  String(c.id) !== String(currentConvId) &&
                  String(msg.senderId) !== String(user?.id)
                    ? (c.unreadCount || 0) + 1
                    : c.unreadCount,
              };
            }
            return c;
          });
          if (!found) loadConversations();
          return next.sort((a, b) => {
            const ta = a.lastMessageAt || a.updatedAt || 0;
            const tb = b.lastMessageAt || b.updatedAt || 0;
            return new Date(tb) - new Date(ta);
          });
        });
      });
    });

    return () => {
      socketService.unsubscribe('/user/queue/messages');
    };
  }, [loadConversations, user?.id]);

  // ── Select conversation ───────────────────────────────────────────────────────

  const selectConv = (conv) => {
    const id = String(conv.id);
    setActiveConvId(id);
    setActiveConv(conv);
    setMessages([]);
    setBeforeCursor(null);
    setHasMore(false);
    setView('chat');
    loadMessages(id);
    setConversations((prev) =>
      prev.map((c) => (String(c.id) === id ? { ...c, unreadCount: 0 } : c))
    );
  };

  // ── Send ──────────────────────────────────────────────────────────────────────

  const sendMessage = async () => {
    if (!input.trim() || !activeConvId || sending) return;
    const content = input.trim();
    const optimisticId = `opt-${Date.now()}`;
    setMessages((prev) => [
      {
        id: optimisticId,
        content,
        senderId: user?.id,
        senderName: user?.fullName,
        senderAvatarUrl: user?.avatarUrl,
        createdAt: new Date().toISOString(),
        _optimistic: true,
      },
      ...prev,
    ]);
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setSending(true);
    try {
      const sent = await chatApi.sendMessage(activeConvId, { content });
      setMessages((prev) =>
        prev.map((m) => (m.id === optimisticId ? { ...sent, _optimistic: false } : m))
      );
      setConversations((prev) =>
        prev
          .map((c) =>
            String(c.id) === String(activeConvId)
              ? { ...c, lastMessage: content, lastMessageContent: content, lastMessageAt: sent.createdAt }
              : c
          )
          .sort((a, b) => new Date(b.lastMessageAt || b.updatedAt || 0) - new Date(a.lastMessageAt || a.updatedAt || 0))
      );
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = `${Math.min(ta.scrollHeight, 96)}px`;
    }
  };

  // ── Scroll ────────────────────────────────────────────────────────────────────

  const handleScroll = () => {
    const el = messagesRef.current;
    if (!el) return;
    setShowScrollBtn(el.scrollTop > 80);
    const nearOldest = el.scrollTop >= el.scrollHeight - el.clientHeight - 80;
    if (nearOldest && hasMore && !loadingMoreRef.current) {
      loadMessages(activeConvId, beforeCursor, true);
    }
  };

  const filteredConvs = conversations.filter((c) => {
    const name = c.partnerName || c.otherUserName || c.recipientName || c.title || '';
    return name.toLowerCase().includes(search.toLowerCase());
  });

  const otherName =
    activeConv?.partnerName ||
    activeConv?.otherUserName ||
    activeConv?.recipientName ||
    activeConv?.title ||
    'Cuộc trò chuyện';
  const otherAvatar =
    activeConv?.partnerAvatar ||
    activeConv?.otherUserAvatarUrl ||
    activeConv?.otherUserAvatar ||
    activeConv?.recipientAvatarUrl;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {/* Popup panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="popup"
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={springs.smooth}
            style={{ originX: 1, originY: 1 }}
            className="w-80 sm:w-[360px] h-[480px] flex flex-col rounded-2xl border border-ink-100 dark:border-ink-700 bg-white dark:bg-ink-900 shadow-elevated overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-ink-100 dark:border-ink-700 shrink-0">
              {view === 'chat' ? (
                <button
                  type="button"
                  onClick={() => setView('list')}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors"
                  aria-label="Quay lại"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
              ) : null}

              {view === 'chat' && activeConv ? (
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Avatar src={otherAvatar} name={otherName} size="sm" />
                  <span className="text-sm font-semibold text-ink-900 dark:text-ink-50 truncate">
                    {otherName}
                  </span>
                </div>
              ) : (
                <span className="flex-1 text-sm font-semibold text-ink-900 dark:text-ink-50">
                  Tin nhắn
                </span>
              )}

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-7 w-7 items-center justify-center rounded-full text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors"
                aria-label="Đóng"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <AnimatePresence initial={false} mode="wait">
              {view === 'list' ? (
                <motion.div
                  key="list"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.15 }}
                  className="flex flex-col flex-1 min-h-0"
                >
                  {/* Search */}
                  <div className="px-3 py-2 border-b border-ink-100 dark:border-ink-700 shrink-0">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ink-400" />
                      <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Tìm kiếm..."
                        className="w-full h-8 rounded-lg bg-ink-100 dark:bg-ink-800 pl-8 pr-3 text-sm text-ink-900 dark:text-ink-50 placeholder-ink-400 outline-none focus:ring-2 focus:ring-primary-500/40"
                      />
                    </div>
                  </div>

                  {/* Conversation list */}
                  <div className="flex-1 overflow-y-auto p-1.5">
                    {loadingConvs ? (
                      <div className="flex flex-col items-center justify-center py-10 gap-2">
                        <Loader2 className="h-5 w-5 animate-spin text-primary-500" />
                        <p className="text-xs text-ink-400">Đang tải...</p>
                      </div>
                    ) : filteredConvs.length === 0 ? (
                      <div className="text-center py-10">
                        <MessageCircle className="h-8 w-8 mx-auto mb-2 text-ink-200 dark:text-ink-600" />
                        <p className="text-xs text-ink-400">Chưa có cuộc trò chuyện nào</p>
                      </div>
                    ) : (
                      filteredConvs.map((conv) => (
                        <ConvItem
                          key={conv.id}
                          conv={conv}
                          isActive={String(conv.id) === String(activeConvId)}
                          onClick={() => selectConv(conv)}
                        />
                      ))
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="chat"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.15 }}
                  className="flex flex-col flex-1 min-h-0 relative"
                >
                  {/* Messages */}
                  <div
                    ref={messagesRef}
                    onScroll={handleScroll}
                    className="flex-1 overflow-y-auto flex flex-col-reverse py-3 gap-1.5"
                  >
                    {typing && <TypingIndicator />}
                    {loadingMsgs ? (
                      <div className="flex flex-col items-center justify-center py-10 gap-2">
                        <Loader2 className="h-5 w-5 animate-spin text-primary-500" />
                        <p className="text-xs text-ink-400">Đang tải tin nhắn...</p>
                      </div>
                    ) : messages.length === 0 ? (
                      <p className="text-center text-xs text-ink-400 py-10">
                        Bắt đầu cuộc trò chuyện!
                      </p>
                    ) : (
                      <>
                        {messages.map((msg) => (
                          <MessageBubble
                            key={msg.id}
                            message={msg}
                            isOwn={String(msg.senderId) === String(user?.id)}
                          />
                        ))}
                        {loadingMore && (
                          <div className="flex justify-center py-2">
                            <Loader2 className="h-4 w-4 animate-spin text-primary-500" />
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Scroll-to-bottom button */}
                  <AnimatePresence>
                    {showScrollBtn && (
                      <motion.button
                        type="button"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={springs.snappy}
                        onClick={() => messagesRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
                        className="absolute bottom-16 right-3 h-7 w-7 rounded-full bg-primary-500 hover:bg-primary-600 text-white flex items-center justify-center shadow-soft"
                        aria-label="Cuộn xuống"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </motion.button>
                    )}
                  </AnimatePresence>

                  {/* Input */}
                  <div className="px-3 py-2.5 border-t border-ink-100 dark:border-ink-700 shrink-0">
                    <div className="flex items-end gap-1.5">
                      <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        placeholder="Nhập tin nhắn..."
                        rows={1}
                        className="flex-1 resize-none rounded-xl bg-ink-100 dark:bg-ink-800 px-3 py-2 text-sm text-ink-900 dark:text-ink-50 placeholder-ink-400 outline-none focus:ring-2 focus:ring-primary-500/40 max-h-[96px] leading-relaxed"
                      />
                      <button
                        type="button"
                        onClick={sendMessage}
                        disabled={!input.trim() || sending}
                        className="h-9 w-9 rounded-full bg-primary-500 hover:bg-primary-600 disabled:bg-primary-500/40 text-white flex items-center justify-center transition-colors shrink-0"
                        aria-label="Gửi"
                      >
                        {sending ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Send className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle button */}
      <motion.button
        type="button"
        onClick={() => setOpen((o) => !o)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        transition={springs.snappy}
        className="h-14 w-14 rounded-full bg-primary-500 hover:bg-primary-600 text-white shadow-elevated flex items-center justify-center transition-colors relative"
        aria-label={open ? 'Đóng tin nhắn' : 'Mở tin nhắn'}
      >
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.span
              key="x"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X className="h-6 w-6" />
            </motion.span>
          ) : (
            <motion.span
              key="chat"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <MessageCircle className="h-6 w-6" />
            </motion.span>
          )}
        </AnimatePresence>

        {/* Unread badge */}
        {!open && totalUnread > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-error text-white text-[10px] font-bold px-1 ring-2 ring-white dark:ring-ink-900">
            {totalUnread > 99 ? '99+' : totalUnread}
          </span>
        )}
      </motion.button>
    </div>
  );
}
