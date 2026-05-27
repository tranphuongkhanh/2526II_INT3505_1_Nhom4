import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Image as ImageIcon, CheckCircle, XCircle, FileText,
  MapPin, Ruler, Wind, Refrigerator, ShieldCheck, Flame,
  Wifi, Zap, Droplets, Home, Calendar, Eye,
} from 'lucide-react';
import { postApi } from '../../lib/api';
import { springs } from '../../lib/animations';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import Skeleton from '../../components/ui/Skeleton';
import Modal from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';

const STATUS_META = {
  PENDING:  { label: 'Chờ duyệt', variant: 'pending' },
  APPROVED: { label: 'Đã duyệt',  variant: 'approved' },
  REJECTED: { label: 'Từ chối',   variant: 'rejected' },
};

const ROOM_TYPE_LABEL = {
  PHONG_TRO: 'Phòng trọ', CHUNG_CU_MINI: 'Chung cư mini',
  O_GHEP: 'Ở ghép', HOMESTAY: 'Homestay',
};

function fmtPrice(v) {
  if (v == null || Number(v) === 0) return null;
  return Number(v).toLocaleString('vi-VN');
}

const TABS = [
  { key: 'PENDING',  label: 'Chờ duyệt', pulse: true },
  { key: 'APPROVED', label: 'Đã duyệt' },
  { key: 'REJECTED', label: 'Từ chối' },
  { key: 'ALL',      label: 'Tất cả' },
];

const fmt = (d) => d ? new Date(d).toLocaleDateString('vi-VN') : '—';
const toArr = (x) => Array.isArray(x) ? x : (x?.content ?? x?.items ?? x?.data ?? []);

// ── Stamp overlay ──────────────────────────────────────────
function StampOverlay({ type }) {
  const approve = type === 'approve';
  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center z-20 rounded-2xl"
      style={{ background: approve ? 'rgba(16,185,129,0.07)' : 'rgba(239,68,68,0.07)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        initial={{ scale: 0.3, rotate: -15, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
        className={`border-4 rounded-xl px-8 py-3 -rotate-6 ${
          approve ? 'border-green-500' : 'border-red-500'
        }`}
      >
        <span className={`text-2xl font-black tracking-widest ${
          approve ? 'text-green-500' : 'text-red-500'
        }`}>
          {approve ? 'APPROVED' : 'REJECTED'}
        </span>
      </motion.div>
    </motion.div>
  );
}

// ── Post detail modal ──────────────────────────────────────
function PostDetailModal({ post, onClose, onApprove, onReject }) {
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => { setActiveIdx(0); }, [post?.id]);

  if (!post) return null;
  const images = post.images ?? [];
  const activeImg = images[activeIdx]?.imageUrl;
  const address = [post.address, post.ward, post.district, post.city].filter(Boolean).join(', ');

  const amenities = [
    post.hasAc        && { icon: Wind,        label: 'Điều hoà' },
    post.hasFridge    && { icon: Refrigerator, label: 'Tủ lạnh' },
    post.hasPrivateWc && { icon: Flame,        label: 'WC riêng' },
    post.hasSecurity  && { icon: ShieldCheck,  label: 'Bảo vệ' },
  ].filter(Boolean);

  const fees = [
    { icon: Wifi,     label: 'Wifi',     value: fmtPrice(post.wifiFee),                unit: '/tháng' },
    { icon: Zap,      label: 'Điện',     value: fmtPrice(post.electricityPricePerUnit), unit: '/số' },
    { icon: Droplets, label: 'Nước',     value: fmtPrice(post.waterPricePerUnit),       unit: '/m³' },
    { icon: Home,     label: 'Dịch vụ', value: fmtPrice(post.serviceFee),             unit: '/tháng' },
  ].filter((f) => f.value);

  return (
    <Modal
      isOpen={!!post}
      onClose={onClose}
      title="Chi tiết bài đăng"
      size="lg"
      footer={
        post.status === 'PENDING' ? (
          <>
            <Button variant="ghost" onClick={onClose}>Đóng</Button>
            <Button variant="danger" icon={XCircle} onClick={() => { onClose(); onReject(post); }}>Từ chối</Button>
            <Button icon={CheckCircle} onClick={() => { onClose(); onApprove(post); }}>Duyệt bài</Button>
          </>
        ) : (
          <Button variant="ghost" onClick={onClose}>Đóng</Button>
        )
      }
    >
      <div className="space-y-4 py-1">
        {/* Main image with prev/next */}
        <div className="relative h-56 rounded-2xl overflow-hidden bg-ink-100 dark:bg-ink-800 group">
          {activeImg
            ? <img src={activeImg} alt="" className="w-full h-full object-cover transition-opacity duration-200" />
            : <div className="h-full flex items-center justify-center"><ImageIcon className="h-10 w-10 text-ink-300" /></div>}

          {/* Prev / Next */}
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => setActiveIdx((i) => (i - 1 + images.length) % images.length)}
                className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
              </button>
              <button
                type="button"
                onClick={() => setActiveIdx((i) => (i + 1) % images.length)}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </button>
              {/* Dot indicators */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                {images.map((_, i) => (
                  <button key={i} type="button" onClick={() => setActiveIdx(i)}
                    className={`h-1.5 rounded-full transition-all ${i === activeIdx ? 'w-4 bg-white' : 'w-1.5 bg-white/50'}`}
                  />
                ))}
              </div>
            </>
          )}

          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent px-4 pb-6 pt-10 pointer-events-none">
            <p className="text-white font-semibold text-base leading-tight">{post.roomTitle}</p>
            <p className="text-white/70 text-xs mt-0.5">{ROOM_TYPE_LABEL[post.roomType] ?? post.roomType ?? '—'}</p>
          </div>
        </div>

        {/* Thumbnail strip */}
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {images.map((img, i) => (
              <button key={img.id ?? i} type="button" onClick={() => setActiveIdx(i)}
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
            <p className="text-xs text-ink-400">{post.ownerEmail}</p>
          </div>
          <div className="text-right text-xs text-ink-400 space-y-0.5">
            <div className="flex items-center gap-1 justify-end"><Calendar className="h-3.5 w-3.5" />Đăng: {fmt(post.createdAt)}</div>
            {post.startDate && <div className="flex items-center gap-1 justify-end"><Eye className="h-3.5 w-3.5" />Hiệu lực: {fmt(post.startDate)} – {fmt(post.endDate)}</div>}
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
            <p className="text-sm text-ink-600 dark:text-ink-200 leading-relaxed">{post.description}</p>
          </div>
        )}

        {/* Amenities */}
        {amenities.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {amenities.map(({ icon: Icon, label }) => (
              <span key={label} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 text-xs font-medium">
                <Icon className="h-3.5 w-3.5" />{label}
              </span>
            ))}
          </div>
        )}

        {/* Fees */}
        {fees.length > 0 && (
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
        )}

        {/* Deposit */}
        {fmtPrice(post.deposit) && (
          <p className="text-xs text-ink-400">Đặt cọc: <span className="font-semibold text-ink-700 dark:text-ink-200">{fmtPrice(post.deposit)} VNĐ</span></p>
        )}

        {/* Reject reason */}
        {post.status === 'REJECTED' && post.rejectReason && (
          <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 p-3 text-sm text-red-700 dark:text-red-400">
            <p className="font-medium mb-1">Lý do từ chối:</p>
            <p>{post.rejectReason}</p>
          </div>
        )}
      </div>
    </Modal>
  );
}

