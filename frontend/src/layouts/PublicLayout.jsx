import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import {
  Search,
  Bell,
  Menu,
  X,
  Heart,
  MessageCircle,
  User as UserIcon,
  LogOut,
  Mail,
  Phone,
  MapPin,
} from 'lucide-react';

const BrandIcon = {
  Facebook: (props) => (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M13.5 21v-7.5h2.5l.5-3h-3V8.6c0-.9.3-1.5 1.6-1.5H17V4.4c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.4-4 4v2.2H8v3h2.6V21h2.9z" />
    </svg>
  ),
  Instagram: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  ),
  Twitter: (props) => (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M17.6 3h3.1l-6.8 7.8L22 21h-6.3l-4.9-6.4L5.1 21H2l7.3-8.3L2 3h6.4l4.4 5.9L17.6 3zm-1.1 16.2h1.7L7.6 4.7H5.8l10.7 14.5z" />
    </svg>
  ),
};
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/Toast';
import ThemeToggle from '../components/ui/ThemeToggle';
import Avatar from '../components/ui/Avatar';
import { pageVariants, springs } from '../lib/animations';

function NavbarSearch() {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        navigate(`/posts${q ? `?q=${encodeURIComponent(q)}` : ''}`);
      }}
      className="relative hidden md:block w-64"
    >
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
      <input
        type="text"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Tìm phòng trọ…"
        className="w-full h-10 rounded-full bg-ink-100 dark:bg-ink-800 pl-9 pr-4 text-sm text-ink-900 dark:text-ink-50 placeholder-ink-400 outline-none focus:ring-2 focus:ring-primary-500/40"
      />
    </form>
  );
}

