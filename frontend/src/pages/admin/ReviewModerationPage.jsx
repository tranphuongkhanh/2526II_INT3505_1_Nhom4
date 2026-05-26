import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { CheckCircle, XCircle, Shield, Star } from 'lucide-react';
import { reviewApi } from '../../lib/api';
import { springs } from '../../lib/animations';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import Skeleton from '../../components/ui/Skeleton';
import { useToast } from '../../components/ui/Toast';

const TABS = [
  { key: 'PENDING',  label: 'Chờ duyệt' },
  { key: 'APPROVED', label: 'Đã duyệt' },
  { key: 'REJECTED', label: 'Từ chối' },
];

const TYPE_META = {
  ROOM_REVIEW:   { label: 'Đánh giá phòng',       variant: 'info' },
  RENTER_REVIEW: { label: 'Đánh giá người thuê',  variant: 'info' },
};

const STATUS_META = {
  PENDING:  { label: 'Chờ duyệt', variant: 'pending' },
  APPROVED: { label: 'Đã duyệt',  variant: 'approved' },
  REJECTED: { label: 'Từ chối',   variant: 'rejected' },
};

const fmt = (d) => d ? new Date(d).toLocaleDateString('vi-VN') : '—';
const toArr = (x) => Array.isArray(x) ? x : (x?.content ?? x?.items ?? x?.data ?? []);

// ── Animated stars (sequential on viewport entry) ──────────
function AnimatedStars({ rating, size = 'md' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const sz = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';

  return (
    <div ref={ref} className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star, i) => (
        <motion.span
          key={star}
          initial={{ color: '#e2e8f0' }}
          animate={inView ? { color: star <= rating ? '#f59e0b' : '#e2e8f0' } : {}}
          transition={{ delay: i * 0.04, duration: 0.15 }}
        >
          <Star
            className={sz}
            fill={star <= rating ? 'currentColor' : 'none'}
            strokeWidth={1.5}
          />
        </motion.span>
      ))}
    </div>
  );
}

