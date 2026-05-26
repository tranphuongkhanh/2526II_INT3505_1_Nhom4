import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import {
  Plus, Search, LayoutGrid, List, Edit2, Trash2, Star, Upload,
  Wind, Flame, Shirt, Refrigerator, GripVertical,
  Home, X, AlertCircle, ToggleLeft,
} from 'lucide-react';
import { roomApi } from '../../lib/api';
import { useToast } from '../../components/ui/Toast';
import { springs } from '../../lib/animations';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Skeleton from '../../components/ui/Skeleton';

// ── Constants ──────────────────────────────────────────────
const ROOM_TYPES = [
  { value: 'PHONG_TRO',    label: 'Phòng trọ' },
  { value: 'CHUNG_CU_MINI', label: 'Chung cư mini' },
  { value: 'O_GHEP',       label: 'Ở ghép' },
  { value: 'HOMESTAY',     label: 'Homestay' },
];

const AMENITY_DEFS = [
  { key: 'hasAc',        label: 'Điều hoà',      icon: Wind },
  { key: 'hasPrivateWc', label: 'WC riêng',      icon: Flame },
  { key: 'hasSecurity',  label: 'Bảo vệ',        icon: Shirt },
  { key: 'hasFridge',    label: 'Tủ lạnh',       icon: Refrigerator },
];

const STATUS_MAP = {
  AVAILABLE:   { label: 'Còn trống',     cls: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  RENTED:      { label: 'Đã cho thuê',   cls: 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400' },
  UNAVAILABLE: { label: 'Không khả dụng', cls: 'bg-ink-100 text-ink-600 dark:bg-ink-700 dark:text-ink-300' },
};

const EMPTY_FORM = {
  title: '', description: '', roomType: 'PHONG_TRO', areaMq: '',
  price: '', address: '', ward: '', district: '', city: '',
  hasAc: false, hasPrivateWc: false, hasSecurity: false, hasFridge: false,
  wifiFee: '', waterPricePerUnit: '', electricityPricePerUnit: '',
  serviceFee: '', bikeParkingFee: '', deposit: '',
};

// ── Confetti ───────────────────────────────────────────────
const CONFETTI_COLORS = ['#14919B', '#F0A500', '#22C55E', '#3B82F6', '#EF4444', '#F59E0B', '#A855F7'];

function Confetti({ onDone }) {
  const particles = useMemo(
    () => Array.from({ length: 48 }, (_, i) => ({
      id: i,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      x: (Math.random() - 0.5) * 700,
      y: -(Math.random() * 500 + 80),
      rotate: (Math.random() - 0.5) * 720,
      size: Math.random() * 10 + 6,
      delay: Math.random() * 0.35,
    })),
    [],
  );

  return (
    <div className="fixed inset-0 pointer-events-none z-[60] flex items-start justify-center overflow-hidden">
      <div className="relative mt-24">
        {particles.map((p) => (
          <motion.div
            key={p.id}
            style={{ position: 'absolute', width: p.size, height: p.size, backgroundColor: p.color, borderRadius: 2, top: 0, left: 0 }}
            initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 1 }}
            animate={{ x: p.x, y: p.y, opacity: 0, rotate: p.rotate, scale: 0.2 }}
            transition={{ duration: 1.4, delay: p.delay, ease: [0.16, 1, 0.3, 1] }}
            onAnimationComplete={() => { if (p.id === particles.length - 1) onDone?.(); }}
          />
        ))}
      </div>
    </div>
  );
}

// ── Amenity toggle ─────────────────────────────────────────
function AmenityToggle({ label, icon: Icon, checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={[
        'flex items-center gap-3 p-3 rounded-xl border text-left transition-colors',
        checked
          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
          : 'border-ink-200 dark:border-ink-700 hover:border-ink-300 dark:hover:border-ink-600',
      ].join(' ')}
    >
      <Icon className={`h-4 w-4 shrink-0 ${checked ? 'text-primary-500' : 'text-ink-400'}`} />
      <span className={`text-sm flex-1 ${checked ? 'text-primary-600 dark:text-primary-400 font-medium' : 'text-ink-600 dark:text-ink-200'}`}>
        {label}
      </span>
      <div
        className="relative h-5 w-9 rounded-full transition-colors duration-200 shrink-0"
        style={{ backgroundColor: checked ? '#14919B' : '#CBD5E1' }}
      >
        <motion.div
          className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm"
          animate={{ left: checked ? '16px' : '2px' }}
          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        />
      </div>
    </button>
  );
}

