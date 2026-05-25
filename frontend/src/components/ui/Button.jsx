import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { springs } from '../../lib/animations';

const VARIANTS = {
  primary:
    'bg-primary-500 hover:bg-primary-700 text-white shadow-soft disabled:bg-primary-500/50',
  outlined:
    'border border-primary-500 text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/30 disabled:opacity-50',
  ghost:
    'text-ink-600 hover:bg-ink-100 dark:text-ink-200 dark:hover:bg-ink-800 disabled:opacity-50',
  danger:
    'bg-error hover:bg-red-600 text-white shadow-soft disabled:bg-error/60',
};

const SIZES = {
  sm: 'h-9 px-3 text-sm gap-1.5 rounded-lg',
  md: 'h-11 px-5 text-sm gap-2 rounded-xl',
  lg: 'h-13 px-6 text-base gap-2 rounded-2xl',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  iconPosition = 'left',
  onClick,
  type = 'button',
  fullWidth = false,
  className = '',
  children,
  ...rest
}) {
  const isDisabled = disabled || loading;
  return (
    <motion.button
      type={type}
      onClick={isDisabled ? undefined : onClick}
      disabled={isDisabled}
      whileTap={isDisabled ? undefined : { scale: 0.97 }}
      transition={springs.snappy}
      className={[
        'relative inline-flex items-center justify-center font-medium select-none',
        'transition-colors duration-200 outline-none',
        'focus-visible:ring-2 focus-visible:ring-primary-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent',
        VARIANTS[variant] || VARIANTS.primary,
        SIZES[size] || SIZES.md,
        fullWidth ? 'w-full' : '',
        isDisabled ? 'cursor-not-allowed' : 'cursor-pointer',
        className,
      ].join(' ')}
      {...rest}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        <>
          {Icon && iconPosition === 'left' ? <Icon className="h-4 w-4" aria-hidden="true" /> : null}
          <span>{children}</span>
          {Icon && iconPosition === 'right' ? <Icon className="h-4 w-4" aria-hidden="true" /> : null}
        </>
      )}
    </motion.button>
  );
}

export default Button;
