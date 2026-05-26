import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  motion,
  AnimatePresence,
  useInView,
  useScroll,
  useTransform,
  useReducedMotion,
} from 'framer-motion';
import {
  ArrowRight,
  Search,
  MessageCircle,
  Home as HomeIcon,
  Key,
  Quote,
  GraduationCap,
} from 'lucide-react';

import { useAuth } from '../contexts/AuthContext';
import RoomCard from '../components/RoomCard';
import Skeleton from '../components/ui/Skeleton';
import StarRating from '../components/ui/StarRating';
import { postApi, publicApi } from '../lib/api';
import {
  fadeUp,
  slideRight,
  slideLeft,
  staggerContainer,
  scaleIn,
  springs,
  easings,
} from '../lib/animations';

// ═══════════════════════════════════════════════════════════
// Custom hooks
// ═══════════════════════════════════════════════════════════

function useCountUp(target, { duration = 1500, start = false } = {}) {
  const [value, setValue] = useState(0);
  const startedRef = useRef(false);
  const rafRef = useRef(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!start || startedRef.current) return undefined;
    startedRef.current = true;
    if (reduceMotion) {
      setValue(target);
      return undefined;
    }
    const begin = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - begin) / duration);
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t); // easeOutExpo
      setValue(Math.round(target * eased));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => rafRef.current && cancelAnimationFrame(rafRef.current);
  }, [start, target, duration, reduceMotion]);

  return value;
}

