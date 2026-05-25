import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Send, ChevronDown, ArrowLeft, MessageCircle, Loader2 } from 'lucide-react';
import { chatApi } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import Avatar from '../components/ui/Avatar';
import { springs } from '../lib/animations';

const POLL_INTERVAL = 5000;
const MSG_LIMIT = 30;

// ─── Utilities ────────────────────────────────────────────────────────────────

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

// ─── Typing indicator ─────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 px-4 py-1">
      <div className="flex gap-1.5 px-3 py-2.5 bg-ink-100 dark:bg-ink-800 rounded-2xl rounded-bl-sm">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="h-2 w-2 rounded-full bg-ink-400"
            animate={{ scaleY: [1, 1.8, 1] }}
            transition={{ repeat: Infinity, duration: 0.9, delay: i * 0.15, ease: 'easeInOut' }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Message bubble ───────────────────────────────────────────────────────────

function MessageBubble({ message, isOwn }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: isOwn ? 40 : -40 }}
      animate={{ opacity: message._optimistic ? 0.7 : 1, x: 0 }}
      transition={springs.snappy}
      className={['flex items-end gap-2 px-4', isOwn ? 'flex-row-reverse' : 'flex-row'].join(' ')}
    >
      {!isOwn ? (
        <Avatar
          src={message.senderAvatarUrl || message.senderAvatar}
          name={message.senderName || '?'}
          size="sm"
        />
      ) : null}
      <div
        className={[
          'max-w-[70%] px-4 py-2.5 rounded-2xl text-sm',
          isOwn
            ? 'bg-primary-500 text-white rounded-br-sm'
            : 'bg-ink-100 dark:bg-ink-800 text-ink-900 dark:text-ink-50 rounded-bl-sm',
        ].join(' ')}
      >
        <p className="whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
        <p className={['text-[10px] mt-1', isOwn ? 'text-primary-100/80' : 'text-ink-400'].join(' ')}>
          {formatTime(message.createdAt || message.sentAt)}
        </p>
      </div>
    </motion.div>
  );
}

// ─── Conversation list item ───────────────────────────────────────────────────

