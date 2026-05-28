import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useSpring } from 'framer-motion';
import {
  Plus, Receipt, ChevronRight, ChevronDown,
  Zap, Droplets, DollarSign,
} from 'lucide-react';
import { roomApi, contractApi, billApi, userApi } from '../../lib/api';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { springs } from '../../lib/animations';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Skeleton from '../../components/ui/Skeleton';

const fmt = (n) =>
  n != null
    ? new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(n) + 'đ'
    : '—';

// ── Animated number (spring) ──────────────────────────────
function SpringNumber({ value, formatFn = fmt }) {
  const spring = useSpring(value, { stiffness: 200, damping: 22 });
  const [display, setDisplay] = useState(Math.round(value));

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  useEffect(() => {
    return spring.on('change', (v) => setDisplay(Math.round(v)));
  }, [spring]);

  return <>{formatFn(display)}</>;
}

// ── Status badge with stamp animation ────────────────────
function StatusBadge({ status, stamping }) {
  const styles =
    status === 'PAID'
      ? 'bg-green-100 text-green-700 ring-green-200 dark:bg-green-900/30 dark:text-green-400 dark:ring-green-500/30'
      : status === 'AWAITING_APPROVAL'
        ? 'bg-amber-100 text-amber-700 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:ring-amber-500/30'
        : 'bg-orange-100 text-orange-700 ring-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:ring-orange-500/30';
  const label =
    status === 'PAID' ? 'Đã thanh toán'
      : status === 'AWAITING_APPROVAL' ? 'Chờ duyệt'
        : 'Chưa thanh toán';
  return (
    <motion.span
      key={status}
      initial={false}
      animate={
        stamping
          ? { scale: [0.5, 1.2, 1], rotate: [-15, -4, 0] }
          : { scale: 1, rotate: 0 }
      }
      transition={springs.bouncy}
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ring-1 ${styles}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${
        status === 'PAID' ? 'bg-green-500' : status === 'AWAITING_APPROVAL' ? 'bg-amber-500' : 'bg-orange-500'
      }`} />
      {label}
    </motion.span>
  );
}

// ── Bill row with accordion ───────────────────────────────
function BillRow({ bill: initialBill, contract }) {
  const toast = useToast();
  const [bill, setBill] = useState(initialBill);
  const [open, setOpen] = useState(false);
  const [marking, setMarking] = useState(false);
  const [stamping, setStamping] = useState(false);

  const handleApprove = async (e) => {
    e.stopPropagation();
    if (bill.status !== 'AWAITING_APPROVAL') return;
    setMarking(true);
    try {
      const updated = await billApi.approve(bill.id);
      setStamping(true);
      setBill(updated);
      setTimeout(() => setStamping(false), 800);
    } catch (err) {
      toast.error(err.displayMessage ?? 'Duyệt thất bại.');
    } finally {
      setMarking(false);
    }
  };

  const handleReject = async (e) => {
    e.stopPropagation();
    if (bill.status !== 'AWAITING_APPROVAL') return;
    const reason = window.prompt('Lý do từ chối (tuỳ chọn):', '') ?? '';
    setMarking(true);
    try {
      const updated = await billApi.reject(bill.id, reason);
      setBill(updated);
    } catch (err) {
      toast.error(err.displayMessage ?? 'Từ chối thất bại.');
    } finally {
      setMarking(false);
    }
  };

  const lineItems = bill.lineItems ?? bill.items ?? [];

  return (
    <>
      <tr
        className="border-b border-ink-100 dark:border-ink-700 cursor-pointer hover:bg-ink-50 dark:hover:bg-ink-800/50 transition-colors"
        onClick={() => setOpen((o) => !o)}
      >
        <td className="py-3 pl-4 pr-2 text-sm text-ink-900 dark:text-ink-50">
          <span className="flex items-center gap-1.5">
            <motion.span
              animate={{ rotate: open ? 90 : 0 }}
              transition={springs.snappy}
              className="text-ink-400"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </motion.span>
            {bill.billingMonth ?? bill.month ?? '—'}
          </span>
        </td>
        <td className="py-3 px-2 text-sm text-ink-600 dark:text-ink-200 text-right">
          {fmt(bill.elecAmount)}
        </td>
        <td className="py-3 px-2 text-sm text-ink-600 dark:text-ink-200 text-right">
          {fmt(bill.waterAmount)}
        </td>
        <td className="py-3 px-2 text-sm text-ink-600 dark:text-ink-200 text-right">
          {fmt(bill.rentAmount)}
        </td>
        <td className="py-3 px-2 text-sm text-ink-600 dark:text-ink-200 text-right">
          {fmt(bill.extraFee)}
        </td>
        <td className="py-3 px-2 text-sm font-semibold text-ink-900 dark:text-ink-50 text-right">
          {fmt(bill.totalAmount)}
        </td>
        <td className="py-3 pl-2 pr-2 text-right">
          <StatusBadge status={bill.status} stamping={stamping} />
        </td>
        <td className="py-3 pl-2 pr-4 text-right" onClick={(e) => e.stopPropagation()}>
          {bill.status === 'AWAITING_APPROVAL' && (
            <div className="inline-flex gap-1.5">
              <Button size="sm" variant="outlined" loading={marking} onClick={handleApprove}>
                Duyệt
              </Button>
              <Button size="sm" variant="ghost" onClick={handleReject}>
                Từ chối
              </Button>
            </div>
          )}
        </td>
      </tr>
      <AnimatePresence initial={false}>
        {open && (
          <tr>
            <td colSpan={8} className="p-0">
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={springs.smooth}
                className="overflow-hidden"
              >
                <div className="bg-ink-50 dark:bg-ink-800/50 px-6 py-4 space-y-2 border-b border-ink-100 dark:border-ink-700">
                  {/* Electricity detail */}
                  {bill.elecUsage != null && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1.5 text-ink-500 dark:text-ink-400">
                        <Zap className="h-3.5 w-3.5 text-yellow-400" />
                        Điện: {bill.elecPrev ?? '?'} →{' '}
                        {bill.elecCurr ?? '?'} kWh
                        ({bill.elecUsage} × {fmt(bill.elecUnitPrice ?? contract?.electricityPrice)})
                      </span>
                      <span className="font-medium text-ink-900 dark:text-ink-50">
                        {fmt(bill.elecAmount)}
                      </span>
                    </div>
                  )}
                  {/* Water detail */}
                  {bill.waterUsage != null && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1.5 text-ink-500 dark:text-ink-400">
                        <Droplets className="h-3.5 w-3.5 text-blue-400" />
                        Nước: {bill.waterPrev ?? '?'} →{' '}
                        {bill.waterCurr ?? '?'} m³
                        ({bill.waterUsage} × {fmt(bill.waterUnitPrice ?? contract?.waterPrice)})
                      </span>
                      <span className="font-medium text-ink-900 dark:text-ink-50">
                        {fmt(bill.waterAmount)}
                      </span>
                    </div>
                  )}
                  {/* Rent */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5 text-ink-500 dark:text-ink-400">
                      <DollarSign className="h-3.5 w-3.5 text-ink-400" />
                      Tiền thuê tháng
                    </span>
                    <span className="font-medium text-ink-900 dark:text-ink-50">
                      {fmt(bill.rentAmount)}
                    </span>
                  </div>
                  {/* Extra */}
                  {bill.extraFee > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-ink-500 dark:text-ink-400">
                        Phụ phí{bill.extraNote ? ` — ${bill.extraNote}` : ''}
                      </span>
                      <span className="font-medium text-ink-900 dark:text-ink-50">
                        {fmt(bill.extraFee)}
                      </span>
                    </div>
                  )}
                  {/* Custom line items */}
                  {lineItems.map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-ink-500 dark:text-ink-400">
                        {item.description ?? item.name ?? `Khoản ${i + 1}`}
                      </span>
                      <span className="font-medium text-ink-900 dark:text-ink-50">
                        {fmt(item.amount)}
                      </span>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-ink-200 dark:border-ink-700 flex items-center justify-between text-sm font-bold">
                    <span className="text-ink-700 dark:text-ink-200">Tổng cộng</span>
                    <span className="text-primary-500">{fmt(bill.totalAmount)}</span>
                  </div>

                  {bill.paymentProofUrl && (
                    <div className="pt-3 border-t border-ink-200 dark:border-ink-700 space-y-2">
                      <p className="text-xs font-semibold text-ink-500 dark:text-ink-300">
                        Ảnh chuyển khoản từ người thuê
                        {bill.proofSubmittedAt && (
                          <span className="ml-2 text-ink-400 font-normal">
                            ({new Date(bill.proofSubmittedAt).toLocaleString('vi-VN')})
                          </span>
                        )}
                      </p>
                      <a
                        href={bill.paymentProofUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <img
                          src={bill.paymentProofUrl}
                          alt="Ảnh chuyển khoản"
                          className="rounded-lg border border-ink-200 dark:border-ink-700 max-h-72 bg-white"
                        />
                      </a>
                    </div>
                  )}
                  {bill.rejectionReason && (
                    <p className="text-xs text-red-500 pt-2 border-t border-ink-200 dark:border-ink-700">
                      Lý do từ chối lần trước: {bill.rejectionReason}
                    </p>
                  )}
                </div>
              </motion.div>
            </td>
          </tr>
        )}
      </AnimatePresence>
    </>
  );
}

// Common Vietnamese bank short codes accepted by img.vietqr.io
const BANK_CODES = [
  'VCB', 'TCB', 'MB', 'BIDV', 'VPB', 'ACB', 'TPB', 'STB',
  'ICB', 'AGRIBANK', 'VIB', 'SHB', 'HDB', 'OCB', 'MSB', 'SEAB',
];

// ── Create bill modal ─────────────────────────────────────
function CreateBillModal({ isOpen, onClose, contract, room, lastBill, onCreated }) {
  const toast = useToast();
  const { user, updateUser } = useAuth();
  const [saving, setSaving] = useState(false);

  const today = new Date();
  const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const currentMonthLabel = today.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  const [form, setForm] = useState({
    billingMonth: currentMonth,
    prevElec: '',
    currElec: '',
    elecPrice: '',
    prevWater: '',
    currWater: '',
    waterPrice: '',
    extraAmount: '',
    extraNote: '',
    bankCode: 'VCB',
    bankAccountNumber: '',
    bankAccountName: '',
  });

  useEffect(() => {
    if (!isOpen || !contract) return;
    // First month → 0/0; otherwise carry over the last bill's current reading.
    const prevElecVal = lastBill?.elecCurr ?? lastBill?.electricityCurrent ?? 0;
    const prevWaterVal = lastBill?.waterCurr ?? lastBill?.waterCurrent ?? 0;
    setForm({
      billingMonth: currentMonth,
      prevElec: String(prevElecVal),
      currElec: '',
      elecPrice: String(contract.electricity_price ?? contract.electricityPrice ?? ''),
      prevWater: String(prevWaterVal),
      currWater: '',
      waterPrice: String(contract.water_price ?? contract.waterPrice ?? ''),
      extraAmount: '',
      extraNote: '',
      bankCode: user?.bankCode ?? 'VCB',
      bankAccountNumber: user?.bankAccountNumber ?? '',
      bankAccountName: user?.bankAccountName ?? user?.fullName ?? '',
    });
  }, [isOpen, contract, lastBill, user]);

  const set = (field, val) => setForm((f) => ({ ...f, [field]: val }));

  const elecUsage = Math.max(0, (Number(form.currElec) || 0) - (Number(form.prevElec) || 0));
  const elecAmount = elecUsage * (Number(form.elecPrice) || 0);
  const waterUsage = Math.max(0, (Number(form.currWater) || 0) - (Number(form.prevWater) || 0));
  const waterAmount = waterUsage * (Number(form.waterPrice) || 0);
  const rentAmount = Number(contract?.monthly_rent ?? contract?.monthlyRent ?? 0);
  const serviceFee = Number(room?.serviceFee ?? room?.service_fee ?? 0);
  const wifiFee = Number(room?.wifiFee ?? room?.wifi_fee ?? 0);
  const bikeParkingFee = Number(room?.bikeParkingFee ?? room?.bike_parking_fee ?? 0);
  const extra = Number(form.extraAmount) || 0;
  const total = elecAmount + waterAmount + rentAmount + serviceFee + wifiFee + bikeParkingFee + extra;

  const handleSave = async () => {
    if (!form.billingMonth) { toast.error('Vui lòng chọn tháng.'); return; }
    if (!form.currElec) { toast.error('Vui lòng nhập chỉ số điện hiện tại.'); return; }
    if (!form.currWater) { toast.error('Vui lòng nhập chỉ số nước hiện tại.'); return; }
    if (!form.bankCode || !form.bankAccountNumber || !form.bankAccountName) {
      toast.error('Vui lòng nhập đầy đủ thông tin tài khoản nhận tiền.');
      return;
    }
    setSaving(true);
    try {
      // Persist bank info first, so the bill snapshot uses up-to-date account.
      const bankChanged =
        form.bankCode !== user?.bankCode
        || form.bankAccountNumber !== user?.bankAccountNumber
        || form.bankAccountName !== user?.bankAccountName;
      if (bankChanged) {
        const updated = await userApi.updateMe({
          bankCode: form.bankCode,
          bankAccountNumber: form.bankAccountNumber,
          bankAccountName: form.bankAccountName,
        });
        updateUser(updated);
      }
      // Backend expects: billingMonth (yyyy-MM-dd, day 1), elecCurr, waterCurr, extraFee, extraNote.
      // Prev meters & prices come from the last bill / contract on the server; service fees come from the room.
      const result = await billApi.create({
        contractId: contract.id,
        billingMonth: `${form.billingMonth}-01`,
        elecCurr: Number(form.currElec),
        waterCurr: Number(form.currWater),
        extraFee: extra,
        extraNote: form.extraNote,
      });
      onCreated(result);
      onClose();
    } catch (err) {
      toast.error(err.displayMessage ?? 'Tạo hoá đơn thất bại.');
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    'w-full h-12 px-4 rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 text-sm text-ink-900 dark:text-ink-50 outline-none focus:border-primary-500 transition-colors';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      title="Tạo hoá đơn tháng"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Huỷ</Button>
          <Button onClick={handleSave} loading={saving}>Tạo hoá đơn</Button>
        </>
      }
    >
      <div className="space-y-6 py-2">
        {/* Month — always the current real month, not editable */}
        <div>
          <label className="block text-xs text-primary-500 mb-1">Tháng</label>
          <input
            readOnly
            value={currentMonthLabel}
            className={`${inputClass} bg-ink-50 dark:bg-ink-800 cursor-not-allowed`}
          />
        </div>

        {/* Electricity */}
        <div className="space-y-3">
          <p className="flex items-center gap-2 text-sm font-semibold text-ink-700 dark:text-ink-200">
            <Zap className="h-4 w-4 text-yellow-400" /> Điện
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-ink-400 mb-1">Chỉ số cũ (kWh)</label>
              <input
                readOnly
                value={form.prevElec}
                className={`${inputClass} bg-ink-50 dark:bg-ink-800 text-ink-500`}
              />
            </div>
            <div>
              <label className="block text-xs text-ink-400 mb-1">Chỉ số mới (kWh)</label>
              <input
                type="number"
                value={form.currElec}
                onChange={(e) => set('currElec', e.target.value)}
                className={inputClass}
                placeholder="0"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="bg-ink-50 dark:bg-ink-800/50 rounded-xl p-3 text-center">
              <p className="text-xs text-ink-400">Sử dụng</p>
              <p className="font-bold text-ink-900 dark:text-ink-50 mt-0.5">{elecUsage} kWh</p>
            </div>
            <div className="bg-ink-50 dark:bg-ink-800/50 rounded-xl p-3 text-center">
              <label className="block text-xs text-ink-400 mb-1">Đơn giá</label>
              <input
                type="number"
                value={form.elecPrice}
                onChange={(e) => set('elecPrice', e.target.value)}
                className="w-full bg-transparent text-center font-bold text-ink-900 dark:text-ink-50 outline-none text-sm"
                placeholder="0"
              />
            </div>
            <div className="bg-primary-50 dark:bg-primary-900/20 rounded-xl p-3 text-center">
              <p className="text-xs text-primary-400">Thành tiền</p>
              <p className="font-bold text-primary-600 dark:text-primary-400 mt-0.5">{fmt(elecAmount)}</p>
            </div>
          </div>
        </div>

        {/* Water */}
        <div className="space-y-3">
          <p className="flex items-center gap-2 text-sm font-semibold text-ink-700 dark:text-ink-200">
            <Droplets className="h-4 w-4 text-blue-400" /> Nước
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-ink-400 mb-1">Chỉ số cũ (m³)</label>
              <input
                readOnly
                value={form.prevWater}
                className={`${inputClass} bg-ink-50 dark:bg-ink-800 text-ink-500`}
              />
            </div>
            <div>
              <label className="block text-xs text-ink-400 mb-1">Chỉ số mới (m³)</label>
              <input
                type="number"
                value={form.currWater}
                onChange={(e) => set('currWater', e.target.value)}
                className={inputClass}
                placeholder="0"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="bg-ink-50 dark:bg-ink-800/50 rounded-xl p-3 text-center">
              <p className="text-xs text-ink-400">Sử dụng</p>
              <p className="font-bold text-ink-900 dark:text-ink-50 mt-0.5">{waterUsage} m³</p>
            </div>
            <div className="bg-ink-50 dark:bg-ink-800/50 rounded-xl p-3 text-center">
              <label className="block text-xs text-ink-400 mb-1">Đơn giá</label>
              <input
                type="number"
                value={form.waterPrice}
                onChange={(e) => set('waterPrice', e.target.value)}
                className="w-full bg-transparent text-center font-bold text-ink-900 dark:text-ink-50 outline-none text-sm"
                placeholder="0"
              />
            </div>
            <div className="bg-primary-50 dark:bg-primary-900/20 rounded-xl p-3 text-center">
              <p className="text-xs text-primary-400">Thành tiền</p>
              <p className="font-bold text-primary-600 dark:text-primary-400 mt-0.5">{fmt(waterAmount)}</p>
            </div>
          </div>
        </div>

        {/* Rent + service fees (readOnly, from room/contract) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between rounded-xl bg-ink-50 dark:bg-ink-800/50 px-4 py-3">
            <span className="flex items-center gap-2 text-sm text-ink-600 dark:text-ink-200">
              <DollarSign className="h-4 w-4 text-ink-400" /> Tiền thuê
            </span>
            <span className="font-semibold text-ink-900 dark:text-ink-50">{fmt(rentAmount)}</span>
          </div>
          {serviceFee > 0 && (
            <div className="flex items-center justify-between rounded-xl bg-ink-50/60 dark:bg-ink-800/30 px-4 py-2 text-sm">
              <span className="text-ink-600 dark:text-ink-300">Phí dịch vụ</span>
              <span className="font-medium text-ink-800 dark:text-ink-100">{fmt(serviceFee)}</span>
            </div>
          )}
          {wifiFee > 0 && (
            <div className="flex items-center justify-between rounded-xl bg-ink-50/60 dark:bg-ink-800/30 px-4 py-2 text-sm">
              <span className="text-ink-600 dark:text-ink-300">Phí WiFi</span>
              <span className="font-medium text-ink-800 dark:text-ink-100">{fmt(wifiFee)}</span>
            </div>
          )}
          {bikeParkingFee > 0 && (
            <div className="flex items-center justify-between rounded-xl bg-ink-50/60 dark:bg-ink-800/30 px-4 py-2 text-sm">
              <span className="text-ink-600 dark:text-ink-300">Phí gửi xe</span>
              <span className="font-medium text-ink-800 dark:text-ink-100">{fmt(bikeParkingFee)}</span>
            </div>
          )}
        </div>

        {/* Extra fee */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Phụ phí (VNĐ)"
            type="number"
            value={form.extraAmount}
            onChange={(e) => set('extraAmount', e.target.value)}
          />
          <Input
            label="Ghi chú phụ phí"
            value={form.extraNote}
            onChange={(e) => set('extraNote', e.target.value)}
          />
        </div>

        {/* Bank account for QR */}
        <div className="space-y-3 rounded-2xl border border-ink-200 dark:border-ink-700 p-4">
          <p className="text-sm font-semibold text-ink-700 dark:text-ink-200">
            Tài khoản nhận tiền (dùng để tạo QR)
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-ink-400 mb-1">Ngân hàng</label>
              <select
                value={form.bankCode}
                onChange={(e) => set('bankCode', e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 text-sm outline-none focus:border-primary-500"
              >
                {BANK_CODES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-ink-400 mb-1">Số tài khoản</label>
              <input
                value={form.bankAccountNumber}
                onChange={(e) => set('bankAccountNumber', e.target.value.replace(/\D/g, ''))}
                className="w-full h-11 px-3 rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 text-sm outline-none focus:border-primary-500"
                placeholder="Ví dụ: 0123456789"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-ink-400 mb-1">Tên chủ tài khoản</label>
            <input
              value={form.bankAccountName}
              onChange={(e) => set('bankAccountName', e.target.value)}
              className="w-full h-11 px-3 rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 text-sm outline-none focus:border-primary-500"
              placeholder="Họ tên chủ tài khoản"
            />
          </div>
        </div>

        {/* Total */}
        <div className="flex items-center justify-between rounded-2xl bg-primary-500/10 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800 px-5 py-4">
          <span className="text-base font-semibold text-ink-700 dark:text-ink-200">Tổng cộng</span>
          <span className="text-2xl font-bold text-primary-500">
            <SpringNumber value={total} />
          </span>
        </div>
      </div>
    </Modal>
  );
}

// ── Page ──────────────────────────────────────────────────
export default function BillManagementPage() {
  const toast = useToast();
  const [rooms, setRooms] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [contracts, setContracts] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [bills, setBills] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingContracts, setLoadingContracts] = useState(false);
  const [loadingBills, setLoadingBills] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  // Load owner's rooms first
  useEffect(() => {
    roomApi
      .getAll()
      .then((r) => {
        const arr = Array.isArray(r) ? r : (r?.content ?? r?.items ?? []);
        setRooms(arr);
        if (arr.length > 0) setSelectedRoomId(String(arr[0].id));
      })
      .catch(() => toast.error('Không thể tải danh sách phòng.'))
      .finally(() => setLoadingRooms(false));
  }, []);

  // Load contracts for selected room
  useEffect(() => {
    if (!selectedRoomId) return;
    setLoadingContracts(true);
    setContracts([]);
    setSelectedId('');
    contractApi
      .getByRoom(selectedRoomId)
      .then((r) => {
        const arr = Array.isArray(r) ? r : (r?.content ?? r?.items ?? []);
        setContracts(arr);
        if (arr.length > 0) setSelectedId(String(arr[0].id));
      })
      .catch(() => toast.error('Không thể tải hợp đồng.'))
      .finally(() => setLoadingContracts(false));
  }, [selectedRoomId]);

  useEffect(() => {
    if (!selectedId) return;
    setLoadingBills(true);
    setBills([]);
    billApi
      .getByContract(selectedId)
      .then((r) => {
        const arr = Array.isArray(r) ? r : (r?.content ?? r?.items ?? []);
        setBills(arr);
      })
      .catch(() => toast.error('Không thể tải hoá đơn.'))
      .finally(() => setLoadingBills(false));
  }, [selectedId]);

  const selectedContract = contracts.find((c) => String(c.id) === selectedId);
  const selectedRoom = rooms.find((r) => String(r.id) === selectedRoomId);
  const isContractActive = (selectedContract?.status ?? '').toLowerCase() === 'active';
  const lastBill = bills.length > 0 ? bills[bills.length - 1] : null;

  const handleCreated = useCallback((bill) => {
    setBills((prev) => [...prev, bill]);
    toast.success('Đã tạo hoá đơn — đã gửi QR cho người thuê.');
  }, [toast]);

  // Realtime: when a bill-related notification arrives (e.g. renter paid),
  // refresh the bill list for the currently selected contract.
  const { notifications } = useNotifications();
  const latestNotifId = notifications[0]?.id;
  useEffect(() => {
    if (!selectedId || !latestNotifId) return;
    const top = notifications[0];
    const refType = (top?.referenceType || top?.reference_type || '').toLowerCase();
    if (refType !== 'bill') return;
    billApi
      .getByContract(selectedId)
      .then((r) => {
        const arr = Array.isArray(r) ? r : (r?.content ?? r?.items ?? []);
        setBills(arr);
      })
      .catch(() => {});
  }, [latestNotifId, selectedId, notifications]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-ink-900 dark:text-ink-50">Quản lý hoá đơn</h1>
        {isContractActive && (
          <Button icon={Plus} onClick={() => setCreateOpen(true)}>
            Tạo hoá đơn
          </Button>
        )}
      </div>

      {/* Room selector */}
      {loadingRooms ? (
        <Skeleton variant="rect" className="h-12 w-80 rounded-xl" />
      ) : rooms.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center border-2 border-dashed border-ink-200 dark:border-ink-700 rounded-2xl">
          <Receipt className="h-10 w-10 text-ink-300 mb-3" />
          <p className="font-medium text-ink-600 dark:text-ink-200">Chưa có phòng nào</p>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-ink-600 dark:text-ink-200 shrink-0">Phòng:</label>
          <select
            value={selectedRoomId}
            onChange={(e) => setSelectedRoomId(e.target.value)}
            className="h-11 px-4 rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 text-sm text-ink-900 dark:text-ink-50 outline-none focus:border-primary-500 transition-colors"
          >
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>{r.title}</option>
            ))}
          </select>
        </div>
      )}

      {/* Contract selector */}
      {selectedRoomId && (loadingContracts ? (
        <Skeleton variant="rect" className="h-12 w-80 rounded-xl" />
      ) : contracts.length === 0 ? (
        <div className="flex flex-col items-center py-10 text-center border-2 border-dashed border-ink-200 dark:border-ink-700 rounded-2xl">
          <Receipt className="h-8 w-8 text-ink-300 mb-2" />
          <p className="font-medium text-ink-600 dark:text-ink-200">Phòng này chưa có hợp đồng</p>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-ink-600 dark:text-ink-200 shrink-0">
            Hợp đồng:
          </label>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="h-11 px-4 rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 text-sm text-ink-900 dark:text-ink-50 outline-none focus:border-primary-500 transition-colors"
          >
            {contracts.map((c) => (
              <option key={c.id} value={c.id}>
                HĐ #{c.id} — Khách #{c.renter_id ?? c.renterId ?? '?'}
                {(c.status ?? '').toLowerCase() === 'active' ? ' ✓' : ''}
              </option>
            ))}
          </select>
        </div>
      ))}

      {/* Bills table */}
      {selectedId && (
        loadingBills ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} variant="rect" className="h-12 w-full rounded-xl" />
            ))}
          </div>
        ) : bills.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center py-16 text-center border-2 border-dashed border-ink-200 dark:border-ink-700 rounded-2xl"
          >
            <Receipt className="h-8 w-8 text-ink-300 mb-2" />
            <p className="text-ink-600 dark:text-ink-200 font-medium">Chưa có hoá đơn</p>
            {isContractActive && (
              <Button className="mt-3" size="sm" icon={Plus} onClick={() => setCreateOpen(true)}>
                Tạo hoá đơn đầu tiên
              </Button>
            )}
          </motion.div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-ink-100 dark:border-ink-700 bg-white dark:bg-ink-900 shadow-soft">
            <table className="w-full text-sm border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-ink-100 dark:border-ink-700">
                  {['Tháng', 'Điện', 'Nước', 'Tiền thuê', 'Phụ phí', 'Tổng', 'Trạng thái', ''].map(
                    (h) => (
                      <th
                        key={h}
                        className="py-3 px-2 first:pl-4 last:pr-4 text-xs font-semibold text-ink-400 uppercase tracking-wider text-right first:text-left last:text-right"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {bills.map((bill) => (
                  <BillRow key={bill.id} bill={bill} contract={selectedContract} />
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      <CreateBillModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        contract={selectedContract}
        room={selectedRoom}
        lastBill={lastBill}
        onCreated={handleCreated}
      />
    </div>
  );
}