// ── Review card ────────────────────────────────────────────
function ReviewCard({ review, exitDir, exiting, onApprove, onReject, busy }) {
  return (
    <motion.div
      layout
      animate={exiting ? {
        x: exitDir === 'right' ? '100%' : '-100%',
        opacity: 0,
        height: 0,
        marginBottom: 0,
        paddingTop: 0,
        paddingBottom: 0,
      } : { x: 0, opacity: 1 }}
      transition={{ duration: 0.42, ease: [0.4, 0, 0.2, 1] }}
      className="overflow-hidden"
    >
      <Card padding="md" className="mb-4">
        <div className="flex items-start justify-between gap-3">
          {/* Reviewer info */}
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <Avatar src={review.reviewerAvatar} name={review.reviewerName} size="md" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-ink-900 dark:text-ink-50 text-sm">
                  {review.reviewerName}
                </p>
                <Badge
                  variant={review.type === 'RENTER_REVIEW' ? 'info' : 'info'}
                  className={review.type === 'RENTER_REVIEW' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' : ''}
                >
                  {TYPE_META[review.type]?.label ?? review.type}
                </Badge>
                <Badge variant={STATUS_META[review.status]?.variant ?? 'info'}>
                  {STATUS_META[review.status]?.label ?? review.status}
                </Badge>
              </div>

              <p className="text-xs text-ink-400 mt-0.5">
                về <span className="text-primary-500 font-medium">{review.targetName}</span>
                {' · '}{fmt(review.createdAt)}
              </p>

              <div className="mt-2">
                <AnimatedStars rating={review.rating} />
              </div>

              <p className="mt-2 text-sm text-ink-600 dark:text-ink-200 leading-relaxed line-clamp-4">
                {review.comment}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          {review.status === 'PENDING' && (
            <div className="flex items-center gap-2 shrink-0">
              <motion.button
                type="button"
                whileTap={{ scale: 0.9 }}
                onClick={onApprove}
                disabled={busy}
                title="Duyệt đánh giá"
                className="h-9 w-9 rounded-full bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400 flex items-center justify-center transition-colors disabled:opacity-50"
              >
                <CheckCircle className="h-5 w-5" />
              </motion.button>
              <motion.button
                type="button"
                whileTap={{ scale: 0.9 }}
                onClick={onReject}
                disabled={busy}
                title="Từ chối đánh giá"
                className="h-9 w-9 rounded-full bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 flex items-center justify-center transition-colors disabled:opacity-50"
              >
                <XCircle className="h-5 w-5" />
              </motion.button>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

// ── Page ───────────────────────────────────────────────────
export default function ReviewModerationPage() {
  const toast = useToast();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusTab, setStatusTab] = useState('PENDING');
  const [exitInfo, setExitInfo] = useState({});    // { [id]: 'left'|'right' }
  const [exitingIds, setExitingIds] = useState(new Set());
  const [busy, setBusy] = useState(null);

  useEffect(() => {
    reviewApi.adminGetAll({ limit: 500 })
      .then((d) => setReviews(toArr(d)))
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  }, []);

  const counts = {
    PENDING:  reviews.filter((r) => r.status === 'PENDING').length,
    APPROVED: reviews.filter((r) => r.status === 'APPROVED').length,
    REJECTED: reviews.filter((r) => r.status === 'REJECTED').length,
  };

  const filtered = reviews.filter((r) => r.status === statusTab);

  const removeReview = useCallback((id, dir, newStatus) => {
    setExitInfo((prev) => ({ ...prev, [id]: dir }));
    setExitingIds((prev) => new Set([...prev, id]));
    setTimeout(() => {
      setReviews((prev) => prev.map((r) => r.id === id ? { ...r, status: newStatus } : r));
      setExitingIds((prev) => { const s = new Set(prev); s.delete(id); return s; });
      setExitInfo((prev) => { const n = { ...prev }; delete n[id]; return n; });
    }, 480);
  }, []);

  const handleApprove = useCallback(async (review) => {
    setBusy(review.id);
    try {
      await reviewApi.adminUpdateStatus(review.id, { status: 'APPROVED' }).catch(() => {});
      removeReview(review.id, 'left', 'APPROVED');
      toast.success('Đã duyệt đánh giá');
    } finally {
      setBusy(null);
    }
  }, [removeReview, toast]);

  const handleReject = useCallback(async (review) => {
    setBusy(review.id);
    try {
      await reviewApi.adminUpdateStatus(review.id, { status: 'REJECTED' }).catch(() => {});
      removeReview(review.id, 'right', 'REJECTED');
      toast.success('Đã từ chối đánh giá');
    } finally {
      setBusy(null);
    }
  }, [removeReview, toast]);

  const pendingDone = statusTab === 'PENDING' && !loading && counts.PENDING === 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-ink-900 dark:text-ink-50">Kiểm duyệt đánh giá</h1>
        <p className="text-ink-400 mt-1 text-sm">Duyệt và quản lý các đánh giá của người dùng.</p>
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
              <span className={`text-xs rounded-full px-1.5 font-semibold ${
                statusTab === tab.key
                  ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/40 dark:text-primary-300'
                  : 'bg-ink-100 dark:bg-ink-700 text-ink-500'
              }`}>
                {counts[tab.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-2xl" />)}
        </div>
      ) : pendingDone ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={springs.smooth}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            className="h-16 w-16 rounded-full bg-green-50 dark:bg-green-900/30 flex items-center justify-center mb-4"
          >
            <Shield className="h-8 w-8 text-green-500" />
          </motion.div>
          <p className="text-xl font-bold text-ink-900 dark:text-ink-50">✓ Tất cả đã kiểm duyệt!</p>
          <p className="text-sm text-ink-400 mt-1">Không còn đánh giá nào cần xem xét.</p>
        </motion.div>
      ) : filtered.length === 0 ? (
        <Card className="text-center py-16 text-ink-400">
          <Star className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Không có đánh giá nào trong mục này.</p>
        </Card>
      ) : (
        <div>
          <AnimatePresence initial={false} mode="sync">
            {filtered.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                exitDir={exitInfo[review.id] ?? 'left'}
                exiting={exitingIds.has(review.id)}
                onApprove={() => handleApprove(review)}
                onReject={() => handleReject(review)}
                busy={busy !== null}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
