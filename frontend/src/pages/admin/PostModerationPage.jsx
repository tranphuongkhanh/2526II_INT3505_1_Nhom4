import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown, Image as ImageIcon, CheckCircle, XCircle,
  ChevronLeft, ChevronRight, FileText,
} from 'lucide-react';
import { postApi } from '../../lib/api';
import { springs } from '../../lib/animations';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import Skeleton from '../../components/ui/Skeleton';
import Modal from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';

const STATUS_META = {
  PENDING:  { label: 'Chờ duyệt', variant: 'pending' },
  APPROVED: { label: 'Đã duyệt',  variant: 'approved' },
  REJECTED: { label: 'Từ chối',   variant: 'rejected' },
};

const TABS = [
  { key: 'PENDING',  label: 'Chờ duyệt', pulse: true },
  { key: 'APPROVED', label: 'Đã duyệt' },
  { key: 'REJECTED', label: 'Từ chối' },
  { key: 'ALL',      label: 'Tất cả' },
];

const fmt = (d) => d ? new Date(d).toLocaleDateString('vi-VN') : '—';
const toArr = (x) => Array.isArray(x) ? x : (x?.content ?? x?.items ?? x?.data ?? []);

// ── Stamp overlay ──────────────────────────────────────────
function StampOverlay({ type }) {
  const approve = type === 'approve';
  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center z-20 rounded-2xl"
      style={{ background: approve ? 'rgba(16,185,129,0.07)' : 'rgba(239,68,68,0.07)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        initial={{ scale: 0.3, rotate: -15, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
        className={`border-4 rounded-xl px-8 py-3 -rotate-6 ${
          approve ? 'border-green-500' : 'border-red-500'
        }`}
      >
        <span className={`text-2xl font-black tracking-widest ${
          approve ? 'text-green-500' : 'text-red-500'
        }`}>
          {approve ? 'APPROVED' : 'REJECTED'}
        </span>
      </motion.div>
    </motion.div>
  );
}

// ── Image carousel ─────────────────────────────────────────
function ImageCarousel({ images }) {
  const [idx, setIdx] = useState(0);
  const imgs = images ?? [];

  if (imgs.length === 0) {
    return (
      <div className="aspect-video bg-ink-100 dark:bg-ink-700 rounded-xl flex items-center justify-center text-ink-400">
        <ImageIcon className="h-8 w-8 opacity-40" />
      </div>
    );
  }

  return (
    <div className="relative aspect-video bg-ink-100 dark:bg-ink-700 rounded-xl overflow-hidden">
      <img
        src={imgs[idx]?.url ?? imgs[idx]}
        alt=""
        className="w-full h-full object-cover"
      />
      {imgs.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => setIdx((i) => (i - 1 + imgs.length) % imgs.length)}
            className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setIdx((i) => (i + 1) % imgs.length)}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {imgs.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIdx(i)}
                className={`h-1.5 rounded-full transition-all ${i === idx ? 'w-4 bg-white' : 'w-1.5 bg-white/50'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Post card ──────────────────────────────────────────────
function PostCard({ post, expanded, onToggle, onApprove, onReject, stampType, removing }) {
  const isPending = post.status === 'PENDING';

  return (
    <motion.div
      layout
      animate={removing ? { x: '-110%', opacity: 0 } : { x: 0, opacity: 1 }}
      transition={removing ? { duration: 0.45, ease: [0.4, 0, 0.2, 1] } : springs.smooth}
      className={[
        'relative rounded-2xl border overflow-hidden',
        isPending
          ? 'border-l-4 border-amber-400 bg-amber-50/30 dark:bg-amber-900/10 border-r-ink-100 border-t-ink-100 border-b-ink-100 dark:border-r-ink-700 dark:border-t-ink-700 dark:border-b-ink-700'
          : 'bg-white dark:bg-ink-800 border-ink-100 dark:border-ink-700',
        'shadow-soft',
      ].join(' ')}
    >
      {stampType && <StampOverlay type={stampType} />}

      {/* Summary row */}
      <div className="flex items-center gap-4 p-5">
        {/* Thumbnail placeholder */}
        <div className="h-16 w-20 rounded-xl bg-ink-100 dark:bg-ink-700 shrink-0 overflow-hidden flex items-center justify-center">
          {post.images?.[0] ? (
            <img src={post.images[0]?.url ?? post.images[0]} alt="" className="w-full h-full object-cover" />
          ) : (
            <ImageIcon className="h-6 w-6 text-ink-300" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 flex-wrap">
            <p className="font-semibold text-ink-900 dark:text-ink-50 truncate max-w-xs">{post.roomTitle || '—'}</p>
            <Badge variant={STATUS_META[post.status]?.variant ?? 'info'}>
              {STATUS_META[post.status]?.label ?? post.status}
            </Badge>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Avatar src={post.ownerAvatar} name={post.ownerName} size="sm" />
            <span className="text-xs text-ink-400">{post.ownerName || '—'}</span>
          </div>
          <p className="text-xs text-ink-400 mt-0.5">Đăng: {fmt(post.createdAt)}</p>
        </div>

        <button
          type="button"
          onClick={onToggle}
          className="flex items-center gap-1.5 text-sm text-primary-500 hover:text-primary-700 transition-colors shrink-0 font-medium"
        >
          Xem chi tiết
          <motion.span animate={{ rotate: expanded ? 180 : 0 }} transition={springs.smooth}>
            <ChevronDown className="h-4 w-4" />
          </motion.span>
        </button>
      </div>

      {/* Expanded detail */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ ...springs.smooth, opacity: { duration: 0.2 } }}
            className="overflow-hidden border-t border-ink-100 dark:border-ink-700"
          >
            <div className="p-5 space-y-4">
              {/* Carousel */}
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...springs.smooth, delay: 0 }}>
                <ImageCarousel images={post.images} />
              </motion.div>

              {/* Price + amenities */}
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...springs.smooth, delay: 0.06 }}
                className="flex flex-wrap gap-4 items-start">
                <div>
                  <p className="text-xs text-ink-400 uppercase tracking-wide">Giá thuê</p>
                  <p className="text-lg font-bold text-primary-500 mt-0.5">
                    {post.price ? post.price.toLocaleString('vi-VN') + ' đ/tháng' : '—'}
                  </p>
                </div>
                {post.amenities?.length > 0 && (
                  <div>
                    <p className="text-xs text-ink-400 uppercase tracking-wide mb-1">Tiện ích</p>
                    <div className="flex flex-wrap gap-1.5">
                      {post.amenities.map((a) => (
                        <span key={a} className="text-xs bg-ink-100 dark:bg-ink-700 text-ink-600 dark:text-ink-200 px-2 py-0.5 rounded-full">
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Description */}
              {post.description && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...springs.smooth, delay: 0.12 }}>
                  <p className="text-xs text-ink-400 uppercase tracking-wide mb-1">Mô tả</p>
                  <p className="text-sm text-ink-600 dark:text-ink-200 line-clamp-3">{post.description}</p>
                </motion.div>
              )}

              {/* Action buttons for pending */}
              {post.status === 'PENDING' && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...springs.smooth, delay: 0.18 }}
                  className="flex gap-3 pt-2"
                >
                  <Button onClick={onApprove} icon={CheckCircle} size="sm">
                    Duyệt bài
                  </Button>
                  <Button onClick={onReject} variant="danger" icon={XCircle} size="sm">
                    Từ chối
                  </Button>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Page ───────────────────────────────────────────────────
export default function PostModerationPage() {
  const toast = useToast();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusTab, setStatusTab] = useState('PENDING');
  const [expandedId, setExpandedId] = useState(null);
  const [stampInfo, setStampInfo] = useState({});   // { [id]: 'approve'|'reject' }
  const [removingIds, setRemovingIds] = useState(new Set());
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    postApi.adminGetAll({ size: 500 })
      .then((d) => setPosts(toArr(d)))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, []);

  const counts = {
    ALL:      posts.length,
    PENDING:  posts.filter((p) => p.status === 'PENDING').length,
    APPROVED: posts.filter((p) => p.status === 'APPROVED').length,
    REJECTED: posts.filter((p) => p.status === 'REJECTED').length,
  };

  const filtered = statusTab === 'ALL' ? posts : posts.filter((p) => p.status === statusTab);

  const processPost = useCallback(async (id, type, payload) => {
    setBusy(true);
    try {
      await postApi.adminUpdateStatus(id, payload).catch(() => {});
      setStampInfo((prev) => ({ ...prev, [id]: type }));
      setExpandedId(null);
      setTimeout(() => {
        setRemovingIds((prev) => new Set([...prev, id]));
        setTimeout(() => {
          setPosts((prev) => prev.filter((p) => p.id !== id));
          setStampInfo((prev) => { const n = { ...prev }; delete n[id]; return n; });
          setRemovingIds((prev) => { const s = new Set(prev); s.delete(id); return s; });
        }, 500);
      }, 1100);
      toast.success(type === 'approve' ? 'Đã duyệt bài đăng' : 'Đã từ chối bài đăng');
    } finally {
      setBusy(false);
    }
  }, [toast]);

  const handleApprove = useCallback((post) => {
    processPost(post.id, 'approve', { status: 'APPROVED' });
  }, [processPost]);

  const handleRejectSubmit = useCallback(async () => {
    if (!rejectTarget) return;
    await processPost(rejectTarget.id, 'reject', { status: 'REJECTED', rejectReason });
    setRejectTarget(null);
    setRejectReason('');
  }, [rejectTarget, rejectReason, processPost]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-ink-900 dark:text-ink-50">Kiểm duyệt bài đăng</h1>
        <p className="text-ink-400 mt-1 text-sm">Duyệt và quản lý các bài đăng phòng trọ.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-ink-100 dark:border-ink-700 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setStatusTab(tab.key)}
            className={[
              'px-4 py-2.5 text-sm font-medium whitespace-nowrap flex items-center gap-1.5 relative transition-colors',
              statusTab === tab.key
                ? 'text-primary-500 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary-500 after:rounded-t'
                : 'text-ink-400 hover:text-ink-700 dark:hover:text-ink-200',
            ].join(' ')}
          >
            {tab.label}
            {counts[tab.key] > 0 && (
              <span className={[
                'text-xs rounded-full px-1.5 font-semibold',
                tab.pulse && tab.key === statusTab ? 'animate-pulse' : '',
                statusTab === tab.key
                  ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/40 dark:text-primary-300'
                  : 'bg-ink-100 dark:bg-ink-700 text-ink-500',
              ].join(' ')}>
                {counts[tab.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Post list */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="text-center py-16 text-ink-400">
          <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Không có bài đăng nào trong mục này.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          <AnimatePresence initial={false}>
            {filtered.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                expanded={expandedId === post.id}
                onToggle={() => setExpandedId((p) => (p === post.id ? null : post.id))}
                onApprove={() => handleApprove(post)}
                onReject={() => { setRejectTarget(post); setRejectReason(''); }}
                stampType={stampInfo[post.id]}
                removing={removingIds.has(post.id)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Reject modal */}
      <Modal
        isOpen={Boolean(rejectTarget)}
        onClose={() => { setRejectTarget(null); setRejectReason(''); }}
        title="Từ chối bài đăng"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => { setRejectTarget(null); setRejectReason(''); }}>
              Huỷ
            </Button>
            <Button variant="danger" onClick={handleRejectSubmit} loading={busy} disabled={!rejectReason.trim()}>
              Xác nhận từ chối
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-ink-600 dark:text-ink-200">
            Nhập lý do từ chối bài đăng <strong className="text-ink-900 dark:text-ink-50">{rejectTarget?.roomTitle}</strong>:
          </p>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Lý do từ chối..."
            rows={4}
            className="w-full rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 text-sm text-ink-900 dark:text-ink-50 placeholder-ink-400 px-4 py-3 focus:outline-none focus:border-primary-500 transition-colors resize-none"
          />
        </div>
      </Modal>
    </div>
  );
}
