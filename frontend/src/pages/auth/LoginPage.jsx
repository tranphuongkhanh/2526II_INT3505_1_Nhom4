import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, CheckCircle2, AlertTriangle, Ban } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { springs } from '../../lib/animations';
import GoogleLoginButton from '../../components/auth/GoogleLoginButton';

const redirectFor = (role) => {
  if (role === 'OWNER') return '/owner';
  if (role === 'ADMIN') return '/admin';
  return '/';
};

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  // error: { type: 'credentials' | 'pending' | 'banned', message }
  const [formError, setFormError] = useState(null);
  const [shake, setShake] = useState(false);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 400);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setFormError({ type: 'credentials', message: 'Vui lòng nhập email và mật khẩu.' });
      triggerShake();
      return;
    }
    setIsLoading(true);
    setFormError(null);
    try {
      const me = await login(email, password);
      setSuccess(true);
      setTimeout(() => {
        const dest = location.state?.from || redirectFor(me?.role);
        navigate(dest, { replace: true });
      }, 600);
    } catch (err) {
      const data = err?.response?.data;
      const status = data?.status || data?.userStatus || data?.accountStatus;
      if (status === 'PENDING') {
        setFormError({
          type: 'pending',
          message: 'Tài khoản đang chờ admin xét duyệt.',
        });
      } else if (status === 'BANNED') {
        setFormError({
          type: 'banned',
          message: 'Tài khoản của bạn đã bị khoá.',
        });
      } else {
        setFormError({
          type: 'credentials',
          message: err?.displayMessage || 'Email hoặc mật khẩu không đúng.',
        });
      }
      triggerShake();
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ ...springs.smooth, duration: 0.3 }}
      className={shake ? 'animate-shake' : ''}
    >
      <h1 className="font-display text-3xl md:text-4xl font-extrabold text-ink-900 dark:text-ink-50">
        Chào mừng trở lại
      </h1>
      <p className="mt-2 text-ink-600 dark:text-ink-200">
        Đăng nhập để tiếp tục hành trình của bạn.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4" noValidate>
        {formError?.type === 'pending' ? (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-200"
          >
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
            <span>{formError.message}</span>
          </motion.div>
        ) : null}

        {formError?.type === 'banned' ? (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 dark:border-red-500/30 dark:bg-red-500/10 p-3 text-sm text-red-800 dark:text-red-200"
          >
            <Ban className="h-5 w-5 shrink-0 mt-0.5" />
            <span>{formError.message}</span>
          </motion.div>
        ) : null}

        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          icon={Mail}
          autoComplete="email"
          required
          disabled={isLoading || success}
        />
        <Input
          label="Mật khẩu"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          icon={Lock}
          autoComplete="current-password"
          required
          disabled={isLoading || success}
          error={formError?.type === 'credentials' ? formError.message : undefined}
        />

        <div className="flex justify-end">
          <Link
            to="/forgot-password"
            className="text-sm font-medium text-accent-500 hover:text-accent-700 transition-colors"
          >
            Quên mật khẩu?
          </Link>
        </div>

        {success ? (
          <motion.button
            type="button"
            disabled
            initial={{ scale: 0.98 }}
            animate={{ scale: 1 }}
            transition={springs.bouncy}
            className="w-full h-11 inline-flex items-center justify-center gap-2 rounded-xl bg-success text-white font-medium shadow-soft"
          >
            <CheckCircle2 className="h-5 w-5" />
            Đăng nhập thành công
          </motion.button>
        ) : (
          <Button type="submit" fullWidth loading={isLoading}>
            Đăng nhập
          </Button>
        )}
      </form>

      <div className="my-6 flex items-center gap-3">
        <div className="flex-1 h-px bg-ink-100 dark:bg-ink-700" />
        <span className="text-xs uppercase tracking-wider text-ink-400">hoặc</span>
        <div className="flex-1 h-px bg-ink-100 dark:bg-ink-700" />
      </div>

      <div className="mb-6">
        <GoogleLoginButton role="RENTER" />
      </div>

      <p className="text-center text-sm text-ink-600 dark:text-ink-200">
        Chưa có tài khoản?{' '}
        <Link
          to="/register"
          className="font-semibold text-primary-500 hover:text-primary-700 transition-colors"
        >
          Đăng ký ngay
        </Link>
      </p>
    </motion.div>
  );
}

export default LoginPage;
