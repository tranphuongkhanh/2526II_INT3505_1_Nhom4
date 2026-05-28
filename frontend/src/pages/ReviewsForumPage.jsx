import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, MessageSquare, Home, UserRound } from 'lucide-react';
import { reviewApi } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/Toast';
import { Skeleton } from '../components/ui/Skeleton';
import { Badge } from '../components/ui/Badge';
import Avatar from '../components/ui/Avatar';
import { springs } from '../lib/animations';

const TABS = [
  { value: 'ALL', label: 'Tất cả', type: null },
  { value: 'RENTER_TO_ROOM', label: 'Đánh giá phòng', type: 'RENTER_TO_ROOM' },
  { value: 'OWNER_TO_RENTER', label: 'Đánh giá người thuê', type: 'OWNER_TO_RENTER' },
  { value: 'MINE', label: 'Của tôi', type: null },
];

function StarsRow({ value = 0 }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={[
            'h-4 w-4',
            i < value
              ? 'fill-accent-500 text-accent-500'
              : 'fill-ink-200 text-ink-200 dark:fill-ink-700 dark:text-ink-700',
          ].join(' ')}
        />
      ))}
    </div>
  );
}

function ReviewCard({ review, currentUserId }) {
  const isRoomReview = review.review_type === 'RENTER_TO_ROOM';
  const reviewerName = review.reviewer_name ?? 'Ẩn danh';
  const reviewerAvatar = review.reviewer_avatar;
  const createdAt = review.created_at;
  const isMine = currentUserId && review.reviewer_id === currentUserId;
  const isAboutMe = currentUserId && review.target_user_id === currentUserId;

  const targetNode = isRoomReview ? (
    <Link
      to={`/posts/${review.target_room_id ?? ''}`}
      className="inline-flex items-center gap-1 text-primary-600 dark:text-primary-400 hover:underline"
    >
      <Home className="h-3.5 w-3.5" />
      {review.target_room_title ?? 'Phòng đã đánh giá'}
    </Link>
  ) : (
    <span className="inline-flex items-center gap-1 text-ink-700 dark:text-ink-200">
      <UserRound className="h-3.5 w-3.5" />
      {review.target_user_name ?? 'Người thuê'}
    </span>
  );

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springs.smooth}
      className="bg-white dark:bg-ink-900 rounded-2xl border border-ink-100 dark:border-ink-700 shadow-soft p-4"
    >
      <div className="flex gap-3">
        <Avatar src={reviewerAvatar} name={reviewerName} size="md" />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-ink-900 dark:text-ink-50 truncate">{reviewerName}</p>
            <Badge variant={isRoomReview ? 'info' : 'warning'} size="sm">
              {isRoomReview ? 'Đánh giá phòng' : 'Đánh giá người thuê'}
            </Badge>
            {isMine && <Badge variant="success" size="sm">Của bạn</Badge>}
            {isAboutMe && !isMine && <Badge variant="error" size="sm">Về bạn</Badge>}
          </div>
          <p className="mt-0.5 text-xs text-ink-500 dark:text-ink-400">
            {isRoomReview ? 'đã đánh giá' : 'đã đánh giá người thuê'} {targetNode}
          </p>
          <div className="mt-2">
            <StarsRow value={review.rating ?? 0} />
          </div>
          {review.comment && (
            <p className="mt-2 text-sm text-ink-700 dark:text-ink-200 whitespace-pre-wrap">
              {review.comment}
            </p>
          )}
          {createdAt && (
            <p className="mt-2 text-xs text-ink-400">
              {new Date(createdAt).toLocaleString('vi-VN')}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function ReviewsForumPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [tab, setTab] = useState('ALL');
  const [items, setItems] = useState([]);
  const [mine, setMine] = useState({ written: [], received: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    setLoading(true);

    const tabMeta = TABS.find((t) => t.value === tab);

    const load = async () => {
      try {
        if (tab === 'MINE') {
          if (!user) { setItems([]); return; }
          const [written, received] = await Promise.all([
            reviewApi.getMyWrittenReviews({ limit: 50 }).catch(() => null),
            reviewApi.getMyRenterReviews({ limit: 50 }).catch(() => null),
          ]);
          const toArr = (d) => Array.isArray(d) ? d : (d?.items ?? d?.content ?? []);
          const w = toArr(written);
          const r = toArr(received);
          if (cancel) return;
          setMine({ written: w, received: r });
          const merged = [...w, ...r]
            .filter((v, i, arr) => arr.findIndex((x) => x.id === v.id) === i)
            .sort((a, b) => new Date(b.created_at ?? b.createdAt ?? 0) - new Date(a.created_at ?? a.createdAt ?? 0));
          setItems(merged);
        } else {
          const params = { limit: 50 };
          if (tabMeta?.type) params.type = tabMeta.type;
          const data = await reviewApi.getFeed(params);
          if (cancel) return;
          const arr = Array.isArray(data) ? data : (data?.items ?? data?.content ?? []);
          setItems(arr);
        }
      } catch {
        if (!cancel) toast.error('Không thể tải bảng tin đánh giá.');
      } finally {
        if (!cancel) setLoading(false);
      }
    };

    load();
    return () => { cancel = true; };
  }, [tab, user?.id]);

  const stats = useMemo(() => {
    const total = items.length;
    const avg = total
      ? (items.reduce((s, r) => s + (r.rating || 0), 0) / total).toFixed(1)
      : '—';
    return { total, avg };
  }, [items]);

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-end justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink-900 dark:text-ink-50">Bảng tin đánh giá</h1>
          <p className="text-sm text-ink-500 dark:text-ink-400 mt-1">
            Nơi mọi người chia sẻ đánh giá về phòng và người thuê.
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-ink-400">Tổng cộng</p>
          <p className="text-lg font-bold text-ink-900 dark:text-ink-50">
            {stats.total} đánh giá · {stats.avg} <Star className="inline h-4 w-4 fill-accent-500 text-accent-500" />
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-ink-100 dark:bg-ink-800 p-1 mb-6 w-fit flex-wrap">
        {TABS.map((t) => {
          if (t.value === 'MINE' && !user) return null;
          const active = tab === t.value;
          return (
            <button
              key={t.value}
              type="button"
              onClick={() => setTab(t.value)}
              className={[
                'relative px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                active
                  ? 'text-ink-900 dark:text-ink-50'
                  : 'text-ink-600 dark:text-ink-400 hover:text-ink-900 dark:hover:text-ink-50',
              ].join(' ')}
            >
              {active && (
                <motion.span
                  layoutId="forum-tab-indicator"
                  className="absolute inset-0 rounded-lg bg-white dark:bg-ink-700 shadow-soft"
                  transition={springs.snappy}
                />
              )}
              <span className="relative z-10">{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="rect" className="h-28 w-full rounded-2xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center">
          <MessageSquare className="h-10 w-10 text-ink-300 mb-3" />
          <p className="font-medium text-ink-600 dark:text-ink-200">
            {tab === 'MINE' ? 'Bạn chưa có đánh giá nào' : 'Chưa có đánh giá nào'}
          </p>
        </div>
      ) : (
        <AnimatePresence initial={false}>
          <div className="space-y-4">
            {items.map((r) => (
              <ReviewCard key={r.id} review={r} currentUserId={user?.id} />
            ))}
          </div>
        </AnimatePresence>
      )}

      {tab === 'MINE' && !loading && (
        <p className="mt-6 text-xs text-ink-400 text-center">
          Đã viết: {mine.written.length} · Được đánh giá: {mine.received.length}
        </p>
      )}
    </div>
  );
}
