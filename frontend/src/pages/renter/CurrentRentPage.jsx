import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Home, MapPin, User, Phone, Calendar, Zap, Droplets, DollarSign, Search } from 'lucide-react';
import { contractApi } from '../../lib/api';
import { useToast } from '../../components/ui/Toast';
import { Skeleton } from '../../components/ui/Skeleton';
import { Badge } from '../../components/ui/Badge';

const fmt = (n) =>
  n != null
    ? new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(n) + 'đ'
    : '—';

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('vi-VN') : '—');

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-ink-100 dark:border-ink-700 last:border-0">
      <span className="flex-shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/30 text-primary-500">
        <Icon className="h-4 w-4" />
      </span>
      <span className="text-sm text-ink-500 dark:text-ink-400 w-32 shrink-0">{label}</span>
      <span className="text-sm font-medium text-ink-900 dark:text-ink-50">{value}</span>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="rounded-2xl border border-ink-100 dark:border-ink-700 bg-white dark:bg-ink-900 shadow-soft overflow-hidden">
      <div className="px-5 py-3.5 border-b border-ink-100 dark:border-ink-700">
        <h2 className="text-sm font-semibold text-ink-500 dark:text-ink-400 uppercase tracking-wider">
          {title}
        </h2>
      </div>
      <div className="px-5">{children}</div>
    </div>
  );
}

export default function CurrentRentPage() {
  const [contract, setContract] = useState(undefined);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    contractApi
      .getCurrentRent()
      .then((data) => setContract(data))
      .catch(() => toast.error('Không thể tải thông tin thuê phòng.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-10 space-y-4">
        <Skeleton variant="rect" className="h-8 w-48" />
        <Skeleton variant="rect" className="h-48 w-full rounded-2xl" />
        <Skeleton variant="rect" className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-10">
        <h1 className="text-2xl font-bold text-ink-900 dark:text-ink-50 mb-8">Phòng đang thuê</h1>
        <div className="flex flex-col items-center py-24 text-center rounded-2xl border border-ink-100 dark:border-ink-700 bg-white dark:bg-ink-900">
          <Home className="h-12 w-12 text-ink-200 dark:text-ink-600 mb-4" />
          <p className="text-lg font-semibold text-ink-700 dark:text-ink-200 mb-2">
            Bạn chưa thuê phòng nào
          </p>
          <p className="text-sm text-ink-400 mb-6">
            Tìm phòng và ký hợp đồng để bắt đầu thuê.
          </p>
          <Link
            to="/posts"
            className="inline-flex items-center gap-2 rounded-xl bg-primary-500 hover:bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors"
          >
            <Search className="h-4 w-4" />
            Tìm phòng ngay
          </Link>
        </div>
      </div>
    );
  }

  const fullAddress = [
    contract.room_address,
    contract.room_ward,
    contract.room_district,
    contract.room_city,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-10 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink-900 dark:text-ink-50">Phòng đang thuê</h1>
        <Badge variant="active">Đang thuê</Badge>
      </div>

      <Section title="Thông tin phòng">
        <InfoRow
          icon={Home}
          label="Tên phòng"
          value={contract.room_title ?? `Phòng #${contract.room_id}`}
        />
        <InfoRow
          icon={MapPin}
          label="Địa chỉ"
          value={fullAddress || '—'}
        />
      </Section>

      <Section title="Thông tin chủ nhà">
        <InfoRow icon={User} label="Họ tên" value={contract.owner_name ?? '—'} />
        <InfoRow icon={Phone} label="Số điện thoại" value={contract.owner_phone ?? '—'} />
      </Section>

      <Section title="Chi tiết hợp đồng">
        <InfoRow
          icon={Calendar}
          label="Ngày bắt đầu"
          value={fmtDate(contract.start_date)}
        />
        <InfoRow
          icon={Calendar}
          label="Ngày kết thúc"
          value={fmtDate(contract.end_date) === '—' ? 'Không xác định' : fmtDate(contract.end_date)}
        />
        <InfoRow
          icon={DollarSign}
          label="Tiền thuê"
          value={fmt(contract.monthly_rent) + '/tháng'}
        />
        <InfoRow
          icon={Zap}
          label="Giá điện"
          value={fmt(contract.electricity_price) + '/kWh'}
        />
        <InfoRow
          icon={Droplets}
          label="Giá nước"
          value={fmt(contract.water_price) + '/m³'}
        />
      </Section>

      <div className="flex justify-end">
        <Link
          to="/my-contracts"
          className="text-sm font-medium text-primary-500 hover:text-primary-700 transition-colors"
        >
          Xem tất cả hợp đồng →
        </Link>
      </div>
    </div>
  );
}
