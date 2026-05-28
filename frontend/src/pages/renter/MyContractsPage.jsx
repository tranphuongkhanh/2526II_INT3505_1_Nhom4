import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Receipt, ChevronDown, ChevronRight, Eye } from 'lucide-react';
import { contractApi, billApi } from '../../lib/api';
import { useToast } from '../../components/ui/Toast';
import { Skeleton } from '../../components/ui/Skeleton';
import { Badge } from '../../components/ui/Badge';
import { springs, easings } from '../../lib/animations';
import ContractPreviewModal from '../../components/contract/ContractPreviewModal';

const CONTRACT_STATUS = {
  PENDING_RENTER_SIGNATURE: { label: 'Chờ bạn ký', variant: 'warning' },
  ACTIVE: { label: 'Đang thuê', variant: 'active' },
  ENDED: { label: 'Đã kết thúc', variant: 'info' },
  TERMINATED: { label: 'Đã chấm dứt', variant: 'rejected' },
};

const fmt = (n) =>
  n != null
    ? new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(n) + 'đ'
    : '—';

function PaidBadge() {
  return (
    <span className="relative inline-flex overflow-hidden rounded-full px-2.5 py-1 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300">
      <span className="relative z-10">Đã thanh toán</span>
      <span
        className="absolute inset-0 bg-shimmer bg-[length:200%_100%] animate-shimmer opacity-50"
        aria-hidden="true"
      />
    </span>
  );
}

function UnpaidBadge() {
  return (
    <span className="inline-flex rounded-full px-2.5 py-1 text-xs font-bold bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400">
      Chưa thanh toán
    </span>
  );
}