// ── Sparkle particle ───────────────────────────────────────
function Sparkle({ angle }) {
  const rad = (angle * Math.PI) / 180;
  const dist = 28;
  return (
    <motion.div
      className="absolute top-1/2 left-1/2 h-1.5 w-1.5 rounded-full bg-accent-500"
      style={{ originX: '50%', originY: '50%' }}
      initial={{ x: '-50%', y: '-50%', scale: 0, opacity: 1 }}
      animate={{ x: `calc(-50% + ${Math.cos(rad) * dist}px)`, y: `calc(-50% + ${Math.sin(rad) * dist}px)`, scale: [0, 1.4, 0], opacity: [1, 1, 0] }}
      transition={{ duration: 0.55, ease: 'easeOut' }}
    />
  );
}

// ── Thumbnail button ───────────────────────────────────────
function ThumbnailButton({ isThumbnail, onClick }) {
  const [burst, setBurst] = useState(false);

  const handleClick = (e) => {
    e.stopPropagation();
    if (!isThumbnail) {
      setBurst(true);
      setTimeout(() => setBurst(false), 600);
    }
    onClick();
  };

  return (
    <div className="relative">
      <motion.button
        type="button"
        onClick={handleClick}
        whileTap={{ scale: 0.85 }}
        className={`relative z-10 p-1.5 rounded-lg transition-colors ${isThumbnail ? 'text-accent-500' : 'text-ink-400 hover:text-accent-500'}`}
        title="Đặt làm ảnh đại diện"
      >
        <Star className={`h-4 w-4 ${isThumbnail ? 'fill-accent-500' : ''}`} />
      </motion.button>
      {burst
        ? [0, 60, 120, 180, 240, 300].map((angle) => <Sparkle key={angle} angle={angle} />)
        : null}
    </div>
  );
}

