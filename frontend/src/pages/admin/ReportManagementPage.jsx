import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flag, ChevronDown, Eye, CheckCircle, XCircle, Image as ImageIcon,
  MapPin, Ruler, Calendar, Loader2,
  Wind, Refrigerator, Flame, ShieldCheck, Wifi, Zap, Droplets, Home,
} from 'lucide-react';
import { reportApi, postApi } from '../../lib/api';
import { springs } from '../../lib/animations';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Skeleton from '../../components/ui/Skeleton';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Modal from '../../components/ui/Modal';
import Avatar from '../../components/ui/Avatar';
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

const ROOM_TYPE_LABEL = {
  PHONG_TRO: 'Phòng trọ', CHUNG_CU_MINI: 'Chung cư mini',
  O_GHEP: 'Ở ghép', HOMESTAY: 'Homestay',
};

function fmtPrice(v) {
  if (v == null || Number(v) === 0) return null;
  return Number(v).toLocaleString('vi-VN');
}

// ── Post preview modal (read-only — shown in-place instead of opening /posts/:id) ─
function PostPreviewModal({ postId, onClose }) {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    if (!postId) { setPost(null); setError(''); return; }
    setLoading(true);
    setError('');
    setActiveIdx(0);
    postApi.getById(postId)
      .then((d) => setPost(d?.data ?? d))
      .catch((e) => setError(e?.displayMessage || 'Không tải được bài đăng.'))
      .finally(() => setLoading(false));
  }, [postId]);

  // The public `/posts/:id` endpoint returns `imageUrls: string[]` and `title`,
  // while the admin moderation endpoint returns `images: [{imageUrl, ...}]` and
  // `roomTitle`. Normalise both shapes so this modal works for either source.
  const images = post
    ? (Array.isArray(post.imageUrls) && post.imageUrls.length > 0
        ? post.imageUrls.map((url, i) => ({ id: i, imageUrl: url }))
        : (post.images ?? []))
    : [];
  const activeImg = images[activeIdx]?.imageUrl;
  const title = post?.roomTitle ?? post?.title ?? '';
  const address = post
    ? [post.address, post.ward, post.district, post.city].filter(Boolean).join(', ')
    : '';

  const amenities = post ? [
    post.hasAc        && { icon: Wind,         label: 'Điều hoà' },
    post.hasFridge    && { icon: Refrigerator, label: 'Tủ lạnh' },
    post.hasPrivateWc && { icon: Flame,        label: 'WC riêng' },
    post.hasSecurity  && { icon: ShieldCheck,  label: 'Bảo vệ' },
  ].filter(Boolean) : [];

  const fees = post ? [
    { icon: Wifi,     label: 'Wifi',    value: fmtPrice(post.wifiFee),                 unit: '/tháng' },
    { icon: Zap,      label: 'Điện',    value: fmtPrice(post.electricityPricePerUnit), unit: '/số' },
    { icon: Droplets, label: 'Nước',    value: fmtPrice(post.waterPricePerUnit),       unit: '/m³' },
    { icon: Home,     label: 'Dịch vụ', value: fmtPrice(post.serviceFee),              unit: '/tháng' },
  ].filter((f) => f.value) : [];

  const fmtDay = (d) => d ? new Date(d).toLocaleDateString('vi-VN') : '—';

  return (
    <Modal isOpen={!!postId} onClose={onClose} title="Xem bài đăng" size="lg">
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        </div>
      ) : error ? (
        <div className="text-center py-12 text-error text-sm">{error}</div>
      ) : !post ? null : (
        <div className="space-y-4 py-1">
          {/* Main image with prev/next */}
          <div className="relative h-56 rounded-2xl overflow-hidden bg-ink-100 dark:bg-ink-800 group">
            {activeImg ? (
              <img src={activeImg} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="h-full flex items-center justify-center"><ImageIcon className="h-10 w-10 text-ink-300" /></div>
            )}

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => setActiveIdx((i) => (i - 1 + images.length) % images.length)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                  aria-label="Ảnh trước"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveIdx((i) => (i + 1) % images.length)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                  aria-label="Ảnh sau"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                </button>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {images.map((_, i) => (
                    <button key={i} type="button" onClick={() => setActiveIdx(i)}
                      className={`h-1.5 rounded-full transition-all ${i === activeIdx ? 'w-4 bg-white' : 'w-1.5 bg-white/50'}`}
                      aria-label={`Ảnh ${i + 1}`}
                    />
                  ))}
                </div>
              </>
            )}

            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent px-4 pb-6 pt-10 pointer-events-none">
              <p className="text-white font-semibold text-base leading-tight">{title}</p>
              <p className="text-white/70 text-xs mt-0.5">{ROOM_TYPE_LABEL[post.roomType] ?? post.roomType ?? '—'}</p>
            </div>
          </div>

          {/* Thumbnail strip */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((img, i) => (
                <button
                  key={img.id ?? i}
                  type="button"
                  onClick={() => setActiveIdx(i)}
                  className={`h-14 w-18 shrink-0 rounded-xl overflow-hidden border-2 transition-colors ${i === activeIdx ? 'border-primary-500' : 'border-transparent hover:border-ink-300'}`}
                >
                  <img src={img.imageUrl} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Owner + dates */}
          <div className="flex items-center gap-3 rounded-xl bg-ink-50 dark:bg-ink-800 p-3">
            <Avatar src={post.ownerAvatar} name={post.ownerName} size="md" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-ink-900 dark:text-ink-50">{post.ownerName || '—'}</p>
              <p className="text-xs text-ink-400">{post.ownerEmail || post.ownerPhone || ''}</p>
            </div>
            <div className="text-right text-xs text-ink-400 space-y-0.5">
              <div className="flex items-center gap-1 justify-end">
                <Calendar className="h-3.5 w-3.5" />Đăng: {fmtDay(post.createdAt)}
              </div>
              {post.startDate && (
                <div className="flex items-center gap-1 justify-end">
                  <Eye className="h-3.5 w-3.5" />Hiệu lực: {fmtDay(post.startDate)} – {fmtDay(post.endDate)}
                </div>
              )}
            </div>
          </div>

          {/* Price + area */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-2xl font-bold text-primary-500">{fmtPrice(post.price) ?? '—'}</span>
              <span className="text-sm text-ink-400 ml-1">VNĐ/tháng</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-ink-500">
              <Ruler className="h-4 w-4" />{post.areaMq ?? '?'} m²
            </div>
          </div>

          {/* Address */}
          {address && (
            <div className="flex items-start gap-2 text-sm text-ink-500 dark:text-ink-300">
              <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-ink-400" />
              <span>{address}</span>
            </div>
          )}

          {/* Description */}
          {post.description && (
            <div>
              <p className="text-xs font-medium text-ink-400 uppercase tracking-wide mb-1">Mô tả</p>
              <p className="text-sm text-ink-600 dark:text-ink-200 leading-relaxed whitespace-pre-line">{post.description}</p>
            </div>
          )}

          {/* Amenities */}
          {amenities.length > 0 && (
            <div>
              <p className="text-xs font-medium text-ink-400 uppercase tracking-wide mb-1.5">Tiện nghi</p>
              <div className="flex flex-wrap gap-2">
                {amenities.map(({ icon: Icon, label }) => (
                  <span key={label} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 text-xs font-medium">
                    <Icon className="h-3.5 w-3.5" />{label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Fees */}
          {fees.length > 0 && (
            <div>
              <p className="text-xs font-medium text-ink-400 uppercase tracking-wide mb-1.5">Chi phí dịch vụ</p>
              <div className="grid grid-cols-2 gap-2">
                {fees.map(({ icon: Icon, label, value, unit }) => (
                  <div key={label} className="flex items-center gap-2 rounded-xl bg-ink-50 dark:bg-ink-800 px-3 py-2">
                    <Icon className="h-3.5 w-3.5 text-ink-400 shrink-0" />
                    <div>
                      <p className="text-[10px] text-ink-400 leading-none mb-0.5">{label}</p>
                      <p className="text-xs font-semibold text-ink-800 dark:text-ink-100">{value} VNĐ{unit}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Deposit */}
          {fmtPrice(post.deposit) && (
            <p className="text-xs text-ink-400">
              Đặt cọc: <span className="font-semibold text-ink-700 dark:text-ink-200">{fmtPrice(post.deposit)} VNĐ</span>
            </p>
          )}

          {/* Rejection reason (if any) */}
          {post.status === 'REJECTED' && post.rejectReason && (
            <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 p-3 text-sm text-red-700 dark:text-red-400">
              <p className="font-medium mb-1">Lý do từ chối:</p>
              <p>{post.rejectReason}</p>
            </div>
          )}

          {/* Footer meta */}
          <div className="flex items-center justify-between text-[11px] text-ink-400 pt-2 border-t border-ink-100 dark:border-ink-700">
            <span>ID bài đăng: <span className="font-mono text-ink-500">#{post.id}</span></span>
            {post.status && (
              <span>Trạng thái: <span className="font-medium text-ink-600 dark:text-ink-300">{post.status}</span></span>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}

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
function ReportItem({ report, expanded, onToggle, onResolve, onReject, onPreviewPost, stampActive, busy }) {
  const [note, setNote] = useState('');

  const reporterName = report.reporter_name ?? report.reporterName ?? '—';
  const reporterEmail = report.reporter_email ?? report.reporterEmail;
  const postTitle = report.post_title ?? report.postTitle ?? `#${report.post_id ?? report.postId ?? '?'}`;
  const postId = report.post_id ?? report.postId;
  const createdAt = report.created_at ?? report.createdAt;

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
              <span className="text-sm font-medium text-ink-900 dark:text-ink-50">
                <span className="text-ink-500 font-normal">{reporterName}</span>
                {reporterEmail && (
                  <span className="text-ink-400 font-normal text-xs ml-1">({reporterEmail})</span>
                )}
                <span className="text-ink-400 mx-1.5">→</span>
                <span className="text-ink-800 dark:text-ink-100">{postTitle}</span>
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-ink-400 bg-ink-100 dark:bg-ink-700 px-2 py-0.5 rounded-full">
                {REASON_LABELS[report.reason] ?? report.reason ?? '—'}
              </span>
              <span className="text-xs text-ink-400">{fmt(createdAt)}</span>
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

                {/* Reporter details */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-ink-50 dark:bg-ink-800 rounded-xl px-4 py-3">
                    <p className="text-xs font-medium text-ink-400 uppercase tracking-wide mb-1">Người báo cáo</p>
                    <p className="text-sm font-semibold text-ink-800 dark:text-ink-100">{reporterName}</p>
                    {reporterEmail && <p className="text-xs text-ink-400 mt-0.5">{reporterEmail}</p>}
                  </div>
                  <div className="bg-ink-50 dark:bg-ink-800 rounded-xl px-4 py-3">
                    <p className="text-xs font-medium text-ink-400 uppercase tracking-wide mb-1">Bài đăng bị báo cáo</p>
                    <p className="text-sm font-semibold text-ink-800 dark:text-ink-100 truncate">{postTitle}</p>
                    <p className="text-xs text-ink-400 mt-0.5">{fmt(createdAt)}</p>
                  </div>
                </div>

                {/* Full reason */}
                <div>
                  <p className="text-xs font-medium text-ink-400 uppercase tracking-wide mb-1">Nội dung báo cáo</p>
                  <p className="text-sm text-ink-700 dark:text-ink-200 leading-relaxed bg-ink-50 dark:bg-ink-700/50 rounded-xl px-4 py-3">
                    {report.reason || '—'}
                  </p>
                </div>

                {/* Resolution info (resolved/rejected) */}
                {report.resolution && (
                  <div>
                    <p className="text-xs font-medium text-ink-400 uppercase tracking-wide mb-1">Ghi chú xử lý</p>
                    <p className="text-sm text-ink-700 dark:text-ink-200 leading-relaxed bg-amber-50 dark:bg-amber-900/20 rounded-xl px-4 py-3">
                      {report.resolution}
                    </p>
                  </div>
                )}

                {/* Post link */}
                {postId && (
                  <div>
                    <button
                      type="button"
                      onClick={() => onPreviewPost(postId)}
                      className="inline-flex items-center gap-1.5 text-sm text-primary-500 hover:text-primary-700 transition-colors font-medium"
                    >
                      Xem bài đăng <Eye className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                {/* Action buttons */}
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
  const [previewPostId, setPreviewPostId] = useState(null);

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
                onPreviewPost={setPreviewPostId}
                stampActive={stampIds.has(report.id)}
                busy={busy !== null}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Post preview modal */}
      <PostPreviewModal postId={previewPostId} onClose={() => setPreviewPostId(null)} />

      {/* Confirm dialog */}
      <ConfirmDialog
        isOpen={Boolean(confirmDialog)}
        onClose={() => setConfirmDialog(null)}
        title={confirmDialog?.type === 'resolve' ? 'Xác nhận xử lý báo cáo' : 'Từ chối báo cáo'}
        message={
          confirmDialog?.type === 'resolve'
            ? `Xác nhận đánh dấu báo cáo về "${confirmDialog?.report?.post_title ?? confirmDialog?.report?.postTitle}" là đã xử lý?`
            : `Từ chối báo cáo về "${confirmDialog?.report?.post_title ?? confirmDialog?.report?.postTitle}"?`
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
