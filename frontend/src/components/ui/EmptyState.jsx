import { motion } from 'framer-motion';
import { Inbox } from 'lucide-react';
import { springs } from '../../lib/animations';
import Button from './Button';

export function EmptyState({
  icon: Icon = Inbox,
  title = 'Chưa có gì ở đây',
  description,
  action,
  className = '',
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={springs.smooth}
      className={[
        'flex flex-col items-center justify-center text-center px-6 py-16',
        className,
      ].join(' ')}
    >
      <div className="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-ink-100 dark:bg-ink-800 text-ink-400">
        <Icon className="h-8 w-8" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-semibold text-ink-900 dark:text-ink-50">{title}</h3>
      {description ? (
        <p className="mt-1.5 max-w-md text-sm text-ink-600 dark:text-ink-200">{description}</p>
      ) : null}
      {action ? (
        <div className="mt-6">
          <Button
            variant={action.variant || 'primary'}
            onClick={action.onClick}
            icon={action.icon}
          >
            {action.label}
          </Button>
        </div>
      ) : null}
    </motion.div>
  );
}

export default EmptyState;
