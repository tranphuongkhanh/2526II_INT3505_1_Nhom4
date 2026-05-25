import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { easings, springs } from '../../lib/animations';

// ── Password scoring ─────────────────────────────────────
export function scorePassword(pwd) {
  if (!pwd) return { score: 0, label: '' };
  let score = 0;
  if (pwd.length >= 8) score += 1;
  if (/[A-Z]/.test(pwd)) score += 1;
  if (/[0-9]/.test(pwd)) score += 1;
  if (/[^A-Za-z0-9]/.test(pwd)) score += 1;
  const labels = ['', 'Yếu', 'Trung bình', 'Mạnh', 'Rất mạnh'];
  return { score, label: labels[score] };
}

const SEGMENT_COLOR = ['bg-ink-200', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500'];

export function PasswordStrengthBar({ password }) {
  const { score, label } = scorePassword(password);
  return (
    <div className="mt-2">
      <div className="flex gap-1.5">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-1.5 flex-1 rounded-full bg-ink-100 dark:bg-ink-700 overflow-hidden"
          >
            <motion.div
              initial={false}
              animate={{ width: score >= i ? '100%' : '0%' }}
              transition={{ duration: 0.3, ease: easings.outExpo }}
              className={['h-full', score >= i ? SEGMENT_COLOR[score] : ''].join(' ')}
            />
          </div>
        ))}
      </div>
      <AnimatePresence>
        {password ? (
          <motion.p
            key={label}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-1.5 text-xs text-ink-400"
          >
            Độ mạnh: <span className="font-medium text-ink-600 dark:text-ink-200">{label}</span>
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

// ── Animated check / cross circle (SVG draw) ────────────
export function SuccessCheckmark({ size = 96 }) {
  return (
    <svg viewBox="0 0 96 96" width={size} height={size} aria-hidden="true">
      <motion.circle
        cx={48}
        cy={48}
        r={42}
        fill="#14919B"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={springs.bouncy}
        style={{ transformOrigin: '48px 48px' }}
      />
      <motion.path
        d="M30 49 L43 62 L66 36"
        fill="none"
        stroke="#fff"
        strokeWidth={6}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.2, duration: 0.6, ease: easings.outExpo }}
      />
    </svg>
  );
}

export function ErrorCross({ size = 96 }) {
  return (
    <svg viewBox="0 0 96 96" width={size} height={size} aria-hidden="true">
      <motion.circle
        cx={48}
        cy={48}
        r={42}
        fill="#EF4444"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={springs.bouncy}
        style={{ transformOrigin: '48px 48px' }}
      />
      <motion.path
        d="M33 33 L63 63"
        fill="none"
        stroke="#fff"
        strokeWidth={6}
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.2, duration: 0.4, ease: easings.outExpo }}
      />
      <motion.path
        d="M63 33 L33 63"
        fill="none"
        stroke="#fff"
        strokeWidth={6}
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.45, duration: 0.4, ease: easings.outExpo }}
      />
    </svg>
  );
}

// ── Confetti burst ──────────────────────────────────────
const CONFETTI_COLORS = ['#14919B', '#F0A500', '#F7C95F', '#66C5C5', '#FFFFFF'];

export function ConfettiBurst({ count = 40 }) {
  const pieces = Array.from({ length: count }).map((_, i) => ({
    angle: Math.random() * Math.PI * 2,
    dist: 70 + Math.random() * 140,
    size: 4 + Math.random() * 4,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    shape: Math.random() > 0.55 ? '999px' : '2px',
    spin: (Math.random() - 0.5) * 720,
    delay: Math.random() * 0.1,
  }));
  return (
    <div
      className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden"
      aria-hidden="true"
    >
      {pieces.map((p, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 1, scale: 0, x: 0, y: 0, rotate: 0 }}
          animate={{
            opacity: 0,
            scale: 1,
            x: Math.cos(p.angle) * p.dist,
            y: Math.sin(p.angle) * p.dist,
            rotate: p.spin,
          }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: p.delay }}
          className="absolute"
          style={{
            width: p.size,
            height: p.size,
            background: p.color,
            borderRadius: p.shape,
            willChange: 'transform',
          }}
        />
      ))}
    </div>
  );
}

// ── Countdown with flip ─────────────────────────────────
export function CountdownFlip({ from = 3, onComplete, suffix = 'giây' }) {
  const [n, setN] = useState(from);

  useEffect(() => {
    if (n <= 0) {
      onComplete?.();
      return undefined;
    }
    const id = setTimeout(() => setN((v) => v - 1), 1000);
    return () => clearTimeout(id);
  }, [n, onComplete]);

  return (
    <span className="inline-flex items-baseline gap-1.5">
      <span
        className="relative inline-block w-5 text-center font-bold text-primary-500 tabular-nums"
        style={{ perspective: 600 }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={n}
            initial={{ rotateX: -90, opacity: 0 }}
            animate={{ rotateX: 0, opacity: 1 }}
            exit={{ rotateX: 90, opacity: 0 }}
            transition={springs.snappy}
            className="block"
          >
            {Math.max(0, n)}
          </motion.span>
        </AnimatePresence>
      </span>
      <span>{suffix}</span>
    </span>
  );
}
