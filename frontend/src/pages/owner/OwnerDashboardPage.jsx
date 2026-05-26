import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Home, FileText, Wallet, TrendingUp, Plus, ArrowRight, Eye,
} from 'lucide-react';
import { roomApi, postApi, paymentApi } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { springs } from '../../lib/animations';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Skeleton from '../../components/ui/Skeleton';

// ── Text scramble ──────────────────────────────────────────
const SCRAMBLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

function useScramble(target, active) {
  const [display, setDisplay] = useState('—');
  const timer = useRef(null);

  useEffect(() => {
    if (!active || target == null) return undefined;
    const str = String(target);
    const DURATION = 800;
    const TICK = 50;
    const start = Date.now();

    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / DURATION, 1);
      if (progress >= 1) { setDisplay(str); return; }
      const revealed = Math.floor(progress * str.length);
      setDisplay(
        str.split('').map((ch, i) => {
          if (i < revealed) return ch;
          if (ch === ' ' || ch === ',' || ch === '.') return ch;
          return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
        }).join(''),
      );
      timer.current = setTimeout(tick, TICK);
    };

    timer.current = setTimeout(tick, TICK);
    return () => clearTimeout(timer.current);
  }, [active, target]);

  return display;
}

// ── Stat card ──────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, colorBg, colorText, delay, scrambleActive }) {
  const display = useScramble(value, scrambleActive);
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springs.smooth, delay }}
    >
      <Card className="flex items-start gap-4" padding="md">
        <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 ${colorBg}`}>
          <Icon className={`h-6 w-6 ${colorText}`} />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-ink-400 uppercase tracking-wide truncate">{label}</p>
          <p className="mt-0.5 text-2xl font-bold font-mono text-ink-900 dark:text-ink-50 tabular-nums">
            {value == null ? '···' : display}
          </p>
        </div>
      </Card>
    </motion.div>
  );
}

// ── Magnetic quick-action card ─────────────────────────────
function MagneticCard({ icon: Icon, title, desc, to, colorBg, colorText }) {
  const navigate = useNavigate();
  const ref = useRef(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const onMove = useCallback((e) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    setPos({
      x: ((e.clientX - cx) / (rect.width / 2)) * 6,
      y: ((e.clientY - cy) / (rect.height / 2)) * 6,
    });
  }, []);

  const onLeave = useCallback(() => setPos({ x: 0, y: 0 }), []);

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      onClick={() => navigate(to)}
      whileHover={{ y: -6, boxShadow: '0 24px 48px rgba(15,23,42,0.18)' }}
      transition={springs.smooth}
      className="group bg-white dark:bg-ink-800 rounded-2xl border border-ink-100 dark:border-ink-700 shadow-soft p-6 cursor-pointer"
    >
      <motion.div
        animate={{ x: pos.x, y: pos.y }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="flex flex-col gap-4"
      >
        <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${colorBg}`}>
          <Icon className={`h-6 w-6 ${colorText}`} />
        </div>
        <div>
          <h3 className="font-semibold text-ink-900 dark:text-ink-50">{title}</h3>
          <p className="text-sm text-ink-400 mt-0.5">{desc}</p>
        </div>
        <span className="flex items-center gap-1 text-primary-500 text-sm font-medium">
          Mở trang
          <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
        </span>
      </motion.div>
    </motion.div>
  );
}

