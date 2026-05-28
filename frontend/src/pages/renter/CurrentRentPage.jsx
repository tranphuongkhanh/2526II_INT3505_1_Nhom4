import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Home, MapPin, User, Phone, Calendar, Zap, Droplets, DollarSign, Search,
  Star, ExternalLink, Snowflake, Refrigerator, ShowerHead, ShieldCheck, Wifi, Bike,
  PencilLine,
} from 'lucide-react';
import { contractApi, reviewApi } from '../../lib/api';
import { useToast } from '../../components/ui/Toast';
import { Skeleton } from '../../components/ui/Skeleton';
import { Badge } from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import StarRating from '../../components/ui/StarRating';
import { springs } from '../../lib/animations';

const fmt = (n) =>
  n != null
    ? new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(n) + 'đ'
    : '—';

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('vi-VN') : '—');

const ROOM_TYPE_LABEL = {
  ROOM: 'Phòng trọ',
  APARTMENT: 'Căn hộ',
  STUDIO: 'Studio',
  HOUSE: 'Nhà nguyên căn',
};

const PLACEHOLDER_IMG =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 4 3'><rect width='4' height='3' fill='%23e6f5f5'/></svg>";

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

function AmenityChip({ icon: Icon, label, color = 'sky' }) {
  const colors = {
    sky: 'bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-700 text-sky-700 dark:text-sky-300',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300',
    violet: 'bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-700 text-violet-700 dark:text-violet-300',
    amber: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700 text-amber-700 dark:text-amber-300',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium ${colors[color]}`}>
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}

function ImageGallery({ images, title }) {
  const list = images && images.length > 0 ? images : [PLACEHOLDER_IMG];
  const [active, setActive] = useState(0);

  return (
    <div className="space-y-2">
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-ink-100 dark:bg-ink-800">
        <motion.img
          key={active}
          src={list[active]}
          alt={title}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
          className="h-full w-full object-cover"
        />
      </div>
      {list.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {list.map((src, i) => (
            <button
              type="button"
              key={`${src}-${i}`}
              onClick={() => setActive(i)}
              className={[
                'shrink-0 h-16 w-24 rounded-xl overflow-hidden border-2 transition-colors',
                i === active
                  ? 'border-primary-500'
                  : 'border-transparent hover:border-ink-200 dark:hover:border-ink-700',
              ].join(' ')}
            >
              <img src={src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function WriteReviewModal({ contract, onClose, onSuccess }) {
  const toast = useToast();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [pending, setPending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating) { toast.warning('Vui lòng chọn số sao.'); return; }
    setPending(true);
    try {
      await reviewApi.createRoomReview({
        roomId: contract.room_id,
        contractId: contract.id,
        rating,
        comment: comment.trim(),
      });
      toast.success('Đánh giá của bạn đã được gửi!');
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.displayMessage || 'Không thể gửi đánh giá, vui lòng thử lại.');
    } finally {
      setPending(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title="Đánh giá phòng đang thuê" size="sm">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="rounded-xl border border-ink-100 dark:border-ink-700 bg-ink-50/60 dark:bg-ink-800/40 px-3 py-2.5">
          <p className="text-xs text-ink-400">Phòng</p>
          <p className="text-sm font-semibold text-ink-900 dark:text-ink-50 truncate">
            {contract.room_title ?? `Phòng #${contract.room_id}`}
          </p>
        </div>

        <div className="flex flex-col items-center gap-2 py-2">
          <p className="text-sm text-ink-600 dark:text-ink-200">Chất lượng phòng</p>
          <StarRating value={rating} onChange={setRating} size="lg" />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink-900 dark:text-ink-50 mb-1.5">Nhận xét</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            maxLength={1000}
            placeholder="Chia sẻ trải nghiệm của bạn về phòng này..."
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

export default function CurrentRentPage() {
  const [contract, setContract] = useState(undefined);
  const [loading, setLoading] = useState(true);
  const [reviewOpen, setReviewOpen] = useState(false);
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
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-10 space-y-4">
        <Skeleton variant="rect" className="h-8 w-48" />
        <Skeleton variant="rect" className="h-64 w-full rounded-2xl" />
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
          <p className="text-lg font-semibold text-ink-700 dark:text-ink-200 mb-2">Bạn chưa thuê phòng nào</p>
          <p className="text-sm text-ink-400 mb-6">Tìm phòng và ký hợp đồng để bắt đầu thuê.</p>
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
  ].filter(Boolean).join(', ');

  const images = (contract.room_image_urls && contract.room_image_urls.length > 0)
    ? contract.room_image_urls
    : (contract.room_thumbnail_url ? [contract.room_thumbnail_url] : []);

  const amenities = [
    contract.room_has_ac && { icon: Snowflake, label: 'Điều hoà', color: 'sky' },
    contract.room_has_fridge && { icon: Refrigerator, label: 'Tủ lạnh', color: 'emerald' },
    contract.room_has_private_wc && { icon: ShowerHead, label: 'WC riêng', color: 'violet' },
    contract.room_has_security && { icon: ShieldCheck, label: 'Bảo vệ', color: 'amber' },
  ].filter(Boolean);

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-10 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-ink-900 dark:text-ink-50">Phòng đang thuê</h1>
        <Badge variant="active">Đang thuê</Badge>
      </div>

      {/* Hero card: gallery + title + CTAs */}
      <motion.div
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springs.smooth}
        className="rounded-2xl border border-ink-100 dark:border-ink-700 bg-white dark:bg-ink-900 shadow-soft overflow-hidden"
      >
        <div className="p-4 sm:p-5">
          <ImageGallery images={images} title={contract.room_title ?? ''} />
        </div>

        <div className="px-5 pb-5 space-y-4">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-ink-900 dark:text-ink-50 leading-snug">
                {contract.room_title ?? `Phòng #${contract.room_id}`}
              </h2>
              <p className="mt-1 text-sm text-ink-500 dark:text-ink-400 flex items-center gap-1.5">
                <MapPin className="h-4 w-4 shrink-0" />
                <span className="truncate">{fullAddress || '—'}</span>
              </p>
              <div className="mt-2 flex items-center gap-3 flex-wrap text-xs text-ink-500 dark:text-ink-400">
                {contract.room_type && (
                  <span className="inline-flex items-center gap-1">
                    <Home className="h-3.5 w-3.5" />
                    {ROOM_TYPE_LABEL[contract.room_type] ?? contract.room_type}
                  </span>
                )}
                {contract.room_area_mq != null && (
                  <span>{contract.room_area_mq} m²</span>
                )}
                {(contract.room_review_count ?? 0) > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-accent-500 text-accent-500" />
                    {Number(contract.room_avg_rating ?? 0).toFixed(1)}
                    <span className="text-ink-400">({contract.room_review_count})</span>
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-ink-400">Tiền thuê</p>
              <p className="text-2xl font-bold text-primary-500">
                {fmt(contract.monthly_rent)}
                <span className="text-sm font-medium text-ink-400">/tháng</span>
              </p>
            </div>
          </div>

          {amenities.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {amenities.map((a) => <AmenityChip key={a.label} {...a} />)}
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              icon={PencilLine}
              onClick={() => setReviewOpen(true)}
              variant="primary"
              size="sm"
            >
              Đánh giá phòng
            </Button>
            {contract.post_id ? (
              <Link
                to={`/posts/${contract.post_id}`}
                className="inline-flex items-center gap-1.5 rounded-xl border border-ink-200 dark:border-ink-700 px-4 py-2 text-sm font-medium text-ink-700 dark:text-ink-200 hover:border-primary-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                Xem bài đăng gốc
              </Link>
            ) : null}
          </div>
        </div>
      </motion.div>

      {/* Owner info */}
      <Section title="Thông tin chủ nhà">
        <InfoRow icon={User} label="Họ tên" value={contract.owner_name ?? '—'} />
        <InfoRow icon={Phone} label="Số điện thoại" value={contract.owner_phone ?? '—'} />
      </Section>

      {/* Contract */}
      <Section title="Chi tiết hợp đồng">
        <InfoRow icon={Calendar} label="Ngày bắt đầu" value={fmtDate(contract.start_date)} />
        <InfoRow
          icon={Calendar}
          label="Ngày kết thúc"
          value={fmtDate(contract.end_date) === '—' ? 'Không xác định' : fmtDate(contract.end_date)}
        />
        <InfoRow icon={DollarSign} label="Tiền thuê" value={fmt(contract.monthly_rent) + '/tháng'} />
        <InfoRow icon={Zap} label="Giá điện" value={fmt(contract.electricity_price) + '/kWh'} />
        <InfoRow icon={Droplets} label="Giá nước" value={fmt(contract.water_price) + '/m³'} />
        {contract.room_deposit != null && (
          <InfoRow icon={DollarSign} label="Tiền đặt cọc" value={fmt(contract.room_deposit)} />
        )}
      </Section>

      {/* Service fees */}
      {(contract.room_service_fee > 0 || contract.room_wifi_fee > 0 || contract.room_bike_parking_fee > 0) && (
        <Section title="Phí dịch vụ hàng tháng">
          {contract.room_service_fee > 0 && (
            <InfoRow icon={DollarSign} label="Phí dịch vụ" value={fmt(contract.room_service_fee) + '/tháng'} />
          )}
          {contract.room_wifi_fee > 0 && (
            <InfoRow icon={Wifi} label="Phí WiFi" value={fmt(contract.room_wifi_fee) + '/tháng'} />
          )}
          {contract.room_bike_parking_fee > 0 && (
            <InfoRow icon={Bike} label="Phí gửi xe" value={fmt(contract.room_bike_parking_fee) + '/tháng'} />
          )}
        </Section>
      )}

      <div className="flex justify-end">
        <Link
          to="/my-contracts"
          className="text-sm font-medium text-primary-500 hover:text-primary-700 transition-colors"
        >
          Xem tất cả hợp đồng →
        </Link>
      </div>

      {reviewOpen && (
        <WriteReviewModal
          contract={contract}
          onClose={() => setReviewOpen(false)}
        />
      )}
    </div>
  );
}
