import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  User as UserIcon,
  Lock,
  Phone,
  AtSign,
  GraduationCap,
  Building2,
  Info,
  IdCard,
  MapPin,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useToast } from '../../components/ui/Toast';
import { authApi } from '../../lib/api';
import { springs } from '../../lib/animations';
import {
  PasswordStrengthBar,
  SuccessCheckmark,
  ConfettiBurst,
  CountdownFlip,
  scorePassword,
} from './_shared';

// ── Role selector ─────────────────────────────────────────
const ROLES = [
  {
    key: 'RENTER',
    Icon: GraduationCap,
    title: 'Tôi muốn thuê phòng',
    subtitle: 'Sinh viên / Người thuê',
  },
  {
    key: 'OWNER',
    Icon: Building2,
    title: 'Tôi là chủ trọ',
    subtitle: 'Đăng tin cho thuê phòng',
  },
];

function RoleSelector({ value, onChange }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {ROLES.map(({ key, Icon, title, subtitle }) => {
        const selected = value === key;
        return (
          <motion.button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            whileTap={{ scale: 0.98 }}
            animate={{ scale: selected ? 1.02 : 1 }}
            transition={springs.smooth}
            className={[
              'relative text-left rounded-2xl border-2 p-4',
              'transition-all duration-300 ease-out',
              selected
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 opacity-100'
                : 'border-ink-100 dark:border-ink-700 bg-white dark:bg-ink-900 opacity-70 hover:opacity-100',
            ].join(' ')}
          >
            <div
              className={[
                'inline-flex h-10 w-10 items-center justify-center rounded-xl transition-colors duration-300',
                selected
                  ? 'bg-primary-500 text-white'
                  : 'bg-ink-100 dark:bg-ink-800 text-ink-400 dark:text-ink-400',
              ].join(' ')}
            >
              <Icon className="h-5 w-5" />
            </div>
            <p className="mt-3 text-sm font-semibold text-ink-900 dark:text-ink-50">
              {title}
            </p>
            <p className="mt-0.5 text-xs text-ink-400">{subtitle}</p>
          </motion.button>
        );
      })}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────
export function RegisterPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const [role, setRole] = useState('RENTER');
  const [step, setStep] = useState(1);
  const [success, setSuccess] = useState(false);

  // step 1 fields
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // step 2 fields (owner only)
  const [idCardNumber, setIdCardNumber] = useState('');
  const [address, setAddress] = useState('');

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const onRoleChange = (next) => {
    if (next === role) return;
    setRole(next);
    setStep(1);
    setErrors({});
  };

  const passwordStrength = useMemo(() => scorePassword(password).score, [password]);

  const validateStep1 = () => {
    const e = {};
    if (!email) e.email = 'Vui lòng nhập email.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Email không hợp lệ.';
    if (!username) e.username = 'Vui lòng nhập tên đăng nhập.';
    else if (username.length < 3) e.username = 'Tên đăng nhập tối thiểu 3 ký tự.';
    if (!fullName) e.fullName = 'Vui lòng nhập họ và tên.';
    if (!phoneNumber) e.phoneNumber = 'Vui lòng nhập số điện thoại.';
    else if (!/^[0-9+\-\s]{9,15}$/.test(phoneNumber))
      e.phoneNumber = 'Số điện thoại không hợp lệ.';
    if (!password) e.password = 'Vui lòng nhập mật khẩu.';
    else if (passwordStrength < 2) e.password = 'Mật khẩu chưa đủ mạnh.';
    if (!confirmPassword) e.confirmPassword = 'Vui lòng nhập lại mật khẩu.';
    else if (password !== confirmPassword)
      e.confirmPassword = 'Mật khẩu nhập lại không khớp.';
    return e;
  };

  const validateStep2 = () => {
    const e = {};
    if (!idCardNumber) e.idCardNumber = 'Vui lòng nhập số CCCD.';
    else if (!/^[0-9]{9,12}$/.test(idCardNumber))
      e.idCardNumber = 'Số CCCD không hợp lệ.';
    if (!address) e.address = 'Vui lòng nhập địa chỉ thường trú.';
    return e;
  };

  const handleNextOrSubmit = async (e) => {
    e.preventDefault();
    const s1 = validateStep1();
    if (Object.keys(s1).length) {
      setErrors(s1);
      return;
    }
    setErrors({});

    if (role === 'OWNER' && step === 1) {
      setStep(2);
      return;
    }

    if (role === 'OWNER' && step === 2) {
      const s2 = validateStep2();
      if (Object.keys(s2).length) {
        setErrors(s2);
        return;
      }
    }

    setIsLoading(true);
    try {
      const payload = {
        email,
        username,
        fullName,
        phoneNumber,
        password,
        role: role.toLowerCase(),
        ...(role === 'OWNER' ? { citizenId: idCardNumber, permanentAddress: address } : {}),
      };
      await authApi.register(payload);
      setSuccess(true);
    } catch (err) {
      const data = err?.response?.data;
      const fieldMap = {};
      if (data?.field === 'email' || /email/i.test(data?.message || '')) {
        fieldMap.email = 'Email đã được sử dụng.';
      }
      if (data?.field === 'username' || /username|tên đăng nhập/i.test(data?.message || '')) {
        fieldMap.username = 'Tên đăng nhập đã được sử dụng.';
      }
      if (Object.keys(fieldMap).length) {
        setErrors(fieldMap);
        if (role === 'OWNER' && step === 2) setStep(1);
      } else {
        toast.error(err?.displayMessage || 'Đăng ký thất bại, vui lòng thử lại.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ── Success state ────────────────────────────────────────
  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative text-center py-6"
      >
        <div className="relative inline-block">
          <SuccessCheckmark />
          <ConfettiBurst />
        </div>
        <h2 className="mt-6 font-display text-2xl font-extrabold text-ink-900 dark:text-ink-50">
          Đăng ký thành công!
        </h2>
        {role === 'OWNER' ? (
          <>
            <p className="mt-2 text-sm text-ink-600 dark:text-ink-200 max-w-sm mx-auto">
              Vui lòng chờ admin xét duyệt tài khoản. Thường mất 1–2 ngày làm việc.
            </p>
            <div className="mt-6">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-sm font-medium text-primary-500 hover:text-primary-700"
              >
                <ArrowLeft className="h-4 w-4" />
                Quay lại đăng nhập
              </Link>
            </div>
          </>
        ) : (
          <>
            <p className="mt-2 text-sm text-ink-600 dark:text-ink-200">
              Chuyển đến trang chủ trong{' '}
              <CountdownFlip from={3} onComplete={() => navigate('/', { replace: true })} />
            </p>
          </>
        )}
      </motion.div>
    );
  }

  // ── Form ────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ ...springs.smooth, duration: 0.3 }}
    >
      <h1 className="font-display text-3xl md:text-4xl font-extrabold text-ink-900 dark:text-ink-50">
        Tạo tài khoản
      </h1>
      <p className="mt-2 text-ink-600 dark:text-ink-200">
        Bạn là sinh viên đang tìm phòng hay chủ trọ muốn đăng tin?
      </p>

      <div className="mt-6">
        <RoleSelector value={role} onChange={onRoleChange} />
      </div>


      <form onSubmit={handleNextOrSubmit} className="mt-6 overflow-hidden" noValidate>
        <AnimatePresence mode="wait" initial={false}>
          {step === 1 ? (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="space-y-4"
            >
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={Mail}
                autoComplete="email"
                required
                error={errors.email}
              />
              <Input
                label="Tên đăng nhập"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                icon={AtSign}
                autoComplete="username"
                required
                error={errors.username}
              />
              <Input
                label="Họ và tên"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                icon={UserIcon}
                autoComplete="name"
                required
                error={errors.fullName}
              />
              <Input
                label="Số điện thoại"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                icon={Phone}
                autoComplete="tel"
                required
                error={errors.phoneNumber}
              />
              <div>
                <Input
                  label="Mật khẩu"
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

              <Button
                type="submit"
                fullWidth
                loading={isLoading && role === 'RENTER'}
                icon={role === 'OWNER' ? ArrowRight : undefined}
                iconPosition="right"
              >
                {role === 'OWNER' ? 'Tiếp theo' : 'Đăng ký'}
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="space-y-4"
            >
              <h2 className="font-display text-xl font-bold text-ink-900 dark:text-ink-50">
                Thông tin xác minh
              </h2>

              <div className="flex items-start gap-3 rounded-xl border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-500/10 p-3">
                <Info className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-300 mt-0.5" />
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  Tài khoản chủ trọ cần được admin xét duyệt trước khi sử dụng.
                  Thường mất 1–2 ngày làm việc.
                </p>
              </div>

              <Input
                label="Số CCCD"
                value={idCardNumber}
                onChange={(e) => setIdCardNumber(e.target.value)}
                icon={IdCard}
                required
                error={errors.idCardNumber}
              />

              <div>
                <label className="block text-sm font-medium text-ink-600 dark:text-ink-200 mb-1.5">
                  Địa chỉ thường trú <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-ink-400 pointer-events-none" />
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    rows={3}
                    placeholder="VD: 123 Đường Cầu Giấy, Q. Cầu Giấy, Hà Nội"
                    className={[
                      'w-full rounded-xl bg-white dark:bg-ink-900 border px-10 py-3 text-sm text-ink-900 dark:text-ink-50 placeholder-ink-400 outline-none transition-colors resize-none',
                      errors.address
                        ? 'border-error focus:border-error'
                        : 'border-ink-200 dark:border-ink-700 focus:border-primary-500',
                    ].join(' ')}
                  />
                </div>
                {errors.address ? (
                  <p className="mt-1.5 text-xs text-error">{errors.address}</p>
                ) : null}
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setStep(1)}
                  icon={ArrowLeft}
                  disabled={isLoading}
                >
                  Quay lại
                </Button>
                <Button type="submit" loading={isLoading} fullWidth>
                  Đăng ký
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>

      <p className="mt-6 text-center text-sm text-ink-600 dark:text-ink-200">
        Đã có tài khoản?{' '}
        <Link
          to="/login"
          className="font-semibold text-primary-500 hover:text-primary-700 transition-colors"
        >
          Đăng nhập
        </Link>
      </p>
    </motion.div>
  );
}

export default RegisterPage;
