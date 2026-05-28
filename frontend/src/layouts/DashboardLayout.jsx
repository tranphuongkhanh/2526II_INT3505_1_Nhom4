import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Home as HomeIcon,
  FileText,
  ScrollText,
  Receipt,
  Car,
  Wallet,
  Users,
  Flag,
  Star,
  MessageCircle,
  ChevronsLeft,
  ChevronsRight,
  Menu,
  X,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/Toast';
import ThemeToggle from '../components/ui/ThemeToggle';
import Avatar from '../components/ui/Avatar';
import NotificationsDropdown from '../components/ui/NotificationsDropdown';
import ChatPopup from '../components/ui/ChatPopup';
import { springs } from '../lib/animations';

const OWNER_ITEMS = [
  { to: '/owner', label: 'Tổng quan', icon: LayoutDashboard, end: true },
  { to: '/owner/rooms', label: 'Phòng', icon: HomeIcon },
  { to: '/owner/posts', label: 'Bài đăng', icon: FileText },
  { to: '/owner/contracts', label: 'Hợp đồng', icon: ScrollText },
  { to: '/owner/bills', label: 'Hoá đơn', icon: Receipt },
  { to: '/owner/vehicles', label: 'Xe', icon: Car },
  { to: '/owner/payments', label: 'Thanh toán', icon: Wallet },
  { to: '/chat', label: 'Tin nhắn', icon: MessageCircle },
];

const ADMIN_ITEMS = [
  { to: '/admin', label: 'Tổng quan', icon: LayoutDashboard, end: true },
  { to: '/admin/users', label: 'Người dùng', icon: Users },
  { to: '/admin/posts', label: 'Bài đăng', icon: FileText },
  { to: '/admin/reviews', label: 'Đánh giá', icon: Star },
  { to: '/admin/reports', label: 'Báo cáo', icon: Flag },
];

function SidebarItem({ to, label, icon: Icon, end, collapsed, onNavigate }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onNavigate}
      className={({ isActive }) =>
        [
          'relative group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
          isActive
            ? 'text-primary-500 bg-primary-50 dark:bg-primary-900/30'
            : 'text-ink-600 dark:text-ink-200 hover:bg-ink-100 dark:hover:bg-ink-800',
        ].join(' ')
      }
    >
      {({ isActive }) => (
        <>
          {isActive ? (
            <motion.span
              layoutId="sidebar-active"
              transition={springs.smooth}
              className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-primary-500"
            />
          ) : null}
          <Icon className="h-5 w-5 shrink-0" />
          <AnimatePresence initial={false}>
            {!collapsed ? (
              <motion.span
                key="label"
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                transition={{ duration: 0.15 }}
                className="truncate"
              >
                {label}
              </motion.span>
            ) : null}
          </AnimatePresence>
        </>
      )}
    </NavLink>
  );
}