function BillRow({ bill }) {
  const [open, setOpen] = useState(false);
  const lineItems = bill.lineItems ?? bill.items ?? [];

  return (
    <tbody>
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
        <td className="py-3 pl-2 pr-4 text-right">
          {bill.status === 'PAID' ? <PaidBadge /> : <UnpaidBadge />}
        </td>
      </tr>
      <AnimatePresence initial={false}>
        {open && lineItems.length > 0 && (
          <tr>
            <td colSpan={7} className="p-0">
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={springs.smooth}
                className="overflow-hidden"
              >
                <div className="bg-ink-50 dark:bg-ink-800/50 px-4 py-3 space-y-1.5">
                  {lineItems.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-sm text-ink-600 dark:text-ink-200"
                    >
                      <span>{item.description ?? item.name ?? `Khoản ${i + 1}`}</span>
                      <span className="font-medium text-ink-900 dark:text-ink-50">
                        {fmt(item.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </td>
          </tr>
        )}
      </AnimatePresence>
    </tbody>
  );
}

function BillTable({ contractId }) {
  const [bills, setBills] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    billApi
      .getByContract(contractId)
      .then((data) => {
        const arr = Array.isArray(data) ? data : (data?.content ?? data?.items ?? []);
        setBills(arr);
      })
      .catch(() => toast.error('Không thể tải hoá đơn.'))
      .finally(() => setLoading(false));
  }, [contractId]);

  if (loading) {
    return (
      <div className="p-4 space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} variant="rect" className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (!bills || bills.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-sm text-ink-400">
        <Receipt className="h-4 w-4 mr-2" />
        Chưa có hoá đơn
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-ink-100 dark:border-ink-700">
            {['Tháng', 'Điện', 'Nước', 'Tiền thuê', 'Phụ phí', 'Tổng', 'Trạng thái'].map(
              (h) => (
                <th
                  key={h}
                  className="py-2.5 px-2 first:pl-4 last:pr-4 text-xs font-semibold text-ink-400 uppercase tracking-wider text-right first:text-left"
                >
                  {h}
                </th>
              )
            )}
          </tr>
        </thead>
        {bills.map((bill) => (
          <BillRow key={bill.id} bill={bill} />
        ))}
      </table>
    </div>
  );
}

function ContractCard({ contract, isSelected, onSelect, onPreview }) {
  const [billsOpen, setBillsOpen] = useState(false);
  const status = (contract.status ?? '').toUpperCase();
  const meta = CONTRACT_STATUS[status] ?? { label: contract.status, variant: 'info' };
  const isPending = status === 'PENDING_RENTER_SIGNATURE';

  const handlePreview = (e) => {
    e.stopPropagation();
    onPreview(contract);
  };

  return (
    <div
      className={[
        'relative rounded-2xl border bg-white dark:bg-ink-900 overflow-hidden transition-shadow cursor-pointer',
        isSelected
          ? 'border-primary-300 dark:border-primary-700 shadow-elevated'
          : 'border-ink-100 dark:border-ink-700 shadow-soft hover:shadow-elevated',
      ].join(' ')}
      onClick={onSelect}
    >
      {/* Teal left border animates in when selected */}
      <AnimatePresence>
        {isSelected && (
          <motion.div
            key="selected-border"
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            exit={{ scaleY: 0 }}
            transition={springs.snappy}
            style={{ originY: 0 }}
            className="absolute left-0 top-0 bottom-0 w-1 bg-primary-500 rounded-r"
          />
        )}
      </AnimatePresence>

      <div className="p-5 pl-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-semibold text-ink-900 dark:text-ink-50 leading-snug truncate">
              {contract.roomTitle ?? contract.room?.title ?? `Hợp đồng #${contract.id}`}
            </h3>
            <p className="mt-1 text-sm text-ink-600 dark:text-ink-200">
              {(contract.start_date ?? contract.startDate)
                ? new Date(contract.start_date ?? contract.startDate).toLocaleDateString('vi-VN')
                : '—'}{' '}
              →{' '}
              {(contract.end_date ?? contract.endDate)
                ? new Date(contract.end_date ?? contract.endDate).toLocaleDateString('vi-VN')
                : 'Không xác định'}
            </p>
          </div>
          <Badge variant={meta.variant}>{meta.label}</Badge>
        </div>

        <div className="mt-3 flex flex-wrap gap-4 text-sm text-ink-600 dark:text-ink-200">
          <span>
            Tiền thuê:{' '}
            <span className="font-semibold text-ink-900 dark:text-ink-50">
              {fmt(contract.monthly_rent ?? contract.monthlyRent)}
            </span>
          </span>
          {(contract.electricity_price ?? contract.electricityPrice) != null && (
            <span>
              Điện:{' '}
              <span className="font-semibold text-ink-900 dark:text-ink-50">
                {fmt(contract.electricity_price ?? contract.electricityPrice)}/kWh
              </span>
            </span>
          )}
          {(contract.water_price ?? contract.waterPrice) != null && (
            <span>
              Nước:{' '}
              <span className="font-semibold text-ink-900 dark:text-ink-50">
                {fmt(contract.water_price ?? contract.waterPrice)}/m³
              </span>
            </span>
          )}
        </div>

        <div className="mt-4 flex items-center gap-3 flex-wrap">
          {isPending && (
            <button
              type="button"
              onClick={handlePreview}
              className="flex items-center gap-1.5 rounded-lg bg-primary-500 hover:bg-primary-600 px-4 py-1.5 text-sm font-semibold text-white transition-colors"
            >
              <Eye className="h-4 w-4" />
              Xem & Ký hợp đồng
            </button>
          )}
          {!isPending && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setBillsOpen((o) => !o); }}
              className="flex items-center gap-1.5 text-sm font-medium text-primary-500 hover:text-primary-700 transition-colors"
            >
              <Receipt className="h-4 w-4" />
              Xem hoá đơn
              <motion.span animate={{ rotate: billsOpen ? 180 : 0 }} transition={springs.snappy}>
                <ChevronDown className="h-4 w-4" />
              </motion.span>
            </button>
          )}
        </div>
      </div>

      <AnimatePresence initial={false}>
        {billsOpen && (
          <motion.div
            key="bills"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={springs.smooth}
            className="overflow-hidden border-t border-ink-100 dark:border-ink-700"
            onClick={(e) => e.stopPropagation()}
          >
            <BillTable contractId={contract.id} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function MyContractsPage() {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [previewContract, setPreviewContract] = useState(null);
  const toast = useToast();

  const handleSign = useCallback(async (contractId) => {
    try {
      const updated = await contractApi.sign(contractId);
      setContracts((prev) => prev.map((c) => c.id === contractId ? { ...c, status: updated.status ?? 'active' } : c));
      toast.success('Hợp đồng đã được ký thành công!');
    } catch (err) {
      toast.error(err.displayMessage ?? 'Ký hợp đồng thất bại.');
    }
  }, [toast]);

  useEffect(() => {
    contractApi
      .getMyContracts()
      .then((data) => {
        const arr = Array.isArray(data) ? data : (data?.content ?? data?.items ?? []);
        setContracts(arr);
        if (arr.length > 0) setSelectedId(arr[0].id);
      })
      .catch(() => toast.error('Không thể tải hợp đồng.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-bold text-ink-900 dark:text-ink-50 mb-6">Hợp đồng của tôi</h1>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} variant="rect" className="h-36 w-full rounded-2xl" />
          ))}
        </div>
      ) : contracts.length === 0 ? (
        <div className="flex flex-col items-center py-24 text-center">
          <FileText className="h-10 w-10 text-ink-300 mb-3" />
          <p className="font-medium text-ink-600 dark:text-ink-200">Chưa có hợp đồng nào</p>
        </div>
      ) : (
        <div className="space-y-4">
          {contracts.map((c) => (
            <ContractCard
              key={c.id}
              contract={c}
              isSelected={selectedId === c.id}
              onSelect={() => setSelectedId(c.id)}
              onPreview={setPreviewContract}
            />
          ))}
        </div>
      )}

      <ContractPreviewModal
        contract={previewContract}
        isOpen={!!previewContract}
        onClose={() => setPreviewContract(null)}
        onSign={handleSign}
      />
    </div>
  );
}