// ── Image section (inside modal) ───────────────────────────
function ImageSection({ roomId, images, onImagesChange }) {
  const toast = useToast();
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState([]);

  const handleFiles = useCallback(async (files) => {
    if (!roomId) { toast.error('Hãy lưu thông tin phòng trước khi tải ảnh.'); return; }
    const arr = Array.from(files);
    for (const file of arr) {
      const tempId = `tmp-${Date.now()}-${Math.random()}`;
      const preview = URL.createObjectURL(file);
      setUploading((prev) => [...prev, { id: tempId, preview, progress: 0 }]);

      // Simulate progress while uploading
      let prog = 0;
      const interval = setInterval(() => {
        prog = Math.min(prog + 15, 90);
        setUploading((prev) => prev.map((u) => u.id === tempId ? { ...u, progress: prog } : u));
      }, 100);

      try {
        const result = await roomApi.uploadImage(roomId, file);
        clearInterval(interval);
        setUploading((prev) => prev.filter((u) => u.id !== tempId));
        URL.revokeObjectURL(preview);
        const newImg = { id: result?.id ?? result?.imageId, imageUrl: result?.imageUrl ?? result?.url ?? preview, thumbnail: false };
        onImagesChange((prev) => [...prev, newImg]);
      } catch {
        clearInterval(interval);
        setUploading((prev) => prev.filter((u) => u.id !== tempId));
        URL.revokeObjectURL(preview);
        toast.error('Tải ảnh thất bại.');
      }
    }
  }, [roomId, onImagesChange, toast]);

  const handleDelete = useCallback(async (imgId) => {
    try {
      await roomApi.deleteImage(roomId, imgId);
      onImagesChange((prev) => prev.filter((i) => i.id !== imgId));
    } catch {
      toast.error('Xoá ảnh thất bại.');
    }
  }, [roomId, onImagesChange, toast]);

  const handleThumbnail = useCallback(async (imgId) => {
    try {
      await roomApi.setThumbnail(roomId, imgId);
      onImagesChange((prev) => prev.map((i) => ({ ...i, thumbnail: i.id === imgId })));
    } catch {
      toast.error('Cập nhật ảnh đại diện thất bại.');
    }
  }, [roomId, onImagesChange, toast]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-ink-700 dark:text-ink-200">Ảnh phòng</label>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-1.5 text-sm text-primary-500 hover:text-primary-700 font-medium transition-colors"
        >
          <Upload className="h-4 w-4" />
          Tải ảnh lên
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {/* Reorder.Group for existing images */}
      {images.length > 0 && (
        <Reorder.Group
          axis="x"
          values={images}
          onReorder={onImagesChange}
          className="flex flex-wrap gap-3"
        >
          {images.map((img) => (
            <Reorder.Item
              key={img.id}
              value={img}
              whileDrag={{ scale: 1.08, boxShadow: '0 12px 32px rgba(0,0,0,0.25)', rotate: 2, zIndex: 20 }}
              className="relative group cursor-grab active:cursor-grabbing"
            >
              <div className="relative h-24 w-24 rounded-xl overflow-hidden border-2 border-ink-200 dark:border-ink-700 select-none">
                {/* blur-up image */}
                <img
                  src={img.imageUrl}
                  alt=""
                  className="h-full w-full object-cover"
                  style={{ filter: 'blur(0)' }}
                  onError={(e) => { e.currentTarget.src = ''; }}
                />
                {img.thumbnail && (
                  <div className="absolute inset-0 border-2 border-accent-500 rounded-xl pointer-events-none" />
                )}
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-end justify-between p-1">
                  <button
                    type="button"
                    onClick={() => handleDelete(img.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-lg bg-red-500 text-white transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  <ThumbnailButton isThumbnail={img.thumbnail} onClick={() => handleThumbnail(img.id)} />
                </div>
                <GripVertical className="absolute top-1 left-1 h-3.5 w-3.5 text-white/70 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Reorder.Item>
          ))}
        </Reorder.Group>
      )}

      {/* Uploading items */}
      {uploading.map((u) => (
        <div key={u.id} className="relative h-24 w-24 rounded-xl overflow-hidden border-2 border-ink-200 dark:border-ink-700">
          <img src={u.preview} alt="" className="h-full w-full object-cover blur-sm" />
          <div className="absolute inset-0 flex flex-col items-center justify-end bg-black/40 p-2">
            <div className="w-full h-1 rounded-full bg-white/30 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-primary-500"
                animate={{ width: `${u.progress}%` }}
                transition={{ ease: 'linear' }}
              />
            </div>
          </div>
        </div>
      ))}

      {images.length === 0 && uploading.length === 0 && (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="w-full h-32 border-2 border-dashed border-ink-200 dark:border-ink-700 rounded-xl flex flex-col items-center justify-center gap-2 text-ink-400 hover:border-primary-400 hover:text-primary-500 transition-colors"
        >
          <Upload className="h-6 w-6" />
          <span className="text-sm">Nhấn để chọn ảnh</span>
        </button>
      )}
    </div>
  );
}

// ── Room form modal ────────────────────────────────────────
function RoomModal({ isOpen, onClose, editRoom, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState(EMPTY_FORM);
  const [images, setImages] = useState([]);
  const [saving, setSaving] = useState(false);
  const [savedRoomId, setSavedRoomId] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    if (editRoom) {
      const {
        title = '', description = '', roomType = 'PHONG_TRO', areaMq = '', price = '',
        address = '', ward = '', district = '', city = '',
        hasAc = false, hasPrivateWc = false, hasSecurity = false, hasFridge = false,
        wifiFee = null, waterPricePerUnit = null, electricityPricePerUnit = null,
        serviceFee = null, bikeParkingFee = null, deposit = null,
      } = editRoom;
      const n = (v) => v != null ? String(v) : '';
      setForm({ title, description, roomType, areaMq: String(areaMq), price: String(price), address, ward, district, city, hasAc, hasPrivateWc, hasSecurity, hasFridge, wifiFee: n(wifiFee), waterPricePerUnit: n(waterPricePerUnit), electricityPricePerUnit: n(electricityPricePerUnit), serviceFee: n(serviceFee), bikeParkingFee: n(bikeParkingFee), deposit: n(deposit) });
      setImages(editRoom.images ?? []);
      setSavedRoomId(editRoom.id);
    } else {
      setForm(EMPTY_FORM);
      setImages([]);
      setSavedRoomId(null);
    }
  }, [isOpen, editRoom]);

  const set = useCallback((field, val) => setForm((f) => ({ ...f, [field]: val })), []);

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('Vui lòng nhập tiêu đề phòng.'); return; }
    if (!form.price) { toast.error('Vui lòng nhập giá thuê.'); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        areaMq: Number(form.areaMq) || 0,
        price: Number(form.price) || 0,
        wifiFee: form.wifiFee !== '' ? Number(form.wifiFee) : null,
        waterPricePerUnit: form.waterPricePerUnit !== '' ? Number(form.waterPricePerUnit) : null,
        electricityPricePerUnit: form.electricityPricePerUnit !== '' ? Number(form.electricityPricePerUnit) : null,
        serviceFee: form.serviceFee !== '' ? Number(form.serviceFee) : null,
        bikeParkingFee: form.bikeParkingFee !== '' ? Number(form.bikeParkingFee) : null,
        deposit: form.deposit !== '' ? Number(form.deposit) : null,
      };
      let room;
      if (editRoom) {
        room = await roomApi.update(editRoom.id, payload);
        toast.success('Đã cập nhật phòng.');
      } else {
        room = await roomApi.create(payload);
        setSavedRoomId(room?.id ?? room?.roomId);
        toast.success('Đã tạo phòng.');
      }
      onSaved(room, !editRoom);
      if (editRoom) onClose();
    } catch (err) {
      toast.error(err.displayMessage ?? 'Lưu thất bại.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      title={editRoom ? 'Chỉnh sửa phòng' : 'Thêm phòng mới'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Huỷ</Button>
          <Button onClick={handleSave} loading={saving}>
            {editRoom ? 'Lưu thay đổi' : 'Tạo phòng'}
          </Button>
        </>
      }
    >
      <div className="space-y-6 py-2">
        {/* Basic info */}
        <div className="space-y-4">
          <Input label="Tiêu đề phòng" required value={form.title} onChange={(e) => set('title', e.target.value)} />
          <div>
            <label className="block text-sm font-medium text-ink-700 dark:text-ink-200 mb-1.5">Mô tả</label>
            <textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 text-ink-900 dark:text-ink-50 px-4 py-3 text-sm outline-none focus:border-primary-500 transition-colors resize-none"
              placeholder="Mô tả về phòng..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink-700 dark:text-ink-200 mb-1.5">Loại phòng</label>
              <select
                value={form.roomType}
                onChange={(e) => set('roomType', e.target.value)}
                className="w-full h-12 rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 text-ink-900 dark:text-ink-50 px-4 text-sm outline-none focus:border-primary-500 transition-colors"
              >
                {ROOM_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-700 dark:text-ink-200 mb-1.5">Diện tích (m²)</label>
              <input
                type="number"
                value={form.areaMq}
                onChange={(e) => set('areaMq', e.target.value)}
                className="w-full h-12 rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 text-ink-900 dark:text-ink-50 px-4 text-sm outline-none focus:border-primary-500 transition-colors"
              />
            </div>
          </div>

          <Input label="Giá thuê (VNĐ/tháng)" required type="number" value={form.price} onChange={(e) => set('price', e.target.value)} />
          <Input label="Tiền đặt cọc (VNĐ)" type="number" value={form.deposit} onChange={(e) => set('deposit', e.target.value)} />
        </div>

        {/* Service pricing */}
        <div>
          <p className="text-sm font-medium text-ink-700 dark:text-ink-200 mb-3">Chi phí dịch vụ</p>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Phí Wifi (VNĐ/tháng)" type="number" value={form.wifiFee} onChange={(e) => set('wifiFee', e.target.value)} />
            <Input label="Giá điện (VNĐ/số)" type="number" value={form.electricityPricePerUnit} onChange={(e) => set('electricityPricePerUnit', e.target.value)} />
            <Input label="Giá nước (VNĐ/m³)" type="number" value={form.waterPricePerUnit} onChange={(e) => set('waterPricePerUnit', e.target.value)} />
            <Input label="Phí dịch vụ chung (VNĐ/tháng)" type="number" value={form.serviceFee} onChange={(e) => set('serviceFee', e.target.value)} />
            <Input label="Phí gửi xe máy (VNĐ/tháng)" type="number" value={form.bikeParkingFee} onChange={(e) => set('bikeParkingFee', e.target.value)} />
          </div>
        </div>

        {/* Amenities */}
        <div>
          <p className="text-sm font-medium text-ink-700 dark:text-ink-200 mb-3">Tiện ích</p>
          <div className="grid grid-cols-2 gap-2.5">
            {AMENITY_DEFS.map(({ key, label, icon }) => (
              <AmenityToggle
                key={key}
                label={label}
                icon={icon}
                checked={form[key]}
                onChange={(v) => set(key, v)}
              />
            ))}
          </div>
        </div>

        {/* Address */}
        <div>
          <p className="text-sm font-medium text-ink-700 dark:text-ink-200 mb-3">Địa chỉ</p>
          <div className="space-y-3">
            <Input label="Địa chỉ" value={form.address} onChange={(e) => set('address', e.target.value)} />
            <div className="grid grid-cols-3 gap-3">
              <Input label="Phường/Xã" value={form.ward} onChange={(e) => set('ward', e.target.value)} />
              <Input label="Quận/Huyện" value={form.district} onChange={(e) => set('district', e.target.value)} />
              <Input label="Tỉnh/Thành phố" value={form.city} onChange={(e) => set('city', e.target.value)} />
            </div>
          </div>
        </div>

        {/* Images */}
        <ImageSection
          roomId={savedRoomId}
          images={images}
          onImagesChange={setImages}
        />
      </div>
    </Modal>
  );
}