// ── Status badge ───────────────────────────────────────────
function StatusBadge({ status }) {
  const cfg = {
    APPROVED: { label: 'Đang hiển thị', cls: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    PENDING:  { label: 'Chờ duyệt',     cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
    REJECTED: { label: 'Bị từ chối',    cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
    HIDDEN:   { label: 'Đã ẩn',         cls: 'bg-ink-100 text-ink-600 dark:bg-ink-700 dark:text-ink-300' },
  }[status] ?? { label: status ?? '—', cls: 'bg-ink-100 text-ink-600' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

// ── Page ───────────────────────────────────────────────────
export default function OwnerDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [posts, setPosts] = useState([]);
  const [payments, setPayments] = useState([]);
  const [scrambleActive, setScrambleActive] = useState(false);

  useEffect(() => {
    Promise.all([
      roomApi.getAll(),
      postApi.getMyPosts(),
      paymentApi.getMyPayments(),
    ]).then(([r, p, pay]) => {
      const toArr = (x) => (Array.isArray(x) ? x : (x?.content ?? x?.items ?? x?.data ?? []));
      setRooms(toArr(r));
      setPosts(toArr(p));
      setPayments(toArr(pay));
      setTimeout(() => setScrambleActive(true), 80);
    }).catch(() => {
      setError(true);
    }).finally(() => {
      setLoading(false);
    });
  }, []);

  const activeRooms = useMemo(() => rooms.filter((r) => r.rentalStatus === 'AVAILABLE').length, [rooms]);
  const totalRevenue = useMemo(() => payments.reduce((s, p) => s + (p.amount ?? 0), 0), [payments]);
  const activePosts = useMemo(() => posts.filter((p) => p.status === 'APPROVED').length, [posts]);

  const stats = [
    { icon: Home, label: 'Tổng phòng', value: loading ? null : rooms.length, colorBg: 'bg-primary-50 dark:bg-primary-900/30', colorText: 'text-primary-500', delay: 0 },
    { icon: TrendingUp, label: 'Phòng trống', value: loading ? null : activeRooms, colorBg: 'bg-green-50 dark:bg-green-900/30', colorText: 'text-green-500', delay: 0.08 },
    { icon: FileText, label: 'Bài đăng active', value: loading ? null : activePosts, colorBg: 'bg-blue-50 dark:bg-blue-900/30', colorText: 'text-blue-500', delay: 0.16 },
    { icon: Wallet, label: 'Doanh thu (VNĐ)', value: loading ? null : totalRevenue.toLocaleString('vi-VN'), colorBg: 'bg-amber-50 dark:bg-amber-900/30', colorText: 'text-amber-500', delay: 0.24 },
  ];

  const quickActions = [
    { icon: Home, title: 'Quản lý phòng', desc: 'Thêm, sửa, xoá phòng trọ', to: '/owner/rooms', colorBg: 'bg-primary-50 dark:bg-primary-900/30', colorText: 'text-primary-500' },
    { icon: FileText, title: 'Quản lý bài đăng', desc: 'Tạo và theo dõi bài đăng', to: '/owner/posts', colorBg: 'bg-blue-50 dark:bg-blue-900/30', colorText: 'text-blue-500' },
    { icon: Wallet, title: 'Lịch sử thanh toán', desc: 'Xem giao dịch thanh toán', to: '/owner/payments', colorBg: 'bg-green-50 dark:bg-green-900/30', colorText: 'text-green-500' },
  ];

  const recentPosts = useMemo(
    () => [...posts].sort((a, b) => new Date(b.createdAt ?? 0) - new Date(a.createdAt ?? 0)).slice(0, 5),
    [posts],
  );

  if (!loading && error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springs.smooth}
        className="flex flex-col items-center justify-center py-24 text-center"
      >
        <p className="text-ink-400">Không thể tải dữ liệu. Vui lòng thử lại sau.</p>
      </motion.div>
    );
  }

  if (!loading && rooms.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springs.smooth}
        className="flex flex-col items-center justify-center py-24 text-center"
      >
        <motion.div
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut' }}
          className="h-20 w-20 rounded-3xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center mb-6"
        >
          <Home className="h-10 w-10 text-primary-500" />
        </motion.div>
        <h2 className="text-2xl font-bold text-ink-900 dark:text-ink-50">
          Chào mừng, {user?.fullName ?? 'chủ trọ'}!
        </h2>
        <p className="mt-2 text-ink-400 max-w-md">
          Bạn chưa có phòng nào. Hãy thêm phòng đầu tiên để bắt đầu quản lý.
        </p>
        <Button className="mt-6" icon={Plus} onClick={() => navigate('/owner/rooms')}>
          Thêm phòng đầu tiên
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={springs.smooth}>
        <h1 className="text-2xl font-bold text-ink-900 dark:text-ink-50">
          Xin chào, {user?.fullName ?? 'chủ trọ'} 👋
        </h1>
        <p className="text-ink-400 mt-1 text-sm">Tổng quan hoạt động của bạn.</p>
      </motion.div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} scrambleActive={scrambleActive} />
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-lg font-semibold text-ink-900 dark:text-ink-50 mb-4">Thao tác nhanh</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {quickActions.map((a) => <MagneticCard key={a.to} {...a} />)}
        </div>
      </div>

      {/* Recent posts */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-ink-900 dark:text-ink-50">Bài đăng gần đây</h2>
          <button
            type="button"
            onClick={() => navigate('/owner/posts')}
            className="text-sm text-primary-500 hover:text-primary-700 flex items-center gap-1 transition-colors"
          >
            Xem tất cả <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
          </div>
        ) : recentPosts.length === 0 ? (
          <Card className="text-center py-10 text-ink-400 text-sm">Chưa có bài đăng nào.</Card>
        ) : (
          <Card padding="none" className="overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-100 dark:border-ink-700">
                  <th className="text-left px-6 py-3 text-xs font-medium text-ink-400 uppercase tracking-wide">Tiêu đề</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-ink-400 uppercase tracking-wide">Trạng thái</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-ink-400 uppercase tracking-wide">Lượt xem</th>
                </tr>
              </thead>
              <tbody>
                {recentPosts.map((p, i) => (
                  <motion.tr
                    key={p.id ?? p.postId ?? i}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ ...springs.smooth, delay: i * 0.05 }}
                    onClick={() => navigate('/owner/posts')}
                    className="border-b border-ink-100 dark:border-ink-700 last:border-0 hover:bg-ink-50 dark:hover:bg-ink-800/50 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4 font-medium text-ink-900 dark:text-ink-50 truncate max-w-[240px]">
                      {p.roomTitle ?? '—'}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="px-6 py-4 text-right text-ink-400 tabular-nums">
                      <span className="inline-flex items-center justify-end gap-1">
                        <Eye className="h-3.5 w-3.5" />
                        {p.viewCount ?? 0}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>
    </div>
  );
}
