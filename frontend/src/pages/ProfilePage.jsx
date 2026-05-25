import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera, Check, Loader2, AlertTriangle,
  Shield, User as UserIcon,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { userApi, authApi } from '../lib/api';
import { useToast } from '../components/ui/Toast';
import Avatar from '../components/ui/Avatar';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { springs } from '../lib/animations';

// ─── Crop modal ───────────────────────────────────────────────────────────────

const CROP_SIZE = 280;

function CropModal({ file, onClose, onConfirm }) {
  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const dragRef = useRef(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [ready, setReady] = useState(false);

  const draw = useCallback((off) => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext('2d');
    const S = CROP_SIZE;
    ctx.clearRect(0, 0, S, S);

    const scale = Math.max(S / img.naturalWidth, S / img.naturalHeight);
    const w = img.naturalWidth * scale;
    const h = img.naturalHeight * scale;
    const dx = (S - w) / 2 + off.x;
    const dy = (S - h) / 2 + off.y;

    // dimmed full image
    ctx.globalAlpha = 0.35;
    ctx.drawImage(img, dx, dy, w, h);
    ctx.globalAlpha = 1;

    // bright image clipped to circle
    ctx.save();
    ctx.beginPath();
    ctx.arc(S / 2, S / 2, S / 2 - 3, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(img, dx, dy, w, h);
    ctx.restore();

    // teal ring
    ctx.strokeStyle = '#14919B';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(S / 2, S / 2, S / 2 - 3, 0, Math.PI * 2);
    ctx.stroke();
  }, []);

  useEffect(() => {
    if (!file) return;
    setReady(false);
    setOffset({ x: 0, y: 0 });
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      imgRef.current = img;
      setReady(true);
    };
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    if (ready) draw(offset);
  }, [ready, offset, draw]);

  const onMouseDown = (e) => {
    dragRef.current = { startX: e.clientX - offset.x, startY: e.clientY - offset.y };
  };
  const onMouseMove = (e) => {
    if (!dragRef.current) return;
    setOffset({ x: e.clientX - dragRef.current.startX, y: e.clientY - dragRef.current.startY });
  };
  const onMouseUp = () => { dragRef.current = null; };

  const handleConfirm = () => {
    const img = imgRef.current;
    if (!img) return;
    const S = 256;
    const canvas = document.createElement('canvas');
    canvas.width = S;
    canvas.height = S;
    const ctx = canvas.getContext('2d');
    const ratio = S / CROP_SIZE;
    const scale = Math.max(S / img.naturalWidth, S / img.naturalHeight);
    const w = img.naturalWidth * scale;
    const h = img.naturalHeight * scale;
    const dx = (S - w) / 2 + offset.x * ratio;
    const dy = (S - h) / 2 + offset.y * ratio;
    ctx.beginPath();
    ctx.arc(S / 2, S / 2, S / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(img, dx, dy, w, h);
    canvas.toBlob((blob) => {
      onConfirm(new File([blob], 'avatar.png', { type: 'image/png' }));
    }, 'image/png');
  };

  return (
    <Modal isOpen={!!file} onClose={onClose} title="Chỉnh sửa ảnh đại diện">
      <div className="flex flex-col items-center gap-5">
        <p className="text-sm text-ink-400 text-center">
          Kéo ảnh để điều chỉnh vị trí trong khung tròn
        </p>
        {!ready ? (
          <div
            style={{ width: CROP_SIZE, height: CROP_SIZE }}
            className="rounded-full bg-ink-100 dark:bg-ink-800 flex items-center justify-center"
          >
            <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            width={CROP_SIZE}
            height={CROP_SIZE}
            className="rounded-xl cursor-grab active:cursor-grabbing select-none"
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
          />
        )}
        <div className="flex gap-3 w-full">
          <Button variant="outlined" fullWidth onClick={onClose}>Hủy</Button>
          <Button fullWidth onClick={handleConfirm} disabled={!ready}>Xác nhận</Button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Password strength ────────────────────────────────────────────────────────

function strengthScore(pw) {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[a-z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}

const STRENGTH_LABELS = ['', 'Rất yếu', 'Yếu', 'Trung bình', 'Mạnh', 'Rất mạnh'];
const STRENGTH_COLORS = [
  '', 'bg-error', 'bg-orange-400', 'bg-amber-400', 'bg-lime-500', 'bg-success',
];

// ─── Security tab ─────────────────────────────────────────────────────────────

function SecurityTab() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const score = strengthScore(form.newPassword);

  const handleChange = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((err) => ({ ...err, [key]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.currentPassword) errs.currentPassword = 'Vui lòng nhập mật khẩu hiện tại';
    if (!form.newPassword) errs.newPassword = 'Vui lòng nhập mật khẩu mới';
    else if (form.newPassword.length < 8) errs.newPassword = 'Tối thiểu 8 ký tự';
    if (form.newPassword !== form.confirmPassword) errs.confirmPassword = 'Mật khẩu không khớp';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await authApi.changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      toast.success('Đã đổi mật khẩu thành công');
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.displayMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Mật khẩu hiện tại"
        type="password"
        value={form.currentPassword}
        onChange={handleChange('currentPassword')}
        error={errors.currentPassword}
        autoComplete="current-password"
      />
      <div>
        <Input
          label="Mật khẩu mới"
          type="password"
          value={form.newPassword}
          onChange={handleChange('newPassword')}
          error={errors.newPassword}
          autoComplete="new-password"
        />
        <AnimatePresence>
          {form.newPassword ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mt-2 space-y-1"
            >
              <div className="flex gap-1">
                {Array.from({ length: 5 }, (_, i) => (
                  <div
                    key={i}
                    className={[
                      'h-1 flex-1 rounded-full transition-all duration-300',
                      i < score ? STRENGTH_COLORS[score] : 'bg-ink-200 dark:bg-ink-700',
                    ].join(' ')}
                  />
                ))}
              </div>
              <p className="text-xs text-ink-400">{STRENGTH_LABELS[score]}</p>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
      <Input
        label="Xác nhận mật khẩu mới"
        type="password"
        value={form.confirmPassword}
        onChange={handleChange('confirmPassword')}
        error={errors.confirmPassword}
        autoComplete="new-password"
      />
      <Button type="submit" fullWidth loading={loading} className="mt-2">
        Đổi mật khẩu
      </Button>
    </form>
  );
}

// ─── Profile tab ──────────────────────────────────────────────────────────────

const PROFILE_FIELDS = [
  { key: 'fullName', label: 'Họ và tên' },
  { key: 'phoneNumber', label: 'Số điện thoại' },
];

function ProfileTab({ user, onUpdate }) {
  const toast = useToast();
  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    phoneNumber: user?.phoneNumber || '',
  });
  const [saveState, setSaveState] = useState('idle'); // idle | loading | success

  useEffect(() => {
    setForm({ fullName: user?.fullName || '', phoneNumber: user?.phoneNumber || '' });
  }, [user?.fullName, user?.phoneNumber]);

  const changed =
    form.fullName !== (user?.fullName || '') ||
    form.phoneNumber !== (user?.phoneNumber || '');

  const handleChange = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSave = async () => {
    setSaveState('loading');
    try {
      const updated = await userApi.updateMe(form);
      onUpdate(updated || form);
      setSaveState('success');
      setTimeout(() => setSaveState('idle'), 2000);
      toast.success('Đã lưu thay đổi');
    } catch (err) {
      toast.error(err.displayMessage);
      setSaveState('idle');
    }
  };

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {changed ? (
          <motion.div
            key="banner"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl text-sm text-amber-700 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              Bạn có thay đổi chưa được lưu
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Email readonly */}
      <Input label="Email" value={user?.email || ''} disabled />

      {PROFILE_FIELDS.map(({ key, label }) => {
        const isChanged = form[key] !== (user?.[key] || '');
        return (
          <div key={key} className="relative flex items-stretch gap-0">
            <AnimatePresence>
              {isChanged ? (
                <motion.div
                  layoutId={`border-${key}`}
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  exit={{ scaleY: 0 }}
                  className="w-0.5 bg-primary-500 rounded-full shrink-0 mr-3 origin-top"
                />
              ) : null}
            </AnimatePresence>
            <div className="flex-1">
              <Input
                label={label}
                value={form[key]}
                onChange={handleChange(key)}
              />
            </div>
          </div>
        );
      })}

      <div className="pt-2">
        <Button
          fullWidth
          onClick={handleSave}
          disabled={!changed || saveState === 'success'}
          loading={saveState === 'loading'}
        >
          <AnimatePresence mode="wait" initial={false}>
            {saveState === 'success' ? (
              <motion.span
                key="done"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={springs.snappy}
                className="flex items-center gap-2"
              >
                <Check className="h-4 w-4" />
                Đã lưu
              </motion.span>
            ) : (
              <motion.span
                key="save"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                Lưu thay đổi
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const TABS = [
  { key: 'info', label: 'Thông tin', icon: UserIcon },
  { key: 'security', label: 'Bảo mật', icon: Shield },
];

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const fileInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState('info');
  const [cropFile, setCropFile] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setAvatarUrl(user?.avatarUrl || null);
  }, [user?.avatarUrl]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCropFile(file);
    e.target.value = '';
  };

  const handleCropConfirm = async (blob) => {
    setCropFile(null);
    setUploading(true);
    try {
      const result = await userApi.uploadAvatar(blob);
      const newUrl =
        typeof result === 'string'
          ? result
          : result?.avatarUrl || result?.url || null;
      if (newUrl) {
        setAvatarUrl(newUrl);
        updateUser({ avatarUrl: newUrl });
      }
      toast.success('Đã cập nhật ảnh đại diện');
    } catch (err) {
      toast.error(err.displayMessage);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-10">
      {/* Avatar */}
      <div className="flex flex-col items-center mb-8">
        <div className="relative group cursor-pointer" onClick={() => !uploading && fileInputRef.current?.click()}>
          <motion.div
            key={avatarUrl}
            initial={{ clipPath: 'circle(0% at 50% 50%)' }}
            animate={{ clipPath: 'circle(100% at 50% 50%)' }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <Avatar src={avatarUrl} name={user?.fullName || user?.email || ''} size="xl" />
          </motion.div>

          {/* Hover overlay */}
          {!uploading ? (
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 group-hover:bg-black/45 transition-all duration-200">
              <Camera className="h-7 w-7 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
              <Loader2 className="h-7 w-7 text-white animate-spin" />
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        <p className="mt-3 text-base font-semibold text-ink-900 dark:text-ink-50">
          {user?.fullName || 'Người dùng'}
        </p>
        <p className="text-sm text-ink-400">{user?.email}</p>
        <button
          type="button"
          onClick={() => !uploading && fileInputRef.current?.click()}
          className="mt-2 text-xs text-primary-500 hover:text-primary-700 font-medium transition-colors"
        >
          Thay đổi ảnh đại diện
        </button>
      </div>

      {/* Tabs */}
      <div className="relative flex border-b border-ink-200 dark:border-ink-700 mb-6">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className={[
              'relative flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors',
              activeTab === key
                ? 'text-primary-500'
                : 'text-ink-600 dark:text-ink-200 hover:text-primary-500',
            ].join(' ')}
          >
            <Icon className="h-4 w-4" />
            {label}
            {activeTab === key ? (
              <motion.div
                layoutId="profile-tab-underline"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500 rounded-full"
                transition={springs.snappy}
              />
            ) : null}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        {activeTab === 'info' ? (
          <motion.div
            key="info"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            transition={springs.snappy}
          >
            <ProfileTab user={user} onUpdate={updateUser} />
          </motion.div>
        ) : (
          <motion.div
            key="security"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={springs.snappy}
          >
            <SecurityTab />
          </motion.div>
        )}
      </AnimatePresence>

      <CropModal
        file={cropFile}
        onClose={() => setCropFile(null)}
        onConfirm={handleCropConfirm}
      />
    </div>
  );
}
