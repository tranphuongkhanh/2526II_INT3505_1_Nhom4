import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, CheckCircle2, Clock } from 'lucide-react';
import { paymentApi } from '../../lib/api';
import { useToast } from '../../components/ui/Toast';
import { springs } from '../../lib/animations';
import Skeleton from '../../components/ui/Skeleton';

const fmt = (n) =>
  n != null
    ? new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(n) + 'đ'
    : '—';

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

// ── Counter animation ─────────────────────────────────────
function useCountUp(target, duration = 900) {
  const [value, setValue] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    if (target === 0) { setValue(0); return; }
    const start = performance.now();
    const animate = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);

  return value;
}

// ── Summary bar ───────────────────────────────────────────
function SummaryBar({ totalPaid, totalPending }) {
  const paid = useCountUp(totalPaid);
  const pending = useCountUp(totalPending);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springs.smooth, delay: 0.05 }}
        className="flex items-center gap-4 bg-white dark:bg-ink-800 rounded-2xl border border-green-100 dark:border-green-900/40 shadow-soft px-5 py-4"
      >
        <div className="h-11 w-11 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-ink-400 font-medium uppercase tracking-wider">Đã thanh toán</p>
          <p className="text-xl font-bold text-green-600 dark:text-green-400 mt-0.5">{fmt(paid)}</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springs.smooth, delay: 0.12 }}
        className="flex items-center gap-4 bg-white dark:bg-ink-800 rounded-2xl border border-amber-100 dark:border-amber-900/40 shadow-soft px-5 py-4"
      >
        <motion.div
          animate={{ opacity: [1, 0.4, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="h-11 w-11 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0"
        >
          <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
        </motion.div>
        <div className="min-w-0">
          <p className="text-xs text-ink-400 font-medium uppercase tracking-wider">Chờ thanh toán</p>
          <p className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-0.5">{fmt(pending)}</p>
        </div>
      </motion.div>
    </div>
  );
}

// ── Type badge ────────────────────────────────────────────
function TypeBadge({ type }) {
  const isNew = type === 'NEW' || type === 'Đăng mới';
  return (
    <span
      className={[
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold',
        isNew
          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
          : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      ].join(' ')}
    >
      {isNew ? 'Đăng mới' : 'Gia hạn'}
    </span>
  );
}

// ── Status badge ──────────────────────────────────────────
function PayStatusBadge({ status }) {
  const s = (status || '').toUpperCase();
  const isPaid = s === 'PAID' || s === 'COMPLETED';
  return (
    <span
      className={[
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold',
        isPaid
          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
          : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
      ].join(' ')}
    >
      {isPaid ? 'Đã TT' : 'Chờ TT'}
    </span>
  );
}

// ── Payment row ───────────────────────────────────────────
function PaymentRow({ payment, index }) {
  const isExtension = !!payment.extensionId;
  const computedType = isExtension ? 'EXTENSION' : 'NEW';

  return (
    <motion.tr
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ ...springs.smooth, delay: index * 0.04 }}
      className="group relative border-b border-ink-100 dark:border-ink-700 hover:bg-ink-50 dark:hover:bg-ink-800/50 transition-colors"
    >
      {/* Teal left border on hover */}
      <td className="relative py-3.5 pl-4 pr-3 text-sm text-ink-900 dark:text-ink-50">
        <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r bg-primary-500 opacity-0 group-hover:opacity-100 transition-opacity" />
        <span className="truncate max-w-[200px] block">
          {payment.postTitle ?? payment.post?.title ?? `Thanh toán #${payment.id}`}
        </span>
      </td>
      <td className="py-3.5 px-3 text-sm">
        <TypeBadge type={computedType} />
      </td>
      <td className="py-3.5 px-3 text-sm font-semibold text-ink-900 dark:text-ink-50 text-right">
        {fmt(payment.amount)}
      </td>
      <td className="py-3.5 px-3 text-sm text-right">
        <PayStatusBadge status={payment.status} />
        {(payment.status || '').toUpperCase() === 'PENDING' && (
          payment.post?.status === 'APPROVED' || isExtension ? (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); payment.onRetry?.(payment.id); }}
              disabled={payment.retrying}
              className="block mt-1.5 ml-auto text-xs font-medium text-primary-500 hover:text-primary-600 dark:hover:text-primary-400 hover:underline disabled:opacity-50"
            >
              {payment.retrying ? 'Đang tải...' : 'Thanh toán ngay'}
            </button>
          ) : (
            <span className="block mt-1.5 ml-auto text-xs font-medium text-ink-400">
              Chờ Admin duyệt bài
            </span>
          )
        )}
      </td>
      <td className="py-3.5 px-3 text-sm text-ink-400 text-right whitespace-nowrap">
        {fmtDate(payment.createdAt ?? payment.date ?? payment.paidAt)}
      </td>
      <td className="py-3.5 pl-3 pr-4 text-sm text-ink-400 max-w-[160px]">
        <span className="truncate block">{payment.note ?? '—'}</span>
      </td>
    </motion.tr>
  );
}

const STATUS_TABS = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'PAID', label: 'Đã TT' },
  { value: 'PENDING', label: 'Chờ TT' },
];