// ── Room card ──────────────────────────────────────────────
function RoomCard({ room, view, onEdit, onDelete, onToggleStatus }) {
  const toast = useToast();
  const [toggling, setToggling] = useState(false);
  const thumbnail = room.images?.find((i) => i.thumbnail) ?? room.images?.[0];
  const statusCfg = STATUS_MAP[room.rentalStatus] ?? STATUS_MAP.AVAILABLE;
  const price = Number(room.price ?? 0).toLocaleString('vi-VN');

  const handleToggle = async () => {
    const next = room.rentalStatus === 'AVAILABLE' ? 'RENTED' : 'AVAILABLE';
    setToggling(true);
    try {
      await roomApi.updateRentalStatus(room.id, next);
      onToggleStatus(room.id, next);
    } catch {
      toast.error('Cập nhật trạng thái thất bại.');
    } finally {
      setToggling(false);
    }
  };

  if (view === 'list') {
    return (
      <motion.div
        layout
        className="bg-white dark:bg-ink-800 rounded-2xl border border-ink-100 dark:border-ink-700 shadow-soft flex gap-4 p-4 items-center"
      >
        <div className="h-16 w-20 rounded-xl overflow-hidden shrink-0 bg-ink-100 dark:bg-ink-700">
          {thumbnail
            ? <img src={thumbnail.imageUrl} alt="" className="h-full w-full object-cover" />
            : <div className="h-full w-full flex items-center justify-center"><Home className="h-6 w-6 text-ink-400" /></div>}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-ink-900 dark:text-ink-50 truncate">{room.title}</p>
          <p className="text-sm text-ink-400 mt-0.5">{price} VNĐ/tháng · {room.areaMq ?? '?'} m²</p>
        </div>
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium shrink-0 ${statusCfg.cls}`}>{statusCfg.label}</span>
        <ActionButtons onEdit={onEdit} onDelete={onDelete} onToggle={handleToggle} toggling={toggling} />
      </motion.div>
    );
  }

  return (
    <motion.div layout className="bg-white dark:bg-ink-800 rounded-2xl border border-ink-100 dark:border-ink-700 shadow-soft overflow-hidden group">
      <div className="relative h-44 overflow-hidden bg-ink-100 dark:bg-ink-700">
        {thumbnail
          ? <img src={thumbnail.imageUrl} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
          : <div className="h-full w-full flex items-center justify-center"><Home className="h-10 w-10 text-ink-300 dark:text-ink-600" /></div>}
        <div className="absolute top-3 left-3">
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusCfg.cls}`}>{statusCfg.label}</span>
        </div>
      </div>
      <div className="p-4 space-y-2">
        <h3 className="font-semibold text-ink-900 dark:text-ink-50 truncate">{room.title}</h3>
        <p className="text-primary-500 font-bold">{price} <span className="text-xs text-ink-400 font-normal">VNĐ/tháng</span></p>
        <p className="text-xs text-ink-400">{room.areaMq ?? '?'} m² · {ROOM_TYPES.find((t) => t.value === room.roomType)?.label ?? room.roomType}</p>
        {/* Amenity icons */}
        <div className="flex gap-2 pt-0.5">
          {AMENITY_DEFS.filter(({ key }) => room[key]).slice(0, 4).map(({ key, icon: Icon }) => (
            <Icon key={key} className="h-3.5 w-3.5 text-ink-400" />
          ))}
        </div>
        {room.avgRating ? (
          <div className="flex items-center gap-1 text-xs text-ink-400">
            <Star className="h-3.5 w-3.5 fill-accent-500 text-accent-500" />
            {room.avgRating.toFixed(1)} ({room.reviewCount ?? 0})
          </div>
        ) : null}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-ink-100 dark:border-ink-700">
          <ActionButtons onEdit={onEdit} onDelete={onDelete} onToggle={handleToggle} toggling={toggling} />
        </div>
      </div>
    </motion.div>
  );
}

