import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Eye, Heart, Calendar, AlertCircle, BarChart2, Plus,
  X, TrendingUp, RefreshCw, Home,
} from 'lucide-react';
import { postApi, roomApi } from '../../lib/api';
import { useToast } from '../../components/ui/Toast';
import { springs } from '../../lib/animations';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Skeleton from '../../components/ui/Skeleton';
import Input from '../../components/ui/Input';

// ── Status config ──────────────────────────────────────────
const STATUS_TABS = [
  { key: 'ALL',             label: 'Tất cả' },
  { key: 'APPROVED',        label: 'Đang hiển thị' },
  { key: 'PENDING',         label: 'Chờ duyệt' },
  { key: 'HIDDEN_REJECTED', label: 'Ẩn / Từ chối' },
];

const STATUS_BADGE = {
  APPROVED: { label: 'Đang hiển thị', cls: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  PENDING:  { label: 'Chờ duyệt',     cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 animate-pulse-glow' },
  REJECTED: { label: 'Bị từ chối',    cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  HIDDEN:   { label: 'Đã ẩn',         cls: 'bg-ink-100 text-ink-600 dark:bg-ink-700 dark:text-ink-300' },
};

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('vi-VN');
}

// ── SVG Line + Area + Bar charts ───────────────────────────
function LineChart({ data }) {
  const W = 400; const H = 100; const PAD = 20;
  if (!data || data.length < 2) return <div className="h-24 flex items-center justify-center text-ink-400 text-sm">Không có dữ liệu</div>;

  const vals = data.map((d) => d.count ?? d.value ?? 0);
  const max = Math.max(...vals, 1);
  const pts = vals.map((v, i) => ({
    x: PAD + (i / (vals.length - 1)) * (W - PAD * 2),
    y: H - PAD - (v / max) * (H - PAD * 2),
  }));
  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${pts[pts.length - 1].x} ${H - PAD} L ${pts[0].x} ${H - PAD} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="area-grad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#14919B" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#14919B" stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.path d={areaPath} fill="url(#area-grad)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.85, duration: 0.4 }} />
      <motion.path d={linePath} fill="none" stroke="#14919B" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} />
      {pts.map((p, i) => (
        <motion.circle key={i} cx={p.x} cy={p.y} r={3} fill="#14919B"
          initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8 + i * 0.04 }} />
      ))}
    </svg>
  );
}

function BarChart({ data }) {
  const W = 400; const H = 100; const PAD = 20;
  if (!data || data.length === 0) return <div className="h-24 flex items-center justify-center text-ink-400 text-sm">Không có dữ liệu</div>;

  const vals = data.map((d) => d.count ?? d.value ?? 0);
  const max = Math.max(...vals, 1);
  const bw = (W - PAD * 2) / data.length;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      {data.map((d, i) => {
        const bh = ((vals[i] / max) * (H - PAD * 2));
        const x = PAD + i * bw + bw * 0.1;
        return (
          <motion.rect key={i} x={x} width={bw * 0.8} rx={3} fill="#14919B" opacity={0.75}
            initial={{ y: H - PAD, height: 0 }}
            animate={{ y: H - PAD - bh, height: bh }}
            transition={{ ...springs.smooth, delay: i * 0.03 + 0.1 }} />
        );
      })}
    </svg>
  );
}