// ── Page ──────────────────────────────────────────────────
export default function PaymentHistoryPage() {
  const toast = useToast();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusTab, setStatusTab] = useState('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get('paymentStatus');
    if (status) {
      if (status === 'success') {
        toast.success('Thanh toán thành công!');
      } else if (status === 'failed') {
        toast.error('Thanh toán thất bại hoặc đã bị huỷ!');
      } else if (status === 'invalid_signature') {
        toast.error('Chữ ký giao dịch không hợp lệ!');
      } else if (status === 'already_paid') {
        toast.error('Đơn này đã được thanh toán trước đó!');
      } else {
        toast.error('Có lỗi xảy ra trong quá trình thanh toán!');
      }
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    paymentApi
      .getMyPayments()
      .then((r) => {
        const arr = Array.isArray(r) ? r : (r?.content ?? r?.items ?? r?.data ?? []);
        setPayments(arr);
      })
      .catch(() => toast.error('Không thể tải lịch sử thanh toán.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = payments.filter((p) => {
    const s = (p.status || '').toUpperCase();
    if (statusTab === 'PAID' && s !== 'PAID' && s !== 'COMPLETED') return false;
    if (statusTab === 'PENDING' && (s === 'PAID' || s === 'COMPLETED')) return false;
    const date = new Date(p.createdAt ?? p.date ?? p.paidAt ?? 0);
    if (dateFrom && date < new Date(dateFrom)) return false;
    if (dateTo && date > new Date(dateTo + 'T23:59:59')) return false;
    return true;
  });

  const totalPaid = payments
    .filter((p) => {
      const s = (p.status || '').toUpperCase();
      return s === 'PAID' || s === 'COMPLETED';
    })
    .reduce((s, p) => s + (Number(p.amount) || 0), 0);

  const totalPending = payments
    .filter((p) => {
      const s = (p.status || '').toUpperCase();
      return s !== 'PAID' && s !== 'COMPLETED';
    })
    .reduce((s, p) => s + (Number(p.amount) || 0), 0);

  const handleRetry = async (id) => {
    setPayments((prev) => prev.map((p) => p.id === id ? { ...p, retrying: true } : p));
    try {
      const res = await paymentApi.retry(id);
      if (res?.paymentUrl) {
        window.location.href = res.paymentUrl;
      } else {
        toast.error('Không thể tạo link thanh toán.');
      }
    } catch (err) {
      toast.error(err.displayMessage || 'Có lỗi xảy ra khi tạo link thanh toán.');
    } finally {
      setPayments((prev) => prev.map((p) => p.id === id ? { ...p, retrying: false } : p));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <h1 className="text-2xl font-bold text-ink-900 dark:text-ink-50">Lịch sử thanh toán</h1>

      {/* Summary */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <Skeleton key={i} variant="rect" className="h-20 w-full rounded-2xl" />
          ))}
        </div>
      ) : (
        <SummaryBar totalPaid={totalPaid} totalPending={totalPending} />
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        {/* Status tabs */}
        <div className="flex items-center rounded-xl border border-ink-200 dark:border-ink-700 overflow-hidden">
          {STATUS_TABS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setStatusTab(value)}
              className={[
                'px-4 h-10 text-sm font-medium transition-colors',
                statusTab === value
                  ? 'bg-primary-500 text-white'
                  : 'bg-white dark:bg-ink-900 text-ink-500 dark:text-ink-400 hover:bg-ink-50 dark:hover:bg-ink-800',
              ].join(' ')}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Date range */}
        <div className="flex items-center gap-2 text-sm text-ink-500">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="h-10 px-3 rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 text-sm text-ink-900 dark:text-ink-50 outline-none focus:border-primary-500 transition-colors"
          />
          <span>—</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="h-10 px-3 rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 text-sm text-ink-900 dark:text-ink-50 outline-none focus:border-primary-500 transition-colors"
          />
          {(dateFrom || dateTo) && (
            <button
              type="button"
              onClick={() => { setDateFrom(''); setDateTo(''); }}
              className="text-xs text-ink-400 hover:text-ink-600 transition-colors"
            >
              Xoá lọc
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} variant="rect" className="h-12 w-full rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center py-20 text-center border-2 border-dashed border-ink-200 dark:border-ink-700 rounded-2xl"
        >
          <Wallet className="h-10 w-10 text-ink-300 mb-3" />
          <p className="font-medium text-ink-600 dark:text-ink-200">
            {payments.length === 0 ? 'Chưa có giao dịch nào' : 'Không có kết quả phù hợp'}
          </p>
        </motion.div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-ink-100 dark:border-ink-700 bg-white dark:bg-ink-900 shadow-soft">
          <table className="w-full text-sm border-collapse min-w-[640px]">
            <thead>
              <tr className="border-b border-ink-100 dark:border-ink-700">
                {['Bài đăng', 'Loại', 'Số tiền', 'Trạng thái', 'Ngày', 'Ghi chú'].map((h, i) => (
                  <th
                    key={h}
                    className={[
                      'py-3 px-3 first:pl-4 last:pr-4 text-xs font-semibold text-ink-400 uppercase tracking-wider',
                      i >= 2 && i <= 4 ? 'text-right' : 'text-left',
                    ].join(' ')}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((payment, i) => (
                <PaymentRow key={payment.id} payment={{ ...payment, onRetry: handleRetry }} index={i} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