function ConvItem({ conv, isActive, onClick }) {
  const otherName =
    conv.otherUserName ||
    conv.recipientName ||
    conv.title ||
    'Cuộc trò chuyện';
  const otherAvatar = conv.otherUserAvatarUrl || conv.otherUserAvatar || conv.recipientAvatarUrl;
  const lastMsg = conv.lastMessage || conv.lastMessageContent || '';
  const lastTime = conv.lastMessageAt || conv.updatedAt;
  const unread = conv.unreadCount || 0;

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ x: 4 }}
      transition={springs.snappy}
      className={[
        'w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-colors text-left',
        isActive
          ? 'bg-primary-50 dark:bg-primary-900/30'
          : 'hover:bg-ink-100 dark:hover:bg-ink-800',
      ].join(' ')}
    >
      <Avatar src={otherAvatar} name={otherName} size="md" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-ink-900 dark:text-ink-50 truncate">
            {otherName}
          </p>
          <span className="text-[11px] text-ink-400 shrink-0">{formatConvTime(lastTime)}</span>
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p className="text-xs text-ink-400 truncate">{lastMsg || 'Bắt đầu trò chuyện'}</p>
          {unread > 0 ? (
            <span className="shrink-0 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary-500 text-[10px] font-bold text-white px-1.5">
              {unread > 99 ? '99+' : unread}
            </span>
          ) : null}
        </div>
      </div>
    </motion.button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ChatPage() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(conversationId || null);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [beforeCursor, setBeforeCursor] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [search, setSearch] = useState('');
  const [typing] = useState(false); // set true via websocket in future

  const messagesRef = useRef(null);
  const textareaRef = useRef(null);
  const pollRef = useRef(null);
  const loadingMoreRef = useRef(false);

  // ── Load conversations ──────────────────────────────────────────────────────

  const loadConversations = useCallback(async () => {
    try {
      const data = await chatApi.getConversations();
      setConversations(Array.isArray(data) ? data : data?.content || []);
    } catch {
      /* swallow poll errors */
    }
  }, []);

  useEffect(() => {
    loadConversations();
    pollRef.current = setInterval(loadConversations, POLL_INTERVAL);
    return () => clearInterval(pollRef.current);
  }, [loadConversations]);

  // ── Load messages ───────────────────────────────────────────────────────────

  const loadMessages = useCallback(async (convId, cursor = null, prepend = false) => {
    if (!convId) return;
    if (prepend) {
      if (loadingMoreRef.current) return;
      loadingMoreRef.current = true;
      setLoadingMore(true);
    } else {
      setLoadingMessages(true);
    }
    try {
      const params = { limit: MSG_LIMIT };
      if (cursor) params.before = cursor;
      const data = await chatApi.getMessages(convId, params);
      const msgs = Array.isArray(data) ? data : data?.content || data?.messages || [];
      if (prepend) {
        setMessages((prev) => [...prev, ...msgs]);
      } else {
        setMessages(msgs);
      }
      setHasMore(msgs.length === MSG_LIMIT);
      if (msgs.length > 0) {
        setBeforeCursor(msgs[msgs.length - 1].id);
      }
      chatApi.markRead(convId).catch(() => {});
    } catch {
      /* swallow */
    } finally {
      if (prepend) {
        loadingMoreRef.current = false;
        setLoadingMore(false);
      } else {
        setLoadingMessages(false);
      }
    }
  }, []);

  // ── Active conversation ─────────────────────────────────────────────────────

  useEffect(() => {
    if (conversationId) setActiveConvId(conversationId);
  }, [conversationId]);

  useEffect(() => {
    if (!activeConvId) return;
    setMessages([]);
    setBeforeCursor(null);
    setHasMore(false);
    loadMessages(activeConvId);
    // find in list or fetch detail
    const inList = conversations.find((c) => String(c.id) === String(activeConvId));
    if (inList) {
      setActiveConv(inList);
    } else {
      chatApi.getConversationDetail(activeConvId).then(setActiveConv).catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConvId, loadMessages]);

  const selectConversation = (conv) => {
    setActiveConvId(String(conv.id));
    navigate(`/chat/${conv.id}`, { replace: true });
  };

  const handleBack = () => {
    setActiveConvId(null);
    navigate('/chat', { replace: true });
  };

  // ── Scroll ──────────────────────────────────────────────────────────────────

  const handleScroll = () => {
    const el = messagesRef.current;
    if (!el) return;
    // flex-col-reverse: scrollTop=0 is visual bottom (newest)
    setShowScrollBtn(el.scrollTop > 100);
    const nearOldest = el.scrollTop >= el.scrollHeight - el.clientHeight - 80;
    if (nearOldest && hasMore && !loadingMoreRef.current) {
      loadMessages(activeConvId, beforeCursor, true);
    }
  };

  const scrollToBottom = () => {
    messagesRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Input ───────────────────────────────────────────────────────────────────

  const handleInputChange = (e) => {
    setInput(e.target.value);
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ── Send ────────────────────────────────────────────────────────────────────

  const sendMessage = async () => {
    if (!input.trim() || !activeConvId || sending) return;
    const content = input.trim();
    const optimisticId = `opt-${Date.now()}`;
    const optimisticMsg = {
      id: optimisticId,
      content,
      senderId: user?.id,
      senderName: user?.fullName,
      senderAvatarUrl: user?.avatarUrl,
      createdAt: new Date().toISOString(),
      _optimistic: true,
    };
    setMessages((prev) => [optimisticMsg, ...prev]);
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setSending(true);
    try {
      const sent = await chatApi.sendMessage(activeConvId, { content });
      setMessages((prev) =>
        prev.map((m) => (m.id === optimisticId ? { ...sent, _optimistic: false } : m))
      );
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
    } finally {
      setSending(false);
    }
  };

  // ── Derived ─────────────────────────────────────────────────────────────────

  const filteredConvs = conversations.filter((c) => {
    const name = c.otherUserName || c.recipientName || c.title || '';
    return name.toLowerCase().includes(search.toLowerCase());
  });

  const otherName =
    activeConv?.otherUserName ||
    activeConv?.recipientName ||
    activeConv?.title ||
    'Cuộc trò chuyện';
  const otherAvatar =
    activeConv?.otherUserAvatarUrl ||
    activeConv?.otherUserAvatar ||
    activeConv?.recipientAvatarUrl;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen bg-base">
      {/* ── Left panel ─────────────────────────────────────────────────────── */}
      <div
        className={[
          'flex-col bg-white dark:bg-ink-900 border-r border-ink-100 dark:border-ink-700',
          activeConvId ? 'hidden md:flex md:w-80' : 'flex w-full md:w-80',
        ].join(' ')}
      >
        <div className="p-4 border-b border-ink-100 dark:border-ink-700">
          <h1 className="text-lg font-semibold text-ink-900 dark:text-ink-50 mb-3">Tin nhắn</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm..."
              className="w-full h-10 rounded-xl bg-ink-100 dark:bg-ink-800 pl-9 pr-4 text-sm text-ink-900 dark:text-ink-50 placeholder-ink-400 outline-none focus:ring-2 focus:ring-primary-500/40"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {filteredConvs.length === 0 ? (
            <div className="text-center py-10">
              <MessageCircle className="h-10 w-10 mx-auto mb-2 text-ink-300 dark:text-ink-600" />
              <p className="text-sm text-ink-400">Chưa có cuộc trò chuyện nào</p>
            </div>
          ) : (
            filteredConvs.map((conv) => (
              <ConvItem
                key={conv.id}
                conv={conv}
                isActive={String(conv.id) === String(activeConvId)}
                onClick={() => selectConversation(conv)}
              />
            ))
          )}
        </div>
      </div>

      {/* ── Right panel ────────────────────────────────────────────────────── */}
      {activeConvId ? (
        <div
          className={[
            'flex-col flex-1 overflow-hidden relative',
            activeConvId ? 'flex' : 'hidden md:flex',
          ].join(' ')}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-ink-100 dark:border-ink-700 bg-white dark:bg-ink-900 shrink-0">
            <button
              type="button"
              onClick={handleBack}
              className="md:hidden p-2 -ml-2 rounded-full hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors text-ink-600 dark:text-ink-200"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            {activeConv ? (
              <>
                <Avatar src={otherAvatar} name={otherName} size="sm" />
                <p className="font-semibold text-sm text-ink-900 dark:text-ink-50">{otherName}</p>
              </>
            ) : null}
          </div>

          {/* Messages */}
          <div
            ref={messagesRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto flex flex-col-reverse py-4 gap-2"
          >
            {typing ? <TypingIndicator /> : null}

            {loadingMessages ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
              </div>
            ) : messages.length === 0 ? (
              <p className="text-center text-sm text-ink-400 py-12">
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
                {loadingMore ? (
                  <div className="flex justify-center py-3">
                    <Loader2 className="h-4 w-4 animate-spin text-primary-500" />
                  </div>
                ) : null}
              </>
            )}
          </div>

          {/* Scroll-to-bottom FAB */}
          <AnimatePresence>
            {showScrollBtn ? (
              <motion.button
                type="button"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={springs.snappy}
                onClick={scrollToBottom}
                className="absolute bottom-24 right-4 h-10 w-10 rounded-full bg-primary-500 hover:bg-primary-700 text-white flex items-center justify-center shadow-elevated transition-colors"
                aria-label="Cuộn xuống"
              >
                <ChevronDown className="h-5 w-5" />
              </motion.button>
            ) : null}
          </AnimatePresence>

          {/* Input area */}
          <div className="px-4 py-3 border-t border-ink-100 dark:border-ink-700 bg-white dark:bg-ink-900 shrink-0">
            <div className="flex items-end gap-2">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Nhập tin nhắn..."
                rows={1}
                className="flex-1 resize-none rounded-xl bg-ink-100 dark:bg-ink-800 px-4 py-2.5 text-sm text-ink-900 dark:text-ink-50 placeholder-ink-400 outline-none focus:ring-2 focus:ring-primary-500/40 max-h-[120px] leading-relaxed"
              />
              <button
                type="button"
                onClick={sendMessage}
                disabled={!input.trim() || sending}
                className="h-10 w-10 rounded-full bg-primary-500 hover:bg-primary-700 disabled:bg-primary-500/40 text-white flex items-center justify-center transition-colors shrink-0"
                aria-label="Gửi"
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </div>
            <p className="text-[11px] text-ink-400 mt-1.5">
              Enter để gửi · Shift+Enter xuống dòng
            </p>
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center text-ink-400">
          <div className="text-center">
            <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-20" />
            <p className="text-sm">Chọn cuộc trò chuyện để bắt đầu</p>
          </div>
        </div>
      )}
    </div>
  );
}
