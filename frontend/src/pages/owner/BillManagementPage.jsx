import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useSpring } from 'framer-motion';
import {
  Plus, Receipt, ChevronRight, ChevronDown, Camera, Check,
  Zap, Droplets, DollarSign, PenLine, X,
} from 'lucide-react';
import { roomApi, contractApi, billApi, ocrApi } from '../../lib/api';
import { useToast } from '../../components/ui/Toast';
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
      className={[
        'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap',
        status === 'PAID'
          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
          : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
      ].join(' ')}
    >
      {status === 'PAID' ? 'Đã TT' : 'Chưa TT'}
    </motion.span>
  );
}

// ── OCR scan panel ────────────────────────────────────────
function OcrScanPanel({ label, onAccept, onClose }) {
  const fileRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [displayText, setDisplayText] = useState('');
  const [confidence, setConfidence] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [edited, setEdited] = useState('');

  const handleFile = async (file) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    setScanning(true);
    setResult(null);
    setDisplayText('');
    setConfidence(null);
    try {
      const data = await ocrApi.meter(file);
      const reading = String(data?.reading ?? data?.value ?? '');
      const conf = data?.confidence ?? null;
      setConfidence(conf);
      // Typewriter effect
      let i = 0;
      const step = () => {
        if (i >= reading.length) { setResult(reading); setScanning(false); return; }
        setDisplayText(reading.slice(0, ++i));
        setTimeout(step, 80);
      };
      step();
    } catch {
      setScanning(false);
      setDisplayText('Không nhận diện được');
    }
  };

  const handleAccept = () => {
    onAccept(editMode ? edited : result);
  };

  return (
    <div className="rounded-2xl border border-ink-200 dark:border-ink-700 bg-ink-50 dark:bg-ink-800/50 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-ink-700 dark:text-ink-200">{label}</p>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg text-ink-400 hover:bg-ink-200 dark:hover:bg-ink-700"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {!preview ? (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="w-full h-28 border-2 border-dashed border-ink-300 dark:border-ink-600 rounded-xl flex flex-col items-center justify-center gap-2 text-ink-400 hover:border-primary-400 hover:text-primary-500 transition-colors"
        >
          <Camera className="h-6 w-6" />
          <span className="text-sm">Chọn ảnh đồng hồ</span>
        </button>
      ) : (
        <div className="relative rounded-xl overflow-hidden h-36 bg-black">
          <img src={preview} alt="" className="h-full w-full object-contain" />
          {scanning && (
            <motion.div
              className="absolute left-0 right-0 h-0.5 bg-green-400 shadow-[0_0_8px_2px_rgba(74,222,128,0.7)]"
              animate={{ top: ['-2px', '100%'] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            />
          )}
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {(displayText || result) && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 bg-white dark:bg-ink-900 rounded-xl px-3 py-2 border border-ink-200 dark:border-ink-700">
            <span className="font-mono text-lg font-bold text-primary-500 flex-1">
              {displayText}
              {scanning && <span className="animate-pulse">|</span>}
            </span>
          </div>

          {confidence != null && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-ink-400">Độ tin cậy</span>
              <div className="flex-1 h-1.5 bg-ink-200 dark:bg-ink-700 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${confidence > 0.8 ? 'bg-green-500' : 'bg-amber-500'}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${(confidence * 100).toFixed(0)}%` }}
                  transition={springs.smooth}
                />
              </div>
              <span className={`text-xs font-medium ${confidence > 0.8 ? 'text-green-600' : 'text-amber-600'}`}>
                {(confidence * 100).toFixed(0)}%
              </span>
            </div>
          )}

          {result && !scanning && (
            editMode ? (
              <div className="flex gap-2">
                <input
                  className="flex-1 h-9 px-3 rounded-lg border border-primary-400 bg-white dark:bg-ink-900 text-sm text-ink-900 dark:text-ink-50 outline-none font-mono"
                  value={edited}
                  onChange={(e) => setEdited(e.target.value)}
                  autoFocus
                />
                <Button size="sm" onClick={handleAccept}>Dùng</Button>
                <Button size="sm" variant="ghost" onClick={() => setEditMode(false)}>Huỷ</Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button size="sm" icon={Check} onClick={handleAccept} className="flex-1">Chấp nhận</Button>
                <Button size="sm" variant="outlined" icon={PenLine} onClick={() => { setEditMode(true); setEdited(result); }}>
                  Sửa
                </Button>
              </div>
            )
          )}
        </div>
      )}

      {!preview && (
        <Button
          variant="outlined"
          size="sm"
          icon={Camera}
          fullWidth
          onClick={() => fileRef.current?.click()}
        >
          Chụp / chọn ảnh
        </Button>
      )}
    </div>
  );
}

