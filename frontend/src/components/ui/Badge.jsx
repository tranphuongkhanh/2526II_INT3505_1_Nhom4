const VARIANTS = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  approved: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300',
  active: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300',
  banned: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300',
  available: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300',
  rented: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
  paid: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300',
  unpaid: 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300',
  info: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
};

const SIZES = {
  sm: 'text-[10px] px-2 py-0.5 h-5',
  md: 'text-xs px-2.5 py-1 h-6',
};

export function Badge({
  variant = 'info',
  size = 'md',
  pulse = false,
  className = '',
  children,
}) {
  const wantsPulse = pulse || variant === 'pending';
  return (
    <span
      className={[
        'inline-flex items-center gap-1 rounded-full font-medium tracking-wide',
        VARIANTS[variant] ?? VARIANTS.info,
        SIZES[size] ?? SIZES.md,
        wantsPulse ? 'animate-pulse-glow' : '',
        className,
      ].join(' ')}
    >
      {children}
    </span>
  );
}

export default Badge;
