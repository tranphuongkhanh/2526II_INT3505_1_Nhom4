import { useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { KeyRound, Lock, ArrowLeft } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useToast } from '../../components/ui/Toast';
import { authApi } from '../../lib/api';
import { springs } from '../../lib/animations';
import {
  PasswordStrengthBar,
  SuccessCheckmark,
  ErrorCross,
  CountdownFlip,
  scorePassword,
} from './_shared';

function AnimatedKey() {
  return (
    <motion.div
      initial={{ rotate: -180, scale: 0.6, opacity: 0 }}
      animate={{ rotate: 0, scale: 1, opacity: 1 }}
      transition={{ ...springs.bouncy, delay: 0.1 }}
      className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 dark:bg-primary-900/30 text-primary-500"
    >
      <KeyRound className="h-7 w-7" />
    </motion.div>
  );
}

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const navigate = useNavigate();
  const toast = useToast();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [tokenInvalid, setTokenInvalid] = useState(false);
  const [errors, setErrors] = useState({});

  const pwdScore = useMemo(() => scorePassword(password).score, [password]);

  // Redirect if no token in URL
  if (!token) {
    return <Navigate to="/forgot-password" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!password) next.password = 'Vui lòng nhập mật khẩu mới.';
    else if (pwdScore < 2) next.password = 'Mật khẩu chưa đủ mạnh.';
    if (!confirmPassword) next.confirmPassword = 'Vui lòng nhập lại mật khẩu.';
    else if (password !== confirmPassword)
      next.confirmPassword = 'Mật khẩu nhập lại không khớp.';
    if (Object.keys(next).length) {
      setErrors(next);
      return;
    }
    setErrors({});
    setIsLoading(true);
    try {
      await authApi.resetPassword({ token, newPassword: password, password });
      setSuccess(true);
    } catch (err) {
      const status = err?.response?.status;
      const msg = (err?.response?.data?.message || '').toLowerCase();
      if (
        status === 400 ||
        status === 410 ||
        msg.includes('token') ||
        msg.includes('expired') ||
        msg.includes('invalid')
      ) {
        setTokenInvalid(true);
      } else {
        toast.error(err?.displayMessage || 'Đặt lại mật khẩu thất bại, vui lòng thử lại.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ── Token-invalid state ──
  if (tokenInvalid) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springs.smooth}
        className="text-center"
      >
        <div className="inline-block">
          <ErrorCross />
        </div>
        <h2 className="mt-5 font-display text-2xl font-extrabold text-ink-900 dark:text-ink-50">
          Link đã hết hạn hoặc không hợp lệ
        </h2>
        <p className="mt-2 text-ink-600 dark:text-ink-200 max-w-sm mx-auto">
          Vì lý do bảo mật, các liên kết đặt lại mật khẩu chỉ có hiệu lực trong thời gian ngắn.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/forgot-password">
            <Button>Gửi lại email</Button>
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl text-sm font-medium text-ink-600 dark:text-ink-200 hover:text-primary-500 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Đăng nhập
          </Link>
        </div>
      </motion.div>
    );
  }

  // ── Success state ──
  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-4"
      >
        <div className="inline-block">
          <SuccessCheckmark />
        </div>
        <h2 className="mt-5 font-display text-2xl font-extrabold text-ink-900 dark:text-ink-50">
          Mật khẩu đã được đặt lại thành công!
        </h2>
        <p className="mt-2 text-sm text-ink-600 dark:text-ink-200">
          Chuyển đến đăng nhập trong{' '}
          <CountdownFlip from={3} onComplete={() => navigate('/login', { replace: true })} />
        </p>
      </motion.div>
    );
  }

  // ── Form ──
  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ ...springs.smooth, duration: 0.3 }}
    >
      <AnimatedKey />
      <h2 className="mt-5 font-display text-2xl md:text-3xl font-extrabold text-ink-900 dark:text-ink-50">
        Đặt lại mật khẩu
      </h2>
      <p className="mt-2 text-ink-600 dark:text-ink-200">
        Chọn một mật khẩu mới — nên có ít nhất 8 ký tự, kết hợp chữ hoa, số và ký tự đặc biệt.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
        <div>
          <Input
            label="Mật khẩu mới"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={Lock}
            autoComplete="new-password"
            required
            error={errors.password}
          />
          <PasswordStrengthBar password={password} />
        </div>

        <Input
          label="Xác nhận mật khẩu"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          icon={Lock}
          autoComplete="new-password"
          required
          error={errors.confirmPassword}
        />

        <Button type="submit" fullWidth loading={isLoading}>
          Đặt lại mật khẩu
        </Button>
      </form>

      <div className="mt-6">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-sm font-medium text-ink-600 dark:text-ink-200 hover:text-primary-500 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại đăng nhập
        </Link>
      </div>
    </motion.div>
  );
}

export default ResetPasswordPage;
