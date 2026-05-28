import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, MessageSquare } from 'lucide-react';
import { reviewApi } from '../../lib/api';
import { useToast } from '../../components/ui/Toast';
import { Skeleton } from '../../components/ui/Skeleton';
import { Badge } from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import { springs } from '../../lib/animations';

const TABS = [
  { label: 'Đã viết', value: 0 },
  { label: 'Từ chủ trọ', value: 1 },
];

const REVIEW_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

function AnimatedStars({ rating, viewOnce = true }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <motion.span
          key={i}
          initial={{ scale: 0.5, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: viewOnce }}
          transition={{ delay: i * 0.05, ...springs.bouncy }}
        >
          <Star
            className={[
              'h-4 w-4',
              i < rating
                ? 'fill-accent-500 text-accent-500'
                : 'fill-ink-200 text-ink-200 dark:fill-ink-700 dark:text-ink-700',
            ].join(' ')}
          />
        </motion.span>
      ))}
    </div>
  );
}

const PLACEHOLDER_IMG =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 4 3'><rect width='4' height='3' fill='%23e6f5f5'/></svg>";

function WrittenReviewCard({ review }) {
  const statusVariant = REVIEW_STATUS[review.status] ?? 'info';
  const statusLabel =
    review.status === 'PENDING'
      ? 'Chờ duyệt'
      : review.status === 'APPROVED'
      ? 'Đã duyệt'
      : review.status === 'REJECTED'
      ? 'Từ chối'
      : review.status;

  const isRenterReview = (review.review_type ?? review.reviewType) === 'OWNER_TO_RENTER';
  const targetTitle = isRenterReview
    ? (review.target_user_name ?? review.targetUserName ?? 'Người thuê')
    : (review.target_room_title ?? review.targetRoomTitle ?? review.roomTitle ?? review.room?.title ?? '—');
  const createdAt = review.created_at ?? review.createdAt;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springs.smooth}
      className="flex gap-4 bg-white dark:bg-ink-900 rounded-2xl border border-ink-100 dark:border-ink-700 shadow-soft p-4"
    >
      <img
        src={review.thumbnailUrl ?? review.room?.thumbnailUrl ?? PLACEHOLDER_IMG}
        alt={targetTitle}
        className="h-20 w-28 rounded-xl object-cover shrink-0 bg-ink-100 dark:bg-ink-800"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <p className="font-semibold text-ink-900 dark:text-ink-50 truncate leading-snug">
            {isRenterReview ? `Đánh giá người thuê: ${targetTitle}` : targetTitle}
          </p>
          {review.status && (
            <Badge variant={statusVariant} size="sm">
              {statusLabel}
            </Badge>
          )}
        </div>
        <div className="mt-1.5">
          <AnimatedStars rating={review.rating ?? 0} />
        </div>
        <p className="mt-2 text-sm text-ink-600 dark:text-ink-200 line-clamp-2">
          {review.comment}
        </p>
        {createdAt && (
          <p className="mt-1.5 text-xs text-ink-400">
            {new Date(createdAt).toLocaleDateString('vi-VN')}
          </p>
        )}
      </div>
    </motion.div>
  );
}

function RenterReviewCard({ review }) {
  const reviewerName =
    review.reviewer_name ?? review.reviewerName ?? review.reviewer?.fullName ?? 'Chủ trọ';
  const reviewerAvatar =
    review.reviewer_avatar ?? review.reviewerAvatarUrl ?? review.reviewer?.avatarUrl;
  const createdAt = review.created_at ?? review.createdAt;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springs.smooth}
      className="flex gap-4 bg-white dark:bg-ink-900 rounded-2xl border border-ink-100 dark:border-ink-700 shadow-soft p-4"
    >
      <Avatar src={reviewerAvatar} name={reviewerName} size="lg" />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-ink-900 dark:text-ink-50 leading-snug">
          {reviewerName}
        </p>
        <div className="mt-1.5">
          <AnimatedStars rating={review.rating ?? 0} />
        </div>
        <p className="mt-2 text-sm text-ink-600 dark:text-ink-200 line-clamp-3">
          {review.comment}
        </p>
        {createdAt && (
          <p className="mt-1.5 text-xs text-ink-400">
            {new Date(createdAt).toLocaleDateString('vi-VN')}
          </p>
        )}
      </div>
    </motion.div>
  );
}

const slideVariants = {
  enter: (dir) => ({ x: dir * 30, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir) => ({ x: -dir * 30, opacity: 0 }),
};

export default function MyReviewsPage() {
  const [tab, setTab] = useState(0);
  const [direction, setDirection] = useState(1);
  const [writtenReviews, setWrittenReviews] = useState([]);
  const [renterReviews, setRenterReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    Promise.all([
      reviewApi.getMyWrittenReviews(),
      reviewApi.getMyRenterReviews(),
    ])
      .then(([written, renter]) => {
        const toArr = (d) =>
          Array.isArray(d) ? d : (d?.content ?? d?.items ?? []);
        setWrittenReviews(toArr(written));
        setRenterReviews(toArr(renter));
      })
      .catch(() => toast.error('Không thể tải đánh giá.'))
      .finally(() => setLoading(false));
  }, []);

  const handleTabChange = (newTab) => {
    setDirection(newTab > tab ? 1 : -1);
    setTab(newTab);
  };

  const items = tab === 0 ? writtenReviews : renterReviews;

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-bold text-ink-900 dark:text-ink-50 mb-6">Đánh giá của tôi</h1>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-ink-100 dark:bg-ink-800 p-1 mb-6 w-fit">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => handleTabChange(t.value)}
            className={[
              'relative px-5 py-2 text-sm font-medium rounded-lg transition-colors',
              tab === t.value
                ? 'text-ink-900 dark:text-ink-50'
                : 'text-ink-600 dark:text-ink-400 hover:text-ink-900 dark:hover:text-ink-50',
            ].join(' ')}
          >
            {tab === t.value && (
              <motion.span
                layoutId="reviews-tab-indicator"
                className="absolute inset-0 rounded-lg bg-white dark:bg-ink-700 shadow-soft"
                transition={springs.snappy}
              />
            )}
            <span className="relative z-10">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} variant="rect" className="h-28 w-full rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="relative overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={tab}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ ...springs.smooth, duration: 0.25 }}
            >
              {items.length === 0 ? (
                <div className="flex flex-col items-center py-20 text-center">
                  <MessageSquare className="h-10 w-10 text-ink-300 mb-3" />
                  <p className="font-medium text-ink-600 dark:text-ink-200">
                    {tab === 0 ? 'Chưa có đánh giá nào' : 'Chưa có đánh giá từ chủ trọ'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((review) =>
                    tab === 0 ? (
                      <WrittenReviewCard key={review.id} review={review} />
                    ) : (
                      <RenterReviewCard key={review.id} review={review} />
                    )
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
