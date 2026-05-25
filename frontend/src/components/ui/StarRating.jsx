import { useState } from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { springs } from '../../lib/animations';

const SIZES = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-7 w-7',
};

export function StarRating({
  value = 0,
  onChange,
  readonly = false,
  size = 'md',
  className = '',
}) {
  const [hover, setHover] = useState(0);
  const display = hover || value;
  const interactive = !readonly && typeof onChange === 'function';

  return (
    <div
      className={['inline-flex items-center gap-1', className].join(' ')}
      onMouseLeave={() => interactive && setHover(0)}
      role={interactive ? 'radiogroup' : 'img'}
      aria-label={`Đánh giá ${value} trên 5 sao`}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= display;
        return (
          <motion.button
            key={star}
            type="button"
            disabled={!interactive}
            onMouseEnter={() => interactive && setHover(star)}
            onClick={() => interactive && onChange(star)}
            initial={false}
            animate={{
              scale: interactive && hover >= star ? 1.1 : 1,
              transition: { ...springs.bouncy, delay: interactive && hover >= star ? (star - 1) * 0.03 : 0 },
            }}
            whileTap={interactive ? { scale: 0.85 } : undefined}
            transition={springs.bouncy}
            className={[
              interactive ? 'cursor-pointer' : 'cursor-default',
              'outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 rounded',
            ].join(' ')}
            aria-label={`${star} sao`}
            role={interactive ? 'radio' : undefined}
            aria-checked={interactive ? value === star : undefined}
          >
            <Star
              className={[
                SIZES[size] ?? SIZES.md,
                'transition-colors duration-150',
                filled ? 'fill-accent-500 text-accent-500' : 'fill-transparent text-ink-200 dark:text-ink-700',
              ].join(' ')}
              strokeWidth={1.5}
            />
          </motion.button>
        );
      })}
    </div>
  );
}

export default StarRating;
