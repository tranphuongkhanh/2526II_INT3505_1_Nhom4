import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flag, ChevronDown, ExternalLink, CheckCircle, XCircle } from 'lucide-react';
import { reportApi } from '../../lib/api';
import { springs } from '../../lib/animations';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Skeleton from '../../components/ui/Skeleton';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { useToast } from '../../components/ui/Toast';

const TABS = [
  { key: 'PENDING',  label: 'Chờ xử lý' },
  { key: 'RESOLVED', label: 'Đã xử lý' },
  { key: 'REJECTED', label: 'Từ chối' },
];

const STATUS_META = {
  PENDING:  { label: 'Chờ xử lý', variant: 'pending' },
  RESOLVED: { label: 'Đã xử lý',  variant: 'approved' },
  REJECTED: { label: 'Từ chối',   variant: 'rejected' },
};

const REASON_LABELS = {
  SPAM:        'Spam',
  FAKE:        'Thông tin giả',
  INAPPROPRIATE: 'Nội dung không phù hợp',
  FRAUD:       'Lừa đảo',
  OTHER:       'Lý do khác',
};

const fmt = (d) => d ? new Date(d).toLocaleDateString('vi-VN') : '—';
const toArr = (x) => Array.isArray(x) ? x : (x?.content ?? x?.items ?? x?.data ?? []);

// ── Stamp overlay ──────────────────────────────────────────
function StampOverlay() {
  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center z-20 rounded-2xl bg-green-500/5"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        initial={{ scale: 0.3, rotate: -15, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
        className="border-4 border-green-500 rounded-xl px-8 py-3 -rotate-6"
      >
        <span className="text-2xl font-black tracking-widest text-green-500">RESOLVED</span>
      </motion.div>
    </motion.div>
  );
}

