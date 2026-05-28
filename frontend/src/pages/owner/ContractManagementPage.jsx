import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Home, ScrollText, DollarSign, Zap, Droplets, Hand,
  FileText, User, Users, MapPin, Calendar, Banknote, ShieldCheck, Building2, Star,
} from 'lucide-react';
import { roomApi, contractApi, userApi, reviewApi } from '../../lib/api';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../contexts/AuthContext';
import { springs } from '../../lib/animations';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Skeleton from '../../components/ui/Skeleton';
import StarRating from '../../components/ui/StarRating';

const fmt = (n) =>
  n != null
    ? new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(n) + 'đ'
    : '—';

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('vi-VN') : '—');

// ── Handshake overlay ─────────────────────────────────────
function HandshakeOverlay({ visible, onDone }) {
  useEffect(() => {
    if (!visible) return undefined;
    const t = setTimeout(onDone, 2400);
    return () => clearTimeout(t);
  }, [visible, onDone]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.75, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.75, opacity: 0 }}
            transition={springs.bouncy}
            className="bg-white dark:bg-ink-900 rounded-3xl px-10 py-8 shadow-elevated flex flex-col items-center gap-5"
          >
            <div className="flex items-center">
              <motion.div
                initial={{ x: -40, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ ...springs.bouncy, delay: 0.12 }}
              >
                <Hand className="h-14 w-14 text-primary-500" />
              </motion.div>
              <motion.div
                initial={{ x: 40, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ ...springs.bouncy, delay: 0.12 }}
                className="scale-x-[-1]"
              >
                <Hand className="h-14 w-14 text-primary-500" />
              </motion.div>
            </div>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="text-center"
            >
              <p className="text-xl font-bold text-ink-900 dark:text-ink-50">Hợp đồng đã ký!</p>
              <p className="text-sm text-ink-400 mt-1">Hợp đồng đã được tạo thành công</p>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Room selector card ────────────────────────────────────
function RoomSelectorCard({ room, selected, onClick }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.96 }}
      className={[
        'relative flex-shrink-0 w-44 p-4 rounded-2xl border-2 text-left transition-colors',
        selected
          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
          : 'border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 hover:border-primary-300 dark:hover:border-primary-700',
      ].join(' ')}
    >
      <AnimatePresence>
        {selected && (
          <motion.div
            key="sel-bar"
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            exit={{ scaleY: 0 }}
            style={{ originY: 0 }}
            transition={springs.snappy}
            className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-primary-500"
          />
        )}
      </AnimatePresence>
      <Home className={`h-5 w-5 mb-2 ${selected ? 'text-primary-500' : 'text-ink-400'}`} />
      <p
        className={`text-sm font-semibold truncate ${
          selected ? 'text-primary-600 dark:text-primary-400' : 'text-ink-800 dark:text-ink-100'
        }`}
      >
        {room.title}
      </p>
      <p className={`text-xs mt-0.5 truncate ${selected ? 'text-primary-400' : 'text-ink-400'}`}>
        {room.address || 'Chưa có địa chỉ'}
      </p>
    </motion.button>
  );
}

// ── Contract card ─────────────────────────────────────────
const STATUS_META = {
  pending_renter_signature: { label: 'Chờ bên B ký', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  active:                   { label: 'ACTIVE',        color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  ended:                    { label: 'ENDED',          color: 'bg-ink-100 text-ink-500 dark:bg-ink-700 dark:text-ink-400' },
};

function ReviewRenterModal({ contract, onClose }) {
  const toast = useToast();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [pending, setPending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating) { toast.warning('Vui lòng chọn số sao.'); return; }
    setPending(true);
    try {
      await reviewApi.createRenterReview({
        contractId: contract.id,
        rating,
        comment: comment.trim(),
      });
      toast.success('Đánh giá của bạn đã được gửi và đang chờ duyệt!');
      onClose();
    } catch (err) {
      toast.error(err.displayMessage || 'Không thể gửi đánh giá, vui lòng thử lại.');
    } finally {
      setPending(false);
    }
  };

  const renterName =
    contract.renter_name ?? contract.renterName ?? `Khách thuê #${contract.renter_id ?? contract.renterId ?? '—'}`;

  return (
    <Modal isOpen onClose={onClose} title="Đánh giá người thuê" size="sm">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="rounded-xl border border-ink-100 dark:border-ink-700 bg-ink-50/60 dark:bg-ink-800/40 px-3 py-2.5">
          <p className="text-xs text-ink-400">Người thuê</p>
          <p className="text-sm font-semibold text-ink-900 dark:text-ink-50 truncate">{renterName}</p>
        </div>

        <div className="flex flex-col items-center gap-2 py-2">
          <p className="text-sm text-ink-600 dark:text-ink-200">Thái độ &amp; ý thức thuê</p>
          <StarRating value={rating} onChange={setRating} size="lg" />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink-900 dark:text-ink-50 mb-1.5">
            Nhận xét
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            maxLength={1000}
            placeholder="Chia sẻ trải nghiệm của bạn về người thuê này..."
            className="w-full px-3 py-2.5 rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 text-ink-900 dark:text-ink-50 placeholder-ink-400 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500/40 transition"
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} type="button">Hủy</Button>
          <Button type="submit" loading={pending}>Gửi đánh giá</Button>
        </div>
      </form>
    </Modal>
  );
}

