const BASE =
  'relative overflow-hidden bg-ink-100 dark:bg-ink-800 before:absolute before:inset-0 ' +
  'before:bg-gradient-to-r before:from-transparent before:via-white/60 dark:before:via-white/10 before:to-transparent ' +
  'before:bg-[length:200%_100%] before:animate-shimmer';

const VARIANTS = {
  text: 'h-4 rounded',
  rect: 'rounded-md',
  circle: 'rounded-full',
  card: '',
};

export function Skeleton({ className = '', variant = 'rect' }) {
  if (variant === 'card') {
    return (
      <div className={['rounded-2xl bg-white dark:bg-ink-800 border border-ink-100 dark:border-ink-700 p-4 space-y-3', className].join(' ')}>
        <div className={[BASE, 'h-40 w-full rounded-xl'].join(' ')} />
        <div className={[BASE, 'h-4 w-3/4 rounded'].join(' ')} />
        <div className={[BASE, 'h-4 w-1/2 rounded'].join(' ')} />
        <div className={[BASE, 'h-4 w-2/3 rounded'].join(' ')} />
      </div>
    );
  }
  return <div className={[BASE, VARIANTS[variant] ?? VARIANTS.rect, className].join(' ')} />;
}

export default Skeleton;