// ── Stats drawer ───────────────────────────────────────────
function StatsDrawer({ postId, onClose }) {
  const toast = useToast();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!postId) return;
    setLoading(true);
    postApi.getStats(postId)
      .then(setStats)
      .catch(() => toast.error('Không thể tải thống kê.'))
      .finally(() => setLoading(false));
  }, [postId]);

  return (
    <AnimatePresence>
      {postId ? (
        <>
          <motion.div
            key="stats-backdrop"
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            key="stats-panel"
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-white dark:bg-ink-900 border-l border-ink-100 dark:border-ink-700 shadow-elevated flex flex-col"
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={springs.smooth}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-ink-100 dark:border-ink-700">
              <div className="flex items-center gap-2">
                <BarChart2 className="h-5 w-5 text-primary-500" />
                <h3 className="font-semibold text-ink-900 dark:text-ink-50">Thống kê bài đăng</h3>
              </div>
              <button type="button" onClick={onClose} className="p-2 rounded-lg text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {loading ? (
                <div className="space-y-6">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
                </div>
              ) : !stats ? (
                <div className="text-center py-12 text-ink-400">Không có dữ liệu.</div>
              ) : (
                <>
                  {/* Summary */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-ink-50 dark:bg-ink-800 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Eye className="h-4 w-4 text-primary-500" />
                        <span className="text-xs text-ink-400 font-medium">Tổng lượt xem</span>
                      </div>
                      <p className="text-2xl font-bold font-mono text-ink-900 dark:text-ink-50">{stats.totalViews ?? 0}</p>
                    </div>
                    <div className="bg-ink-50 dark:bg-ink-800 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Heart className="h-4 w-4 text-red-500" />
                        <span className="text-xs text-ink-400 font-medium">Tổng lượt thích</span>
                      </div>
                      <p className="text-2xl font-bold font-mono text-ink-900 dark:text-ink-50">{stats.favoriteCount ?? 0}</p>
                    </div>
                  </div>

                  {/* Views by day chart */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="h-4 w-4 text-primary-500" />
                      <h4 className="text-sm font-semibold text-ink-900 dark:text-ink-50">Lượt xem theo ngày</h4>
                    </div>
                    <LineChart data={
                      Object.entries(stats.viewsByDay ?? {})
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([, count]) => ({ count }))
                    } />
                  </div>

                  {/* Views by hour bar chart */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <BarChart2 className="h-4 w-4 text-primary-500" />
                      <h4 className="text-sm font-semibold text-ink-900 dark:text-ink-50">Lượt xem theo giờ</h4>
                    </div>
                    <BarChart data={
                      Object.entries(stats.viewsByHour ?? {})
                        .sort(([a], [b]) => Number(a) - Number(b))
                        .map(([, count]) => ({ count }))
                    } />
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}

// ── Duration config ────────────────────────────────────────
const DURATION_TYPES = [
  { value: 'DAY',     label: 'Ngày' },
  { value: 'WEEK',    label: 'Tuần' },
  { value: 'MONTH',   label: 'Tháng' },
  { value: 'QUARTER', label: 'Quý' },
  { value: 'YEAR',    label: 'Năm' },
];

// ── Extend modal ───────────────────────────────────────────
function ExtendModal({ post, onClose, onExtended }) {
  const toast = useToast();
  const [durationType, setDurationType] = useState('MONTH');
  const [durationValue, setDurationValue] = useState('1');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (post) { setDurationType('MONTH'); setDurationValue('1'); }
  }, [post]);

  const handleExtend = async () => {
    if (!durationValue || Number(durationValue) < 1) {
      toast.error('Vui lòng nhập thời lượng hợp lệ.');
      return;
    }
    setLoading(true);
    try {
      const result = await postApi.extend(post.id ?? post.postId, {
        durationType,
        durationValue: Number(durationValue),
      });
      if (result?.paymentUrl) {
        window.location.href = result.paymentUrl;
        return;
      }
      toast.success('Gia hạn thành công!');
      onExtended?.();
      onClose();
    } catch (err) {
      toast.error(err.displayMessage ?? 'Gia hạn thất bại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={!!post}
      onClose={onClose}
      title="Gia hạn bài đăng"
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Huỷ</Button>
          <Button onClick={handleExtend} loading={loading}>Xác nhận & Thanh toán</Button>
        </>
      }
    >
      <div className="space-y-5 py-2">
        <div>
          <p className="text-sm text-ink-400 mb-1">Ngày hết hạn hiện tại</p>
          <span className="font-mono font-bold text-primary-500 text-lg">{fmtDate(post?.endDate)}</span>
        </div>
        <div>
          <label className="block text-sm font-medium text-ink-700 dark:text-ink-200 mb-1.5">Đơn vị thời gian</label>
          <select
            value={durationType}
            onChange={(e) => setDurationType(e.target.value)}
            className="w-full h-12 rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 text-ink-900 dark:text-ink-50 px-4 text-sm outline-none focus:border-primary-500 transition-colors"
          >
            {DURATION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <Input
          label="Số lượng"
          type="number"
          min="1"
          value={durationValue}
          onChange={(e) => setDurationValue(e.target.value)}
        />
        <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 p-3 text-xs text-amber-700 dark:text-amber-400">
          Sau khi xác nhận, bạn sẽ được chuyển đến trang thanh toán VNPay.
        </div>
      </div>
    </Modal>
  );
}

// ── Create post modal ──────────────────────────────────────
function CreatePostModal({ isOpen, onClose, onCreated }) {
  const toast = useToast();
  const [rooms, setRooms] = useState([]);
  const [roomId, setRoomId] = useState('');
  const [durationType, setDurationType] = useState('MONTH');
  const [durationValue, setDurationValue] = useState('1');
  const [loading, setLoading] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoadingRooms(true);
    roomApi.getAll()
      .then((r) => {
        const arr = Array.isArray(r) ? r : (r?.content ?? r?.items ?? []);
        setRooms(arr);
        if (arr.length) setRoomId(String(arr[0].id));
      })
      .catch(() => toast.error('Không thể tải danh sách phòng.'))
      .finally(() => setLoadingRooms(false));
    setDurationType('MONTH');
    setDurationValue('1');
  }, [isOpen]);

  const selectedRoom = rooms.find((r) => String(r.id) === roomId);

  const handleCreate = async () => {
    if (!roomId) { toast.error('Vui lòng chọn phòng.'); return; }
    if (!durationValue || Number(durationValue) < 1) { toast.error('Vui lòng nhập thời lượng hợp lệ.'); return; }
    setLoading(true);
    try {
      const result = await postApi.create({
        roomId: Number(roomId),
        durationType,
        durationValue: Number(durationValue),
      });
      onCreated?.(result);
      if (result?.paymentUrl) {
        window.location.href = result.paymentUrl;
        return;
      }
      toast.success('Đã tạo bài đăng. Vui lòng thanh toán.');
      onClose();
    } catch (err) {
      toast.error(err.displayMessage ?? 'Tạo bài đăng thất bại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Tạo bài đăng mới"
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Huỷ</Button>
          <Button onClick={handleCreate} loading={loading}>Tạo & Thanh toán</Button>
        </>
      }
    >
      <div className="space-y-5 py-2">
        <div>
          <label className="block text-sm font-medium text-ink-700 dark:text-ink-200 mb-1.5">Chọn phòng</label>
          {loadingRooms ? (
            <Skeleton className="h-12 rounded-xl" />
          ) : (
            <select
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="w-full h-12 rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 text-ink-900 dark:text-ink-50 px-4 text-sm outline-none focus:border-primary-500 transition-colors"
            >
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>{r.title}</option>
              ))}
            </select>
          )}
        </div>

        {selectedRoom && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl bg-ink-50 dark:bg-ink-800 p-3 flex items-center gap-3">
            <Home className="h-4 w-4 text-primary-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-ink-900 dark:text-ink-50 truncate">{selectedRoom.title}</p>
              <p className="text-xs text-ink-400">{Number(selectedRoom.price ?? 0).toLocaleString('vi-VN')} VNĐ/tháng</p>
            </div>
          </motion.div>
        )}

        <div>
          <label className="block text-sm font-medium text-ink-700 dark:text-ink-200 mb-1.5">Đơn vị thời gian</label>
          <select
            value={durationType}
            onChange={(e) => setDurationType(e.target.value)}
            className="w-full h-12 rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 text-ink-900 dark:text-ink-50 px-4 text-sm outline-none focus:border-primary-500 transition-colors"
          >
            {DURATION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>

        <Input
          label="Số lượng"
          type="number"
          min="1"
          value={durationValue}
          onChange={(e) => setDurationValue(e.target.value)}
        />

        <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 p-3 text-xs text-amber-700 dark:text-amber-400">
          Sau khi tạo bài đăng, bạn sẽ được chuyển đến trang thanh toán VNPay. Bài đăng sẽ hiển thị sau khi thanh toán thành công và được admin duyệt.
        </div>
      </div>
    </Modal>
  );
}