function useMagneticButton(maxOffset = 6) {
  const ref = useRef(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const reduceMotion = useReducedMotion();

  const onMouseMove = useCallback(
    (e) => {
      if (reduceMotion || !ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const dx = e.clientX - (rect.left + rect.width / 2);
      const dy = e.clientY - (rect.top + rect.height / 2);
      setOffset({
        x: Math.max(-maxOffset, Math.min(maxOffset, dx / 6)),
        y: Math.max(-maxOffset, Math.min(maxOffset, dy / 6)),
      });
    },
    [maxOffset, reduceMotion]
  );

  const onMouseLeave = useCallback(() => setOffset({ x: 0, y: 0 }), []);

  return { ref, offset, handlers: { onMouseMove, onMouseLeave } };
}

// ═══════════════════════════════════════════════════════════
// SECTION 1 — Hero
// ═══════════════════════════════════════════════════════════

function SpotlightCursor() {
  const ref = useRef(null);
  const targetRef = useRef({ x: 0, y: 0 });
  const currentRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) return undefined;
    targetRef.current = { x: window.innerWidth / 2, y: window.innerHeight / 3 };
    currentRef.current = { ...targetRef.current };

    const onMove = (e) => {
      targetRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', onMove);

    const tick = () => {
      const t = targetRef.current;
      const c = currentRef.current;
      c.x += (t.x - c.x) * 0.08; // lerp factor 0.08
      c.y += (t.y - c.y) * 0.08;
      if (ref.current) {
        ref.current.style.background = `radial-gradient(circle 400px at ${c.x}px ${c.y}px, rgba(20,145,155,0.15), transparent 70%)`;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('mousemove', onMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [reduceMotion]);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 hidden md:block"
    />
  );
}

function MeshBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-[#063D3D]" />
      <motion.div
        className="absolute -top-24 -left-24 h-[540px] w-[540px] rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(20,145,155,0.55), transparent 70%)', willChange: 'transform' }}
        animate={{ x: [0, 90, -40, 0], y: [0, 70, 30, 0] }}
        transition={{ duration: 28, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute top-1/3 -right-32 h-[620px] w-[620px] rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(102,197,197,0.45), transparent 70%)', willChange: 'transform' }}
        animate={{ x: [0, -60, 40, 0], y: [0, -90, 20, 0] }}
        transition={{ duration: 30, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -bottom-32 left-1/4 h-[500px] w-[500px] rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(240,165,0,0.35), transparent 70%)', willChange: 'transform' }}
        animate={{ x: [0, 60, -50, 0], y: [0, -40, 20, 0] }}
        transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute top-14 right-1/3 h-[280px] w-[280px] rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(247,201,95,0.28), transparent 70%)', willChange: 'transform' }}
        animate={{ x: [0, -30, 30, 0], y: [0, 40, -20, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}

const FLOATING_SHAPES = [
  { size: 280, x: '6%', y: '15%', rx: '40%', tint: 'rgba(255,255,255,0.05)', dur: 32, dx: 30, dy: -40, deg: 35 },
  { size: 140, x: '76%', y: '22%', rx: '50%', tint: 'rgba(20,145,155,0.18)', dur: 24, dx: -28, dy: 26, deg: -45 },
  { size: 220, x: '58%', y: '70%', rx: '32%', tint: 'rgba(255,255,255,0.06)', dur: 36, dx: 40, dy: -22, deg: 25 },
  { size: 90, x: '20%', y: '72%', rx: '46%', tint: 'rgba(247,201,95,0.18)', dur: 22, dx: 18, dy: -30, deg: 60 },
  { size: 180, x: '42%', y: '36%', rx: '42%', tint: 'rgba(255,255,255,0.03)', dur: 28, dx: -22, dy: 30, deg: -30 },
  { size: 110, x: '88%', y: '58%', rx: '48%', tint: 'rgba(102,197,197,0.22)', dur: 30, dx: -36, dy: -20, deg: 50 },
];

function FloatingShapes() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {FLOATING_SHAPES.map((s, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{
            left: s.x,
            top: s.y,
            width: s.size,
            height: s.size,
            borderRadius: s.rx,
            background: s.tint,
            willChange: 'transform',
          }}
          animate={{
            x: [0, s.dx, 0],
            y: [0, s.dy, 0],
            rotate: [0, s.deg, 0],
          }}
          transition={{ duration: s.dur, repeat: Infinity, ease: 'linear' }}
        />
      ))}
    </div>
  );
}

function MagneticPrimaryCTA() {
  const { ref, offset, handlers } = useMagneticButton(6);
  const navigate = useNavigate();
  return (
    <motion.button
      ref={ref}
      {...handlers}
      onClick={() => navigate('/posts')}
      animate={{ x: offset.x, y: offset.y }}
      transition={springs.smooth}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      className="group inline-flex items-center justify-center gap-2 h-14 px-8 rounded-2xl bg-primary-500 hover:bg-primary-700 text-white text-base font-semibold shadow-elevated transition-colors"
      style={{ willChange: 'transform' }}
    >
      Tìm phòng ngay
      <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
    </motion.button>
  );
}

function OutlinedSecondaryCTA() {
  const { role } = useAuth();
  const navigate = useNavigate();

  if (role === 'RENTER') return null;

  const handleClick = () => {
    if (role === 'OWNER') {
      navigate('/owner/posts');
    } else if (role === 'ADMIN') {
      navigate('/admin');
    } else {
      navigate('/register');
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      transition={springs.snappy}
    >
      <button
        onClick={handleClick}
        className="inline-flex h-14 items-center justify-center px-8 rounded-2xl border-2 border-white/80 text-white text-base font-semibold hover:bg-white hover:text-primary-700 transition-colors"
      >
        Đăng phòng cho thuê
      </button>
    </motion.div>
  );
}

function HeroSearch() {
  const navigate = useNavigate();
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [min, setMin] = useState('');
  const [max, setMax] = useState('');
  const [roomType, setRoomType] = useState('');

  const submit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (city) params.set('city', city);
    if (district) params.set('district', district);
    if (min) params.set('minPrice', min);
    if (max) params.set('maxPrice', max);
    if (roomType) params.set('type', roomType);
    navigate(`/posts${params.toString() ? `?${params.toString()}` : ''}`);
  };

  const fieldClass =
    'h-11 rounded-xl bg-ink-50 dark:bg-ink-800 border border-transparent focus:border-primary-500 px-3 text-sm text-ink-900 dark:text-ink-50 placeholder-ink-400 outline-none transition-colors w-full';

  return (
    <motion.form
      onSubmit={submit}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springs.smooth, delay: 0.75 }}
      className="relative z-20 mx-auto w-full max-w-5xl rounded-2xl bg-white dark:bg-ink-900 border border-ink-100 dark:border-ink-700 shadow-elevated p-4 md:p-5"
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
        <input
          className={`${fieldClass} md:col-span-3`}
          placeholder="Thành phố (vd: Hà Nội)"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          aria-label="Thành phố"
        />
        <input
          className={`${fieldClass} md:col-span-3`}
          placeholder="Quận / huyện"
          value={district}
          onChange={(e) => setDistrict(e.target.value)}
          aria-label="Quận huyện"
        />
        <div className="md:col-span-3 grid grid-cols-2 gap-2">
          <input
            className={fieldClass}
            placeholder="Giá từ"
            type="number"
            min="0"
            value={min}
            onChange={(e) => setMin(e.target.value)}
            aria-label="Giá tối thiểu"
          />
          <input
            className={fieldClass}
            placeholder="Giá đến"
            type="number"
            min="0"
            value={max}
            onChange={(e) => setMax(e.target.value)}
            aria-label="Giá tối đa"
          />
        </div>
        <select
          className={`${fieldClass} md:col-span-2`}
          value={roomType}
          onChange={(e) => setRoomType(e.target.value)}
          aria-label="Loại phòng"
        >
          <option value="">Loại phòng</option>
          <option value="SINGLE">Phòng đơn</option>
          <option value="SHARED">Phòng ghép</option>
          <option value="STUDIO">Studio</option>
          <option value="APARTMENT">Căn hộ</option>
        </select>
        <button
          type="submit"
          className="md:col-span-1 inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-primary-500 hover:bg-primary-700 text-white font-medium transition-colors"
        >
          <Search className="h-4 w-4" />
          <span className="md:hidden">Tìm</span>
        </button>
      </div>
    </motion.form>
  );
}

function HeroSection() {
  return (
    <section className="relative min-h-screen flex flex-col text-white overflow-hidden">
      <MeshBackground />
      <FloatingShapes />
      <SpotlightCursor />

      <div className="relative z-10 flex-1 flex items-center">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-20 lg:py-24 text-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1, ease: easings.outExpo }}
            className="inline-flex items-center gap-2 rounded-full border border-primary-300/50 bg-primary-500/15 backdrop-blur px-4 py-1.5 text-xs font-medium text-primary-100"
          >
            <GraduationCap className="h-4 w-4" />
            Dành cho sinh viên
          </motion.div>

          <h1 className="mt-6 font-display text-[42px] leading-[1.05] md:text-6xl lg:text-7xl font-extrabold tracking-tight">
            <motion.span
              variants={slideRight}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.6, delay: 0.2, ease: easings.outExpo }}
              className="block text-white/95 font-medium"
            >
              Tìm tổ ấm cho
            </motion.span>
            <motion.span
              variants={slideRight}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.6, delay: 0.35, ease: easings.outExpo }}
              className="block bg-gradient-to-r from-primary-300 to-accent-500 bg-clip-text text-transparent pb-2"
            >
              hành trình sinh viên
            </motion.span>
          </h1>

          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.5, delay: 0.45, ease: easings.outExpo }}
            className="mx-auto mt-6 max-w-2xl text-base md:text-lg text-primary-100/85 leading-relaxed"
          >
            Kết nối sinh viên với chủ trọ uy tín. Tìm phòng, chat trực tiếp,
            và quản lý thuê trọ — tất cả trong một nơi.
          </motion.p>

          <div className="mt-9 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.5, delay: 0.55, ease: easings.outExpo }}
            >
              <MagneticPrimaryCTA />
            </motion.div>
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.5, delay: 0.65, ease: easings.outExpo }}
            >
              <OutlinedSecondaryCTA />
            </motion.div>
          </div>
        </div>
      </div>

      {/* Search bar overlapping into next section */}
      <div className="relative z-10 px-4 sm:px-6 lg:px-8" style={{ marginBottom: '-50px' }}>
        <HeroSearch />
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════
// SECTION 2 — Stats
// ═══════════════════════════════════════════════════════════

