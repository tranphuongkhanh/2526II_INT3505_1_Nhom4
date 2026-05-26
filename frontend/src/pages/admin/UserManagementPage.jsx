import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, CheckCircle, Ban, RefreshCw, User, ChevronRight } from 'lucide-react';
import { adminApi } from '../../lib/api';
import { springs } from '../../lib/animations';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import Skeleton from '../../components/ui/Skeleton';
import { useToast } from '../../components/ui/Toast';

const STATUS_META = {
  PENDING: { label: 'Chờ duyệt',      variant: 'pending' },
  ACTIVE:  { label: 'Đang hoạt động', variant: 'active' },
  BANNED:  { label: 'Bị cấm',         variant: 'banned' },
};
const ROLE_META = {
  RENTER: { label: 'Người thuê', variant: 'info' },
  OWNER:  { label: 'Chủ trọ',   variant: 'approved' },
  ADMIN:  { label: 'Admin',     variant: 'info' },
};
const TABS = [
  { key: 'ALL',     label: 'Tất cả' },
  { key: 'PENDING', label: 'Chờ duyệt' },
  { key: 'ACTIVE',  label: 'Hoạt động' },
  { key: 'BANNED',  label: 'Bị cấm' },
];
const ROLES = ['ALL', 'RENTER', 'OWNER'];
const ROLE_LABELS = { ALL: 'Tất cả vai trò', RENTER: 'Người thuê', OWNER: 'Chủ trọ' };

const fmt = (d) => d ? new Date(d).toLocaleDateString('vi-VN') : '—';

// ── Sparkle burst from button ──────────────────────────────
function Sparkles({ origin, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 900);
    return () => clearTimeout(t);
  }, [onDone]);

  return createPortal(
    <>
      {Array.from({ length: 6 }).map((_, i) => {
        const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
        const dist = 52 + i * 9;
        return (
          <motion.span
            key={i}
            style={{ position: 'fixed', top: origin.y, left: origin.x, pointerEvents: 'none', zIndex: 200, lineHeight: 1 }}
            initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
            animate={{ x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, scale: 1.2, opacity: 0 }}
            transition={{ duration: 0.65, ease: 'easeOut', delay: i * 0.04 }}
            className="text-amber-400 text-xl select-none"
          >
            ★
          </motion.span>
        );
      })}
    </>,
    document.body
  );
}