// ── Post card ──────────────────────────────────────────────
function PostCard({ post, onViewDetail, stampType, removing }) {
  const isPending = post.status === 'PENDING';
  const thumbnail = post.images?.find((i) => i.thumbnail)?.imageUrl ?? post.images?.[0]?.imageUrl;

  return (
    <motion.div
      layout
      animate={removing ? { x: '-110%', opacity: 0 } : { x: 0, opacity: 1 }}
      transition={removing ? { duration: 0.45, ease: [0.4, 0, 0.2, 1] } : springs.smooth}
      className={[
        'relative rounded-2xl border overflow-hidden shadow-soft',
        isPending
          ? 'border-l-4 border-amber-400 bg-amber-50/30 dark:bg-amber-900/10 border-r-ink-100 border-t-ink-100 border-b-ink-100 dark:border-r-ink-700 dark:border-t-ink-700 dark:border-b-ink-700'
          : 'bg-white dark:bg-ink-800 border-ink-100 dark:border-ink-700',
      ].join(' ')}
    >
      {stampType && <StampOverlay type={stampType} />}
      <div className="flex items-center gap-4 p-5">
        <div className="h-16 w-20 rounded-xl bg-ink-100 dark:bg-ink-700 shrink-0 overflow-hidden flex items-center justify-center">
          {thumbnail
            ? <img src={thumbnail} alt="" className="w-full h-full object-cover" />
            : <ImageIcon className="h-6 w-6 text-ink-300" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 flex-wrap">
            <p className="font-semibold text-ink-900 dark:text-ink-50 truncate max-w-xs">{post.roomTitle || '—'}</p>
            <Badge variant={STATUS_META[post.status]?.variant ?? 'info'}>
              {STATUS_META[post.status]?.label ?? post.status}
            </Badge>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Avatar src={post.ownerAvatar} name={post.ownerName} size="sm" />
            <span className="text-xs text-ink-400">{post.ownerName || '—'}</span>
          </div>
          <p className="text-xs text-ink-400 mt-0.5">Đăng: {fmt(post.createdAt)}</p>
        </div>
        <button
          type="button"
          onClick={() => onViewDetail(post)}
          className="flex items-center gap-1.5 text-sm text-primary-500 hover:text-primary-700 transition-colors shrink-0 font-medium"
        >
          Xem chi tiết
        </button>
      </div>
    </motion.div>
  );
}

// ── Page ───────────────────────────────────────────────────
export default function PostModerationPage() {
  const toast = useToast();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusTab, setStatusTab] = useState('PENDING');
  const [stampInfo, setStampInfo] = useState({});
  const [removingIds, setRemovingIds] = useState(new Set());
  const [detailPost, setDetailPost] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    postApi.adminGetAll({ size: 500 })
      .then((d) => { if (!ignore) setPosts(toArr(d)); })
      .catch(() => { /* keep whatever we have; don't wipe on transient errors */ })
      .finally(() => { if (!ignore) setLoading(false); });
    return () => { ignore = true; };
  }, []);

  const counts = {
    ALL:      posts.length,
    PENDING:  posts.filter((p) => p.status === 'PENDING').length,
    APPROVED: posts.filter((p) => p.status === 'APPROVED').length,
    REJECTED: posts.filter((p) => p.status === 'REJECTED').length,
  };

  const filtered = statusTab === 'ALL' ? posts : posts.filter((p) => p.status === statusTab);

  const processPost = useCallback(async (id, type, payload) => {
    setBusy(true);
    try {
      await postApi.adminUpdateStatus(id, payload).catch(() => {});
      setStampInfo((prev) => ({ ...prev, [id]: type }));
      setTimeout(() => {
        setRemovingIds((prev) => new Set([...prev, id]));
        setTimeout(() => {
          const newStatus = type === 'approve' ? 'APPROVED' : 'REJECTED';
          setPosts((prev) => prev.map((p) => p.id !== id ? p : { ...p, status: newStatus }));
          setStampInfo((prev) => { const n = { ...prev }; delete n[id]; return n; });
          setRemovingIds((prev) => { const s = new Set(prev); s.delete(id); return s; });
        }, 500);
      }, 1100);
      toast.success(type === 'approve' ? 'Đã duyệt bài đăng' : 'Đã từ chối bài đăng');
    } finally {
      setBusy(false);
    }
  }, [toast]);

  const handleApprove = useCallback((post) => {
    processPost(post.id, 'approve', { status: 'APPROVED' });
  }, [processPost]);

  const handleRejectSubmit = useCallback(async () => {
    if (!rejectTarget) return;
    await processPost(rejectTarget.id, 'reject', { status: 'REJECTED', rejectReason });
    setRejectTarget(null);
    setRejectReason('');
  }, [rejectTarget, rejectReason, processPost]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-ink-900 dark:text-ink-50">Kiểm duyệt bài đăng</h1>
        <p className="text-ink-400 mt-1 text-sm">Duyệt và quản lý các bài đăng phòng trọ.</p>
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
              <span className={[
                'text-xs rounded-full px-1.5 font-semibold',
                tab.pulse && tab.key === statusTab ? 'animate-pulse' : '',
                statusTab === tab.key
                  ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/40 dark:text-primary-300'
                  : 'bg-ink-100 dark:bg-ink-700 text-ink-500',
              ].join(' ')}>
                {counts[tab.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Post list */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="text-center py-16 text-ink-400">
          <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Không có bài đăng nào trong mục này.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          <AnimatePresence initial={false}>
            {filtered.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onViewDetail={setDetailPost}
                stampType={stampInfo[post.id]}
                removing={removingIds.has(post.id)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Post detail modal */}
      <PostDetailModal
        post={detailPost}
        onClose={() => setDetailPost(null)}
        onApprove={handleApprove}
        onReject={(post) => { setRejectTarget(post); setRejectReason(''); }}
      />

      {/* Reject modal */}
      <Modal
        isOpen={Boolean(rejectTarget)}
        onClose={() => { setRejectTarget(null); setRejectReason(''); }}
        title="Từ chối bài đăng"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => { setRejectTarget(null); setRejectReason(''); }}>
              Huỷ
            </Button>
            <Button variant="danger" onClick={handleRejectSubmit} loading={busy} disabled={!rejectReason.trim()}>
              Xác nhận từ chối
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-ink-600 dark:text-ink-200">
            Nhập lý do từ chối bài đăng <strong className="text-ink-900 dark:text-ink-50">{rejectTarget?.roomTitle}</strong>:
          </p>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Lý do từ chối..."
            rows={4}
            className="w-full rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 text-sm text-ink-900 dark:text-ink-50 placeholder-ink-400 px-4 py-3 focus:outline-none focus:border-primary-500 transition-colors resize-none"
          />
        </div>
      </Modal>
    </div>
  );
}
