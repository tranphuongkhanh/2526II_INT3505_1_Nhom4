import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users, Home, FileText, Star, Flag, CheckCircle,
  GraduationCap, Building2, Shield, Clock, Ban,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, Sector,
} from 'recharts';
import api from '../../lib/api';
import { springs } from '../../lib/animations';
import Card from '../../components/ui/Card';
import Skeleton from '../../components/ui/Skeleton';

// ── Helpers ────────────────────────────────────────────────
const SCRAMBLE_CHARS = '0123456789';

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
function StatCard({ icon: Icon, label, value, colorBg, colorText, delay, scrambleActive, pulse, onClick }) {
  const display = useScramble(value, scrambleActive);
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springs.smooth, delay }}
      onClick={onClick}
      className={onClick ? 'cursor-pointer' : ''}
    >
      <Card className="flex items-start gap-4 relative overflow-hidden" padding="md">
        {pulse ? (
          <span className={`absolute top-3 right-3 h-2.5 w-2.5 rounded-full ${colorText.replace('text-', 'bg-')}`}>
            <span className={`absolute inset-0 rounded-full ${colorText.replace('text-', 'bg-')} opacity-75 animate-ping`} />
          </span>
        ) : null}
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

// ── Custom active pie shape ────────────────────────────────
function ActivePieShape(props) {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent } = props;
  return (
    <g>
      <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 8}
        startAngle={startAngle} endAngle={endAngle} fill={fill} />
      <Sector cx={cx} cy={cy} innerRadius={outerRadius + 12} outerRadius={outerRadius + 16}
        startAngle={startAngle} endAngle={endAngle} fill={fill} />
      <text x={cx} y={cy - 6} textAnchor="middle" fill={fill} className="text-sm font-semibold">
        {payload.name}
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" fill="#94a3b8" fontSize={12}>
        {(percent * 100).toFixed(0)}%
      </text>
    </g>
  );
}

