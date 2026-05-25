import { useMemo, useState } from 'react';

const SIZES = {
  sm: { box: 'h-8 w-8 text-xs', dot: 'h-2 w-2 ring-2' },
  md: { box: 'h-10 w-10 text-sm', dot: 'h-2.5 w-2.5 ring-2' },
  lg: { box: 'h-14 w-14 text-base', dot: 'h-3 w-3 ring-2' },
  xl: { box: 'h-20 w-20 text-xl', dot: 'h-3.5 w-3.5 ring-[3px]' },
};

const PALETTE = [
  'bg-primary-500',
  'bg-primary-700',
  'bg-accent-500',
  'bg-accent-700',
  'bg-info',
  'bg-success',
  'bg-rose-500',
  'bg-violet-500',
  'bg-emerald-500',
  'bg-amber-500',
];

const initialsOf = (name) => {
  if (!name) return '?';
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const hashColor = (name) => {
  if (!name) return PALETTE[0];
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = (h * 31 + name.charCodeAt(i)) | 0;
  }
  return PALETTE[Math.abs(h) % PALETTE.length];
};

export function Avatar({
  src,
  name = '',
  size = 'md',
  online,
  className = '',
}) {
  const [errored, setErrored] = useState(false);
  const sz = SIZES[size] ?? SIZES.md;
  const initials = useMemo(() => initialsOf(name), [name]);
  const color = useMemo(() => hashColor(name), [name]);
  const showImage = src && !errored;

  return (
    <span className={['relative inline-flex shrink-0', className].join(' ')}>
      <span
        className={[
          'inline-flex items-center justify-center overflow-hidden rounded-full',
          'font-semibold text-white select-none',
          sz.box,
          showImage ? 'bg-ink-100 dark:bg-ink-700' : color,
        ].join(' ')}
        aria-label={name || 'avatar'}
      >
        {showImage ? (
          <img
            src={src}
            alt={name || ''}
            className="h-full w-full object-cover"
            onError={() => setErrored(true)}
          />
        ) : (
          initials
        )}
      </span>
      {online !== undefined ? (
        <span
          className={[
            'absolute bottom-0 right-0 rounded-full ring-white dark:ring-ink-900',
            sz.dot,
            online ? 'bg-success' : 'bg-ink-400',
          ].join(' ')}
          aria-label={online ? 'Đang trực tuyến' : 'Ngoại tuyến'}
        />
      ) : null}
    </span>
  );
}

export default Avatar;
