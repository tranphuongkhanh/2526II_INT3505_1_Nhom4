import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowLeft } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useToast } from '../../components/ui/Toast';
import { authApi } from '../../lib/api';
import { springs, easings } from '../../lib/animations';

// ── Animated lock icon ─────────────────────────────────────
function AnimatedLock() {
  return (
    <motion.div
      whileHover={{ rotateY: [0, 15, 0] }}
      transition={{ duration: 0.6, ease: easings.outExpo }}
      style={{ transformStyle: 'preserve-3d', perspective: 600 }}
      className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 dark:bg-primary-900/30 text-primary-500"
    >
      <Lock className="h-7 w-7" />
    </motion.div>
  );
}

// ── Envelope opening + letter slide-out ───────────────────
function AnimatedEnvelope() {
  return (
    <svg viewBox="0 0 200 140" width={160} height={112} aria-hidden="true">
      <defs>
        <clipPath id="env-body-clip">
          <rect x={20} y={50} width={160} height={80} rx={4} />
        </clipPath>
      </defs>
      {/* envelope back */}
      <rect x={20} y={50} width={160} height={80} rx={4} fill="#0D6E6E" />

      {/* letter slides up and out from behind envelope */}
      <motion.g
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: -32, opacity: 1 }}
        transition={{ delay: 0.45, duration: 0.8, ease: easings.outExpo }}
      >
        <rect x={48} y={48} width={104} height={66} rx={4} fill="#fff" stroke="#CCF0EF" />
        <rect x={58} y={62} width={68} height={4} rx={2} fill="#CCF0EF" />
        <rect x={58} y={74} width={84} height={4} rx={2} fill="#CCF0EF" />
        <rect x={58} y={86} width={56} height={4} rx={2} fill="#CCF0EF" />
      </motion.g>

      {/* envelope front pocket — hides letter below this line until it has slid up */}
      <rect x={20} y={86} width={160} height={44} rx={4} fill="#14919B" />
      <path d="M20 86 L100 130 L180 86" fill="#0D6E6E" opacity={0.6} />

      {/* flap opening upward (flip via scaleY about its base) */}
      <motion.polygon
        points="20,50 100,100 180,50"
        fill="#14919B"
        initial={{ scaleY: 1 }}
        animate={{ scaleY: -1 }}
        transition={{ duration: 0.45, ease: easings.outExpo, delay: 0.05 }}
        style={{ transformOrigin: '100px 50px' }}
      />
    </svg>
  );
}

export function ForgotPasswordPage() {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.warning('Vui lòng nhập email.');
      return;
    }
    setIsLoading(true);
    try {
      await authApi.forgotPassword(email);
    } catch {
      /* swallow — always show success for security */
    } finally {
      setIsLoading(false);
      setSent(true);
    }
  };

  const handleResend = async () => {
    setSent(false);
    setIsLoading(true);
    try {
      await authApi.forgotPassword(email);
    } catch {
      /* swallow */
    } finally {
      setIsLoading(false);
      setSent(true);
    }
  };

  return (
    <div style={{ perspective: 1200 }}>
      <motion.div
        animate={{ rotateY: sent ? 180 : 0 }}
        transition={{ duration: 0.55, ease: easings.inOutQuart }}
        style={{ transformStyle: 'preserve-3d', position: 'relative' }}
      >
        {/* Front face — form */}
        <div style={{ backfaceVisibility: 'hidden' }}>
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...springs.smooth, duration: 0.3 }}
          >
            <AnimatedLock />
            <h2 className="mt-5 font-display text-2xl md:text-3xl font-extrabold text-ink-900 dark:text-ink-50">
              Quên mật khẩu?
            </h2>
            <p className="mt-2 text-ink-600 dark:text-ink-200 max-w-sm">
              Nhập email đã đăng ký, chúng tôi sẽ gửi liên kết đặt lại mật khẩu cho bạn.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={Mail}
                autoComplete="email"
                required
              />
              <Button type="submit" fullWidth loading={isLoading}>
                Gửi email
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
        </div>

        {/* Back face — success */}
        <div
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            position: 'absolute',
            inset: 0,
          }}
        >
          <div className="text-center sm:text-left">
            <div className="flex sm:block justify-center">
              <AnimatedEnvelope />
            </div>
            <h3 className="mt-4 font-display text-2xl font-extrabold text-ink-900 dark:text-ink-50">
              Email đã được gửi!
            </h3>
            <p className="mt-2 text-ink-600 dark:text-ink-200 max-w-sm mx-auto sm:mx-0">
              Vui lòng kiểm tra hộp thư của <span className="font-medium text-ink-900 dark:text-ink-50">{email || 'bạn'}</span> và làm theo hướng dẫn.
              Nếu không thấy email, kiểm tra cả thư mục spam.
            </p>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Button variant="ghost" onClick={handleResend} loading={isLoading}>
                Gửi lại
              </Button>
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl text-sm font-medium text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Đăng nhập
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default ForgotPasswordPage;