// ── Accordion item ─────────────────────────────────────────
function ReportItem({ report, expanded, onToggle, onResolve, onReject, stampActive, busy }) {
  const [note, setNote] = useState('');

  return (
    <motion.div layout className="relative">
      {stampActive && <StampOverlay />}
      <Card padding="none" className="overflow-hidden">
        {/* Summary row */}
        <button
          type="button"
          onClick={onToggle}
          className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-ink-50 dark:hover:bg-ink-700/40 transition-colors"
        >
          <div className="h-9 w-9 rounded-xl bg-red-50 dark:bg-red-900/30 flex items-center justify-center shrink-0">
            <Flag className="h-4 w-4 text-red-500" />
          </div>

          <div className="flex-1 min-w-0 space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-ink-900 dark:text-ink-50 truncate">
                <span className="text-ink-400 font-normal">{report.reporterName}</span>
                {' → '}
                <span>{report.postTitle}</span>
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-ink-400 bg-ink-100 dark:bg-ink-700 px-2 py-0.5 rounded-full">
                {REASON_LABELS[report.reason] ?? report.reason}
              </span>
              <span className="text-xs text-ink-400">{fmt(report.createdAt)}</span>
              <Badge variant={STATUS_META[report.status]?.variant ?? 'info'}>
                {STATUS_META[report.status]?.label ?? report.status}
              </Badge>
            </div>
          </div>

          <motion.span
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={springs.smooth}
            className="shrink-0 text-ink-400"
          >
            <ChevronDown className="h-4 w-4" />
          </motion.span>
        </button>

        {/* Expanded content */}
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ ...springs.smooth, opacity: { duration: 0.2 } }}
              className="overflow-hidden"
            >
              <div className="px-5 pb-5 pt-1 border-t border-ink-100 dark:border-ink-700 space-y-4">
                {/* Full reason */}
                <div>
                  <p className="text-xs font-medium text-ink-400 uppercase tracking-wide mb-1">Nội dung báo cáo</p>
                  <p className="text-sm text-ink-700 dark:text-ink-200 leading-relaxed bg-ink-50 dark:bg-ink-700/50 rounded-xl px-4 py-3">
                    {report.fullReason || '—'}
                  </p>
                </div>

                {/* Post link */}
                {report.postId && (
                  <div>
                    <a
                      href={`/posts/${report.postId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-primary-500 hover:text-primary-700 transition-colors font-medium"
                    >
                      Xem bài đăng <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                )}

                {/* Resolution note */}
                {report.status === 'PENDING' && (
                  <>
                    <div>
                      <p className="text-xs font-medium text-ink-400 uppercase tracking-wide mb-1">Ghi chú xử lý</p>
                      <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Nhập ghi chú xử lý (tùy chọn)..."
                        rows={3}
                        className="w-full rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 text-sm text-ink-900 dark:text-ink-50 placeholder-ink-400 px-4 py-3 focus:outline-none focus:border-primary-500 transition-colors resize-none"
                      />
                    </div>

                    <div className="flex gap-3">
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.96 }}
                        onClick={() => onResolve(note)}
                        disabled={busy}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400 transition-colors disabled:opacity-50"
                      >
                        <CheckCircle className="h-4 w-4" /> Đã xử lý
                      </motion.button>
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.96 }}
                        onClick={() => onReject(note)}
                        disabled={busy}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 transition-colors disabled:opacity-50"
                      >
                        <XCircle className="h-4 w-4" /> Từ chối
                      </motion.button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}

// ── Page ───────────────────────────────────────────────────
export default function ReportManagementPage() {
  const toast = useToast();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusTab, setStatusTab] = useState('PENDING');
  const [expandedId, setExpandedId] = useState(null);
  const [stampIds, setStampIds] = useState(new Set());
  const [busy, setBusy] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null); // { type, report, note }

  useEffect(() => {
    reportApi.adminGetAll({ limit: 500 })
      .then((d) => setReports(toArr(d)))
      .catch(() => setReports([]))
      .finally(() => setLoading(false));
  }, []);

  const counts = {
    PENDING:  reports.filter((r) => r.status === 'PENDING').length,
    RESOLVED: reports.filter((r) => r.status === 'RESOLVED').length,
    REJECTED: reports.filter((r) => r.status === 'REJECTED').length,
  };

  const filtered = reports.filter((r) => r.status === statusTab);

  const processReport = useCallback(async (report, newStatus, note) => {
    setBusy(report.id);
    try {
      await reportApi.adminUpdateStatus(report.id, { status: newStatus, resolution: note }).catch(() => {});

      if (newStatus === 'RESOLVED') {
        setStampIds((prev) => new Set([...prev, report.id]));
        setTimeout(() => {
          setReports((prev) => prev.map((r) => r.id === report.id ? { ...r, status: newStatus } : r));
          setExpandedId(null);
          setStampIds((prev) => { const s = new Set(prev); s.delete(report.id); return s; });
        }, 1200);
        toast.success('Đã đánh dấu đã xử lý');
      } else {
        setReports((prev) => prev.map((r) => r.id === report.id ? { ...r, status: newStatus } : r));
        setExpandedId(null);
        toast.success('Đã từ chối báo cáo');
      }
    } finally {
      setBusy(null);
    }
  }, [toast]);

  const openConfirm = useCallback((type, report, note) => {
    setConfirmDialog({ type, report, note });
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-ink-900 dark:text-ink-50">Xử lý báo cáo</h1>
        <p className="text-ink-400 mt-1 text-sm">Xem xét và xử lý báo cáo vi phạm từ người dùng.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-ink-100 dark:border-ink-700 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setStatusTab(tab.key)}
            className={[
              'px-4 py-2.5 text-sm font-medium whitespace-nowrap flex items-center gap-1.5 relative transition-colors',
              statusTab === tab.key
                ? 'text-primary-500 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary-500 after:rounded-t'
                : 'text-ink-400 hover:text-ink-700 dark:hover:text-ink-200',
            ].join(' ')}
          >
            {tab.label}
            {counts[tab.key] > 0 && (
              <span className={`text-xs rounded-full px-1.5 font-semibold ${
                statusTab === tab.key
                  ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/40 dark:text-primary-300'
                  : 'bg-ink-100 dark:bg-ink-700 text-ink-500'
              }`}>
                {counts[tab.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Report list */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="text-center py-16 text-ink-400">
          <Flag className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Không có báo cáo nào trong mục này.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {filtered.map((report) => (
              <ReportItem
                key={report.id}
                report={report}
                expanded={expandedId === report.id}
                onToggle={() => setExpandedId((p) => (p === report.id ? null : report.id))}
                onResolve={(note) => openConfirm('resolve', report, note)}
                onReject={(note) => openConfirm('reject', report, note)}
                stampActive={stampIds.has(report.id)}
                busy={busy !== null}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Confirm dialog */}
      <ConfirmDialog
        isOpen={Boolean(confirmDialog)}
        onClose={() => setConfirmDialog(null)}
        title={confirmDialog?.type === 'resolve' ? 'Xác nhận xử lý báo cáo' : 'Từ chối báo cáo'}
        message={
          confirmDialog?.type === 'resolve'
            ? `Xác nhận đánh dấu báo cáo về "${confirmDialog?.report?.postTitle}" là đã xử lý?`
            : `Từ chối báo cáo về "${confirmDialog?.report?.postTitle}"?`
        }
        confirmLabel={confirmDialog?.type === 'resolve' ? 'Đã xử lý' : 'Từ chối'}
        confirmVariant={confirmDialog?.type === 'resolve' ? 'primary' : 'danger'}
        onConfirm={() =>
          processReport(
            confirmDialog.report,
            confirmDialog.type === 'resolve' ? 'RESOLVED' : 'REJECTED',
            confirmDialog.note,
          )
        }
      />
    </div>
  );
}
