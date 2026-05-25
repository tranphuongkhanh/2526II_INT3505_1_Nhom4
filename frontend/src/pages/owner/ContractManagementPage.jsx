import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Home, ScrollText, DollarSign, Zap, Droplets, Hand,
} from 'lucide-react';
import { roomApi, contractApi } from '../../lib/api';
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
function ContractCard({ contract, onEnd }) {
  const isActive = contract.status === 'ACTIVE';
  const [localStatus, setLocalStatus] = useState(contract.status);
  const [ending, setEnding] = useState(false);

  const handleEnd = async () => {
    setEnding(true);
    try {
      await onEnd(contract.id);
      setLocalStatus('ENDED');
    } catch {
      // error handled in parent
    } finally {
      setEnding(false);
    }
  };

  const active = localStatus === 'ACTIVE';

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
            {contract.renterName ?? `Khách thuê #${contract.renter_id ?? contract.renterId ?? '—'}`}
          </p>
          <p className="text-xs text-ink-400 mt-0.5">
            {fmtDate(contract.start_date ?? contract.startDate)} →{' '}
            {(contract.end_date ?? contract.endDate)
              ? fmtDate(contract.end_date ?? contract.endDate)
              : 'Không xác định'}
          </p>
        </div>
        <span
          className={[
            'shrink-0 px-2.5 py-1 rounded-full text-xs font-bold',
            active
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-ink-100 text-ink-500 dark:bg-ink-700 dark:text-ink-400',
          ].join(' ')}
        >
          {active ? 'ACTIVE' : 'ENDED'}
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

      {active && (
        <div className="mt-4 flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            loading={ending}
            onClick={handleEnd}
            className="text-error hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            Kết thúc hợp đồng
          </Button>
        </div>
      )}
    </motion.div>
  );
}

// ── Create contract modal ─────────────────────────────────
const EMPTY_FORM = {
  renterId: '',
  startDate: '',
  endDate: '',
  monthlyRent: '',
  electricityPrice: '',
  waterPrice: '',
};

function CreateContractModal({ isOpen, onClose, room, onCreated }) {
  const toast = useToast();
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && room) {
      setForm({ ...EMPTY_FORM, monthlyRent: String(room.price ?? '') });
    }
  }, [isOpen, room]);

  const set = (field, val) => setForm((f) => ({ ...f, [field]: val }));

  const handleSave = async () => {
    if (!form.renterId.trim()) { toast.error('Vui lòng nhập ID người thuê.'); return; }
    if (isNaN(Number(form.renterId)) || Number(form.renterId) < 1) { toast.error('ID người thuê phải là số hợp lệ.'); return; }
    if (!form.startDate) { toast.error('Vui lòng chọn ngày bắt đầu.'); return; }
    if (!form.monthlyRent) { toast.error('Vui lòng nhập tiền thuê.'); return; }
    setSaving(true);
    try {
      const result = await contractApi.create({
        roomId: room.id,
        renter_id: Number(form.renterId),
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Tạo hợp đồng mới"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Huỷ</Button>
          <Button onClick={handleSave} loading={saving}>Ký hợp đồng</Button>
        </>
      }
    >
      <div className="space-y-4 py-2">
        <Input
          label="ID người thuê"
          required
          type="number"
          min="1"
          value={form.renterId}
          onChange={(e) => set('renterId', e.target.value)}
          placeholder="Nhập ID số của người thuê"
        />
        <div className="grid grid-cols-2 gap-4">
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
        <Input
          label="Tiền thuê (VNĐ/tháng)"
          required
          type="number"
          value={form.monthlyRent}
          onChange={(e) => set('monthlyRent', e.target.value)}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Giá điện (VNĐ/kWh)"
            type="number"
            value={form.electricityPrice}
            onChange={(e) => set('electricityPrice', e.target.value)}
          />
          <Input
            label="Giá nước (VNĐ/m³)"
            type="number"
            value={form.waterPrice}
            onChange={(e) => set('waterPrice', e.target.value)}
          />
        </div>
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
