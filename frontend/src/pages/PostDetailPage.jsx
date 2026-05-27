import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import {
  MapPin, Star, Heart, Phone, MessageCircle, Flag,
  ChevronLeft, ChevronRight, X, Images as ImagesIcon,
  Wifi, AirVent, Refrigerator, Bike, Bath, ShieldCheck,
  Home, Ruler, Tag, ChevronDown, Users, Zap, Droplets, Wrench,
} from 'lucide-react';

import { RoomCard } from '../components/RoomCard';
import Button from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';
import StarRating from '../components/ui/StarRating';
import Modal from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { useAuth } from '../contexts/AuthContext';
import { postApi, reviewApi, favoriteApi, chatApi, reportApi } from '../lib/api';
import { springs, easings } from '../lib/animations';

// ─── constants ───────────────────────────────────────────────────────────────

const AMENITY_ICONS = {
  ac:       { Icon: AirVent,      label: 'Máy lạnh' },
  fridge:   { Icon: Refrigerator, label: 'Tủ lạnh' },
  wc:       { Icon: Bath,         label: 'WC riêng' },
  security: { Icon: ShieldCheck,  label: 'Bảo vệ' },
};

const ROOM_TYPES = {
  PHONG_TRO:    'Phòng trọ',
  CHUNG_CU_MINI: 'Chung cư mini',
  O_GHEP:       'Ở ghép',
  HOMESTAY:     'Homestay',
};

const REPORT_REASONS = [
  { value: 'WRONG_INFO',    label: 'Thông tin sai lệch' },
  { value: 'SCAM',          label: 'Lừa đảo' },
  { value: 'DUPLICATE',     label: 'Tin đăng trùng lặp' },
  { value: 'INAPPROPRIATE', label: 'Nội dung không phù hợp' },
  { value: 'OTHER',         label: 'Lý do khác' },
];

const formatPrice = (n) =>
  new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(n || 0) + 'đ/tháng';

const PLACEHOLDER_IMG =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 4 3'><rect width='4' height='3' fill='%23e6f5f5'/></svg>";

// ─── HeartBurst ──────────────────────────────────────────────────────────────

