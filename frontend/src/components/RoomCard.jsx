import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  MapPin,
  ArrowRight,
  Ruler,
  Tag,
  Eye,
  Clock,
  CheckCircle2,
  AirVent,
  Refrigerator,
  Bike,
  ShieldCheck,
  Bath,
} from 'lucide-react';
import Card from './ui/Card';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from './ui/Toast';
import { favoriteApi } from '../lib/api';
import { springs } from '../lib/animations';

const AMENITY_ICONS = {
  ac: { Icon: AirVent, label: 'Máy lạnh' },
  fridge: { Icon: Refrigerator, label: 'Tủ lạnh' },
  wc: { Icon: Bath, label: 'WC riêng' },
  security: { Icon: ShieldCheck, label: 'Bảo vệ' },
};

const formatPrice = (n) =>
  new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(n || 0) + 'đ/tháng';

const formatPriceOnly = (n) =>
  new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(n || 0) + 'đ';

const ROOM_TYPE_LABELS = {
  PHONG_TRO: 'Phòng trọ',
  CHUNG_CU_MINI: 'Chung cư mini',
  O_GHEP: 'Ở ghép',
  HOMESTAY: 'Homestay',
};

const formatRelativeTime = (iso) => {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return null;
  const diffMs = Date.now() - then;
  const day = 24 * 60 * 60 * 1000;
  if (diffMs < day)         return 'Hôm nay';
  if (diffMs < 2 * day)     return 'Hôm qua';
  if (diffMs < 30 * day)    return `${Math.floor(diffMs / day)} ngày trước`;
  if (diffMs < 365 * day)   return `${Math.floor(diffMs / (30 * day))} tháng trước`;
  return `${Math.floor(diffMs / (365 * day))} năm trước`;
};

const isRecentlyPosted = (iso) => {
  if (!iso) return false;
  const diffMs = Date.now() - new Date(iso).getTime();
  return diffMs < 3 * 24 * 60 * 60 * 1000;
};

const PLACEHOLDER_IMG =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 4 3'><rect width='4' height='3' fill='%23e6f5f5'/></svg>";

// ── Heart burst (8 particles) ────────────────────────────
function HeartBurst({ trigger }) {
  if (!trigger) return null;
  const particles = Array.from({ length: 8 });
  return (
    <AnimatePresence>
      <div
        key={trigger}
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
        aria-hidden="true"
      >
        {particles.map((_, i) => {
          const angle = (i / particles.length) * Math.PI * 2;
          const dist = 30 + Math.random() * 30;
          return (
            <motion.span
              key={`${trigger}-${i}`}
              initial={{ opacity: 1, scale: 0, x: 0, y: 0 }}
              animate={{
                opacity: 0,
                scale: 1.5,
                x: Math.cos(angle) * dist,
                y: Math.sin(angle) * dist,
              }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="absolute"
              style={{ willChange: 'transform' }}
            >
              <Heart className="h-3 w-3 text-primary-500 fill-primary-500" />
            </motion.span>
          );
        })}
      </div>
    </AnimatePresence>
  );
}

// ── Blur-up image ────────────────────────────────────────
function RoomImage({ src, alt, className = '' }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className={['relative overflow-hidden bg-ink-100 dark:bg-ink-800', className].join(' ')}>
      <div
        aria-hidden="true"
        className="absolute inset-0 transition-opacity duration-300"
        style={{
          background: 'linear-gradient(135deg, #CCF0EF 0%, #F7C95F33 100%)',
          opacity: loaded ? 0 : 1,
        }}
      />
      <img
        src={src || PLACEHOLDER_IMG}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        className={[
          'absolute inset-0 h-full w-full object-cover transition-all duration-500',
          loaded ? 'opacity-100 blur-0 scale-100' : 'opacity-0 blur-md scale-105',
        ].join(' ')}
      />
    </div>
  );
}

// ── Favorite button (handles auth + API) ─────────────────
function FavoriteButton({ post, initialFavorited, onChange }) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [favorited, setFavorited] = useState(initialFavorited ?? Boolean(post.isFavorited));
  const [burst, setBurst] = useState(0);
  const [pending, setPending] = useState(false);

  const onClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.info('Vui lòng đăng nhập để lưu phòng yêu thích.');
      navigate('/login');
      return;
    }
    if (pending) return;

    const next = !favorited;
    setFavorited(next);
    setBurst((b) => b + 1);
    setPending(true);
    try {
      if (next) await favoriteApi.add(post.id);
      else await favoriteApi.remove(post.id);
      onChange?.(post.id, next);
    } catch {
      // revert on failure
      setFavorited(!next);
      toast.error('Không thể cập nhật, vui lòng thử lại.');
    } finally {
      setPending(false);
    }
  };

  return (
    <motion.button
      type="button"
      onClick={onClick}
      animate={{ scale: burst ? [1, 1.4, 1] : 1 }}
      transition={burst ? { ...springs.bouncy, duration: 0.5 } : { duration: 0.15 }}
      className="relative h-9 w-9 rounded-full bg-white/95 dark:bg-ink-900/95 shadow-soft flex items-center justify-center hover:scale-110 transition-transform"
      aria-label={favorited ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}
      aria-pressed={favorited}
      style={{ willChange: 'transform' }}
    >
      <Heart
        className={[
          'h-4 w-4 transition-colors',
          favorited ? 'fill-primary-500 text-primary-500' : 'text-ink-600',
        ].join(' ')}
      />
      <HeartBurst trigger={burst} />
    </motion.button>
  );
}

