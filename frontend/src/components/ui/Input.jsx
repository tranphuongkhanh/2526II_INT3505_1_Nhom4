import { useId, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';

export function Input({
  label,
  type = 'text',
  value,
  onChange,
  error,
  hint,
  icon: Icon,
  required = false,
  disabled = false,
  placeholder = ' ',
  className = '',
  name,
  autoComplete,
  ...rest
}) {
  const reactId = useId();
  const id = rest.id || reactId;
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const isPassword = type === 'password';
  const effectiveType = isPassword && revealed ? 'text' : type;
  const filled = value !== undefined && value !== null && String(value).length > 0;
  const floated = focused || filled;

  const borderColor = error
    ? 'border-error focus-within:border-error'
    : focused
      ? 'border-primary-500'
      : 'border-ink-200 dark:border-ink-700';

  const labelColor = error
    ? 'text-error'
    : floated
      ? 'text-primary-500'
      : 'text-ink-400 dark:text-ink-400';

  return (
    <div className={['w-full', className].join(' ')}>
      <div
        className={[
          'relative bg-white dark:bg-ink-900 rounded-xl border transition-colors duration-200',
          borderColor,
          disabled ? 'opacity-60 cursor-not-allowed' : '',
        ].join(' ')}
      >
        {Icon ? (
          <span
            className={[
              'absolute left-3 text-ink-400 dark:text-ink-400 pointer-events-none',
              label ? 'bottom-3' : 'top-1/2 -translate-y-1/2',
            ].join(' ')}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>
        ) : null}

        <input
          id={id}
          name={name}
          type={effectiveType}
          value={value ?? ''}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          disabled={disabled}
          required={required}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className={[
            'peer w-full bg-transparent outline-none text-ink-900 dark:text-ink-50',
            'placeholder-transparent rounded-xl',
            label ? 'h-14 pt-5 pb-1' : 'h-12',
            Icon ? 'pl-10 pr-4' : 'px-4',
            isPassword ? 'pr-10' : '',
          ].join(' ')}
          {...rest}
        />

        {label ? (
          <motion.label
            htmlFor={id}
            initial={false}
            animate={
              floated
                ? { top: '6px', y: '0%', fontSize: '11px', opacity: 1 }
                : { top: '50%', y: '-50%', fontSize: '14px', opacity: 1 }
            }
            transition={{ duration: 0.15 }}
            className={[
              'pointer-events-none absolute',
              Icon ? 'left-10' : 'left-4',
              'font-medium flex items-center',
              labelColor,
            ].join(' ')}
          >
            {label}
            {required ? <span className="text-error ml-0.5">*</span> : null}
          </motion.label>
        ) : null}

        {isPassword ? (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setRevealed((r) => !r)}
            className={[
              'absolute right-3 text-ink-400 hover:text-ink-600 dark:hover:text-ink-200 transition-colors',
              label ? 'bottom-3' : 'top-1/2 -translate-y-1/2',
            ].join(' ')}
            aria-label={revealed ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
          >
            {revealed ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        ) : null}
      </div>

      <AnimatePresence initial={false} mode="wait">
        {error ? (
          <motion.p
            key="error"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
            className="mt-1.5 text-xs text-error"
          >
            {error}
          </motion.p>
        ) : hint ? (
          <motion.p
            key="hint"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="mt-1.5 text-xs text-ink-400 dark:text-ink-400"
          >
            {hint}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export default Input;
