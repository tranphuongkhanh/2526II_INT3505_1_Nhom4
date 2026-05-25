import { motion } from 'framer-motion';
import { springs } from '../../lib/animations';

const PADDING = {
  none: 'p-0',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export function Card({
  children,
  className = '',
  hover = false,
  onClick,
  padding = 'md',
  as: Tag = motion.div,
  ...rest
}) {
  const interactive = Boolean(onClick) || hover;
  return (
    <Tag
      onClick={onClick}
      whileHover={
        hover
          ? { y: -8, boxShadow: '0 20px 40px rgba(15, 23, 42, 0.18)' }
          : undefined
      }
      transition={springs.smooth}
      className={[
        'bg-white dark:bg-ink-800 rounded-2xl border border-ink-100 dark:border-ink-700',
        'shadow-soft',
        PADDING[padding] ?? PADDING.md,
        interactive ? 'cursor-pointer' : '',
        className,
      ].join(' ')}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export default Card;