// ── Shared content (used in both layouts) ────────────────
function CardBody({ post, dense = false }) {
  // Support both PostSummaryResponse (roomTitle, areaMq) and legacy field names
  const title = post.roomTitle ?? post.title;
  const area  = post.areaMq   ?? post.area;
  const typeKey = post.roomType ?? post.type;
  const typeLabel = ROOM_TYPE_LABELS[typeKey] ?? typeKey;
  const relTime = formatRelativeTime(post.createdAt);

  return (
    <div className={['flex flex-col h-full', dense ? 'p-3' : 'p-4'].join(' ')}>
      {typeLabel ? (
        <span className="self-start mb-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-[10px] font-semibold uppercase tracking-wide">
          <Tag className="h-3 w-3" />
          {typeLabel}
        </span>
      ) : null}

      <h3 className="text-[15px] font-semibold text-ink-900 dark:text-ink-50 line-clamp-2 leading-snug">
        {title}
      </h3>

      <p className="mt-1.5 flex items-center gap-1.5 text-xs text-ink-600 dark:text-ink-200">
        <MapPin className="h-3.5 w-3.5 text-primary-500 shrink-0" />
        <span className="truncate">
          {[post.district, post.city].filter(Boolean).join(', ') || 'Đang cập nhật địa chỉ'}
        </span>
      </p>

      <div className="mt-2 flex items-center gap-x-3 gap-y-1 flex-wrap text-xs text-ink-500 dark:text-ink-300">
        {area ? (
          <span className="inline-flex items-center gap-1">
            <Ruler className="h-3.5 w-3.5" />
            {area} m²
          </span>
        ) : null}
        {post.viewCount != null ? (
          <span className="inline-flex items-center gap-1">
            <Eye className="h-3.5 w-3.5" />
            {post.viewCount.toLocaleString('vi-VN')}
          </span>
        ) : null}
        <span className="inline-flex items-center gap-1 text-success">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Còn trống
        </span>
      </div>

      <div className="mt-auto pt-3 border-t border-ink-100 dark:border-ink-700 flex items-end justify-between gap-2">
        <div className="min-w-0">
          <p className="text-lg font-bold text-primary-500 font-display leading-none truncate">
            {formatPriceOnly(post.price)}
          </p>
          <p className="mt-0.5 text-[11px] text-ink-400">/tháng</p>
        </div>
        {relTime ? (
          <span className="inline-flex items-center gap-1 text-[11px] text-ink-400 shrink-0">
            <Clock className="h-3 w-3" />
            {relTime}
          </span>
        ) : null}
      </div>
    </div>
  );
}

// ── Card ─────────────────────────────────────────────────
export function RoomCard({
  post,
  viewMode = 'grid',
  layoutId,
  initialFavorited,
  onFavoriteChange,
}) {
  if (viewMode === 'list') {
    return (
      <motion.div layout layoutId={layoutId} style={{ willChange: 'transform' }}>
        <Card hover padding="none" className="overflow-hidden group">
          <Link to={`/posts/${post.id}`} className="flex flex-col sm:flex-row">
            <div className="relative w-full sm:w-56 shrink-0">
              <RoomImage
                src={post.thumbnailImage ?? post.thumbnailUrl}
                alt={post.roomTitle ?? post.title}
                className="aspect-[4/3] sm:aspect-auto sm:h-full sm:min-h-[180px]"
              />
              {isRecentlyPosted(post.createdAt) && (
                <span className="absolute top-3 right-3 z-10 px-2.5 py-1 rounded-full bg-accent-500 text-ink-900 text-[10px] font-bold uppercase tracking-wide shadow-soft">
                  Mới đăng
                </span>
              )}
              <div className="absolute top-3 left-3 z-10">
                <FavoriteButton
                  post={post}
                  initialFavorited={initialFavorited}
                  onChange={onFavoriteChange}
                />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <CardBody post={post} />
            </div>
          </Link>
        </Card>
      </motion.div>
    );
  }

  // grid (default)
  return (
    <motion.div layout layoutId={layoutId} style={{ willChange: 'transform' }}>
      <Card hover padding="none" className="overflow-hidden h-full flex flex-col group">
        <Link to={`/posts/${post.id}`} className="block flex-1 flex flex-col">
          <div className="relative aspect-[4/3] overflow-hidden">
            <RoomImage
              src={post.thumbnailImage ?? post.thumbnailUrl}
              alt={post.roomTitle ?? post.title}
              className="absolute inset-0 h-full w-full"
            />

            {isRecentlyPosted(post.createdAt) && (
              <span className="absolute top-3 right-3 z-10 px-2.5 py-1 rounded-full bg-accent-500 text-ink-900 text-[10px] font-bold uppercase tracking-wide shadow-soft">
                Mới đăng
              </span>
            )}

            <div className="absolute top-3 left-3 z-10">
              <FavoriteButton
                post={post}
                initialFavorited={initialFavorited}
                onChange={onFavoriteChange}
              />
            </div>

            {/* hover overlay */}
            <div className="absolute inset-0 z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-gradient-to-t from-black/70 via-black/30 to-transparent">
              <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-primary-700 text-sm font-semibold shadow-soft translate-y-2 group-hover:translate-y-0 transition-transform">
                Xem chi tiết
                <ArrowRight className="h-4 w-4" />
              </span>
            </div>
          </div>

          <div className="flex-1">
            <CardBody post={post} />
          </div>
        </Link>
      </Card>
    </motion.div>
  );
}

export default RoomCard;
