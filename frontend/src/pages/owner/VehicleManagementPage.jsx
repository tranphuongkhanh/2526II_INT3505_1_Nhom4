import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Home, Car, Bike, Trash2 } from 'lucide-react';
import { roomApi, vehicleApi } from '../../lib/api';
import { useToast } from '../../components/ui/Toast';
import { springs } from '../../lib/animations';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Skeleton from '../../components/ui/Skeleton';

// Vietnamese license plate regex
const PLATE_REGEX = /^\d{2}[A-Z]{1,2}[-\s]?\d{4,5}$/;

function formatPlate(raw) {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

// ── Vietnamese plate graphic ──────────────────────────────
function PlateGraphic({ plateNumber, animating }) {
  const isValid = PLATE_REGEX.test(plateNumber.replace(/\s/g, ''));
  const borderColor = plateNumber
    ? isValid
      ? 'ring-2 ring-green-400'
      : 'ring-2 ring-amber-400'
    : '';

  return (
    <div
      className={[
        'relative rounded-lg overflow-hidden select-none transition-shadow duration-300',
        borderColor,
      ].join(' ')}
      style={{ width: 160, height: 60 }}
    >
      {/* Yellow background */}
      <div className="absolute inset-0 bg-[#FFEB3B]" />
      {/* Blue top strip */}
      <div className="absolute top-0 left-0 right-0 h-[14px] bg-[#1565C0] flex items-center justify-center">
        <span className="text-white text-[7px] font-bold tracking-[0.15em]">VIỆT NAM</span>
      </div>
      {/* Plate number */}
      <div className="absolute inset-0 top-[14px] flex items-center justify-center">
        <span
          className="font-mono font-black text-black leading-none"
          style={{ fontSize: plateNumber.length > 9 ? 18 : 22 }}
        >
          {plateNumber || '00A-00000'}
        </span>
      </div>
      {/* Scan overlay when animating */}
      {animating && (
        <div className="absolute inset-0 overflow-hidden">
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={`h-${i}`}
              className="absolute left-0 right-0 h-px bg-green-400/70"
              animate={{ top: ['-5px', '65px'] }}
              transition={{ duration: 1.0, delay: i * 0.12, repeat: Infinity, ease: 'linear' }}
            />
          ))}
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={`v-${i}`}
              className="absolute top-0 bottom-0 w-px bg-green-400/70"
              animate={{ left: ['-5px', '165px'] }}
              transition={{ duration: 1.0, delay: i * 0.15, repeat: Infinity, ease: 'linear' }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Vehicle type icon ─────────────────────────────────────
const VEHICLE_TYPES = [
  { value: 'CAR', label: 'Ô tô', icon: Car },
  { value: 'MOTORBIKE', label: 'Xe máy', icon: Bike },
  { value: 'BICYCLE', label: 'Xe đạp', icon: Bike },
];

function VehicleTypeIcon({ type, className = '' }) {
  const def = VEHICLE_TYPES.find((t) => t.value === type) ?? VEHICLE_TYPES[0];
  const Icon = def.icon;
  return <Icon className={className} />;
}

// ── Room selector card (shared pattern) ─────────────────
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

// ── Vehicle card ──────────────────────────────────────────
function VehicleCard({ vehicle, index, onDelete }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDelete(vehicle.id);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <motion.div
      initial={{ rotateY: 90, opacity: 0 }}
      animate={{ rotateY: 0, opacity: 1 }}
      transition={{ ...springs.smooth, delay: index * 0.1 }}
      style={{ perspective: 800 }}
      className="bg-white dark:bg-ink-800 rounded-2xl border border-ink-100 dark:border-ink-700 shadow-soft p-4 flex flex-col gap-3"
    >
      {/* Plate graphic */}
      <div className="flex justify-center">
        <PlateGraphic plateNumber={vehicle.licensePlate ?? ''} animating={false} />
      </div>

      {/* Vehicle info */}
      <div className="flex items-center gap-2">
        <VehicleTypeIcon
          type={vehicle.vehicleType}
          className="h-5 w-5 text-ink-400 shrink-0"
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink-900 dark:text-ink-50 truncate">
            {VEHICLE_TYPES.find((t) => t.value === vehicle.vehicleType)?.label ?? vehicle.vehicleType}
          </p>
          <p className="text-xs text-ink-400 truncate">
            {vehicle.renterName ?? vehicle.renter?.fullName ?? vehicle.renter?.email ?? 'Khách thuê'}
          </p>
        </div>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="shrink-0 p-2 rounded-lg text-ink-400 hover:text-error hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          title="Xoá xe"
        >
          {deleting ? (
            <span className="h-4 w-4 block rounded-full border-2 border-error/30 border-t-error animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </button>
      </div>
    </motion.div>
  );
}

// ── Add vehicle modal ─────────────────────────────────────
function AddVehicleModal({ isOpen, onClose, room, onAdded }) {
  const toast = useToast();
  const [plateInput, setPlateInput] = useState('');
  const [vehicleType, setVehicleType] = useState('MOTORBIKE');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPlateInput('');
      setVehicleType('MOTORBIKE');
    }
  }, [isOpen]);

  const isValid = PLATE_REGEX.test(plateInput.replace(/\s/g, ''));

  const handleSave = async () => {
    if (!plateInput.trim()) { toast.error('Vui lòng nhập biển số xe.'); return; }
    if (!isValid) { toast.error('Biển số xe không hợp lệ.'); return; }
    setSaving(true);
    try {
      const result = await vehicleApi.create({
        roomId: room.id,
        licensePlate: plateInput.trim(),
        vehicleType,
      });
      onAdded(result);
      onClose();
    } catch (err) {
      toast.error(err.displayMessage ?? 'Thêm xe thất bại.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Thêm xe"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Huỷ</Button>
          <Button onClick={handleSave} loading={saving}>Thêm xe</Button>
        </>
      }
    >
      <div className="space-y-4 py-2">
        {/* Plate preview */}
        <div className="flex justify-center py-2">
          <PlateGraphic plateNumber={plateInput} animating={false} />
        </div>

        {/* Plate input */}
        <div>
          <label className="block text-xs text-ink-400 mb-1.5">Biển số xe</label>
          <input
            className={[
              'w-full h-12 px-4 rounded-xl border bg-white dark:bg-ink-900 text-sm font-mono font-bold text-ink-900 dark:text-ink-50 outline-none transition-colors',
              plateInput
                ? isValid
                  ? 'border-green-400 focus:border-green-500'
                  : 'border-amber-400 focus:border-amber-500'
                : 'border-ink-200 dark:border-ink-700 focus:border-primary-500',
            ].join(' ')}
            value={plateInput}
            onChange={(e) => setPlateInput(formatPlate(e.target.value))}
            placeholder="51A-12345"
            maxLength={12}
          />
          {plateInput && (
            <p className={`text-xs mt-1 ${isValid ? 'text-green-600' : 'text-amber-600'}`}>
              {isValid ? 'Biển số hợp lệ' : 'Biển số chưa đúng định dạng Việt Nam'}
            </p>
          )}
        </div>

        {/* Vehicle type */}
        <div>
          <label className="block text-xs text-ink-400 mb-2">Loại xe</label>
          <div className="flex gap-2">
            {VEHICLE_TYPES.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setVehicleType(value)}
                className={[
                  'flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 text-sm font-medium transition-colors',
                  vehicleType === value
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                    : 'border-ink-200 dark:border-ink-700 text-ink-500 dark:text-ink-400 hover:border-ink-300',
                ].join(' ')}
              >
                <Icon className="h-5 w-5" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ── Page ──────────────────────────────────────────────────
export default function VehicleManagementPage() {
  const toast = useToast();
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

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
    setLoadingVehicles(true);
    setVehicles([]);
    vehicleApi
      .getByRoom(selectedRoom.id)
      .then((r) => {
        const arr = Array.isArray(r) ? r : (r?.content ?? r?.items ?? []);
        setVehicles(arr);
      })
      .catch(() => toast.error('Không thể tải danh sách xe.'))
      .finally(() => setLoadingVehicles(false));
  }, [selectedRoom]);

  const handleSelectRoom = useCallback((room) => {
    setSelectedRoom(room);
    setVehicles([]);
  }, []);

  const handleAdded = useCallback((vehicle) => {
    setVehicles((prev) => [...prev, vehicle]);
    toast.success('Đã thêm xe.');
  }, [toast]);

  const handleDelete = useCallback(
    async (vehicleId) => {
      await vehicleApi.delete(vehicleId);
      setVehicles((prev) => prev.filter((v) => v.id !== vehicleId));
      toast.success('Đã xoá xe.');
    },
    [toast]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink-900 dark:text-ink-50">Quản lý xe</h1>
        {selectedRoom && (
          <Button icon={Plus} onClick={() => setAddOpen(true)}>
            Thêm xe
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

      {/* Vehicles grid */}
      {selectedRoom && (
        <div className="space-y-3">
          <h2 className="text-base font-semibold text-ink-700 dark:text-ink-200">
            Xe — {selectedRoom.title}
          </h2>

          {loadingVehicles ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} variant="card" className="h-40 rounded-2xl" />
              ))}
            </div>
          ) : vehicles.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center py-16 text-center border-2 border-dashed border-ink-200 dark:border-ink-700 rounded-2xl"
            >
              <Car className="h-8 w-8 text-ink-300 mb-2" />
              <p className="text-ink-600 dark:text-ink-200 font-medium">Chưa có xe nào</p>
              <Button className="mt-3" size="sm" icon={Plus} onClick={() => setAddOpen(true)}>
                Thêm xe đầu tiên
              </Button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <AnimatePresence mode="popLayout">
                {vehicles.map((vehicle, i) => (
                  <VehicleCard
                    key={vehicle.id}
                    vehicle={vehicle}
                    index={i}
                    onDelete={handleDelete}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}

      <AddVehicleModal
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        room={selectedRoom}
        onAdded={handleAdded}
      />
    </div>
  );
}