function StatItem({ value, suffix = '', label, start, delay }) {
  const count = useCountUp(value ?? 0, { duration: 1500, start: start && value != null });
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={start ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
      transition={{ ...springs.smooth, delay }}
      className="flex-1 text-center px-2"
    >
      <p className="font-display text-3xl md:text-5xl font-extrabold text-primary-500 tabular-nums">
        {value == null ? '···' : count}
        <span>{suffix}</span>
      </p>
      <p className="mt-1 text-xs md:text-sm uppercase tracking-wider text-ink-400 font-medium">
        {label}
      </p>
    </motion.div>
  );
}

function StatsSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const [stats, setStats] = useState(null);

  useEffect(() => {
    publicApi.getStatistics().then(setStats).catch(() => {});
  }, []);

  const items = [
    { label: 'Phòng trọ',  value: stats?.totalRooms,    suffix: '+' },
    { label: 'Sinh viên',  value: stats?.totalRenters,   suffix: '+' },
    { label: 'Chủ trọ',   value: stats?.totalOwners,    suffix: '+' },
    { label: 'Bài đăng',  value: stats?.totalActivePosts, suffix: '+' },
  ];

  return (
    <section className="relative bg-white dark:bg-ink-900 pt-24 pb-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div
          ref={ref}
          className="rounded-3xl bg-white dark:bg-ink-800 border border-ink-100 dark:border-ink-700 shadow-soft py-8 md:py-10 px-4 md:px-8 flex items-stretch divide-x divide-ink-100 dark:divide-ink-700"
        >
          {items.map((s, i) => (
            <StatItem key={s.label} value={s.value} suffix={s.suffix} label={s.label} start={inView} delay={i * 0.2} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════
// SECTION 3 — Featured listings
// ═══════════════════════════════════════════════════════════

// Scroll-reveal wrapper around the shared RoomCard
function RevealCard({ listing, index }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 30, scale: 0.95 }}
      transition={{ ...springs.smooth, delay: (index % 3) * 0.08 }}
      style={{ willChange: 'transform' }}
      className="h-full"
    >
      <RoomCard post={listing} />
    </motion.div>
  );
}

function FeaturedListings() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    postApi
      .search({ size: 8 })
      .then((res) => {
        if (cancelled) return;
        const raw = res?.items ?? [];
        setItems(Array.isArray(raw) ? raw.slice(0, 8) : []);
      })
      .catch(() => {
        if (cancelled) return;
        setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="bg-base py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary-500">
              Phòng nổi bật
            </p>
            <h2 className="mt-1 font-display text-3xl md:text-4xl font-extrabold text-ink-900 dark:text-ink-50">
              Lựa chọn dành cho bạn
            </h2>
          </div>
          <Link
            to="/posts"
            className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-primary-500 hover:text-primary-700"
          >
            Xem tất cả
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} variant="card" />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-ink-400 text-sm">Không thể tải danh sách phòng. Vui lòng thử lại sau.</p>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-ink-400 text-sm">Chưa có phòng nào được đăng.</p>
          </div>
        ) : (
          <>
            {/* mobile horizontal scroll carousel */}
            <div className="md:hidden -mx-4 px-4 pb-4 overflow-x-auto">
              <div className="flex gap-4 snap-x snap-mandatory">
                {items.map((listing, i) => (
                  <div key={listing.id || i} className="snap-start shrink-0 w-[80%]">
                    <RevealCard listing={listing} index={i} />
                  </div>
                ))}
              </div>
            </div>
            {/* desktop 3-column grid */}
            <div className="hidden md:grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {items.map((listing, i) => (
                <RevealCard key={listing.id || i} listing={listing} index={i} />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════
// SECTION 4 — How it works
// ═══════════════════════════════════════════════════════════

const STEPS = [
  { n: 1, title: 'Tìm kiếm', desc: 'Lọc theo khu vực, giá, tiện nghi.', Icon: Search },
  { n: 2, title: 'Liên hệ', desc: 'Chat trực tiếp với chủ trọ.', Icon: MessageCircle },
  { n: 3, title: 'Chuyển đến', desc: 'Ký hợp đồng và chuyển vào ở.', Icon: HomeIcon },
];

function DashedArrow({ inView }) {
  return (
    <svg viewBox="0 0 200 24" className="hidden lg:block w-full h-6 text-primary-300" aria-hidden="true">
      <motion.path
        d="M0,12 C50,2 150,22 200,12"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray="6 6"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: inView ? 1 : 0 }}
        transition={{ duration: 1.2, ease: easings.outExpo }}
      />
      <motion.path
        d="M192,6 L200,12 L192,18"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ opacity: 0 }}
        animate={{ opacity: inView ? 1 : 0 }}
        transition={{ delay: 1, duration: 0.3 }}
      />
    </svg>
  );
}