function AvatarDropdown() {
  const { user, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
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
    navigate('/');
  };

  const items = [
    { label: 'Hồ sơ', icon: UserIcon, to: '/profile' },
    { label: 'Yêu thích', icon: Heart, to: '/favorites' },
    { label: 'Tin nhắn', icon: MessageCircle, to: '/chat' },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full p-1 hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors"
        aria-haspopup="menu"
        aria-expanded={open}
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
            role="menu"
          >
            <div className="px-4 py-3 border-b border-ink-100 dark:border-ink-700">
              <p className="text-sm font-semibold text-ink-900 dark:text-ink-50 truncate">
                {user?.fullName || user?.email || 'Người dùng'}
              </p>
              {user?.email ? (
                <p className="text-xs text-ink-400 truncate">{user.email}</p>
              ) : null}
            </div>
            <div className="py-1.5">
              {items.map(({ label, icon: Icon, to }) => (
                <button
                  key={to}
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    navigate(to);
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-ink-600 dark:text-ink-200 hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors"
                  role="menuitem"
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>
            <div className="py-1.5 border-t border-ink-100 dark:border-ink-700">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-error hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                role="menuitem"
              >
                <LogOut className="h-4 w-4" />
                Đăng xuất
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function Navbar() {
  const { isAuthenticated } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, 'change', (y) => setScrolled(y > 12));

  const navLink = ({ isActive }) =>
    [
      'text-sm font-medium transition-colors',
      isActive ? 'text-primary-500' : 'text-ink-600 dark:text-ink-200 hover:text-primary-500',
    ].join(' ');

  return (
    <motion.header
      initial={false}
      animate={{
        height: scrolled ? 56 : 72,
        backgroundColor: scrolled
          ? 'rgba(255,255,255,0.85)'
          : 'rgba(255,255,255,1)',
      }}
      transition={springs.smooth}
      className={[
        'sticky top-0 z-40 w-full border-b transition-shadow',
        scrolled
          ? 'border-ink-100 dark:border-ink-700 shadow-soft backdrop-blur-md'
          : 'border-transparent',
        'dark:!bg-ink-900/85',
      ].join(' ')}
    >
      <div className="mx-auto flex h-full max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="font-display text-xl font-bold text-primary-500 tracking-tight">
          RoomHub
        </Link>

        <NavbarSearch />

        <nav className="hidden md:flex items-center gap-6 ml-2">
          <NavLink to="/posts" className={navLink}>
            Tìm phòng
          </NavLink>
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          <ThemeToggle />
          {isAuthenticated ? (
            <>
              <Link
                to="/notifications"
                className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-ink-600 dark:text-ink-200 hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors"
                aria-label="Thông báo"
              >
                <Bell className="h-5 w-5" />
              </Link>
              <AvatarDropdown />
            </>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Link
                to="/login"
                className="text-sm font-medium text-ink-600 dark:text-ink-200 hover:text-primary-500 px-3 py-2"
              >
                Đăng nhập
              </Link>
              <Link
                to="/register"
                className="text-sm font-medium bg-primary-500 hover:bg-primary-700 text-white px-4 py-2 rounded-xl transition-colors"
              >
                Đăng ký
              </Link>
            </div>
          )}

          <button
            type="button"
            onClick={() => setMobileOpen((o) => !o)}
            className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-full text-ink-600 dark:text-ink-200 hover:bg-ink-100 dark:hover:bg-ink-800"
            aria-label="Mở menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen ? (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={springs.smooth}
            className="md:hidden border-t border-ink-100 dark:border-ink-700 bg-white dark:bg-ink-900"
          >
            <div className="px-4 py-4 space-y-2">
              <NavLink
                to="/posts"
                onClick={() => setMobileOpen(false)}
                className="block py-2 text-base font-medium text-ink-900 dark:text-ink-50"
              >
                Tìm phòng
              </NavLink>
              {!isAuthenticated ? (
                <div className="flex gap-2 pt-2">
                  <Link
                    to="/login"
                    onClick={() => setMobileOpen(false)}
                    className="flex-1 text-center text-sm font-medium border border-primary-500 text-primary-500 rounded-xl px-3 py-2"
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileOpen(false)}
                    className="flex-1 text-center text-sm font-medium bg-primary-500 text-white rounded-xl px-3 py-2"
                  >
                    Đăng ký
                  </Link>
                </div>
              ) : null}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.header>
  );
}

function Footer() {
  return (
    <footer className="bg-ink-900 text-ink-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <p className="font-display text-2xl font-bold text-white">RoomHub</p>
          <p className="mt-3 text-sm text-ink-400 leading-relaxed">
            Nền tảng tìm phòng trọ minh bạch và đáng tin cậy dành cho sinh viên Việt Nam.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold text-white mb-3">Khám phá</p>
          <ul className="space-y-2 text-sm text-ink-400">
            <li><Link to="/posts" className="hover:text-white transition-colors">Tìm phòng</Link></li>
            <li><Link to="/favorites" className="hover:text-white transition-colors">Yêu thích</Link></li>
            <li><Link to="/chat" className="hover:text-white transition-colors">Tin nhắn</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-white mb-3">Hỗ trợ</p>
          <ul className="space-y-2 text-sm text-ink-400">
            <li className="flex items-center gap-2"><Mail className="h-4 w-4" /> support@RoomHub.vn</li>
            <li className="flex items-center gap-2"><Phone className="h-4 w-4" /> 1900 1234</li>
            <li className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Hà Nội, Việt Nam</li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-white mb-3">Theo dõi</p>
          <div className="flex items-center gap-3">
            <a href="#" aria-label="Facebook" className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-ink-800 hover:bg-primary-500 transition-colors">
              <BrandIcon.Facebook className="h-4 w-4" />
            </a>
            <a href="#" aria-label="Instagram" className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-ink-800 hover:bg-primary-500 transition-colors">
              <BrandIcon.Instagram className="h-4 w-4" />
            </a>
            <a href="#" aria-label="Twitter" className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-ink-800 hover:bg-primary-500 transition-colors">
              <BrandIcon.Twitter className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
      <div className="border-t border-ink-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 text-xs text-ink-400 text-center">
          © {new Date().getFullYear()} RoomHub. Mọi quyền được bảo lưu.
        </div>
      </div>
    </footer>
  );
}

export function PublicLayout() {
  const location = useLocation();
  const { role, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base">
        <div className="h-10 w-10 rounded-full border-2 border-primary-500/30 border-t-primary-500 animate-spin" />
      </div>
    );
  }

  if (role === 'OWNER') return <Navigate to="/owner" replace />;
  if (role === 'ADMIN') return <Navigate to="/admin" replace />;

  return (
    <div className="min-h-screen flex flex-col bg-base">
      <Navbar />
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
}

export default PublicLayout;