// ── User slide-over panel ──────────────────────────────────
function UserSlideOver({ user, onClose, onAction }) {
  return createPortal(
    <AnimatePresence>
      {user ? (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={springs.smooth}
            className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white dark:bg-ink-900 shadow-elevated overflow-y-auto flex flex-col"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-ink-100 dark:border-ink-700 sticky top-0 bg-white dark:bg-ink-900">
              <h2 className="text-lg font-semibold text-ink-900 dark:text-ink-50">Chi tiết người dùng</h2>
              <button type="button" onClick={onClose} className="p-2 rounded-lg text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 px-6 py-6 space-y-6">
              <div className="flex items-center gap-4">
                <Avatar src={user.avatarUrl} name={user.fullName || user.email} size="xl" />
                <div>
                  <p className="text-xl font-bold text-ink-900 dark:text-ink-50">{user.fullName || '—'}</p>
                  <p className="text-sm text-ink-400 mt-0.5">{user.email}</p>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    <Badge variant={ROLE_META[user.role]?.variant ?? 'info'}>
                      {ROLE_META[user.role]?.label ?? user.role}
                    </Badge>
                    <Badge variant={STATUS_META[user.status]?.variant ?? 'info'}>
                      {STATUS_META[user.status]?.label ?? user.status}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  ['CMND / CCCD', user.citizenId],
                  ['Số điện thoại', user.phone],
                  ['Ngày tham gia', fmt(user.createdAt)],
                  ['Địa chỉ', user.permanentAddress],
                ].filter(([, v]) => v).map(([label, val]) => (
                  <div key={label}>
                    <p className="text-xs font-medium text-ink-400 uppercase tracking-wide">{label}</p>
                    <p className="text-sm text-ink-900 dark:text-ink-50 font-medium mt-0.5">{val}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-2 pt-4 border-t border-ink-100 dark:border-ink-700">
                {user.status === 'PENDING' && user.role === 'OWNER' && (
                  <Button fullWidth onClick={() => onAction('approve', user)}>
                    <CheckCircle className="h-4 w-4 mr-1" /> Phê duyệt tài khoản
                  </Button>
                )}
                {user.status === 'ACTIVE' && (
                  <Button fullWidth variant="danger" onClick={() => onAction('ban', user)}>
                    <Ban className="h-4 w-4 mr-1" /> Cấm tài khoản
                  </Button>
                )}
                {user.status === 'BANNED' && (
                  <Button fullWidth onClick={() => onAction('unban', user)}>
                    <RefreshCw className="h-4 w-4 mr-1" /> Gỡ cấm tài khoản
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}

// ── Page ───────────────────────────────────────────────────
export default function UserManagementPage() {
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusTab, setStatusTab] = useState('ALL');
  const [selectedUser, setSelectedUser] = useState(null);
  const [sparkles, setSparkles] = useState(null);
  const [flashRows, setFlashRows] = useState(new Set());
  const [busy, setBusy] = useState(null);

  useEffect(() => {
    adminApi.getUsers()
      .then((d) => setUsers(Array.isArray(d) ? d : (d?.content ?? d?.items ?? d?.data ?? [])))
      .catch(() => {
        toast.error('Không thể tải danh sách người dùng.');
        setUsers([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const counts = {
    ALL: users.length,
    PENDING: users.filter((u) => u.status === 'PENDING').length,
    ACTIVE:  users.filter((u) => u.status === 'ACTIVE').length,
    BANNED:  users.filter((u) => u.status === 'BANNED').length,
  };

  const filtered = users.filter((u) => {
    if (statusTab !== 'ALL' && u.status !== statusTab) return false;
    if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      return (
        u.fullName?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.citizenId?.includes(q)
      );
    }
    return true;
  });

  const patchUser = useCallback((id, patch) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)));
    setSelectedUser((s) => (s?.id === id ? { ...s, ...patch } : s));
  }, []);

  const handleAction = useCallback(async (action, user, btnEl) => {
    setBusy(user.id);
    try {
      const newStatus = action === 'ban' ? 'BANNED' : 'ACTIVE';

      if (action === 'approve' && btnEl) {
        const rect = btnEl.getBoundingClientRect();
        setSparkles({ origin: { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }, key: Date.now() });
      }

      await adminApi.updateUserStatus(user.id, { status: newStatus }).catch(() => {});
      patchUser(user.id, { status: newStatus });

      if (action === 'approve') {
        setFlashRows((s) => new Set([...s, user.id]));
        setTimeout(() => setFlashRows((s) => { const n = new Set(s); n.delete(user.id); return n; }), 1400);
        toast.success('Đã phê duyệt tài khoản');
      } else if (action === 'ban') {
        toast.success('Đã cấm tài khoản');
      } else {
        toast.success('Đã gỡ cấm tài khoản');
      }
    } finally {
      setBusy(null);
    }
  }, [patchUser, toast]);

  return (
    <div className="space-y-6">
      {sparkles && (
        <Sparkles key={sparkles.key} origin={sparkles.origin} onDone={() => setSparkles(null)} />
      )}

      <UserSlideOver
        user={selectedUser}
        onClose={() => setSelectedUser(null)}
        onAction={(action, user) => {
          setSelectedUser(null);
          handleAction(action, user);
        }}
      />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-ink-900 dark:text-ink-50">Quản lý người dùng</h1>
        <p className="text-ink-400 mt-1 text-sm">Duyệt, cấm và quản lý tài khoản nền tảng.</p>
      </div>

      {/* Search + role filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Tìm tên, email, CMND..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-9 pr-4 h-11 rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 text-sm text-ink-900 dark:text-ink-50 placeholder-ink-400 focus:outline-none focus:border-primary-500 transition-colors"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="h-11 px-4 rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 text-sm text-ink-900 dark:text-ink-50 focus:outline-none focus:border-primary-500 transition-colors"
        >
          {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
        </select>
      </div>

      {/* Status tabs */}
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

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="text-center py-16 text-ink-400">
          <User className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Không tìm thấy người dùng nào.</p>
        </Card>
      ) : (
        <Card padding="none" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-100 dark:border-ink-700 text-xs text-ink-400 uppercase tracking-wide">
                  <th className="text-left px-6 py-3 font-medium">Người dùng</th>
                  <th className="text-left px-6 py-3 font-medium">Vai trò</th>
                  <th className="text-left px-6 py-3 font-medium">Trạng thái</th>
                  <th className="text-left px-6 py-3 font-medium">CMND / CCCD</th>
                  <th className="text-left px-6 py-3 font-medium">Ngày tham gia</th>
                  <th className="text-right px-6 py-3 font-medium">Hành động</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence initial={false}>
                  {filtered.map((u) => {
                    const isBanned = u.status === 'BANNED';
                    const isFlashing = flashRows.has(u.id);
                    return (
                      <motion.tr
                        key={u.id}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -16 }}
                        transition={springs.smooth}
                        style={{ filter: isBanned ? 'grayscale(80%)' : 'none' }}
                        className={[
                          'border-b border-ink-100 dark:border-ink-700 last:border-0 transition-colors duration-500',
                          isFlashing
                            ? 'bg-green-50 dark:bg-green-900/20'
                            : 'hover:bg-ink-50 dark:hover:bg-ink-800/40',
                        ].join(' ')}
                      >
                        {/* Avatar + name */}
                        <td className="px-6 py-4">
                          <button
                            type="button"
                            onClick={() => setSelectedUser(u)}
                            className="flex items-center gap-3 text-left group"
                          >
                            <Avatar src={u.avatarUrl} name={u.fullName || u.email} size="sm" />
                            <div className="min-w-0">
                              <p className="font-medium text-ink-900 dark:text-ink-50 truncate max-w-[160px] group-hover:text-primary-500 transition-colors">
                                {u.fullName || '—'}
                              </p>
                              <p className="text-xs text-ink-400 truncate max-w-[160px]">{u.email}</p>
                            </div>
                            <ChevronRight className="h-3.5 w-3.5 text-ink-300 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        </td>
                        {/* Role */}
                        <td className="px-6 py-4">
                          <Badge variant={ROLE_META[u.role]?.variant ?? 'info'}>
                            {ROLE_META[u.role]?.label ?? u.role}
                          </Badge>
                        </td>
                        {/* Status */}
                        <td className="px-6 py-4">
                          <Badge variant={STATUS_META[u.status]?.variant ?? 'info'}>
                            {STATUS_META[u.status]?.label ?? u.status}
                          </Badge>
                        </td>
                        {/* citizenId */}
                        <td className="px-6 py-4 text-ink-500 dark:text-ink-300 font-mono text-xs">
                          {u.citizenId || '—'}
                        </td>
                        {/* join date */}
                        <td className="px-6 py-4 text-ink-400 text-xs">{fmt(u.createdAt)}</td>
                        {/* Actions */}
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            {u.status === 'PENDING' && u.role === 'OWNER' && (
                              <motion.button
                                type="button"
                                disabled={busy === u.id}
                                whileTap={{ scale: 0.95 }}
                                onClick={(e) => handleAction('approve', u, e.currentTarget)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400 transition-colors disabled:opacity-50"
                              >
                                <CheckCircle className="h-3.5 w-3.5" /> Duyệt
                              </motion.button>
                            )}
                            {u.status === 'ACTIVE' && (
                              <motion.button
                                type="button"
                                disabled={busy === u.id}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleAction('ban', u)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 transition-colors disabled:opacity-50"
                              >
                                <Ban className="h-3.5 w-3.5" /> Cấm
                              </motion.button>
                            )}
                            {u.status === 'BANNED' && (
                              <motion.button
                                type="button"
                                disabled={busy === u.id}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleAction('unban', u)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 transition-colors disabled:opacity-50"
                              >
                                <RefreshCw className="h-3.5 w-3.5" /> Gỡ cấm
                              </motion.button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
