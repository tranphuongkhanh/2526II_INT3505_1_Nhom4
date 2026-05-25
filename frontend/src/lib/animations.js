/**
 * Shared Framer Motion configs, variants, and easing tokens
 * Import these everywhere so motion feels coherent across the app.
 */

export const springs = {
  snappy: { type: 'spring', stiffness: 300, damping: 24 },
  smooth: { type: 'spring', stiffness: 150, damping: 20 },
  bouncy: { type: 'spring', stiffness: 400, damping: 15 },
  gentle: { type: 'spring', stiffness: 100, damping: 25 },
};

export const durations = {
  fast: 0.15,
  normal: 0.3,
  slow: 0.5,
  dramatic: 0.8,
};

export const easings = {
  outExpo: [0.16, 1, 0.3, 1],
  inOutQuart: [0.76, 0, 0.24, 1],
  bounce: [0.34, 1.56, 0.64, 1],
};

export const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: easings.outExpo },
  },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
};

export const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1 },
};

export const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

export const slideRight = {
  hidden: { opacity: 0, x: -30 },
  visible: { opacity: 1, x: 0 },
};

export const slideLeft = {
  hidden: { opacity: 0, x: 30 },
  visible: { opacity: 1, x: 0 },
};

export const modalBackdrop = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.18 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

export const modalPanel = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: springs.smooth,
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: 10,
    transition: { duration: 0.15 },
  },
};