function ActionButtons({ onEdit, onDelete, onToggle, toggling }) {
  return (
    <>
      <button type="button" onClick={onToggle} disabled={toggling} className="p-2 rounded-lg text-ink-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors" title="Đổi trạng thái">
        <ToggleLeft className="h-4 w-4" />
      </button>
      <button type="button" onClick={onEdit} className="p-2 rounded-lg text-ink-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors" title="Chỉnh sửa">
        <Edit2 className="h-4 w-4" />
      </button>
      <button type="button" onClick={onDelete} className="p-2 rounded-lg text-ink-400 hover:text-error hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Xoá">
        <Trash2 className="h-4 w-4" />
      </button>
    </>
  );
}

// ── Page ───────────────────────────────────────────────────
export default function RoomManagementPage() {
  const toast = useToast();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [view, setView] = useState('grid');
  const [modalOpen, setModalOpen] = useState(false);
  const [editRoom, setEditRoom] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    roomApi.getAll()
      .then((r) => setRooms(Array.isArray(r) ? r : (r?.content ?? r?.items ?? r?.data ?? [])))
      .catch(() => toast.error('Không thể tải danh sách phòng.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () => rooms.filter((r) => r.title?.toLowerCase().includes(search.toLowerCase())),
    [rooms, search],
  );

  const handleSaved = useCallback((room, isNew) => {
    const normalised = room ?? {};
    if (isNew) {
      setRooms((prev) => [normalised, ...prev]);
      setShowConfetti(true);
    } else {
      setRooms((prev) => prev.map((r) => r.id === normalised.id ? { ...r, ...normalised } : r));
    }
  }, []);

  const openCreate = useCallback(() => { setEditRoom(null); setModalOpen(true); }, []);
  const openEdit = useCallback((room) => { setEditRoom(room); setModalOpen(true); }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await roomApi.delete(deleteId);
      setRooms((prev) => prev.filter((r) => r.id !== deleteId));
      toast.success('Đã xoá phòng.');
    } catch (err) {
      toast.error(err.displayMessage ?? 'Xoá thất bại.');
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  const handleToggleStatus = useCallback((id, next) => {
    setRooms((prev) => prev.map((r) => r.id === id ? { ...r, rentalStatus: next } : r));
  }, []);

  return (
    <div className="space-y-6">
      {showConfetti && <Confetti onDone={() => setShowConfetti(false)} />}

      {/* Action bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <h1 className="text-2xl font-bold text-ink-900 dark:text-ink-50">Quản lý phòng</h1>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm phòng..."
              className="w-full h-10 pl-9 pr-4 rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 text-sm text-ink-900 dark:text-ink-50 outline-none focus:border-primary-500 transition-colors"
            />
          </div>
          <div className="flex items-center rounded-xl border border-ink-200 dark:border-ink-700 overflow-hidden">
            <button type="button" onClick={() => setView('grid')} className={`h-10 w-10 flex items-center justify-center transition-colors ${view === 'grid' ? 'bg-primary-500 text-white' : 'bg-white dark:bg-ink-900 text-ink-400 hover:bg-ink-50 dark:hover:bg-ink-800'}`}>
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => setView('list')} className={`h-10 w-10 flex items-center justify-center transition-colors ${view === 'list' ? 'bg-primary-500 text-white' : 'bg-white dark:bg-ink-900 text-ink-400 hover:bg-ink-50 dark:hover:bg-ink-800'}`}>
              <List className="h-4 w-4" />
            </button>
          </div>
          <Button icon={Plus} onClick={openCreate}>Thêm phòng</Button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className={view === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} variant="card" />)}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={springs.smooth}
          className="flex flex-col items-center justify-center py-24 text-center">
          <Home className="h-12 w-12 text-ink-300 mb-4" />
          <h3 className="text-lg font-semibold text-ink-900 dark:text-ink-50">
            {search ? 'Không tìm thấy phòng' : 'Chưa có phòng nào'}
          </h3>
          <p className="text-sm text-ink-400 mt-1">
            {search ? 'Thử từ khoá khác.' : 'Hãy thêm phòng đầu tiên của bạn.'}
          </p>
          {!search && <Button className="mt-4" icon={Plus} onClick={openCreate}>Thêm phòng</Button>}
        </motion.div>
      ) : (
        <motion.div
          layout
          className={view === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}
        >
          <AnimatePresence mode="popLayout">
            {filtered.map((room) => (
              <motion.div
                key={room.id}
                layout
                initial={{ opacity: 0, y: -20, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92, height: 0, marginBottom: 0 }}
                transition={springs.smooth}
              >
                <RoomCard
                  room={room}
                  view={view}
                  onEdit={() => openEdit(room)}
                  onDelete={() => setDeleteId(room.id)}
                  onToggleStatus={handleToggleStatus}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Create/Edit modal */}
      <RoomModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        editRoom={editRoom}
        onSaved={handleSaved}
      />

      {/* Delete confirm */}
      <AnimatePresence>
        {deleteId ? (
          <motion.div
            key="delete-overlay"
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteId(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 8 }}
              transition={springs.snappy}
              className="relative bg-white dark:bg-ink-900 rounded-2xl border border-ink-100 dark:border-ink-700 shadow-elevated p-6 max-w-sm w-full"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center shrink-0">
                  <AlertCircle className="h-5 w-5 text-error" />
                </div>
                <h3 className="text-lg font-semibold text-ink-900 dark:text-ink-50">Xoá phòng</h3>
              </div>
              <p className="text-sm text-ink-600 dark:text-ink-200 mb-6">
                Bạn có chắc muốn xoá phòng này? Hành động này không thể hoàn tác.
              </p>
              <div className="flex justify-end gap-3">
                <Button variant="ghost" onClick={() => setDeleteId(null)}>Huỷ</Button>
                <Button variant="danger" loading={deleting} onClick={handleDelete}>Xoá</Button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