// ── Page ───────────────────────────────────────────────────
export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [scrambleActive, setScrambleActive] = useState(false);
  const [activePieIndex, setActivePieIndex] = useState(0);

  useEffect(() => {
    api.get('/admin/statistics')
      .then((r) => {
        const d = r?.data ?? r;
        const next = d?.data ?? d;
        if (next && typeof next === 'object') setStats(next);
      })
      .catch(() => { /* keep prior stats; don't wipe on transient errors */ })
      .finally(() => {
        setLoading(false);
        setTimeout(() => setScrambleActive(true), 80);
      });
  }, []);

  const statCards = stats ? [
    {
      icon: Users, label: 'Tổng người dùng',
      value: stats.totalUsers ?? 0,
      colorBg: 'bg-primary-50 dark:bg-primary-900/30', colorText: 'text-primary-500',
      delay: 0,
    },
    {
      icon: Home, label: 'Tổng phòng',
      value: stats.totalRooms ?? 0,
      colorBg: 'bg-blue-50 dark:bg-blue-900/30', colorText: 'text-blue-500',
      delay: 0.08,
    },
    {
      icon: FileText, label: 'Bài đăng active',
      value: stats.postsByStatus?.APPROVED ?? 0,
      colorBg: 'bg-green-50 dark:bg-green-900/30', colorText: 'text-green-500',
      delay: 0.16,
    },
    {
      icon: Star, label: 'Đánh giá chờ duyệt',
      value: stats.pendingReviews ?? 0,
      colorBg: 'bg-amber-50 dark:bg-amber-900/30', colorText: 'text-amber-500',
      delay: 0.24, pulse: true,
      onClick: () => navigate('/admin/reviews'),
    },
    {
      icon: Flag, label: 'Báo cáo chờ xử lý',
      value: stats.pendingReports ?? 0,
      colorBg: 'bg-red-50 dark:bg-red-900/30', colorText: 'text-red-500',
      delay: 0.32, pulse: true,
      onClick: () => navigate('/admin/reports'),
    },
  ] : [];

  const pieData = stats ? [
    { name: 'Đã duyệt', value: stats.postsByStatus?.APPROVED ?? 0, color: '#10b981' },
    { name: 'Chờ duyệt', value: stats.postsByStatus?.PENDING ?? 0, color: '#f59e0b' },
    { name: 'Từ chối',   value: stats.postsByStatus?.REJECTED ?? 0, color: '#ef4444' },
  ].filter((d) => d.value > 0) : [];

  const pendingActions = stats ? [
    { label: 'Bài đăng chờ duyệt',       count: stats.postsByStatus?.PENDING ?? 0,  color: 'bg-amber-400', to: '/admin/posts' },
    { label: 'Đánh giá chờ kiểm duyệt',  count: stats.pendingReviews ?? 0,           color: 'bg-amber-400', to: '/admin/reviews' },
    { label: 'Báo cáo chờ xử lý',        count: stats.pendingReports ?? 0,           color: 'bg-red-400',   to: '/admin/reports' },
    { label: 'Chủ trọ chờ duyệt',        count: stats.usersByStatus?.PENDING ?? 0,   color: 'bg-blue-400',  to: '/admin/users' },
  ].filter((a) => a.count > 0) : [];

  const userBreakdown = stats ? [
    { icon: GraduationCap, label: 'Người thuê',     value: stats.usersByRole?.RENTER ?? 0,   color: 'text-primary-500', bg: 'bg-primary-50 dark:bg-primary-900/30' },
    { icon: Building2,     label: 'Chủ trọ',        value: stats.usersByRole?.OWNER ?? 0,    color: 'text-blue-500',    bg: 'bg-blue-50 dark:bg-blue-900/30' },
    { icon: CheckCircle,   label: 'Hoạt động',      value: stats.usersByStatus?.ACTIVE ?? 0, color: 'text-green-500',   bg: 'bg-green-50 dark:bg-green-900/30' },
    { icon: Clock,         label: 'Chờ duyệt',      value: stats.usersByStatus?.PENDING ?? 0,color: 'text-amber-500',   bg: 'bg-amber-50 dark:bg-amber-900/30' },
    { icon: Ban,           label: 'Bị cấm',         value: stats.usersByStatus?.BANNED ?? 0, color: 'text-red-500',     bg: 'bg-red-50 dark:bg-red-900/30' },
    { icon: Shield,        label: 'Quản trị viên',  value: stats.usersByRole?.ADMIN ?? 0,    color: 'text-ink-500',     bg: 'bg-ink-100 dark:bg-ink-800' },
  ] : [];

  const onPieEnter = useCallback((_, index) => setActivePieIndex(index), []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={springs.smooth}>
        <h1 className="text-2xl font-bold text-ink-900 dark:text-ink-50">Tổng quan quản trị</h1>
        <p className="text-ink-400 mt-1 text-sm">Thống kê và hoạt động nền tảng RoomHub.</p>
      </motion.div>

      {/* Stat cards */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {statCards.map((s) => (
            <StatCard key={s.label} {...s} scrambleActive={scrambleActive} />
          ))}
        </div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie chart — post status */}
        <Card padding="md">
          <h2 className="text-base font-semibold text-ink-900 dark:text-ink-50 mb-4">
            Bài đăng theo trạng thái
          </h2>
          {loading || pieData.length === 0 ? (
            <div className="h-[220px] flex items-center justify-center text-ink-400 text-sm">
              {loading ? 'Đang tải…' : 'Chưa có dữ liệu'}
            </div>
          ) : (
            <>
              <div className="relative">
                <PieChart width={280} height={200} className="mx-auto">
                  <Pie
                    data={pieData}
                    cx="50%" cy="50%"
                    innerRadius={58}
                    outerRadius={80}
                    dataKey="value"
                    activeIndex={activePieIndex}
                    activeShape={ActivePieShape}
                    onMouseEnter={onPieEnter}
                    animationDuration={1200}
                    animationEasing="ease-out"
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </div>
              <div className="flex justify-center gap-4 mt-2 flex-wrap">
                {pieData.map((d) => (
                  <span key={d.name} className="flex items-center gap-1.5 text-xs text-ink-600 dark:text-ink-200">
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                    {d.name} ({d.value})
                  </span>
                ))}
              </div>
            </>
          )}
        </Card>

        {/* User breakdown */}
        <Card padding="md">
          <h2 className="text-base font-semibold text-ink-900 dark:text-ink-50 mb-4">
            Thống kê người dùng
          </h2>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {userBreakdown.map(({ icon: Icon, label, value, color, bg }) => (
                <div key={label} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${bg}`}>
                  <Icon className={`h-4 w-4 shrink-0 ${color}`} />
                  <div className="min-w-0">
                    <p className="text-xs text-ink-400 truncate">{label}</p>
                    <p className={`text-lg font-bold font-mono tabular-nums ${color}`}>{value}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Pending actions */}
      <Card padding="md">
        <h2 className="text-base font-semibold text-ink-900 dark:text-ink-50 mb-4">Hành động chờ xử lý</h2>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 rounded-xl" />)}
          </div>
        ) : pendingActions.length === 0 ? (
          <div className="flex items-center gap-2 text-green-500 text-sm py-4">
            <CheckCircle className="h-4 w-4" />
            Tất cả đã được xử lý!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {pendingActions.map((action, i) => (
              <motion.button
                key={action.label}
                type="button"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ...springs.smooth, delay: i * 0.06 }}
                onClick={() => navigate(action.to)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-ink-50 dark:hover:bg-ink-700/50 transition-colors text-left border border-ink-100 dark:border-ink-700"
              >
                <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${action.color}`} />
                <span className="flex-1 text-sm text-ink-700 dark:text-ink-200 leading-snug">{action.label}</span>
                <span className="font-bold text-sm text-ink-900 dark:text-ink-50 tabular-nums">{action.count}</span>
              </motion.button>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
