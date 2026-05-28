import { useState } from 'react';
import {
  FileText, MapPin, Calendar, Banknote, Zap, Droplets,
  User, Phone, PenLine, ShieldCheck, AlertTriangle,
  Home,
} from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

const fmt = (n) =>
  n != null
    ? new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(n) + 'đ'
    : '—';

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

const fmtLongDate = (d) => {
  if (!d) return '—';
  const dd = new Date(d);
  return `ngày ${String(dd.getDate()).padStart(2, '0')} tháng ${String(dd.getMonth() + 1).padStart(2, '0')} năm ${dd.getFullYear()}`;
};

function buildAddress(c) {
  return [c.room_address ?? c.roomAddress, c.room_ward ?? c.roomWard, c.room_district ?? c.roomDistrict, c.room_city ?? c.roomCity]
    .filter(Boolean)
    .join(', ');
}

// ─── Section header ──────────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, children }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-primary-100 dark:bg-primary-900/30">
        <Icon className="h-4 w-4 text-primary-500" />
      </div>
      <h4 className="text-sm font-semibold text-ink-900 dark:text-ink-50 uppercase tracking-wider">
        {children}
      </h4>
    </div>
  );
}

// ─── Article section (numbered) — mirrors owner side ─────────────────────────

function ArticleSection({ number, title, children }) {
  return (
    <section className="rounded-xl border border-ink-100 dark:border-ink-700 overflow-hidden">
      <div className="flex items-center gap-2 bg-ink-50 dark:bg-ink-800/60 px-4 py-2.5 border-b border-ink-100 dark:border-ink-700">
        <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary-500 text-white text-[11px] font-bold shrink-0">
          {number}
        </span>
        <h4 className="text-sm font-semibold text-ink-900 dark:text-ink-50 uppercase tracking-wide">
          {title}
        </h4>
      </div>
      <div className="px-4 py-3 space-y-3">{children}</div>
    </section>
  );
}

// ─── Info row ─────────────────────────────────────────────────────────────────