// ── Post card ──────────────────────────────────────────────
function PostCard({ post, onDelete, onExtend, onStats }) {
  const id = post.id ?? post.postId;
  const status = post.status;
  const badge = STATUS_BADGE[status] ?? STATUS_BADGE.EXPIRED;
  const thumbnail = post.thumbnailUrl ?? post.room?.images?.[0]?.imageUrl;

  return (
    <motion.div
      layout
      className="bg-white dark:bg-ink-800 rounded-2xl border border-ink-100 dark:border-ink-700 shadow-soft overflow-hidden"
    >
      {/* Rejection reason strip */}
      {status === 'REJECTED' && post.rejectReason ? (
        <div className="bg-red-50 dark:bg-red-900/20 border-b border-red-100 dark:border-red-800 px-4 py-2 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-error shrink-0 mt-0.5" />
          <p className="text-xs text-red-700 dark:text-red-400 leading-relaxed">{post.rejectReason}</p>
        </div>
      ) : null}

      <div className="flex gap-4 p-4">
        {/* Thumbnail */}
        <div className="h-20 w-24 rounded-xl overflow-hidden bg-ink-100 dark:bg-ink-700 shrink-0">
          {thumbnail
            ? <img src={thumbnail} alt="" className="h-full w-full object-cover" />
            : <div className="h-full w-full flex items-center justify-center"><FileText className="h-6 w-6 text-ink-300" /></div>}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-start gap-2 justify-between">
            <h3 className="font-semibold text-ink-900 dark:text-ink-50 text-sm truncate">{post.roomTitle ?? '—'}</h3>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${badge.cls}`}>{badge.label}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-ink-400">
            <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{fmtDate(post.startDate)} – {fmtDate(post.endDate)}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-ink-400">
            <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{post.viewCount ?? 0}</span>
            <span className="flex items-center gap-1"><Heart className="h-3.5 w-3.5" />{post.favoriteCount ?? 0}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-1 px-4 pb-3 pt-0 border-t border-ink-100 dark:border-ink-700 mt-2">
        <button type="button" onClick={() => onStats(id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-ink-600 dark:text-ink-200 hover:bg-ink-100 dark:hover:bg-ink-700 transition-colors">
          <BarChart2 className="h-3.5 w-3.5" /> Thống kê
        </button>
        {status === 'APPROVED' && (
          <button type="button" onClick={() => onExtend(post)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors">
            <RefreshCw className="h-3.5 w-3.5" /> Gia hạn
          </button>
        )}
        <button type="button" onClick={() => onDelete(id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-error hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
          <X className="h-3.5 w-3.5" /> Xoá
        </button>
      </div>
    </motion.div>
  );
}

// ── Page ───────────────────────────────────────────────────
export default function PostManagementPage() {
  const toast = useToast();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');
  const tabRef = useRef(null);
  const [indicatorStyle, setIndicatorStyle] = useState({});
  const tabRefs = useRef({});

  const [statsPostId, setStatsPostId] = useState(null);
  const [extendPost, setExtendPost] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    postApi.getMyPosts()
      .then((p) => setPosts(Array.isArray(p) ? p : (p?.content ?? p?.items ?? p?.data ?? [])))
      .catch(() => toast.error('Không thể tải bài đăng.'))
      .finally(() => setLoading(false));
  }, []);

  // Animated tab underline
  useEffect(() => {
    const el = tabRefs.current[activeTab];
    if (!el || !tabRef.current) return;
    const parentRect = tabRef.current.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    setIndicatorStyle({ left: elRect.left - parentRect.left, width: elRect.width });
  }, [activeTab, posts]);

  const counts = useMemo(() => ({
    ALL: posts.length,
    APPROVED: posts.filter((p) => p.status === 'APPROVED').length,
    PENDING: posts.filter((p) => p.status === 'PENDING').length,
    HIDDEN_REJECTED: posts.filter((p) => p.status === 'HIDDEN' || p.status === 'REJECTED').length,
  }), [posts]);

  const filtered = useMemo(() => {
    if (activeTab === 'ALL') return posts;
    if (activeTab === 'HIDDEN_REJECTED') return posts.filter((p) => p.status === 'HIDDEN' || p.status === 'REJECTED');
    return posts.filter((p) => p.status === activeTab);
  }, [posts, activeTab]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await postApi.delete(deleteId);
      setPosts((prev) => prev.filter((p) => (p.id ?? p.postId) !== deleteId));
      toast.success('Đã xoá bài đăng.');
    } catch (err) {
      toast.error(err.displayMessage ?? 'Xoá thất bại.');
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  const handleExtended = useCallback(() => {
    postApi.getMyPosts()
      .then((p) => setPosts(Array.isArray(p) ? p : (p?.content ?? p?.items ?? p?.data ?? [])))
      .catch(() => {});
  }, []);

  const handleCreated = useCallback((post) => {
    setPosts((prev) => [post, ...prev]);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink-900 dark:text-ink-50">Quản lý bài đăng</h1>
        <Button icon={Plus} onClick={() => setCreateOpen(true)}>Tạo bài đăng</Button>
      </div>

      {/* Status tabs */}
      <div className="border-b border-ink-100 dark:border-ink-700">
        <nav ref={tabRef} className="relative flex gap-1 -mb-px">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              ref={(el) => { tabRefs.current[tab.key] = el; }}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={[
                'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap',
                activeTab === tab.key
                  ? 'text-primary-500'
                  : 'text-ink-400 hover:text-ink-600 dark:hover:text-ink-200',
              ].join(' ')}
            >
              {tab.label}
              {counts[tab.key] > 0 && (
                <span className={[
                  'inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-medium',
                  tab.key === 'PENDING' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 animate-pulse-glow' : 'bg-ink-100 text-ink-600 dark:bg-ink-700 dark:text-ink-300',
                  activeTab === tab.key ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400' : '',
                ].join(' ')}>
                  {counts[tab.key]}
                </span>
              )}
            </button>
          ))}
          {/* Animated underline */}
          <motion.div
            className="absolute bottom-0 h-0.5 bg-primary-500 rounded-full"
            animate={indicatorStyle}
            transition={springs.snappy}
          />
        </nav>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={springs.smooth}
          className="flex flex-col items-center justify-center py-24 text-center">
          <FileText className="h-12 w-12 text-ink-300 mb-4" />
          <h3 className="text-lg font-semibold text-ink-900 dark:text-ink-50">Không có bài đăng</h3>
          <p className="text-sm text-ink-400 mt-1">Tạo bài đăng mới để bắt đầu.</p>
          <Button className="mt-4" icon={Plus} onClick={() => setCreateOpen(true)}>Tạo bài đăng</Button>
        </motion.div>
      ) : (
        <motion.div layout className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((post) => (
              <motion.div
                key={post.id ?? post.postId}
                layout
                initial={{ opacity: 0, y: -16, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, height: 0, marginBottom: 0 }}
                transition={springs.smooth}
              >
                <PostCard
                  post={post}
                  onDelete={(id) => setDeleteId(id)}
                  onExtend={setExtendPost}
                  onStats={setStatsPostId}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Stats drawer */}
      <StatsDrawer postId={statsPostId} onClose={() => setStatsPostId(null)} />

      {/* Extend modal */}
      <ExtendModal post={extendPost} onClose={() => setExtendPost(null)} onExtended={handleExtended} />

      {/* Create modal */}
      <CreatePostModal isOpen={createOpen} onClose={() => setCreateOpen(false)} onCreated={handleCreated} />

      {/* Delete confirm */}
      <AnimatePresence>
        {deleteId ? (
          <motion.div
            key="del-overlay"
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteId(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={springs.snappy}
              className="relative bg-white dark:bg-ink-900 rounded-2xl border border-ink-100 dark:border-ink-700 shadow-elevated p-6 max-w-sm w-full"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center shrink-0">
                  <AlertCircle className="h-5 w-5 text-error" />
                </div>
                <h3 className="text-lg font-semibold text-ink-900 dark:text-ink-50">Xoá bài đăng</h3>
              </div>
              <p className="text-sm text-ink-600 dark:text-ink-200 mb-6">Bài đăng sẽ bị xoá vĩnh viễn. Bạn có chắc không?</p>
              <div className="flex justify-end gap-3">
                <Button variant="ghost" onClick={() => setDeleteId(null)}>Huỷ</Button>
                <Button variant="danger" loading={deleting} onClick={handleDelete}>Xoá</Button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
