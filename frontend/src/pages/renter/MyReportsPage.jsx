import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, ChevronDown } from 'lucide-react';
import { reportApi } from '../../lib/api';
import { useToast } from '../../components/ui/Toast';
import { Skeleton } from '../../components/ui/Skeleton';
import { springs, easings } from '../../lib/animations';

const TABS = [
  { label: 'Tất cả', value: null },
  { label: 'Chờ', value: 'PENDING' },
  { label: 'Đã xử lý', value: 'RESOLVED' },
  { label: 'Từ chối', value: 'REJECTED' },
];

const STATUS_META = {
  PENDING: {
    label: 'Chờ xử lý',
    cls: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300 animate-pulse-glow',
  },
  RESOLVED: {
    label: 'Đã xử lý',
    cls: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300',
  },
  REJECTED: {
    label: 'Từ chối',
    cls: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300',
  },
};

function StatusBadge({ status }) {
  const meta = STATUS_META[status] ?? {
    label: status,
    cls: 'bg-ink-100 text-ink-600 dark:bg-ink-700 dark:text-ink-200',
  };
  return (
    <motion.span
      initial={{ clipPath: 'inset(0 100% 0 0 round 9999px)' }}
      whileInView={{ clipPath: 'inset(0 0% 0 0 round 9999px)' }}
      viewport={{ once: true, margin: '-10px' }}
      transition={{ duration: 0.4, ease: easings.outExpo }}
      className={[
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium tracking-wide shrink-0',
        meta.cls,
      ].join(' ')}
    >
      {meta.label}
    </motion.span>
  );
}

function ReportItem({ report }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-ink-100 dark:border-ink-700 last:border-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-start gap-3 py-4 text-left"
      >
        <div className="flex-1 min-w-0">
          <p className="font-medium text-ink-900 dark:text-ink-50 truncate leading-snug">
            {report.postTitle ?? report.post?.title ?? '—'}
          </p>
          <p className="mt-1 text-sm text-ink-600 dark:text-ink-200 line-clamp-1">
            {report.reason}
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0 mt-0.5">
          <StatusBadge status={report.status} />
          <span className="text-xs text-ink-400 hidden sm:block">
            {report.createdAt
              ? new Date(report.createdAt).toLocaleDateString('vi-VN')
              : ''}
          </span>
          <motion.span
            animate={{ rotate: open ? 180 : 0 }}
            transition={springs.snappy}
            className="text-ink-400"
          >
            <ChevronDown className="h-4 w-4" />
          </motion.span>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="detail"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={springs.smooth}
            className="overflow-hidden"
          >
            <div className="pb-4 pl-0 pr-4 space-y-3 text-sm">
              <div className="bg-ink-50 dark:bg-ink-800 rounded-xl p-3 space-y-3">
                <div>
                  <p className="text-xs font-semibold text-ink-400 uppercase tracking-wider mb-1">
                    Lý do đầy đủ
                  </p>
                  <p className="text-ink-900 dark:text-ink-50">{report.reason}</p>
                </div>
                {report.resolution ? (
                  <div className="pt-3 border-t border-ink-100 dark:border-ink-700">
                    <p className="text-xs font-semibold text-ink-400 uppercase tracking-wider mb-1">
                      Phản hồi từ admin
                    </p>
                    <p className="text-ink-900 dark:text-ink-50">{report.resolution}</p>
                  </div>
                ) : null}
                <p className="text-xs text-ink-400 pt-1">
                  Ngày gửi:{' '}
                  {report.createdAt
                    ? new Date(report.createdAt).toLocaleString('vi-VN')
                    : '—'}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function MyReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(null);
  const toast = useToast();

  useEffect(() => {
    reportApi
      .getMyReports()
      .then((data) => {
        const arr = Array.isArray(data) ? data : (data?.content ?? data?.items ?? []);
        setReports(arr);
      })
      .catch(() => toast.error('Không thể tải danh sách báo cáo.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered =
    activeTab === null ? reports : reports.filter((r) => r.status === activeTab);

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-bold text-ink-900 dark:text-ink-50 mb-6">Báo cáo của tôi</h1>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-ink-100 dark:bg-ink-800 p-1 mb-6">
        {TABS.map((tab) => (
          <button
            key={String(tab.value)}
            type="button"
            onClick={() => setActiveTab(tab.value)}
            className={[
              'relative flex-1 py-2 text-sm font-medium rounded-lg transition-colors',
              activeTab === tab.value
                ? 'text-ink-900 dark:text-ink-50'
                : 'text-ink-600 dark:text-ink-400 hover:text-ink-900 dark:hover:text-ink-50',
            ].join(' ')}
          >
            {activeTab === tab.value && (
              <motion.span
                layoutId="reports-tab-indicator"
                className="absolute inset-0 rounded-lg bg-white dark:bg-ink-700 shadow-soft"
                transition={springs.snappy}
              />
            )}
            <span className="relative z-10">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-ink-900 rounded-2xl border border-ink-100 dark:border-ink-700 shadow-soft overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} variant="rect" className="h-16 w-full" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center px-6">
            <FileText className="h-10 w-10 text-ink-300 mb-3" />
            <p className="font-medium text-ink-600 dark:text-ink-200">Không có báo cáo nào</p>
          </div>
        ) : (
          <div className="divide-y-0 px-4">
            {filtered.map((report) => (
              <ReportItem key={report.id} report={report} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