function HeartBurst({ trigger }) {
  if (!trigger) return null;
  return (
    <AnimatePresence>
      <div
        key={trigger}
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
        aria-hidden="true"
      >
        {Array.from({ length: 8 }).map((_, i) => {
          const angle = (i / 8) * Math.PI * 2;
          const dist = 28 + Math.random() * 22;
          return (
            <motion.span
              key={`${trigger}-${i}`}
              initial={{ opacity: 1, scale: 0, x: 0, y: 0 }}
              animate={{ opacity: 0, scale: 1.5, x: Math.cos(angle) * dist, y: Math.sin(angle) * dist }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="absolute"
            >
              <Heart className="h-3 w-3 fill-primary-500 text-primary-500" />
            </motion.span>
          );
        })}
      </div>
    </AnimatePresence>
  );
}

// ─── Lightbox ────────────────────────────────────────────────────────────────

const slideVariants = {
  enter: (dir) => ({ x: dir >= 0 ? '100%' : '-100%', opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:  (dir) => ({ x: dir >= 0 ? '-100%' : '100%', opacity: 0 }),
};

function Lightbox({ images, startIndex, postId, onClose }) {
  const [index, setIndex]     = useState(startIndex);
  const [dir, setDir]         = useState(0);
  const [imgScale, setImgScale] = useState(1);
  const lastPinchDist          = useRef(null);

  const goTo = useCallback((next, direction) => {
    setDir(direction);
    setIndex(next);
    setImgScale(1);
  }, []);

  const onDragEnd = (_, { offset, velocity }) => {
    if ((offset.x < -50 || velocity.x < -300) && index < images.length - 1) goTo(index + 1, 1);
    else if ((offset.x > 50 || velocity.x > 300) && index > 0) goTo(index - 1, -1);
  };

  const onTouchStart = (e) => {
    if (e.touches.length === 2) {
      lastPinchDist.current = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY,
      );
    }
  };

  const onTouchMove = (e) => {
    if (e.touches.length === 2 && lastPinchDist.current) {
      const d = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY,
      );
      setImgScale((s) => Math.min(4, Math.max(1, s * (d / lastPinchDist.current))));
      lastPinchDist.current = d;
    }
  };

  const onTouchEnd = () => { lastPinchDist.current = null; };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape')      onClose();
      if (e.key === 'ArrowRight' && index < images.length - 1) goTo(index + 1,  1);
      if (e.key === 'ArrowLeft'  && index > 0)                 goTo(index - 1, -1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, images.length, onClose, goTo]);

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col"
      style={{ background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(12px)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* header */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0">
        <span className="text-white/60 text-sm tabular-nums">{index + 1} / {images.length}</span>
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          aria-label="Đóng"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* image area */}
      <div
        className="flex-1 relative overflow-hidden"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {index > 0 && (
          <button
            onClick={() => goTo(index - 1, -1)}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Ảnh trước"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}
        {index < images.length - 1 && (
          <button
            onClick={() => goTo(index + 1, 1)}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Ảnh tiếp theo"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}

        <AnimatePresence initial={false} custom={dir}>
          <motion.div
            key={index}
            custom={dir}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={springs.snappy}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.15}
            onDragEnd={onDragEnd}
            className="absolute inset-0 flex items-center justify-center cursor-grab active:cursor-grabbing"
          >
            <motion.img
              src={images[index]}
              alt={`Ảnh ${index + 1}`}
              style={{ scale: imgScale, maxHeight: '80vh', maxWidth: '90vw', objectFit: 'contain' }}
              className="select-none rounded-lg"
              draggable={false}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* thumbnail strip */}
      <div className="shrink-0 py-3 px-4 overflow-x-auto scrollbar-none">
        <div className="flex gap-2 w-max mx-auto">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => goTo(i, i > index ? 1 : -1)}
              className={[
                'h-14 w-14 shrink-0 rounded-lg overflow-hidden border-2 transition-all',
                i === index
                  ? 'border-primary-500 opacity-100'
                  : 'border-transparent opacity-50 hover:opacity-80',
              ].join(' ')}
              aria-label={`Xem ảnh ${i + 1}`}
            >
              <img src={img} alt="" className="h-full w-full object-cover" draggable={false} />
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ─── ImageGallery ─────────────────────────────────────────────────────────────

function ImageGallery({ images, postId }) {
  const [lightboxOpen,  setLightboxOpen]  = useState(false);
  const [lightboxStart, setLightboxStart] = useState(0);
  const [mobileIndex,   setMobileIndex]   = useState(0);

  const open = (i) => { setLightboxStart(i); setLightboxOpen(true); };

  const imgs      = images?.length ? images : [PLACEHOLDER_IMG];
  const mainImg   = imgs[0];
  // Up to 6 small thumbnails on the right (2 cols × 3 rows)
  const gridSlots = [imgs[1], imgs[2], imgs[3], imgs[4], imgs[5], imgs[6]];
  const visibleCount = Math.min(imgs.length, 7);
  const remaining = Math.max(0, imgs.length - visibleCount);
  const lastVisibleIndex = visibleCount - 2; // last index inside right grid

  return (
    <>
      {/* ── Desktop mosaic ── */}
      <div className="hidden md:flex h-[540px] gap-3 rounded-2xl overflow-hidden">
        {/* main image 60% */}
        <div
          className="flex-[3] relative cursor-pointer group overflow-hidden rounded-l-2xl"
          onClick={() => open(0)}
        >
          <img
            src={mainImg}
            alt="Ảnh chính"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); open(0); }}
            className="absolute bottom-4 left-4 inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full bg-white/95 hover:bg-white text-ink-900 text-xs font-semibold shadow-lg backdrop-blur transition-all opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0"
          >
            <ImagesIcon className="h-3.5 w-3.5" />
            Xem ảnh
          </button>
        </div>

        {/* right 2×3 grid 40% — up to 6 thumbnails */}
        <div className="flex-[2] grid grid-cols-2 grid-rows-3 gap-3">
          {gridSlots.map((src, i) => {
            if (!src) return <div key={i} className="rounded-md bg-ink-100 dark:bg-ink-800" />;
            const isLast = i === lastVisibleIndex && remaining > 0;
            const rounded =
              i === 1 ? 'rounded-tr-2xl' :
              i === 5 ? 'rounded-br-2xl' : '';
            return (
              <div
                key={i}
                className={`relative overflow-hidden cursor-pointer group ${rounded}`}
                onClick={() => open(i + 1)}
              >
                <img
                  src={src}
                  alt={`Ảnh ${i + 2}`}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                {isLast && (
                  <div
                    className="absolute inset-0 flex flex-col items-center justify-center bg-black/55 gap-1 backdrop-blur-[1px]"
                    onClick={(e) => { e.stopPropagation(); open(0); }}
                  >
                    <ImagesIcon className="h-6 w-6 text-white" />
                    <span className="text-white text-sm font-semibold">+{remaining} ảnh</span>
                    <span className="text-white/70 text-[11px]">Xem tất cả</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Desktop thumbnail strip ── */}
      {imgs.length > 1 && (
        <div className="hidden md:flex mt-3 gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {imgs.map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={() => open(i)}
              className="relative shrink-0 h-20 w-28 rounded-lg overflow-hidden border-2 border-transparent hover:border-primary-500 transition-all hover:scale-[1.03]"
              aria-label={`Xem ảnh ${i + 1}`}
            >
              <img src={src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* ── Mobile carousel ── */}
      <div className="md:hidden relative h-80 rounded-2xl overflow-hidden">
        <div
          className="flex h-full overflow-x-auto snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none' }}
          onScroll={(e) => {
            const i = Math.round(e.currentTarget.scrollLeft / e.currentTarget.offsetWidth);
            setMobileIndex(i);
          }}
        >
          {imgs.map((src, i) => (
            <div key={i} className="shrink-0 w-full h-full snap-center" onClick={() => open(i)}>
              <img src={src} alt={`Ảnh ${i + 1}`} className="h-full w-full object-cover" />
            </div>
          ))}
        </div>
        {/* dots indicator */}
        {imgs.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 pointer-events-none">
            {imgs.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-200 ${
                  i === mobileIndex ? 'w-5 bg-white' : 'w-1.5 bg-white/50'
                }`}
              />
            ))}
          </div>
        )}
        {/* count + expand */}
        <button
          onClick={() => open(mobileIndex)}
          className="absolute bottom-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/50 text-white text-xs backdrop-blur-sm"
        >
          <ImagesIcon className="h-3.5 w-3.5" />
          {mobileIndex + 1}/{imgs.length}
        </button>
      </div>

      {/* ── Mobile thumbnail strip ── */}
      {imgs.length > 1 && (
        <div className="md:hidden flex mt-3 gap-2 overflow-x-auto px-1 scrollbar-thin">
          {imgs.map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={() => open(i)}
              className={`shrink-0 h-16 w-20 rounded-lg overflow-hidden border-2 transition-all ${
                i === mobileIndex ? 'border-primary-500' : 'border-transparent'
              }`}
              aria-label={`Xem ảnh ${i + 1}`}
            >
              <img src={src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox portal */}
      <AnimatePresence>
        {lightboxOpen && (
          <Lightbox
            images={imgs.filter((s) => s !== PLACEHOLDER_IMG)}
            startIndex={Math.min(lightboxStart, Math.max(0, imgs.filter((s) => s !== PLACEHOLDER_IMG).length - 1))}
            postId={postId}
            onClose={() => setLightboxOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ─── AmenityBadges ────────────────────────────────────────────────────────────

function AmenityBadges({ amenities }) {
  const ref     = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '0px 0px -80px 0px' });

  return (
    <div ref={ref} className="flex flex-wrap gap-2">
      {(amenities || []).slice(0, 6).map((key, i) => {
        const info = AMENITY_ICONS[key];
        if (!info) return null;
        const { Icon, label } = info;
        return (
          <motion.span
            key={key}
            initial={{ opacity: 0, y: 10 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: i * 0.04, ...springs.snappy }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm font-medium"
          >
            <Icon className="h-4 w-4" />
            {label}
          </motion.span>
        );
      })}
    </div>
  );
}

// ─── ExpandableText ───────────────────────────────────────────────────────────

function ExpandableText({ text }) {
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);
  const pRef = useRef(null);

  useEffect(() => {
    const el = pRef.current;
    if (el) setOverflows(el.scrollHeight > el.clientHeight + 4);
  }, [text]);

  return (
    <div>
      <p
        ref={pRef}
        className={[
          'text-ink-600 dark:text-ink-200 text-sm leading-relaxed transition-all duration-300',
          !expanded ? 'line-clamp-4' : '',
        ].join(' ')}
      >
        {text}
      </p>
      {(overflows || expanded) && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 flex items-center gap-1 text-primary-500 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium transition-colors"
        >
          {expanded ? 'Thu gọn' : 'Xem thêm'}
          <motion.span animate={{ rotate: expanded ? 180 : 0 }} transition={springs.snappy}>
            <ChevronDown className="h-4 w-4" />
          </motion.span>
        </button>
      )}
    </div>
  );
}

// ─── ContactCard ──────────────────────────────────────────────────────────────

function ContactCard({ post, sentinelRef, onReport }) {
  const { isAuthenticated } = useAuth();
  const navigate  = useNavigate();
  const toast     = useToast();

  const [isSticky,      setIsSticky]      = useState(false);
  const [favorited,     setFavorited]     = useState(post.isFavorited ?? false);
  const [burst,         setBurst]         = useState(0);
  const [favPending,    setFavPending]    = useState(false);
  const [phoneVisible,  setPhoneVisible]  = useState(false);
  const [chatPending,   setChatPending]   = useState(false);

  useEffect(() => {
    const el = sentinelRef?.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setIsSticky(!entry.isIntersecting),
      { threshold: 0 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [sentinelRef]);

  const handleFavorite = async () => {
    if (!isAuthenticated) {
      toast.info('Vui lòng đăng nhập để lưu phòng yêu thích.');
      navigate('/login');
      return;
    }
    if (favPending) return;
    const next = !favorited;
    setFavorited(next);
    setBurst((b) => b + 1);
    setFavPending(true);
    try {
      if (next) await favoriteApi.add(post.id);
      else       await favoriteApi.remove(post.id);
    } catch {
      setFavorited(!next);
      toast.error('Không thể cập nhật, vui lòng thử lại.');
    } finally {
      setFavPending(false);
    }
  };

  const handleChat = async () => {
    if (!isAuthenticated) {
      toast.info('Vui lòng đăng nhập để nhắn tin.');
      navigate('/login');
      return;
    }
    if (!post.ownerId) {
      toast.info('Không thể liên hệ chủ nhà lúc này.');
      return;
    }
    if (chatPending) return;
    setChatPending(true);
    try {
      const conv = await chatApi.createConversation({ partnerId: post.ownerId });
      const isNew = !conv.lastMessagePreview;
      navigate(`/chat/${conv.id}`, { state: { ephemeralConvId: isNew ? conv.id : null } });
    } catch (err) {
      toast.error(err.displayMessage || 'Không thể tạo cuộc trò chuyện, vui lòng thử lại.');
    } finally {
      setChatPending(false);
    }
  };

  const phone      = post.ownerPhone;
  const maskedPhone = phone ? phone.slice(0, 3) + ' **** ' + phone.slice(-3) : '— — —';

  return (
    <div className="sticky top-6 w-full lg:w-80 shrink-0">
      <motion.div
        animate={{
          scale:     isSticky ? 1.01 : 1,
          boxShadow: isSticky
            ? '0 24px 60px rgba(15,23,42,0.2)'
            : '0 4px 14px rgba(15,23,42,0.06)',
        }}
        transition={springs.smooth}
        className="bg-white dark:bg-ink-800 rounded-2xl border border-ink-100 dark:border-ink-700 p-6 space-y-5"
      >
        {/* price */}
        <div>
          <span className="text-2xl font-bold text-primary-500 font-display leading-none break-all">
            {formatPrice(post.price)}
          </span>
        </div>

        {/* owner */}
        <div className="flex items-center gap-3 py-4 border-y border-ink-100 dark:border-ink-700">
          <Avatar src={post.ownerAvatar} name={post.ownerName} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-ink-900 dark:text-ink-50 truncate">
              {post.ownerName ?? 'Chủ nhà'}
            </p>
          </div>
        </div>

        {/* actions */}
        <div className="space-y-3">
          <Button fullWidth loading={chatPending} onClick={handleChat} icon={MessageCircle}>
            Nhắn tin ngay
          </Button>

          {/* phone reveal */}
          <div className="relative">
            <Button
              fullWidth
              variant="outlined"
              icon={Phone}
              onClick={() => {
                if (!isAuthenticated) {
                  toast.info('Vui lòng đăng nhập để xem số điện thoại.');
                  navigate('/login');
                  return;
                }
                setPhoneVisible((v) => !v);
              }}
            >
              {phoneVisible && phone ? phone : maskedPhone}
            </Button>

            <AnimatePresence>
              {phoneVisible && phone && (
                <motion.a
                  href={`tel:${phone}`}
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  transition={springs.snappy}
                  className="absolute left-0 right-0 top-full mt-2 py-2.5 px-4 rounded-xl bg-white dark:bg-ink-800 border border-primary-200 dark:border-primary-800 shadow-elevated text-center text-primary-600 dark:text-primary-300 text-sm font-semibold hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors z-10"
                  onClick={() => setPhoneVisible(false)}
                >
                  Gọi {phone}
                </motion.a>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* secondary row */}
        <div className="flex items-center justify-between pt-1">
          <motion.button
            type="button"
            onClick={handleFavorite}
            animate={{ scale: burst ? [1, 1.4, 1] : 1 }}
            transition={burst ? { ...springs.bouncy, duration: 0.5 } : { duration: 0.15 }}
            className="relative flex items-center gap-1.5 text-sm text-ink-600 dark:text-ink-200 hover:text-primary-500 transition-colors"
            aria-label={favorited ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}
            style={{ willChange: 'transform' }}
          >
            <Heart
              className={`h-5 w-5 transition-colors ${
                favorited ? 'fill-primary-500 text-primary-500' : ''
              }`}
            />
            {favorited ? 'Đã lưu' : 'Lưu tin'}
            <HeartBurst trigger={burst} />
          </motion.button>

          <button
            type="button"
            onClick={onReport}
            className="flex items-center gap-1.5 text-sm text-ink-400 hover:text-error transition-colors"
          >
            <Flag className="h-4 w-4" />
            Báo cáo
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── RatingBars ───────────────────────────────────────────────────────────────

function RatingBars({ reviews }) {
  const ref     = useRef(null);
  const isInView = useInView(ref, { once: true });

  const total = reviews.length;
  const avg   = total
    ? reviews.reduce((s, r) => s + (r.rating || 0), 0) / total
    : 0;
  const breakdown = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  return (
    <div ref={ref} className="flex flex-col sm:flex-row gap-8 p-5 bg-ink-50 dark:bg-ink-800/60 rounded-2xl border border-ink-100 dark:border-ink-700">
      {/* average score */}
      <div className="flex flex-col items-center justify-center gap-1.5 shrink-0 sm:w-28">
        <span className="text-5xl font-bold text-ink-900 dark:text-ink-50 leading-none">
          {avg.toFixed(1)}
        </span>
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star
              key={s}
              className={`h-4 w-4 ${
                s <= Math.round(avg)
                  ? 'fill-accent-500 text-accent-500'
                  : 'fill-transparent text-ink-200 dark:text-ink-700'
              }`}
              strokeWidth={1.5}
            />
          ))}
        </div>
        <span className="text-xs text-ink-400">{total} đánh giá</span>
      </div>

      {/* bar chart */}
      <div className="flex-1 space-y-2.5">
        {breakdown.map(({ star, count }, i) => {
          const pct = total ? (count / total) * 100 : 0;
          return (
            <div key={star} className="flex items-center gap-2 text-xs">
              <span className="w-3 text-right text-ink-600 dark:text-ink-200 tabular-nums">
                {star}
              </span>
              <Star className="h-3 w-3 fill-accent-500 text-accent-500 shrink-0" />
              <div className="flex-1 h-2 bg-ink-200 dark:bg-ink-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-accent-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={isInView ? { width: `${pct}%` } : {}}
                  transition={{ duration: 0.8, delay: i * 0.08, ease: easings.outExpo }}
                />
              </div>
              <span className="w-5 text-right text-ink-400 tabular-nums">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── ReviewCard ───────────────────────────────────────────────────────────────

function ReviewCard({ review }) {
  const ref     = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '0px 0px -60px 0px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={springs.smooth}
      className="bg-white dark:bg-ink-800 rounded-2xl border border-ink-100 dark:border-ink-700 p-5"
    >
      <div className="flex items-start gap-3">
        <Avatar src={review.reviewer_avatar} name={review.reviewer_name} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="font-semibold text-ink-900 dark:text-ink-50 text-sm">
              {review.reviewer_name ?? 'Ẩn danh'}
            </span>
            <span className="text-xs text-ink-400">
              {review.created_at
                ? new Date(review.created_at).toLocaleDateString('vi-VN')
                : ''}
            </span>
          </div>
          <div className="flex gap-0.5 mt-1.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <motion.span
                key={s}
                initial={{ scale: 0 }}
                animate={isInView ? { scale: 1 } : {}}
                transition={{ delay: s * 0.05, ...springs.bouncy }}
              >
                <Star
                  className={`h-3.5 w-3.5 ${
                    s <= (review.rating || 0)
                      ? 'fill-accent-500 text-accent-500'
                      : 'fill-transparent text-ink-200 dark:text-ink-700'
                  }`}
                  strokeWidth={1.5}
                />
              </motion.span>
            ))}
          </div>
        </div>
      </div>
      {review.comment && (
        <p className="mt-3 text-sm text-ink-600 dark:text-ink-200 leading-relaxed">
          {review.comment}
        </p>
      )}
    </motion.div>
  );
}

// ─── WriteReviewModal ─────────────────────────────────────────────────────────

function WriteReviewModal({ roomId, onClose, onSuccess }) {
  const toast   = useToast();
  const [rating,  setRating]  = useState(0);
  const [comment, setComment] = useState('');
  const [pending, setPending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating) { toast.warning('Vui lòng chọn số sao.'); return; }
    setPending(true);
    try {
      await reviewApi.createRoomReview({ roomId, rating, comment: comment.trim() });
      toast.success('Đánh giá của bạn đã được gửi!');
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.displayMessage || 'Không thể gửi đánh giá, vui lòng thử lại.');
    } finally {
      setPending(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title="Viết đánh giá" size="sm">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="flex flex-col items-center gap-2 py-2">
          <p className="text-sm text-ink-600 dark:text-ink-200">Chất lượng phòng</p>
          <StarRating value={rating} onChange={setRating} size="lg" />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink-900 dark:text-ink-50 mb-1.5">
            Nhận xét
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            maxLength={1000}
            placeholder="Chia sẻ trải nghiệm của bạn về phòng này..."
            className="w-full px-3 py-2.5 rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 text-ink-900 dark:text-ink-50 placeholder-ink-400 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500/40 transition"
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} type="button">Hủy</Button>
          <Button type="submit" loading={pending}>Gửi đánh giá</Button>
        </div>
      </form>
    </Modal>
  );
}

// ─── ReportModal ──────────────────────────────────────────────────────────────

function ReportModal({ postId, onClose }) {
  const toast   = useToast();
  const [reason, setReason] = useState('');
  const [detail, setDetail] = useState('');
  const [pending, setPending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason)                                    { toast.warning('Vui lòng chọn lý do.'); return; }
    if (reason === 'OTHER' && !detail.trim())       { toast.warning('Vui lòng nhập lý do cụ thể.'); return; }
    setPending(true);
    try {
      await reportApi.create({ postId, reason, detail: detail.trim() || undefined });
      toast.success('Báo cáo của bạn đã được gửi, cảm ơn!');
      onClose();
    } catch (err) {
      toast.error(err.displayMessage || 'Không thể gửi báo cáo, vui lòng thử lại.');
    } finally {
      setPending(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title="Báo cáo tin đăng" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          {REPORT_REASONS.map(({ value, label }) => (
            <label
              key={value}
              className={[
                'flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors',
                reason === value
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                  : 'border-ink-200 dark:border-ink-700 hover:border-ink-300 dark:hover:border-ink-600',
              ].join(' ')}
            >
              <input
                type="radio"
                name="report-reason"
                value={value}
                checked={reason === value}
                onChange={() => setReason(value)}
                className="accent-primary-500"
              />
              <span className="text-sm text-ink-900 dark:text-ink-50">{label}</span>
            </label>
          ))}
        </div>

        <AnimatePresence>
          {reason === 'OTHER' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <textarea
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="Mô tả chi tiết vấn đề..."
                className="w-full px-3 py-2.5 rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 text-ink-900 dark:text-ink-50 placeholder-ink-400 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500/40 transition"
              />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" onClick={onClose} type="button">Hủy</Button>
          <Button type="submit" variant="danger" loading={pending} icon={Flag}>
            Gửi báo cáo
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ─── SimilarListings ──────────────────────────────────────────────────────────

function SimilarListings({ city, district, excludeId }) {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    if (!city) return;
    postApi
      .search({ city, district, size: 5 })
      .then((res) => {
        const items = (res?.items ?? [])
          .filter((p) => p.id !== excludeId)
          .slice(0, 4);
        setPosts(items);
      })
      .catch(() => {});
  }, [city, district, excludeId]);

  if (!posts.length) return null;

  return (
    <section className="mt-12">
      <h2 className="text-xl font-bold text-ink-900 dark:text-ink-50 mb-5">
        Tin đăng tương tự
      </h2>
      <div
        className="flex gap-4 overflow-x-auto pb-3 -mx-4 px-4 md:mx-0 md:px-0 snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none' }}
      >
        {posts.map((p) => (
          <div key={p.id} className="shrink-0 w-64 snap-start">
            <RoomCard post={p} viewMode="grid" />
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── PageSkeleton ─────────────────────────────────────────────────────────────

const SHIMMER =
  'relative overflow-hidden bg-ink-100 dark:bg-ink-800 rounded-xl ' +
  'before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent ' +
  'before:via-white/60 dark:before:via-white/10 before:to-transparent ' +
  'before:bg-[length:200%_100%] before:animate-shimmer';

function PageSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-pulse">
      <div className={`h-[480px] w-full rounded-2xl ${SHIMMER}`} />
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 space-y-4">
          <div className={`h-8 w-3/4 ${SHIMMER}`} />
          <div className={`h-5 w-1/2 ${SHIMMER}`} />
          <div className={`h-10 w-1/3 ${SHIMMER}`} />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className={`h-16 ${SHIMMER}`} />
            ))}
          </div>
          <div className={`h-24 w-full ${SHIMMER}`} />
        </div>
        <div className={`w-full lg:w-80 h-72 shrink-0 rounded-2xl ${SHIMMER}`} />
      </div>
    </div>
  );
}

// ─── PostDetailPage ───────────────────────────────────────────────────────────

export default function PostDetailPage() {
  const { postId }  = useParams();
  const navigate    = useNavigate();
  const toast       = useToast();
  const { role }    = useAuth();

  const [post,    setPost]    = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reportOpen,      setReportOpen]      = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);

  const sentinelRef = useRef(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    postApi
      .getById(postId)
      .then((p) => {
        if (!active) return;
        setPost(p);
        const roomId = p?.roomId;
        if (roomId) {
          // Load reviews independently — don't let review errors kill the page
          reviewApi.getByRoom(roomId)
            .then((rv) => { if (active) setReviews(rv?.items ?? []); })
            .catch(() => {});
        }
      })
      .catch((err) => {
        if (!active) return;
        toast.error(err.displayMessage || 'Không thể tải tin đăng.');
        navigate('/posts', { replace: true });
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  const refreshReviews = useCallback(() => {
    if (!post) return;
    const roomId = post.roomId;
    if (roomId) reviewApi.getByRoom(roomId).then((rv) => setReviews(rv?.items ?? [])).catch(() => {});
  }, [post]);

  if (loading) return <PageSkeleton />;
  if (!post)   return null;

  const images = (post.imageUrls ?? []).filter(Boolean);

  const roomId = post.roomId;

  // Derive amenity keys from backend boolean flags
  const amenities = [
    post.hasAc        && 'ac',
    post.hasFridge    && 'fridge',
    post.hasPrivateWc && 'wc',
    post.hasSecurity  && 'security',
  ].filter(Boolean);

  const fmt = (n) => n != null
    ? new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(n) + 'đ'
    : '—';

  const infoGrid = [
    { Icon: Home,  label: 'Loại phòng',   value: ROOM_TYPES[post.roomType] ?? post.roomType ?? '—' },
    { Icon: Ruler, label: 'Diện tích',     value: post.areaMq ? `${post.areaMq} m²` : '—' },
    { Icon: Tag,   label: 'Tiền đặt cọc', value: fmt(post.deposit) },
    { Icon: Users, label: 'Số người ở',   value: '—' },
  ];

  const servicePricing = [
    { Icon: Wifi,     label: 'Phí Wifi',            value: post.wifiFee != null ? fmt(post.wifiFee) + '/tháng' : null },
    { Icon: Zap,      label: 'Giá điện',            value: post.electricityPricePerUnit != null ? fmt(post.electricityPricePerUnit) + '/số' : null },
    { Icon: Droplets, label: 'Giá nước',            value: post.waterPricePerUnit != null ? fmt(post.waterPricePerUnit) + '/m³' : null },
    { Icon: Wrench,   label: 'Phí dịch vụ',        value: post.serviceFee != null ? fmt(post.serviceFee) + '/tháng' : null },
    { Icon: Bike,     label: 'Phí gửi xe máy',     value: post.bikeParkingFee != null ? fmt(post.bikeParkingFee) + '/tháng' : null },
  ].filter((item) => item.value !== null);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen"
    >
      {/* ── full-width gallery ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <ImageGallery images={images} postId={postId} />
      </div>

      {/* sticky sentinel — sits right below gallery */}
      <div ref={sentinelRef} className="h-px" aria-hidden="true" />

      {/* ── two-column body ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8 items-start">

          {/* ────── left: details ────── */}
          <div className="flex-1 min-w-0 space-y-8">

            {/* title + address + price */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-ink-900 dark:text-ink-50 leading-snug">
                {post.title}
              </h1>
              <p className="mt-2 flex items-center gap-1.5 text-sm text-ink-600 dark:text-ink-200">
                <MapPin className="h-4 w-4 text-primary-500 shrink-0" />
                {[post.address, post.district, post.city].filter(Boolean).join(', ')}
              </p>
              <div className="mt-3 flex items-baseline gap-3">
                <span className="text-3xl font-bold text-primary-500 font-display">
                  {formatPrice(post.price)}
                </span>
                {reviews.length > 0 && (
                  <span className="inline-flex items-center gap-1 text-sm text-ink-600 dark:text-ink-200">
                    <Star className="h-4 w-4 fill-accent-500 text-accent-500" />
                    <span className="font-semibold text-ink-900 dark:text-ink-50">
                      {(reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1)}
                    </span>
                    <span className="text-ink-400">({reviews.length})</span>
                  </span>
                )}
              </div>
            </div>

            {/* 4-cell info grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {infoGrid.map(({ Icon, label, value }) => (
                <div
                  key={label}
                  className="flex flex-col gap-1 p-3 rounded-xl bg-ink-50 dark:bg-ink-800/60 border border-ink-100 dark:border-ink-700"
                >
                  <div className="flex items-center gap-1.5 text-ink-400">
                    <Icon className="h-3.5 w-3.5" />
                    <span className="text-[11px] font-medium">{label}</span>
                  </div>
                  <span className="font-semibold text-ink-900 dark:text-ink-50 text-sm">{value}</span>
                </div>
              ))}
            </div>

            {/* amenity badges */}
            {amenities.length > 0 && (
              <div>
                <h2 className="text-base font-semibold text-ink-900 dark:text-ink-50 mb-3">
                  Tiện ích
                </h2>
                <AmenityBadges amenities={amenities} />
              </div>
            )}

            {/* service pricing */}
            {servicePricing.length > 0 && (
              <div>
                <h2 className="text-base font-semibold text-ink-900 dark:text-ink-50 mb-3">
                  Chi phí dịch vụ
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {servicePricing.map(({ Icon, label, value }) => (
                    <div
                      key={label}
                      className="flex flex-col gap-1 p-3 rounded-xl bg-ink-50 dark:bg-ink-800/60 border border-ink-100 dark:border-ink-700"
                    >
                      <div className="flex items-center gap-1.5 text-ink-400">
                        <Icon className="h-3.5 w-3.5" />
                        <span className="text-[11px] font-medium">{label}</span>
                      </div>
                      <span className="font-semibold text-ink-900 dark:text-ink-50 text-sm">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* description */}
            {post.description && (
              <div>
                <h2 className="text-base font-semibold text-ink-900 dark:text-ink-50 mb-2">
                  Mô tả
                </h2>
                <ExpandableText text={post.description} />
              </div>
            )}

            {/* reviews */}
            <section>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-bold text-ink-900 dark:text-ink-50">
                  Đánh giá
                  {reviews.length > 0 && (
                    <span className="ml-2 text-base font-normal text-ink-400">
                      ({reviews.length})
                    </span>
                  )}
                </h2>
                {role === 'RENTER' && (
                  <Button
                    size="sm"
                    variant="outlined"
                    icon={Star}
                    onClick={() => setReviewModalOpen(true)}
                  >
                    Viết đánh giá
                  </Button>
                )}
              </div>

              {reviews.length > 0 ? (
                <>
                  <RatingBars reviews={reviews} />
                  <div className="mt-6 space-y-4">
                    {reviews.map((rv) => (
                      <ReviewCard key={rv.id} review={rv} />
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-sm text-ink-400 py-6 text-center">
                  Chưa có đánh giá nào cho phòng này.
                </p>
              )}
            </section>
          </div>

          {/* ────── right: sticky contact card ────── */}
          <ContactCard
            post={post}
            sentinelRef={sentinelRef}
            onReport={() => setReportOpen(true)}
          />
        </div>

        {/* similar listings */}
        <SimilarListings city={post.city} district={post.district} excludeId={post.id} />
      </div>

      {/* ── modals ── */}
      {reportOpen && (
        <ReportModal postId={post.id} onClose={() => setReportOpen(false)} />
      )}
      {reviewModalOpen && roomId && (
        <WriteReviewModal
          roomId={roomId}
          onClose={() => setReviewModalOpen(false)}
          onSuccess={refreshReviews}
        />
      )}
    </motion.div>
  );
}