function HowItWorks() {
  const sectionRef = useRef(null);
  const inView = useInView(sectionRef, { once: true, amount: 0.3 });
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });
  const parallaxY = useTransform(scrollYProgress, [0, 1], [0, -80]);

  return (
    <section ref={sectionRef} className="relative bg-white dark:bg-ink-900 py-24 overflow-hidden">
      <motion.div
        aria-hidden="true"
        style={{ y: parallaxY, willChange: 'transform' }}
        className="absolute inset-0 opacity-[0.04] dark:opacity-[0.06]"
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(circle, #14919B 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
      </motion.div>

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary-500">
            Quy trình đơn giản
          </p>
          <h2 className="mt-1 font-display text-3xl md:text-4xl font-extrabold text-ink-900 dark:text-ink-50">
            Chỉ 3 bước để tìm được tổ ấm
          </h2>
        </div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr_auto_1fr] gap-y-10 lg:gap-x-6 items-center"
        >
          {STEPS.map((step, i) => (
            <Fragment key={step.n}>
              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 40 },
                  visible: { opacity: 1, y: 0 },
                }}
                transition={{ ...springs.smooth, delay: i * 0.15 }}
                className="text-center"
              >
                <div className="relative mx-auto h-20 w-20 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 text-white flex items-center justify-center shadow-elevated">
                  <step.Icon className="h-9 w-9" />
                  <span className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-accent-500 text-white text-xs font-bold flex items-center justify-center shadow-soft">
                    {step.n}
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-semibold text-ink-900 dark:text-ink-50">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm text-ink-600 dark:text-ink-200 max-w-xs mx-auto">
                  {step.desc}
                </p>
              </motion.div>
              {i < STEPS.length - 1 ? (
                <div className="px-4">
                  <DashedArrow inView={inView} />
                </div>
              ) : null}
            </Fragment>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════
// SECTION 5 — Testimonials
// ═══════════════════════════════════════════════════════════

const TESTIMONIALS = [
  {
    id: 't1',
    name: 'Nguyễn Minh Anh',
    school: 'ĐH Bách Khoa Hà Nội',
    rating: 5,
    quote: 'Mình tìm được phòng đúng ý chỉ sau 2 ngày. Chat trực tiếp với chủ trọ rất tiện, không phải qua môi giới.',
    color: 'bg-accent-500',
  },
  {
    id: 't2',
    name: 'Trần Quốc Việt',
    school: 'ĐH Quốc Gia TP.HCM',
    rating: 5,
    quote: 'Đánh giá thật của các bạn sinh viên khác giúp mình tránh được mấy chỗ kém chất lượng. Cực kỳ hữu ích.',
    color: 'bg-primary-300',
  },
  {
    id: 't3',
    name: 'Lê Phương Linh',
    school: 'ĐH Ngoại Thương',
    rating: 5,
    quote: 'Quản lý hợp đồng và hoá đơn trên cùng một app — không còn cảnh giấy tờ lộn xộn mỗi tháng nữa.',
    color: 'bg-primary-500',
  },
];

function TestimonialCard({ t }) {
  const initials = t.name
    .split(' ')
    .slice(-2)
    .map((s) => s[0])
    .join('')
    .toUpperCase();
  return (
    <motion.div
      whileHover={{ y: -8, boxShadow: '0 24px 60px rgba(255,255,255,0.10)' }}
      transition={springs.smooth}
      className="relative rounded-3xl bg-white/[0.06] backdrop-blur border border-white/10 p-6 lg:p-8 h-full"
      style={{ willChange: 'transform' }}
    >
      <Quote className="absolute top-5 right-5 h-16 w-16 text-primary-300/15" aria-hidden="true" />
      <div className="flex items-center gap-3">
        <span className={`h-12 w-12 rounded-full ${t.color} text-white flex items-center justify-center font-semibold`}>
          {initials}
        </span>
        <div>
          <p className="font-semibold text-white">{t.name}</p>
          <p className="text-xs text-primary-100/70">{t.school}</p>
        </div>
      </div>
      <div className="mt-4">
        <StarRating value={t.rating} readonly size="sm" />
      </div>
      <p className="mt-4 text-sm text-primary-100/90 leading-relaxed relative z-10">
        “{t.quote}”
      </p>
    </motion.div>
  );
}

function TestimonialsSection() {
  const [active, setActive] = useState(0);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (hovered) return undefined;
    const id = setInterval(() => {
      setActive((i) => (i + 1) % TESTIMONIALS.length);
    }, 5000);
    return () => clearInterval(id);
  }, [hovered]);

  return (
    <section className="relative bg-[#063D3D] text-white py-24 overflow-hidden">
      <div className="absolute inset-0 opacity-40 pointer-events-none">
        <div
          className="absolute -top-32 left-1/3 h-[400px] w-[400px] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(20,145,155,0.55), transparent 70%)' }}
        />
        <div
          className="absolute bottom-0 -right-20 h-[360px] w-[360px] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(247,201,95,0.25), transparent 70%)' }}
        />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary-300">
            Cảm nhận
          </p>
          <h2 className="mt-1 font-display text-3xl md:text-4xl font-extrabold">
            Sinh viên nói gì về RoomHub?
          </h2>
        </div>

        <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
          <div className="hidden md:grid grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <motion.div
                key={t.id}
                variants={scaleIn}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                transition={springs.smooth}
              >
                <TestimonialCard t={t} />
              </motion.div>
            ))}
          </div>

          <div className="md:hidden relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={TESTIMONIALS[active].id}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.35 }}
              >
                <TestimonialCard t={TESTIMONIALS[active]} />
              </motion.div>
            </AnimatePresence>
            <div className="mt-6 flex justify-center gap-2">
              {TESTIMONIALS.map((t, i) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActive(i)}
                  className={[
                    'h-2 rounded-full transition-all',
                    i === active ? 'w-6 bg-primary-300' : 'w-2 bg-white/30',
                  ].join(' ')}
                  aria-label={`Chuyển đến testimonial ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════
// SECTION 6 — Dual CTA banner
// ═══════════════════════════════════════════════════════════

function DualCTABanner() {
  return (
    <section className="bg-base">
      <div className="grid grid-cols-1 lg:grid-cols-2">
        <motion.div
          variants={slideRight}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          transition={{ ...springs.smooth, delay: 0.1 }}
          className="relative overflow-hidden bg-gradient-to-br from-primary-500 to-primary-700 text-white p-10 lg:p-16"
        >
          <div className="absolute -top-10 -right-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
          <HomeIcon className="h-10 w-10 text-white/85" />
          <h3 className="mt-4 font-display text-2xl md:text-3xl font-extrabold">
            Bạn đang tìm phòng?
          </h3>
          <p className="mt-2 max-w-md text-primary-100/90 text-sm md:text-base">
            Khám phá hàng trăm phòng trọ chất lượng với giá cả minh bạch, gần các trường đại học lớn.
          </p>
          <Link
            to="/posts"
            className="relative mt-6 inline-flex items-center gap-2 h-12 px-6 rounded-2xl bg-white text-primary-700 font-semibold hover:bg-primary-50 transition-colors"
          >
            Tìm phòng ngay
            <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>

        <motion.div
          variants={slideLeft}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          transition={{ ...springs.smooth, delay: 0.2 }}
          className="relative overflow-hidden bg-ink-900 text-white p-10 lg:p-16"
        >
          <div className="absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-accent-500/20 blur-2xl" aria-hidden="true" />
          <Key className="h-10 w-10 text-accent-500" />
          <h3 className="mt-4 font-display text-2xl md:text-3xl font-extrabold">
            Bạn có phòng cho thuê?
          </h3>
          <p className="mt-2 max-w-md text-ink-200 text-sm md:text-base">
            Tiếp cận hàng nghìn sinh viên đang tìm phòng. Đăng tin miễn phí trong 2 phút.
          </p>
          <Link
            to="/register"
            className="relative mt-6 inline-flex items-center gap-2 h-12 px-6 rounded-2xl bg-primary-500 hover:bg-primary-700 text-white font-semibold transition-colors"
          >
            Đăng phòng của bạn
            <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════
// Page
// ═══════════════════════════════════════════════════════════

export function LandingPage() {
  return (
    <>
      <HeroSection />
      <StatsSection />
      <FeaturedListings />
      <HowItWorks />
      <TestimonialsSection />
      <DualCTABanner />
    </>
  );
}

export default LandingPage;