function ContractCard({ contract, onEnd }) {
  const [localStatus, setLocalStatus] = useState((contract.status ?? '').toLowerCase());
  const [ending, setEnding] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);

  const handleEnd = async () => {
    setEnding(true);
    try {
      await onEnd(contract.id);
      setLocalStatus('ended');
    } catch {
      // error handled in parent
    } finally {
      setEnding(false);
    }
  };

  const active = localStatus === 'active';
  const statusMeta = STATUS_META[localStatus] ?? { label: localStatus, color: 'bg-ink-100 text-ink-500' };

  return (
    <motion.div
      layout
      className={[
        'relative rounded-2xl border p-5 transition-all duration-500',
        active
          ? 'border-l-4 border-l-green-500 border-green-200 dark:border-green-800 bg-green-50/40 dark:bg-green-900/10'
          : 'border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800',
      ].join(' ')}
      style={{
        filter: active ? 'saturate(1)' : 'saturate(0.25)',
        transition: 'filter 0.7s ease',
      }}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <p className="font-semibold text-ink-900 dark:text-ink-50 truncate">
            {contract.renter_name ?? contract.renterName ?? `Khách thuê #${contract.renter_id ?? contract.renterId ?? '—'}`}
          </p>
          <p className="text-xs text-ink-400 mt-0.5">
            {fmtDate(contract.start_date ?? contract.startDate)} →{' '}
            {(contract.end_date ?? contract.endDate)
              ? fmtDate(contract.end_date ?? contract.endDate)
              : 'Không xác định'}
          </p>
        </div>
        <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-bold ${statusMeta.color}`}>
          {statusMeta.label}
        </span>
      </div>

      <div className="flex flex-wrap gap-4 text-sm">
        <span className="flex items-center gap-1 text-ink-600 dark:text-ink-200">
          <DollarSign className="h-3.5 w-3.5 text-ink-400" />
          {fmt(contract.monthly_rent ?? contract.monthlyRent)}
          <span className="text-xs text-ink-400">/tháng</span>
        </span>
        <span className="flex items-center gap-1 text-ink-600 dark:text-ink-200">
          <Zap className="h-3.5 w-3.5 text-yellow-400" />
          {fmt(contract.electricity_price ?? contract.electricityPrice)}/kWh
        </span>
        <span className="flex items-center gap-1 text-ink-600 dark:text-ink-200">
          <Droplets className="h-3.5 w-3.5 text-blue-400" />
          {fmt(contract.water_price ?? contract.waterPrice)}/m³
        </span>
      </div>

      {(active || localStatus === 'ended') && (
        <div className="mt-4 flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            icon={Star}
            onClick={() => setReviewOpen(true)}
            className="text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20"
          >
            Đánh giá người thuê
          </Button>
          {active && (
            <Button
              variant="ghost"
              size="sm"
              loading={ending}
              onClick={handleEnd}
              className="text-error hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              Kết thúc hợp đồng
            </Button>
          )}
        </div>
      )}

      {reviewOpen && (
        <ReviewRenterModal
          contract={contract}
          onClose={() => setReviewOpen(false)}
        />
      )}
    </motion.div>
  );
}

// ── Contract helpers ──────────────────────────────────────
const vnd = (n) =>
  n != null && n !== '' && !isNaN(Number(n))
    ? new Intl.NumberFormat('vi-VN').format(Number(n)) + 'đ'
    : '—';

const formalDate = (d) => {
  const dt = d ? new Date(d) : new Date();
  return `ngày ${String(dt.getDate()).padStart(2, '0')} tháng ${String(dt.getMonth() + 1).padStart(2, '0')} năm ${dt.getFullYear()}`;
};

const ROOM_TYPE_LABEL = {
  ROOM: 'Phòng trọ',
  APARTMENT: 'Căn hộ',
  STUDIO: 'Studio',
  HOUSE: 'Nhà nguyên căn',
};

function ArticleSection({ number, title, children }) {
  return (
    <div className="rounded-xl border border-ink-100 dark:border-ink-700 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-ink-50 dark:bg-ink-800/60 border-b border-ink-100 dark:border-ink-700">
        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary-500 text-white text-[10px] font-bold shrink-0">
          {number}
        </span>
        <span className="text-xs font-bold uppercase tracking-wider text-ink-700 dark:text-ink-200">
          {title}
        </span>
      </div>
      <div className="px-4 py-3 space-y-3">{children}</div>
    </div>
  );
}

function InfoGrid({ rows }) {
  return (
    <div className="divide-y divide-dashed divide-ink-100 dark:divide-ink-700">
      {rows.map(([label, value]) => (
        <div key={label} className="flex justify-between items-baseline py-1.5 gap-4">
          <span className="text-xs text-ink-500 dark:text-ink-400 shrink-0">{label}</span>
          <span className="text-xs font-medium text-ink-800 dark:text-ink-100 text-right truncate">{value || '—'}</span>
        </div>
      ))}
    </div>
  );
}

// ── Renter exact-email lookup ─────────────────────────────
// Privacy: an owner only learns whether an exact email belongs to a verified
// renter; the API never returns the renter's real name, phone, or full email
// before the contract is signed. The owner sees masked previews only.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function RenterPicker({ selected, onSelect }) {
  const [email, setEmail] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');

  const verify = async () => {
    const value = email.trim().toLowerCase();
    setError('');
    if (!EMAIL_RE.test(value)) {
      setError('Vui lòng nhập email hợp lệ.');
      return;
    }
    setVerifying(true);
    try {
      const data = await userApi.lookupRenterByEmail(value);
      // Server returns { id, maskedEmail, maskedName } only.
      onSelect(data);
    } catch (err) {
      onSelect(null);
      setError(err?.displayMessage || 'Không tìm thấy người thuê với email này.');
    } finally {
      setVerifying(false);
    }
  };

  const clear = () => {
    onSelect(null);
    setEmail('');
    setError('');
  };

  if (selected) {
    return (
      <div className="rounded-lg border border-primary-200 dark:border-primary-700 bg-primary-50/50 dark:bg-primary-900/20 px-3 py-2.5 flex items-center gap-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-800 text-primary-600 dark:text-primary-300 font-bold text-sm shrink-0">
          {(selected.maskedName ?? selected.maskedEmail ?? '?')[0].toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink-900 dark:text-ink-50 truncate">{selected.maskedName ?? '—'}</p>
          <p className="text-xs text-ink-500 dark:text-ink-400 truncate">{selected.maskedEmail}</p>
        </div>
        <span className="ml-auto shrink-0 text-xs font-medium text-primary-600 dark:text-primary-400 bg-primary-100 dark:bg-primary-900/40 px-2 py-0.5 rounded-full">
          Đã xác thực
        </span>
        <button
          type="button"
          onClick={clear}
          className="text-ink-400 hover:text-ink-600 shrink-0"
          aria-label="Bỏ chọn"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); if (error) setError(''); }}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); verify(); } }}
          placeholder="Nhập chính xác email của người thuê"
          className="flex-1 h-11 rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 px-4 text-sm text-ink-900 dark:text-ink-50 placeholder-ink-400 outline-none focus:border-primary-500 transition-colors"
          autoComplete="off"
          spellCheck={false}
        />
        <button
          type="button"
          onClick={verify}
          disabled={verifying || !email.trim()}
          className="h-11 px-4 rounded-xl bg-primary-500 hover:bg-primary-600 disabled:bg-ink-200 dark:disabled:bg-ink-700 disabled:text-ink-400 text-white text-sm font-medium transition-colors flex items-center gap-1.5 shrink-0"
        >
          {verifying && (
            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          )}
          Xác minh
        </button>
      </div>
      {error && <p className="mt-1.5 text-xs text-error">{error}</p>}
    </div>
  );
}

// ── Create contract modal ─────────────────────────────────
const EMPTY_FORM = {
  startDate: '',
  endDate: '',
  monthlyRent: '',
  electricityPrice: '',
  waterPrice: '',
};

function CreateContractModal({ isOpen, onClose, room, onCreated }) {
  const toast = useToast();
  const { user } = useAuth();
  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedRenter, setSelectedRenter] = useState(null);
  const [saving, setSaving] = useState(false);

  const now = new Date();
  const contractRef = `HD-${String(now.getFullYear()).slice(2)}${String(now.getMonth() + 1).padStart(2, '0')}-${String(room?.id ?? 0).padStart(3, '0')}`;

  useEffect(() => {
    if (isOpen && room) {
      setForm({
        ...EMPTY_FORM,
        monthlyRent: String(room.price ?? ''),
        electricityPrice: String(room.electricityPricePerUnit ?? ''),
        waterPrice: String(room.waterPricePerUnit ?? ''),
      });
      setSelectedRenter(null);
    }
  }, [isOpen, room]);

  const set = (field, val) => setForm((f) => ({ ...f, [field]: val }));

  const handleSave = async () => {
    if (!selectedRenter) { toast.error('Vui lòng chọn người thuê.'); return; }
    if (!form.startDate) { toast.error('Vui lòng chọn ngày bắt đầu.'); return; }
    if (!form.monthlyRent) { toast.error('Vui lòng nhập tiền thuê.'); return; }
    setSaving(true);
    try {
      const result = await contractApi.create({
        roomId: room.id,
        renter_id: selectedRenter.id,
        start_date: form.startDate,
        end_date: form.endDate || null,
        monthly_rent: Number(form.monthlyRent),
        electricity_price: Number(form.electricityPrice) || 0,
        water_price: Number(form.waterPrice) || 0,
      });
      onCreated(result);
      onClose();
    } catch (err) {
      toast.error(err.displayMessage ?? 'Tạo hợp đồng thất bại.');
    } finally {
      setSaving(false);
    }
  };

  const fullAddress = room
    ? [room.address, room.ward, room.district, room.city].filter(Boolean).join(', ')
    : '—';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title={
        <div>
          <div className="flex items-center gap-2.5 mb-0.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/30 shrink-0">
              <FileText className="h-4 w-4 text-primary-500" />
            </div>
            <p className="text-base font-bold text-ink-900 dark:text-ink-50 tracking-wide">
              HỢP ĐỒNG THUÊ NHÀ Ở
            </p>
          </div>
          <p className="text-xs text-ink-400 pl-10.5">
            Số: <span className="font-mono font-medium text-ink-600 dark:text-ink-300">{contractRef}</span>
            &ensp;·&ensp;Lập {formalDate()}
          </p>
        </div>
      }
      footer={
        <div className="flex items-center justify-between w-full">
          <p className="text-xs text-ink-400 italic">
            Hợp đồng có hiệu lực kể từ ngày ký kết
          </p>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>Huỷ</Button>
            <Button onClick={handleSave} loading={saving} icon={ShieldCheck}>Ký &amp; Xác nhận</Button>
          </div>
        </div>
      }
    >
      <div className="py-1 space-y-3 text-sm">

        {/* Preamble */}
        <p className="text-xs text-ink-500 dark:text-ink-400 leading-relaxed px-1">
          Hợp đồng này được lập và ký kết giữa các bên dưới đây, trên cơ sở tự nguyện, bình đẳng
          và phù hợp với các quy định của pháp luật hiện hành về thuê nhà ở.
        </p>

        {/* Bên A */}
        <ArticleSection number="A" title="Bên cho thuê (Bên A)">
          <InfoGrid
            rows={[
              ['Họ và tên', user?.fullName],
              ['Số điện thoại', user?.phone],
              ['Địa chỉ thường trú', user?.permanentAddress],
              ['Email', user?.email],
            ]}
          />
        </ArticleSection>

        {/* Bên B */}
        <ArticleSection number="B" title="Bên thuê (Bên B)">
          <RenterPicker selected={selectedRenter} onSelect={setSelectedRenter} />
          <p className="text-xs text-ink-400 mt-1.5">
            Nhập đúng email người thuê để mời ký hợp đồng. Thông tin cá nhân (họ tên, số điện thoại)
            chỉ hiển thị đầy đủ sau khi người thuê xác nhận hợp đồng.
          </p>
        </ArticleSection>

        {/* Điều 1 — Đối tượng */}
        <ArticleSection number="1" title="Điều 1 — Đối tượng hợp đồng">
          {/* Basic info */}
          <InfoGrid
            rows={[
              ['Tên phòng', room?.title],
              ['Loại hình', ROOM_TYPE_LABEL[room?.roomType] ?? room?.roomType],
              ['Diện tích', room?.areaMq ? `${room.areaMq} m²` : null],
              ['Địa chỉ', fullAddress],
              ['Tiền đặt cọc', room?.deposit ? vnd(room.deposit) : 'Không có'],
            ]}
          />

          {/* Fees */}
          {(room?.wifiFee || room?.serviceFee || room?.bikeParkingFee) && (
            <div className="mt-2 pt-2 border-t border-dashed border-ink-100 dark:border-ink-700">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-400 mb-1.5">Phí dịch vụ kèm theo</p>
              <InfoGrid
                rows={[
                  room?.serviceFee ? ['Phí dịch vụ', vnd(room.serviceFee) + '/tháng'] : null,
                  room?.wifiFee ? ['Phí WiFi', vnd(room.wifiFee) + '/tháng'] : null,
                  room?.bikeParkingFee ? ['Phí gửi xe', vnd(room.bikeParkingFee) + '/tháng'] : null,
                ].filter(Boolean)}
              />
            </div>
          )}

          {/* Amenities */}
          {(room?.hasAc || room?.hasFridge || room?.hasPrivateWc || room?.hasSecurity) && (
            <div className="mt-2 pt-2 border-t border-dashed border-ink-100 dark:border-ink-700">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-400 mb-1.5">Tiện ích có sẵn</p>
              <div className="flex flex-wrap gap-1.5">
                {room?.hasAc && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-700 px-2 py-0.5 text-xs font-medium text-sky-700 dark:text-sky-300">
                    ❄️ Điều hoà
                  </span>
                )}
                {room?.hasFridge && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                    🧊 Tủ lạnh
                  </span>
                )}
                {room?.hasPrivateWc && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-700 px-2 py-0.5 text-xs font-medium text-violet-700 dark:text-violet-300">
                    🚿 WC riêng
                  </span>
                )}
                {room?.hasSecurity && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300">
                    🔒 Bảo vệ
                  </span>
                )}
              </div>
            </div>
          )}
        </ArticleSection>

        {/* Điều 2 — Thời hạn */}
        <ArticleSection number="2" title="Điều 2 — Thời hạn thuê">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Ngày bắt đầu"
              required
              type="date"
              value={form.startDate}
              onChange={(e) => set('startDate', e.target.value)}
            />
            <Input
              label="Ngày kết thúc (tuỳ chọn)"
              type="date"
              value={form.endDate}
              onChange={(e) => set('endDate', e.target.value)}
            />
          </div>
          {form.startDate && (
            <p className="text-xs text-ink-500 dark:text-ink-400">
              Hợp đồng có hiệu lực từ <span className="font-medium text-ink-700 dark:text-ink-200">{formalDate(form.startDate)}</span>
              {form.endDate
                ? <> đến <span className="font-medium text-ink-700 dark:text-ink-200">{formalDate(form.endDate)}</span>.</>
                : ', không có ngày kết thúc cố định.'}
            </p>
          )}
        </ArticleSection>

        {/* Điều 3 — Tài chính */}
        <ArticleSection number="3" title="Điều 3 — Giá thuê và thanh toán">
          <Input
            label="Tiền thuê hàng tháng (VNĐ)"
            required
            type="number"
            value={form.monthlyRent}
            onChange={(e) => set('monthlyRent', e.target.value)}
            placeholder="VD: 3000000"
          />
          <div className="grid grid-cols-2 gap-3 mt-1">
            <Input
              label="Đơn giá điện (VNĐ/kWh)"
              type="number"
              value={form.electricityPrice}
              onChange={(e) => set('electricityPrice', e.target.value)}
              placeholder="VD: 3500"
            />
            <Input
              label="Đơn giá nước (VNĐ/m³)"
              type="number"
              value={form.waterPrice}
              onChange={(e) => set('waterPrice', e.target.value)}
              placeholder="VD: 15000"
            />
          </div>
          {/* Live summary chips */}
          <div className="flex flex-wrap gap-2 mt-2">
            {form.monthlyRent && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-primary-50 dark:bg-primary-900/20 px-2.5 py-1 text-xs font-semibold text-primary-700 dark:text-primary-300">
                <DollarSign className="h-3 w-3" /> Thuê: {vnd(form.monthlyRent)}/tháng
              </span>
            )}
            {form.electricityPrice && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 px-2.5 py-1 text-xs font-semibold text-yellow-700 dark:text-yellow-300">
                <Zap className="h-3 w-3" /> Điện: {vnd(form.electricityPrice)}/kWh
              </span>
            )}
            {form.waterPrice && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 dark:bg-blue-900/20 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300">
                <Droplets className="h-3 w-3" /> Nước: {vnd(form.waterPrice)}/m³
              </span>
            )}
          </div>
          <p className="text-xs text-ink-400 mt-1">
            Tiền thuê được thanh toán vào ngày <strong>05</strong> hàng tháng.
            Điện, nước thanh toán theo chỉ số thực tế.
          </p>
        </ArticleSection>

        {/* Điều 4 — Nghĩa vụ Bên A */}
        <ArticleSection number="4" title="Điều 4 — Nghĩa vụ và quyền của Bên A (Bên cho thuê)">
          <div className="text-xs text-ink-600 dark:text-ink-300 space-y-1.5">
            <p className="font-semibold text-ink-700 dark:text-ink-200">4.1. Nghĩa vụ:</p>
            <ul className="list-disc list-inside space-y-1 pl-1">
              <li>Giao phòng cho Bên B đúng thời điểm đã thoả thuận, đảm bảo đầy đủ tiện nghi như mô tả trong hợp đồng.</li>
              <li>Đảm bảo quyền sử dụng phòng ổn định, không tự ý xâm phạm hoặc thu hồi trong thời hạn hợp đồng.</li>
              <li>Sửa chữa, khắc phục kịp thời các hư hỏng, xuống cấp không do lỗi của Bên B gây ra.</li>
              <li>Không tăng giá thuê trong thời hạn hợp đồng; nếu gia hạn phải thông báo trước ít nhất <strong>30 ngày</strong>.</li>
              <li>Đảm bảo an ninh, trật tự khu vực chung và cung cấp đầy đủ điện, nước sinh hoạt.</li>
            </ul>
            <p className="font-semibold text-ink-700 dark:text-ink-200 pt-1">4.2. Quyền:</p>
            <ul className="list-disc list-inside space-y-1 pl-1">
              <li>Yêu cầu Bên B thanh toán đúng hạn theo các điều khoản đã thoả thuận.</li>
              <li>Kiểm tra tình trạng phòng định kỳ với sự đồng ý của Bên B (thông báo trước ít nhất <strong>24 giờ</strong>).</li>
              <li>Đơn phương chấm dứt hợp đồng nếu Bên B vi phạm nghĩa vụ sau khi đã nhắc nhở.</li>
            </ul>
          </div>
        </ArticleSection>

        {/* Điều 5 — Nghĩa vụ Bên B */}
        <ArticleSection number="5" title="Điều 5 — Nghĩa vụ và quyền của Bên B (Bên thuê)">
          <div className="text-xs text-ink-600 dark:text-ink-300 space-y-1.5">
            <p className="font-semibold text-ink-700 dark:text-ink-200">5.1. Nghĩa vụ:</p>
            <ul className="list-disc list-inside space-y-1 pl-1">
              <li>Thanh toán tiền thuê và các khoản phí đúng hạn vào ngày <strong>05</strong> hàng tháng.</li>
              <li>Sử dụng phòng đúng mục đích; không tự ý cải tạo, sửa chữa khi chưa có sự đồng ý của Bên A.</li>
              <li>Giữ gìn vệ sinh chung, không gây tiếng ồn, mất trật tự ảnh hưởng đến người xung quanh.</li>
              <li>Bồi thường thiệt hại do làm hư hỏng tài sản, trang thiết bị trong phòng.</li>
              <li>Không cho người khác thuê lại hoặc sử dụng phòng vào mục đích kinh doanh khi chưa được Bên A đồng ý.</li>
              <li>Thông báo cho Bên A trước ít nhất <strong>30 ngày</strong> nếu có nhu cầu chấm dứt hợp đồng trước hạn.</li>
              <li>Hoàn trả phòng đúng thời hạn, đảm bảo tình trạng như khi nhận bàn giao (trừ hao mòn tự nhiên).</li>
            </ul>
            <p className="font-semibold text-ink-700 dark:text-ink-200 pt-1">5.2. Quyền:</p>
            <ul className="list-disc list-inside space-y-1 pl-1">
              <li>Được sử dụng phòng ổn định, không bị Bên A can thiệp trong thời hạn hợp đồng.</li>
              <li>Yêu cầu Bên A sửa chữa kịp thời các hư hỏng không do lỗi của mình.</li>
              <li>Được ưu tiên gia hạn hợp đồng với điều kiện tương đương khi hết hạn.</li>
            </ul>
          </div>
        </ArticleSection>

        {/* Điều 6 — Đặt cọc */}
        <ArticleSection number="6" title="Điều 6 — Đặt cọc và bàn giao">
          <div className="text-xs text-ink-600 dark:text-ink-300 space-y-1">
            <ul className="list-disc list-inside space-y-1 pl-1">
              <li>
                Bên B đặt cọc số tiền{' '}
                <strong className="text-ink-800 dark:text-ink-100">
                  {room?.deposit ? vnd(room.deposit) : 'theo thoả thuận'}
                </strong>{' '}
                để đảm bảo thực hiện hợp đồng.
              </li>
              <li>Tiền đặt cọc được hoàn trả đầy đủ trong vòng <strong>7 ngày</strong> sau khi kết thúc hợp đồng, trừ các khoản bồi thường thiệt hại (nếu có).</li>
              <li>Nếu Bên B đơn phương chấm dứt hợp đồng trước hạn mà không thông báo đúng quy định, Bên A có quyền giữ lại tiền đặt cọc.</li>
              <li>Nếu Bên A đơn phương chấm dứt hợp đồng trái quy định, Bên A phải hoàn trả tiền đặt cọc và bồi thường thêm một khoản tương đương.</li>
              <li>Biên bản bàn giao phòng (trang thiết bị, số điện/nước ban đầu) được lập riêng và là phụ lục không tách rời của hợp đồng này.</li>
            </ul>
          </div>
        </ArticleSection>

        {/* Điều 7 — Chấm dứt */}
        <ArticleSection number="7" title="Điều 7 — Chấm dứt hợp đồng">
          <div className="text-xs text-ink-600 dark:text-ink-300 space-y-1">
            <p className="font-semibold text-ink-700 dark:text-ink-200">Hợp đồng chấm dứt trong các trường hợp sau:</p>
            <ul className="list-disc list-inside space-y-1 pl-1">
              <li>Hết thời hạn thuê và hai bên không ký gia hạn.</li>
              <li>Hai bên thoả thuận chấm dứt trước hạn bằng văn bản.</li>
              <li>Bên B không thanh toán tiền thuê trong <strong>15 ngày</strong> kể từ ngày đến hạn sau khi đã được nhắc nhở.</li>
              <li>Bên B vi phạm nghiêm trọng các điều khoản của hợp đồng và không khắc phục trong <strong>7 ngày</strong> kể từ ngày nhận thông báo.</li>
              <li>Phòng bị thu hồi, giải toả hoặc không thể sử dụng theo quyết định của cơ quan có thẩm quyền.</li>
            </ul>
          </div>
        </ArticleSection>

        {/* Điều 8 — Cam kết chung */}
        <ArticleSection number="8" title="Điều 8 — Điều khoản chung và cam kết">
          <div className="text-xs text-ink-600 dark:text-ink-300 space-y-1.5">
            <ul className="list-disc list-inside space-y-1 pl-1">
              <li>Hợp đồng này có hiệu lực kể từ ngày ký và được lập thành <strong>02 bản</strong>, mỗi bên giữ <strong>01 bản</strong> có giá trị pháp lý như nhau.</li>
              <li>Mọi thay đổi, bổ sung điều khoản chỉ có hiệu lực khi được hai bên ký xác nhận bằng phụ lục hợp đồng.</li>
              <li>Trong quá trình thực hiện hợp đồng, nếu phát sinh tranh chấp, hai bên ưu tiên giải quyết thông qua thương lượng, hoà giải.</li>
              <li>Trường hợp không hoà giải được, tranh chấp sẽ được đưa ra <strong>Toà án nhân dân có thẩm quyền</strong> để giải quyết theo quy định pháp luật Việt Nam.</li>
              <li>Các vấn đề không được quy định trong hợp đồng này sẽ được áp dụng theo <strong>Bộ luật Dân sự</strong> và <strong>Luật Nhà ở</strong> hiện hành.</li>
            </ul>
          </div>
        </ArticleSection>

      </div>
    </Modal>
  );
}

// ── Page ──────────────────────────────────────────────────
export default function ContractManagementPage() {
  const toast = useToast();
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [contracts, setContracts] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingContracts, setLoadingContracts] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [showHandshake, setShowHandshake] = useState(false);

  useEffect(() => {
    roomApi
      .getAll()
      .then((r) => {
        const arr = Array.isArray(r) ? r : (r?.content ?? r?.items ?? []);
        setRooms(arr);
        if (arr.length > 0) setSelectedRoom(arr[0]);
      })
      .catch(() => toast.error('Không thể tải danh sách phòng.'))
      .finally(() => setLoadingRooms(false));
  }, []);

  useEffect(() => {
    if (!selectedRoom) return;
    setLoadingContracts(true);
    contractApi
      .getByRoom(selectedRoom.id)
      .then((r) => {
        const arr = Array.isArray(r) ? r : (r?.content ?? r?.items ?? []);
        setContracts(arr);
      })
      .catch(() => toast.error('Không thể tải hợp đồng.'))
      .finally(() => setLoadingContracts(false));
  }, [selectedRoom]);

  const handleSelectRoom = useCallback((room) => {
    setSelectedRoom(room);
    setContracts([]);
  }, []);

  const handleCreated = useCallback((contract) => {
    setContracts((prev) => [contract, ...prev]);
    setShowHandshake(true);
  }, []);

  const handleEnd = useCallback(
    async (contractId) => {
      await contractApi.end(contractId);
      setContracts((prev) =>
        prev.map((c) => (c.id === contractId ? { ...c, status: 'ENDED' } : c))
      );
      toast.success('Đã kết thúc hợp đồng.');
    },
    [toast]
  );

  return (
    <div className="space-y-6">
      <HandshakeOverlay
        visible={showHandshake}
        onDone={() => setShowHandshake(false)}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink-900 dark:text-ink-50">Quản lý hợp đồng</h1>
        {selectedRoom && (
          <Button icon={Plus} onClick={() => setModalOpen(true)}>
            Tạo hợp đồng
          </Button>
        )}
      </div>

      {/* Room selector */}
      {loadingRooms ? (
        <div className="flex gap-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rect" className="h-24 w-44 flex-shrink-0 rounded-2xl" />
          ))}
        </div>
      ) : rooms.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center rounded-2xl border-2 border-dashed border-ink-200 dark:border-ink-700">
          <Home className="h-10 w-10 text-ink-300 mb-3" />
          <p className="font-medium text-ink-600 dark:text-ink-200">Chưa có phòng nào</p>
          <p className="text-sm text-ink-400 mt-1">Hãy thêm phòng trước khi tạo hợp đồng</p>
        </div>
      ) : (
        <div className="overflow-x-auto pb-2 -mx-1 px-1">
          <div className="flex gap-3 w-max">
            {rooms.map((room) => (
              <RoomSelectorCard
                key={room.id}
                room={room}
                selected={selectedRoom?.id === room.id}
                onClick={() => handleSelectRoom(room)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Contracts list */}
      {selectedRoom && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-ink-700 dark:text-ink-200">
              Hợp đồng — {selectedRoom.title}
            </h2>
          </div>

          {loadingContracts ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <Skeleton key={i} variant="rect" className="h-32 w-full rounded-2xl" />
              ))}
            </div>
          ) : contracts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center py-16 text-center border-2 border-dashed border-ink-200 dark:border-ink-700 rounded-2xl"
            >
              <ScrollText className="h-8 w-8 text-ink-300 mb-2" />
              <p className="text-ink-600 dark:text-ink-200 font-medium">Chưa có hợp đồng</p>
              <Button className="mt-3" size="sm" icon={Plus} onClick={() => setModalOpen(true)}>
                Tạo hợp đồng đầu tiên
              </Button>
            </motion.div>
          ) : (
            <AnimatePresence mode="popLayout">
              {contracts.map((c) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: -12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  transition={springs.smooth}
                >
                  <ContractCard contract={c} onEnd={handleEnd} />
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      )}

      <CreateContractModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        room={selectedRoom}
        onCreated={handleCreated}
      />
    </div>
  );
}