function Sidebar({ items, collapsed, onToggle, isMobile, onCloseMobile, logoTo }) {
  return (
    <motion.aside
      initial={false}
      animate={{ width: isMobile ? 280 : collapsed ? 64 : 256 }}
      transition={springs.smooth}
      className={[
        'h-screen bg-white dark:bg-ink-900 border-r border-ink-100 dark:border-ink-700',
        'flex flex-col shrink-0',
        isMobile ? 'fixed inset-y-0 left-0 z-50 shadow-elevated' : 'sticky top-0',
      ].join(' ')}
    >
      <div className="flex items-center justify-between h-16 px-3 border-b border-ink-100 dark:border-ink-700">
        {(!collapsed || isMobile) && (
          <Link
            to={logoTo}
            className="font-display font-bold text-primary-500 text-xl"
          >
            RoomHub
          </Link>
        )}
        {isMobile ? (
          <button
            type="button"
            onClick={onCloseMobile}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800"
            aria-label="Đóng menu"
          >
            <X className="h-5 w-5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onToggle}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors"
            aria-label={collapsed ? 'Mở rộng' : 'Thu gọn'}
          >
            {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
        {items.map((item) => (
          <SidebarItem
            key={item.to}
            {...item}
            collapsed={collapsed && !isMobile}
            onNavigate={isMobile ? onCloseMobile : undefined}
          />
        ))}
      </nav>

    </motion.aside>
  );
}

function Breadcrumb() {
  const { pathname } = useLocation();
  const parts = pathname.split('/').filter(Boolean);
  return (
    <nav aria-label="breadcrumb" className="text-sm text-ink-400">
      <ol className="flex items-center gap-1.5">
        <li>
          <Link to="/" className="hover:text-primary-500 transition-colors">
            RoomHub
          </Link>
        </li>
        {parts.map((part, i) => {
          const to = '/' + parts.slice(0, i + 1).join('/');
          const isLast = i === parts.length - 1;
          return (
            <li key={to} className="flex items-center gap-1.5">
              <span>/</span>
              {isLast ? (
                <span className="text-ink-900 dark:text-ink-50 font-medium capitalize">{part}</span>
              ) : (
                <Link to={to} className="hover:text-primary-500 transition-colors capitalize">
                  {part}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function TopbarAvatar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onClick = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const handleLogout = async () => {
    setOpen(false);
    await logout();
    toast.success('Đã đăng xuất');
    navigate('/login');
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full p-1 hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors"
      >
        <Avatar src={user?.avatarUrl} name={user?.fullName || user?.email || ''} size="sm" />
      </button>
      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={springs.snappy}
            className="absolute right-0 mt-2 w-56 origin-top-right rounded-2xl border border-ink-100 dark:border-ink-700 bg-white dark:bg-ink-900 shadow-elevated overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-ink-100 dark:border-ink-700">
              <p className="text-sm font-semibold text-ink-900 dark:text-ink-50 truncate">
                {user?.fullName || user?.email || 'Người dùng'}
              </p>
              {user?.email ? (
                <p className="text-xs text-ink-400 truncate">{user.email}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                navigate('/profile');
              }}
              className="w-full text-left px-4 py-2 text-sm text-ink-600 dark:text-ink-200 hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors"
            >
              Hồ sơ
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-error hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors border-t border-ink-100 dark:border-ink-700"
            >
              <LogOut className="h-4 w-4" />
              Đăng xuất
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export function DashboardLayout() {
  const { role } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const items = useMemo(
    () => (role === 'ADMIN' ? ADMIN_ITEMS : OWNER_ITEMS),
    [role]
  );

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex bg-base">
      <div className="hidden lg:block">
        <Sidebar
          items={items}
          collapsed={collapsed}
          onToggle={() => setCollapsed((c) => !c)}
          logoTo={role === 'ADMIN' ? '/admin' : '/'}
        />
      </div>

      <AnimatePresence>
        {mobileOpen ? (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <div className="lg:hidden">
              <Sidebar
                items={items}
                collapsed={false}
                onToggle={() => { }}
                isMobile
                onCloseMobile={() => setMobileOpen(false)}
                logoTo={role === 'ADMIN' ? '/admin' : '/'}
              />
            </div>
          </>
        ) : null}
      </AnimatePresence>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 h-16 bg-white/85 dark:bg-ink-900/85 backdrop-blur-md border-b border-ink-100 dark:border-ink-700 flex items-center gap-3 px-4 lg:px-6">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-lg text-ink-600 dark:text-ink-200 hover:bg-ink-100 dark:hover:bg-ink-800"
            aria-label="Mở menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1 min-w-0">
            <Breadcrumb />
          </div>
          <ThemeToggle />
          <NotificationsDropdown role={role} />
          <TopbarAvatar />
        </header>

        <main className="flex-1 p-4 lg:p-8 min-h-0">
          <Outlet />
        </main>
      </div>
      {role !== 'ADMIN' && <ChatPopup />}
    </div>
  );
}

export default DashboardLayout;