function InfoRow({ label, value, icon: Icon, highlight = false }) {
  return (
    <div className="flex items-start gap-3 py-2">
      {Icon && <Icon className="h-4 w-4 mt-0.5 text-ink-400 shrink-0" />}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-ink-400 leading-none mb-0.5">{label}</p>
        <p
          className={[
            'text-sm leading-snug',
            highlight
              ? 'font-bold text-primary-600 dark:text-primary-400'
              : 'font-medium text-ink-900 dark:text-ink-50',
          ].join(' ')}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

// ─── Party card ──────────────────────────────────────────────────────────────

function PartyCard({ role, name, phone }) {
  return (
    <div className="flex-1 min-w-[200px] rounded-xl bg-ink-50 dark:bg-ink-800/60 p-4 border border-ink-100 dark:border-ink-700">
      <p className="text-[11px] font-semibold text-ink-400 uppercase tracking-wider mb-2">{role}</p>
      <div className="flex items-center gap-2 mb-1">
        <User className="h-4 w-4 text-ink-500" />
        <span className="text-sm font-semibold text-ink-900 dark:text-ink-50">{name || '—'}</span>
      </div>
      {phone && (
        <div className="flex items-center gap-2">
          <Phone className="h-3.5 w-3.5 text-ink-400" />
          <span className="text-sm text-ink-600 dark:text-ink-200">{phone}</span>
        </div>
      )}
    </div>
  );
}

// ─── Price card ──────────────────────────────────────────────────────────────

function PriceCard({ icon: Icon, label, value, unit, accent = false }) {
  return (
    <div
      className={[
        'flex-1 min-w-[140px] rounded-xl p-4 border text-center',
        accent
          ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800'
          : 'bg-ink-50 dark:bg-ink-800/60 border-ink-100 dark:border-ink-700',
      ].join(' ')}
    >
      <div className="flex justify-center mb-2">
        <div
          className={[
            'h-9 w-9 rounded-full flex items-center justify-center',
            accent
              ? 'bg-primary-100 dark:bg-primary-800/50'
              : 'bg-ink-100 dark:bg-ink-700',
          ].join(' ')}
        >
          <Icon className={['h-4 w-4', accent ? 'text-primary-500' : 'text-ink-500'].join(' ')} />
        </div>
      </div>
      <p className="text-xs text-ink-400 mb-0.5">{label}</p>
      <p
        className={[
          'text-base font-bold',
          accent ? 'text-primary-600 dark:text-primary-400' : 'text-ink-900 dark:text-ink-50',
        ].join(' ')}
      >
        {value}
      </p>
      {unit && <p className="text-[11px] text-ink-400">{unit}</p>}
    </div>
  );
}

// ─── Main modal ──────────────────────────────────────────────────────────────

export default function ContractPreviewModal({ contract, isOpen, onClose, onSign }) {
  const [agreed, setAgreed] = useState(false);
  const [signing, setSigning] = useState(false);

  if (!contract) return null;

  const c = contract;
  const title = c.roomTitle ?? c.room_title ?? `Hợp đồng #${c.id}`;
  const address = buildAddress(c);
  const startDate = fmtDate(c.start_date ?? c.startDate);
  const endDate = fmtDate(c.end_date ?? c.endDate);
  const createdAt = c.created_at ?? c.createdAt;

  // Owner-side uses ref `HD-yymm-<room-id padded>` — replicate from contract data.
  const refDate = createdAt ? new Date(createdAt) : new Date();
  const contractRef = `HD-${String(refDate.getFullYear()).slice(2)}${String(refDate.getMonth() + 1).padStart(2, '0')}-${String((c.room_id ?? c.roomId ?? c.id ?? 0)).padStart(3, '0')}`;

  const ownerName = c.owner_name ?? c.ownerName;
  const ownerPhone = c.owner_phone ?? c.ownerPhone;
  const renterName = c.renter_name ?? c.renterName;
  const renterPhone = c.renter_phone ?? c.renterPhone;
  const monthlyRent = c.monthly_rent ?? c.monthlyRent;
  const electricityPrice = c.electricity_price ?? c.electricityPrice;
  const waterPrice = c.water_price ?? c.waterPrice;

  const handleSign = async () => {
    setSigning(true);
    try {
      await onSign(c.id);
      onClose();
    } finally {
      setSigning(false);
    }
  };

  const handleClose = () => {
    if (!signing) {
      setAgreed(false);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="lg"
      title={
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 shrink-0">
            <FileText className="h-5 w-5 text-primary-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-ink-900 dark:text-ink-50 tracking-wide">
              HỢP ĐỒNG THUÊ NHÀ Ở
            </h3>
            <p className="text-xs text-ink-400 mt-0.5">
              Số: <span className="font-mono font-medium text-ink-600 dark:text-ink-300">{contractRef}</span>
              &ensp;·&ensp;Lập {fmtLongDate(createdAt)}
            </p>
          </div>
        </div>
      }
      footer={
        <div className="flex items-center justify-between w-full">
          <p className="text-xs text-ink-400 italic">
            Hợp đồng có hiệu lực ngay sau khi người thuê ký xác nhận
          </p>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={handleClose} disabled={signing}>
              Đóng
            </Button>
            <Button
              variant="primary"
              icon={PenLine}
              onClick={handleSign}
              loading={signing}
              disabled={!agreed}
            >
              Ký xác nhận hợp đồng
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4 py-1 text-sm">
        {/* ── Preamble ────────────────────────────────────────────────── */}
        <p className="text-xs text-ink-500 dark:text-ink-400 leading-relaxed px-1">
          Hợp đồng này được lập và ký kết giữa các bên dưới đây, trên cơ sở tự nguyện, bình đẳng
          và phù hợp với các quy định của pháp luật hiện hành về thuê nhà ở.
        </p>

        {/* ── Banner ──────────────────────────────────────────────────── */}
        <div className="rounded-xl bg-gradient-to-r from-primary-500 to-teal-600 p-5 text-white">
          <p className="text-xs font-medium opacity-80 uppercase tracking-wider mb-1">
            Đối tượng hợp đồng
          </p>
          <h2 className="text-xl font-bold leading-snug">{title}</h2>
          {address && (
            <div className="flex items-center gap-1.5 mt-2 text-sm opacity-90">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span>{address}</span>
            </div>
          )}
        </div>

        {/* ── Parties ─────────────────────────────────────────────────── */}
        <section>
          <SectionHeader icon={User}>Các bên tham gia</SectionHeader>
          <div className="flex flex-wrap gap-3">
            <PartyCard role="Bên cho thuê (Bên A)" name={ownerName} phone={ownerPhone} />
            <PartyCard role="Bên thuê (Bên B)"     name={renterName} phone={renterPhone} />
          </div>
        </section>

        {/* ── Article 1 — Subject ─────────────────────────────────────── */}
        <ArticleSection number="1" title="Điều 1 — Đối tượng hợp đồng">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
            <InfoRow icon={Home}   label="Tên phòng" value={title} />
            <InfoRow icon={MapPin} label="Địa chỉ"   value={address || '—'} />
          </div>
          <p className="text-xs text-ink-500 dark:text-ink-400 leading-relaxed pt-1">
            Bên A đồng ý cho Bên B thuê phòng nêu trên với mục đích để ở. Bên B cam kết sử dụng
            phòng đúng mục đích và tuân thủ các điều khoản trong hợp đồng này.
          </p>
        </ArticleSection>

        {/* ── Article 2 — Term ────────────────────────────────────────── */}
        <ArticleSection number="2" title="Điều 2 — Thời hạn thuê">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
            <InfoRow icon={Calendar} label="Ngày bắt đầu"  value={startDate} highlight />
            <InfoRow icon={Calendar} label="Ngày kết thúc" value={endDate}   highlight />
          </div>
          <p className="text-xs text-ink-500 dark:text-ink-400 pt-1">
            Hợp đồng có hiệu lực từ <strong className="text-ink-700 dark:text-ink-200">{startDate}</strong>
            {endDate !== '—'
              ? <> đến <strong className="text-ink-700 dark:text-ink-200">{endDate}</strong>.</>
              : <>, không có ngày kết thúc cố định.</>}
          </p>
        </ArticleSection>

        {/* ── Article 3 — Pricing ─────────────────────────────────────── */}
        <ArticleSection number="3" title="Điều 3 — Giá thuê và thanh toán">
          <div className="flex flex-wrap gap-3">
            <PriceCard icon={Banknote} label="Tiền thuê hàng tháng" value={fmt(monthlyRent)}      accent />
            <PriceCard icon={Zap}      label="Giá điện"             value={fmt(electricityPrice)} unit="/ kWh" />
            <PriceCard icon={Droplets} label="Giá nước"             value={fmt(waterPrice)}       unit="/ m³" />
          </div>
          <p className="text-xs text-ink-500 dark:text-ink-400">
            Tiền thuê được thanh toán vào ngày <strong>05</strong> hàng tháng.
            Điện, nước thanh toán theo chỉ số thực tế cuối tháng.
          </p>
        </ArticleSection>

        {/* ── Article 4 — Owner obligations ───────────────────────────── */}
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

        {/* ── Article 5 — Renter obligations ──────────────────────────── */}
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

        {/* ── Article 6 — Deposit ─────────────────────────────────────── */}
        <ArticleSection number="6" title="Điều 6 — Đặt cọc và bàn giao">
          <div className="text-xs text-ink-600 dark:text-ink-300 space-y-1">
            <ul className="list-disc list-inside space-y-1 pl-1">
              <li>Bên B đặt cọc theo thoả thuận giữa hai bên để đảm bảo thực hiện hợp đồng.</li>
              <li>Tiền đặt cọc được hoàn trả đầy đủ trong vòng <strong>7 ngày</strong> sau khi kết thúc hợp đồng, trừ các khoản bồi thường thiệt hại (nếu có).</li>
              <li>Nếu Bên B đơn phương chấm dứt hợp đồng trước hạn mà không thông báo đúng quy định, Bên A có quyền giữ lại tiền đặt cọc.</li>
              <li>Nếu Bên A đơn phương chấm dứt hợp đồng trái quy định, Bên A phải hoàn trả tiền đặt cọc và bồi thường thêm một khoản tương đương.</li>
              <li>Biên bản bàn giao phòng (trang thiết bị, số điện/nước ban đầu) được lập riêng và là phụ lục không tách rời của hợp đồng này.</li>
            </ul>
          </div>
        </ArticleSection>

        {/* ── Article 7 — Termination ─────────────────────────────────── */}
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

        {/* ── Article 8 — General commitments ─────────────────────────── */}
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

        {/* ── Important notice ────────────────────────────────────────── */}
        <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800 dark:text-amber-200 leading-relaxed">
              <p className="font-semibold mb-1">Lưu ý quan trọng</p>
              <ul className="list-disc list-inside space-y-0.5 text-xs">
                <li>Sau khi ký, hợp đồng sẽ có hiệu lực ngay lập tức.</li>
                <li>Tiền thuê và các chi phí sẽ được tính theo quy định trong hợp đồng.</li>
                <li>Nếu có thắc mắc, vui lòng liên hệ chủ nhà trước khi ký.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* ── Checkbox agreement ──────────────────────────────────────── */}
        <label
          className={[
            'flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition-colors',
            agreed
              ? 'border-primary-300 dark:border-primary-700 bg-primary-50/50 dark:bg-primary-900/15'
              : 'border-ink-200 dark:border-ink-700 hover:border-primary-300 dark:hover:border-primary-700',
          ].join(' ')}
        >
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 h-5 w-5 rounded border-2 border-ink-300 bg-white appearance-none checked:bg-white checked:border-emerald-500 focus:ring-2 focus:ring-emerald-400 focus:ring-offset-1 cursor-pointer transition-colors"
            style={{
              backgroundImage: agreed
                ? "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 16 16' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M3.5 8.5l3 3 6-6' stroke='%2322c55e' stroke-width='2.75' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")"
                : undefined,
              backgroundSize: '100% 100%',
              backgroundRepeat: 'no-repeat',
            }}
          />
          <div className="flex items-center gap-2">
            <ShieldCheck className={['h-4 w-4 shrink-0', agreed ? 'text-primary-500' : 'text-ink-400'].join(' ')} />
            <span className="text-sm text-ink-700 dark:text-ink-200 leading-snug">
              Tôi đã đọc kỹ và đồng ý với toàn bộ nội dung hợp đồng trên.
            </span>
          </div>
        </label>
      </div>
    </Modal>
  );
}