// ── Bill row with accordion ───────────────────────────────
function BillRow({ bill: initialBill, contract }) {
  const toast = useToast();
  const [bill, setBill] = useState(initialBill);
  const [open, setOpen] = useState(false);
  const [marking, setMarking] = useState(false);
  const [stamping, setStamping] = useState(false);

  const handleMarkPaid = async (e) => {
    e.stopPropagation();
    if (bill.status === 'PAID') return;
    setMarking(true);
    try {
      await billApi.markPaid(bill.id);
      setStamping(true);
      setBill((b) => ({ ...b, status: 'PAID' }));
      setTimeout(() => setStamping(false), 800);
    } catch (err) {
      toast.error(err.displayMessage ?? 'Cập nhật thất bại.');
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
          {fmt(bill.electricityAmount)}
        </td>
        <td className="py-3 px-2 text-sm text-ink-600 dark:text-ink-200 text-right">
          {fmt(bill.waterAmount)}
        </td>
        <td className="py-3 px-2 text-sm text-ink-600 dark:text-ink-200 text-right">
          {fmt(bill.rentAmount)}
        </td>
        <td className="py-3 px-2 text-sm text-ink-600 dark:text-ink-200 text-right">
          {fmt(bill.extraAmount)}
        </td>
        <td className="py-3 px-2 text-sm font-semibold text-ink-900 dark:text-ink-50 text-right">
          {fmt(bill.totalAmount)}
        </td>
        <td className="py-3 pl-2 pr-2 text-right">
          <StatusBadge status={bill.status} stamping={stamping} />
        </td>
        <td className="py-3 pl-2 pr-4 text-right" onClick={(e) => e.stopPropagation()}>
          {bill.status !== 'PAID' && (
            <Button size="sm" variant="outlined" loading={marking} onClick={handleMarkPaid}>
              Đã TT
            </Button>
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
                  {bill.electricityUsage != null && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1.5 text-ink-500 dark:text-ink-400">
                        <Zap className="h-3.5 w-3.5 text-yellow-400" />
                        Điện: {bill.previousElectricityReading ?? '?'} →{' '}
                        {bill.currentElectricityReading ?? '?'} kWh
                        ({bill.electricityUsage} × {fmt(bill.electricityUnitPrice ?? contract?.electricityPrice)})
                      </span>
                      <span className="font-medium text-ink-900 dark:text-ink-50">
                        {fmt(bill.electricityAmount)}
                      </span>
                    </div>
                  )}
                  {/* Water detail */}
                  {bill.waterUsage != null && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1.5 text-ink-500 dark:text-ink-400">
                        <Droplets className="h-3.5 w-3.5 text-blue-400" />
                        Nước: {bill.previousWaterReading ?? '?'} →{' '}
                        {bill.currentWaterReading ?? '?'} m³
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
                  {bill.extraAmount > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-ink-500 dark:text-ink-400">
                        Phụ phí{bill.extraFeeNote ? ` — ${bill.extraFeeNote}` : ''}
                      </span>
                      <span className="font-medium text-ink-900 dark:text-ink-50">
                        {fmt(bill.extraAmount)}
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
                </div>
              </motion.div>
            </td>
          </tr>
        )}
      </AnimatePresence>
    </>
  );
}

// ── Create bill modal ─────────────────────────────────────
function CreateBillModal({ isOpen, onClose, contract, room, lastBill, onCreated }) {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [showElecOcr, setShowElecOcr] = useState(false);
  const [showWaterOcr, setShowWaterOcr] = useState(false);

  const today = new Date();
  const defaultMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

  const [form, setForm] = useState({
    billingMonth: defaultMonth,
    prevElec: '',
    currElec: '',
    elecPrice: '',
    prevWater: '',
    currWater: '',
    waterPrice: '',
    extraAmount: '',
    extraNote: '',
  });

  useEffect(() => {
    if (!isOpen || !contract) return;
    // First month → 0/0; otherwise carry over the last bill's current reading.
    const prevElecVal = lastBill?.elecCurr ?? lastBill?.electricityCurrent ?? 0;
    const prevWaterVal = lastBill?.waterCurr ?? lastBill?.waterCurrent ?? 0;
    setForm({
      billingMonth: defaultMonth,
      prevElec: String(prevElecVal),
      currElec: '',
      elecPrice: String(contract.electricity_price ?? contract.electricityPrice ?? ''),
      prevWater: String(prevWaterVal),
      currWater: '',
      waterPrice: String(contract.water_price ?? contract.waterPrice ?? ''),
      extraAmount: '',
      extraNote: '',
    });
    setShowElecOcr(false);
    setShowWaterOcr(false);
  }, [isOpen, contract, lastBill]);

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
    setSaving(true);
    try {
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
        {/* Month */}
        <Input
          label="Tháng"
          type="month"
          value={form.billingMonth}
          onChange={(e) => set('billingMonth', e.target.value)}
        />

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
              <div className="flex gap-2">
                <input
                  type="number"
                  value={form.currElec}
                  onChange={(e) => set('currElec', e.target.value)}
                  className={inputClass}
                  placeholder="0"
                />
                <button
                  type="button"
                  onClick={() => setShowElecOcr((v) => !v)}
                  className="shrink-0 h-12 w-12 flex items-center justify-center rounded-xl border border-ink-200 dark:border-ink-700 text-ink-400 hover:border-primary-400 hover:text-primary-500 transition-colors"
                  title="OCR"
                >
                  <Camera className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
          <AnimatePresence>
            {showElecOcr && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={springs.smooth}
                className="overflow-hidden"
              >
                <OcrScanPanel
                  label="Chụp đồng hồ điện"
                  onAccept={(v) => { set('currElec', v); setShowElecOcr(false); }}
                  onClose={() => setShowElecOcr(false)}
                />
              </motion.div>
            )}
          </AnimatePresence>
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
              <div className="flex gap-2">
                <input
                  type="number"
                  value={form.currWater}
                  onChange={(e) => set('currWater', e.target.value)}
                  className={inputClass}
                  placeholder="0"
                />
                <button
                  type="button"
                  onClick={() => setShowWaterOcr((v) => !v)}
                  className="shrink-0 h-12 w-12 flex items-center justify-center rounded-xl border border-ink-200 dark:border-ink-700 text-ink-400 hover:border-primary-400 hover:text-primary-500 transition-colors"
                  title="OCR"
                >
                  <Camera className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
          <AnimatePresence>
            {showWaterOcr && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={springs.smooth}
                className="overflow-hidden"
              >
                <OcrScanPanel
                  label="Chụp đồng hồ nước"
                  onAccept={(v) => { set('currWater', v); setShowWaterOcr(false); }}
                  onClose={() => setShowWaterOcr(false)}
                />
              </motion.div>
            )}
          </AnimatePresence>
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

// ── Bill QR modal (shown to owner after a bill is created) ───────────────
export function BillQrPayload(bill) {
  // The renter scans this QR; encodes a deep link plus a quick payment summary.
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const params = new URLSearchParams({
    bill: String(bill?.id ?? ''),
    amount: String(bill?.totalAmount ?? ''),
    month: String(bill?.billingMonth ?? ''),
  });
  return `${origin}/my-contracts?${params.toString()}`;
}

function BillQrModal({ bill, renterName, onClose }) {
  if (!bill) return null;
  const text = BillQrPayload(bill);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&data=${encodeURIComponent(text)}`;

  return (
    <Modal
      isOpen
      onClose={onClose}
      size="sm"
      title="Hoá đơn đã gửi"
      footer={<Button onClick={onClose}>Đóng</Button>}
    >
      <div className="flex flex-col items-center gap-4 py-2">
        <p className="text-sm text-ink-600 dark:text-ink-200 text-center">
          Đã gửi thông báo &amp; mã QR đến{' '}
          <strong>{renterName ?? 'người thuê'}</strong>. Họ có thể quét QR để mở chi tiết hoá đơn và thanh toán.
        </p>
        <img
          src={qrUrl}
          alt="QR hoá đơn"
          width={240}
          height={240}
          className="rounded-xl border border-ink-200 dark:border-ink-700 bg-white p-2"
        />
        <div className="text-center">
          <p className="text-xs text-ink-400">Tổng tiền</p>
          <p className="text-xl font-bold text-primary-500">{fmt(bill.totalAmount)}</p>
          <p className="text-xs text-ink-400 mt-1">Tháng {bill.billingMonth ?? '—'}</p>
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
  const [createdBill, setCreatedBill] = useState(null);

  const handleCreated = useCallback((bill) => {
    setBills((prev) => [...prev, bill]);
    setCreatedBill(bill);
    toast.success('Đã tạo hoá đơn — đã gửi QR cho người thuê.');
  }, [toast]);

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

      <BillQrModal
        bill={createdBill}
        renterName={selectedContract?.renter_name ?? selectedContract?.renterName}
        onClose={() => setCreatedBill(null)}
      />
    </div>
  );
}
