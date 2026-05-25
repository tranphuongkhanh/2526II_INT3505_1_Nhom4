import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  X,
  SlidersHorizontal,
  LayoutGrid,
  List as ListIcon,
  Search as SearchIcon,
  Wifi,
  AirVent,
  Refrigerator,
  Bike,
  Bath,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  RotateCw,
  Check,
} from 'lucide-react';

import RoomCard from '../components/RoomCard';
import Button from '../components/ui/Button';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import { useToast } from '../components/ui/Toast';
import { postApi } from '../lib/api';
import { springs, easings } from '../lib/animations';

// ═════════════════════════════════════════════════════════
// Static option sources
// ═════════════════════════════════════════════════════════

const CITIES = [
  {
    code: 'HAN',
    name: 'Hà Nội',
    districts: [
      'Cầu Giấy', 'Đống Đa', 'Hai Bà Trưng', 'Ba Đình', 'Hoàn Kiếm',
      'Thanh Xuân', 'Nam Từ Liêm', 'Bắc Từ Liêm', 'Hà Đông', 'Long Biên',
    ],
  },
  {
    code: 'HCM',
    name: 'TP. Hồ Chí Minh',
    districts: [
      'Quận 1', 'Quận 3', 'Quận 5', 'Quận 7', 'Quận 10',
      'Bình Thạnh', 'Phú Nhuận', 'Tân Bình', 'Gò Vấp', 'Thủ Đức',
    ],
  },
  { code: 'DAD', name: 'Đà Nẵng', districts: ['Hải Châu', 'Thanh Khê', 'Sơn Trà', 'Ngũ Hành Sơn', 'Liên Chiểu', 'Cẩm Lệ'] },
  { code: 'HUE', name: 'Huế', districts: ['Phú Nhuận', 'Vĩnh Ninh', 'Phú Hội', 'Thuận Hoà'] },
  { code: 'CAN', name: 'Cần Thơ', districts: ['Ninh Kiều', 'Bình Thuỷ', 'Cái Răng'] },
];

const ROOM_TYPES = [
  { key: 'BOARDING', label: 'Phòng trọ' },
  { key: 'MINI_APT', label: 'Chung cư mini' },
  { key: 'SHARED', label: 'Ở ghép' },
  { key: 'HOMESTAY', label: 'Homestay' },
];

const AMENITIES = [
  { key: 'wifi',     label: 'Wifi',         Icon: Wifi },
  { key: 'ac',       label: 'Máy lạnh',     Icon: AirVent },
  { key: 'fridge',   label: 'Tủ lạnh',      Icon: Refrigerator },
  { key: 'parking',  label: 'Chỗ để xe',    Icon: Bike },
  { key: 'wc',       label: 'WC riêng',     Icon: Bath },
  { key: 'security', label: 'Bảo vệ',       Icon: ShieldCheck },
];

const SORT_OPTIONS = [
  { value: 'newest',     label: 'Mới nhất' },
  { value: 'price_asc',  label: 'Giá tăng dần' },
  { value: 'price_desc', label: 'Giá giảm dần' },
  { value: 'rating',     label: 'Đánh giá cao' },
];

const PRICE_MIN = 500_000;
const PRICE_MAX = 20_000_000;
const PAGE_SIZE = 12;

const fmtVND = (n) =>
  new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(n) + 'đ';

// ═════════════════════════════════════════════════════════
// Fallback data (when backend not reachable)
// ═════════════════════════════════════════════════════════

const FALLBACK_POSTS = Array.from({ length: 24 }).map((_, i) => {
  const cities = ['Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng'];
  const districts = ['Cầu Giấy', 'Đống Đa', 'Quận 1', 'Bình Thạnh', 'Thủ Đức', 'Hải Châu'];
  const types = ['Phòng trọ', 'Studio', 'Phòng ghép', 'Căn hộ'];
  const imgs = [
    'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=800&q=70',
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=70',
    'https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=800&q=70',
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=70',
    'https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=800&q=70',
    'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=800&q=70',
    'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=800&q=70',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=70',
  ];
  const allAmen = ['wifi', 'ac', 'fridge', 'parking', 'wc', 'security'];
  return {
    id: `fallback-${i + 1}`,
    title: `Phòng trọ ${types[i % types.length]} #${i + 1} — đầy đủ tiện nghi`,
    thumbnailUrl: imgs[i % imgs.length],
    price: 1_500_000 + (i % 8) * 800_000,
    city: cities[i % cities.length],
    district: districts[i % districts.length],
    area: 16 + (i % 6) * 4,
    type: types[i % types.length],
    amenities: allAmen.slice(0, 3 + (i % 4)),
    rating: 4 + ((i * 0.13) % 1),
    reviewCount: 5 + (i * 3) % 60,
    createdAt: Date.now() - i * 86400000,
  };
});

// ═════════════════════════════════════════════════════════
// Hooks for URL-synced filters
// ═════════════════════════════════════════════════════════

function useFilters() {
  const [params, setParams] = useSearchParams();

  const filters = useMemo(
    () => ({
      city: params.get('city') || '',
      district: params.get('district') || '',
      roomTypes: (params.get('type') || '').split(',').filter(Boolean),
      amenities: (params.get('amenities') || '').split(',').filter(Boolean),
      minPrice: Number(params.get('min_price')) || PRICE_MIN,
      maxPrice: Number(params.get('max_price')) || PRICE_MAX,
      sort: params.get('sort') || 'newest',
      page: Math.max(1, Number(params.get('page')) || 1),
    }),
    [params]
  );

  const update = useCallback(
    (patch, { resetPage = true } = {}) => {
      const next = new URLSearchParams(params);
      const apply = (key, value) => {
        if (value === '' || value === null || value === undefined) next.delete(key);
        else if (Array.isArray(value)) {
          if (value.length === 0) next.delete(key);
          else next.set(key, value.join(','));
        } else next.set(key, String(value));
      };
      if ('city' in patch) {
        apply('city', patch.city);
        if (patch.city !== filters.city) apply('district', '');
      }
      if ('district' in patch) apply('district', patch.district);
      if ('roomTypes' in patch) apply('type', patch.roomTypes);
      if ('amenities' in patch) apply('amenities', patch.amenities);
      if ('minPrice' in patch) {
        if (patch.minPrice === PRICE_MIN) next.delete('min_price');
        else apply('min_price', patch.minPrice);
      }
      if ('maxPrice' in patch) {
        if (patch.maxPrice === PRICE_MAX) next.delete('max_price');
        else apply('max_price', patch.maxPrice);
      }
      if ('sort' in patch) {
        if (patch.sort === 'newest') next.delete('sort');
        else apply('sort', patch.sort);
      }
      if ('page' in patch) {
        if (patch.page === 1) next.delete('page');
        else apply('page', patch.page);
      } else if (resetPage) {
        next.delete('page');
      }
      setParams(next, { replace: false });
    },
    [params, setParams, filters.city]
  );

  const reset = useCallback(() => setParams(new URLSearchParams()), [setParams]);

  return { filters, update, reset };
}

// ═════════════════════════════════════════════════════════
// Accordion section
// ═════════════════════════════════════════════════════════

function FilterSection({ title, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-ink-100 dark:border-ink-700 py-4">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 text-sm font-semibold text-ink-900 dark:text-ink-50"
      >
        <span>{title}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={springs.smooth}>
          <ChevronDown className="h-4 w-4 text-ink-400" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: easings.outExpo }}
            className="overflow-hidden"
          >
            <div className="pt-3">{children}</div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

// ═════════════════════════════════════════════════════════
// Custom checkbox with animated tick
// ═════════════════════════════════════════════════════════

function Checkbox({ checked, onChange, label, Icon }) {
  return (
    <label className="group flex items-center gap-2.5 cursor-pointer select-none py-1.5">
      <span
        className={[
          'inline-flex h-5 w-5 items-center justify-center rounded-md border-2 transition-colors',
          checked
            ? 'border-primary-500 bg-primary-500'
            : 'border-ink-200 dark:border-ink-700 group-hover:border-primary-500',
        ].join(' ')}
      >
        <svg viewBox="0 0 16 16" className="h-3 w-3 text-white" aria-hidden="true">
          <motion.path
            d="M3 8 L7 12 L13 4"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={false}
            animate={{ pathLength: checked ? 1 : 0 }}
            transition={{ duration: 0.25, ease: easings.outExpo }}
          />
        </svg>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
      {Icon ? <Icon className="h-4 w-4 text-ink-400" /> : null}
      <span className="text-sm text-ink-600 dark:text-ink-200">{label}</span>
    </label>
  );
}

// ═════════════════════════════════════════════════════════
// Price range — two overlaid range inputs + number inputs
// ═════════════════════════════════════════════════════════

function PriceRange({ min, max, onCommit }) {
  const [localMin, setLocalMin] = useState(min);
  const [localMax, setLocalMax] = useState(max);

  useEffect(() => setLocalMin(min), [min]);
  useEffect(() => setLocalMax(max), [max]);

  const pct = (v) => ((v - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100;

  const commitMin = (v) => {
    const next = Math.max(PRICE_MIN, Math.min(localMax - 100_000, Number(v) || 0));
    setLocalMin(next);
    onCommit({ minPrice: next });
  };
  const commitMax = (v) => {
    const next = Math.min(PRICE_MAX, Math.max(localMin + 100_000, Number(v) || PRICE_MAX));
    setLocalMax(next);
    onCommit({ maxPrice: next });
  };

  return (
    <div>
      <div className="relative h-7">
        <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-1.5 rounded-full bg-ink-200 dark:bg-ink-700" />
        <div
          className="absolute top-1/2 -translate-y-1/2 h-1.5 rounded-full bg-primary-500"
          style={{ left: `${pct(localMin)}%`, right: `${100 - pct(localMax)}%` }}
        />
        <input
          type="range"
          min={PRICE_MIN}
          max={PRICE_MAX}
          step={100_000}
          value={localMin}
          onChange={(e) => setLocalMin(Math.min(localMax - 100_000, Number(e.target.value)))}
          onMouseUp={() => commitMin(localMin)}
          onTouchEnd={() => commitMin(localMin)}
          onKeyUp={() => commitMin(localMin)}
          className="range-input absolute inset-0 w-full pointer-events-none appearance-none bg-transparent"
          aria-label="Giá tối thiểu"
        />
        <input
          type="range"
          min={PRICE_MIN}
          max={PRICE_MAX}
          step={100_000}
          value={localMax}
          onChange={(e) => setLocalMax(Math.max(localMin + 100_000, Number(e.target.value)))}
          onMouseUp={() => commitMax(localMax)}
          onTouchEnd={() => commitMax(localMax)}
          onKeyUp={() => commitMax(localMax)}
          className="range-input absolute inset-0 w-full pointer-events-none appearance-none bg-transparent"
          aria-label="Giá tối đa"
        />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <label className="text-xs text-ink-400">
          Tối thiểu
          <input
            type="number"
            min={PRICE_MIN}
            max={localMax}
            step={100_000}
            value={localMin}
            onChange={(e) => setLocalMin(Number(e.target.value))}
            onBlur={(e) => commitMin(Number(e.target.value))}
            onKeyDown={(e) => e.key === 'Enter' && commitMin(Number(e.target.value))}
            className="mt-1 w-full h-9 rounded-lg bg-ink-50 dark:bg-ink-800 border border-transparent focus:border-primary-500 px-2 text-sm text-ink-900 dark:text-ink-50 outline-none"
          />
        </label>
        <label className="text-xs text-ink-400">
          Tối đa
          <input
            type="number"
            min={localMin}
            max={PRICE_MAX}
            step={100_000}
            value={localMax}
            onChange={(e) => setLocalMax(Number(e.target.value))}
            onBlur={(e) => commitMax(Number(e.target.value))}
            onKeyDown={(e) => e.key === 'Enter' && commitMax(Number(e.target.value))}
            className="mt-1 w-full h-9 rounded-lg bg-ink-50 dark:bg-ink-800 border border-transparent focus:border-primary-500 px-2 text-sm text-ink-900 dark:text-ink-50 outline-none"
          />
        </label>
      </div>

      <div className="mt-1.5 flex justify-between text-[10px] text-ink-400">
        <span>{fmtVND(localMin)}</span>
        <span>{fmtVND(localMax)}</span>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════
// Filter sidebar
// ═════════════════════════════════════════════════════════

function FilterSidebar({ filters, update, reset, anyActive, onClose }) {
  const selectedCity = CITIES.find((c) => c.name === filters.city) || null;

  const toggle = (list, item) => {
    const set = new Set(list);
    if (set.has(item)) set.delete(item);
    else set.add(item);
    return Array.from(set);
  };

  return (
    <aside className="h-full overflow-y-auto bg-white dark:bg-ink-900 lg:bg-transparent lg:dark:bg-transparent p-5 lg:p-0">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-ink-900 dark:text-ink-50">Bộ lọc</h2>
        <div className="flex items-center gap-2">
          {anyActive ? (
            <button
              type="button"
              onClick={reset}
              className="text-xs font-medium text-error hover:underline"
            >
              Xoá tất cả
            </button>
          ) : null}
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="lg:hidden inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800"
              aria-label="Đóng bộ lọc"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>

      <FilterSection title="Khu vực">
        <div className="space-y-2">
          <select
            value={filters.city}
            onChange={(e) => update({ city: e.target.value })}
            className="w-full h-10 rounded-lg bg-ink-50 dark:bg-ink-800 border border-transparent focus:border-primary-500 px-3 text-sm text-ink-900 dark:text-ink-50 outline-none"
          >
            <option value="">Tất cả thành phố</option>
            {CITIES.map((c) => (
              <option key={c.code} value={c.name}>{c.name}</option>
            ))}
          </select>
          <select
            value={filters.district}
            onChange={(e) => update({ district: e.target.value })}
            disabled={!selectedCity}
            className="w-full h-10 rounded-lg bg-ink-50 dark:bg-ink-800 border border-transparent focus:border-primary-500 px-3 text-sm text-ink-900 dark:text-ink-50 outline-none disabled:opacity-50"
          >
            <option value="">{selectedCity ? 'Tất cả quận/huyện' : 'Chọn thành phố trước'}</option>
            {(selectedCity?.districts || []).map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </FilterSection>

      <FilterSection title="Loại phòng">
        <div className="flex flex-wrap gap-2">
          {ROOM_TYPES.map((t) => {
            const selected = filters.roomTypes.includes(t.key);
            return (
              <motion.button
                key={t.key}
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={() => update({ roomTypes: toggle(filters.roomTypes, t.key) })}
                className={[
                  'px-3 h-8 rounded-full text-xs font-medium transition-colors border',
                  selected
                    ? 'bg-primary-500 text-white border-primary-500'
                    : 'bg-transparent text-ink-600 dark:text-ink-200 border-ink-200 dark:border-ink-700 hover:border-primary-500',
                ].join(' ')}
              >
                {t.label}
              </motion.button>
            );
          })}
        </div>
      </FilterSection>

      <FilterSection title="Khoảng giá">
        <PriceRange min={filters.minPrice} max={filters.maxPrice} onCommit={update} />
      </FilterSection>

      <FilterSection title="Tiện nghi">
        <div className="space-y-0.5">
          {AMENITIES.map(({ key, label, Icon }) => (
            <Checkbox
              key={key}
              checked={filters.amenities.includes(key)}
              onChange={() => update({ amenities: toggle(filters.amenities, key) })}
              label={label}
              Icon={Icon}
            />
          ))}
        </div>
      </FilterSection>
    </aside>
  );
}

// ═════════════════════════════════════════════════════════
// Active filter tag pills
// ═════════════════════════════════════════════════════════

function ActiveFilterTags({ filters, update, reset }) {
  const tags = [];
  if (filters.city) tags.push({ id: 'city', label: filters.city, onRemove: () => update({ city: '' }) });
  if (filters.district) tags.push({ id: 'district', label: filters.district, onRemove: () => update({ district: '' }) });
  filters.roomTypes.forEach((k) => {
    const t = ROOM_TYPES.find((r) => r.key === k);
    if (t) tags.push({ id: `type-${k}`, label: t.label, onRemove: () => update({ roomTypes: filters.roomTypes.filter((x) => x !== k) }) });
  });
  filters.amenities.forEach((k) => {
    const a = AMENITIES.find((x) => x.key === k);
    if (a) tags.push({ id: `am-${k}`, label: a.label, onRemove: () => update({ amenities: filters.amenities.filter((x) => x !== k) }) });
  });
  if (filters.minPrice > PRICE_MIN || filters.maxPrice < PRICE_MAX) {
    tags.push({
      id: 'price',
      label: `${fmtVND(filters.minPrice)} – ${fmtVND(filters.maxPrice)}`,
      onRemove: () => update({ minPrice: PRICE_MIN, maxPrice: PRICE_MAX }),
    });
  }

  if (tags.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <AnimatePresence initial={false}>
        {tags.map((t) => (
          <motion.span
            key={t.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={springs.bouncy}
            className="inline-flex items-center gap-1.5 h-7 pl-3 pr-1 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs font-medium"
          >
            {t.label}
            <button
              type="button"
              onClick={t.onRemove}
              className="inline-flex h-5 w-5 items-center justify-center rounded-full hover:bg-primary-100 dark:hover:bg-primary-900/60"
              aria-label={`Xoá ${t.label}`}
            >
              <X className="h-3 w-3" />
            </button>
          </motion.span>
        ))}
      </AnimatePresence>
      {tags.length >= 2 ? (
        <button
          type="button"
          onClick={reset}
          className="text-xs font-medium text-error hover:underline"
        >
          Xoá tất cả
        </button>
      ) : null}
    </div>
  );
}

// ═════════════════════════════════════════════════════════
// Pagination
// ═════════════════════════════════════════════════════════

function pageNumbers(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, '…', total];
  if (current >= total - 3) return [1, '…', total - 4, total - 3, total - 2, total - 1, total];
  return [1, '…', current - 1, current, current + 1, '…', total];
}

function Pagination({ current, total, onChange }) {
  if (total <= 1) return null;
  const items = pageNumbers(current, total);
  return (
    <nav className="mt-10 flex items-center justify-center gap-1.5" aria-label="Phân trang">
      <button
        type="button"
        onClick={() => onChange(current - 1)}
        disabled={current === 1}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-ink-100 dark:border-ink-700 text-ink-600 dark:text-ink-200 hover:border-primary-500 hover:text-primary-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        aria-label="Trang trước"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      {items.map((p, i) =>
        p === '…' ? (
          <span key={`gap-${i}`} className="px-2 text-ink-400">…</span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            className={[
              'h-9 w-9 rounded-full text-sm font-medium transition-colors',
              p === current
                ? 'bg-primary-500 text-white shadow-soft'
                : 'text-ink-600 dark:text-ink-200 hover:bg-primary-50 dark:hover:bg-primary-900/30',
            ].join(' ')}
            aria-current={p === current ? 'page' : undefined}
          >
            {p}
          </button>
        )
      )}
      <button
        type="button"
        onClick={() => onChange(current + 1)}
        disabled={current === total}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-ink-100 dark:border-ink-700 text-ink-600 dark:text-ink-200 hover:border-primary-500 hover:text-primary-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        aria-label="Trang sau"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}

// ═════════════════════════════════════════════════════════
// Card matching against filters (used when API returns unfiltered fallback data)
// ═════════════════════════════════════════════════════════

const CITY_TO_DISTRICTS = Object.fromEntries(CITIES.map((c) => [c.name, new Set(c.districts)]));

function matchesFilters(post, f) {
  if (f.city && post.city !== f.city) return false;
  if (f.district && post.district !== f.district) return false;
  if (f.minPrice && post.price < f.minPrice) return false;
  if (f.maxPrice && post.price > f.maxPrice) return false;
  if (f.amenities.length && !f.amenities.every((a) => (post.amenities || []).includes(a))) return false;
  // roomTypes are server-side; skip locally
  return true;
}

function sortPosts(list, sort) {
  const arr = [...list];
  switch (sort) {
    case 'price_asc':  return arr.sort((a, b) => a.price - b.price);
    case 'price_desc': return arr.sort((a, b) => b.price - a.price);
    case 'rating':     return arr.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    default:           return arr.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }
}

// ═════════════════════════════════════════════════════════
// Page
// ═════════════════════════════════════════════════════════

export function SearchPage() {
  const { filters, update, reset } = useFilters();
  const toast = useToast();
  const resultsRef = useRef(null);

  const [posts, setPosts] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [viewMode, setViewMode] = useState('grid');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const anyActive =
    Boolean(filters.city || filters.district) ||
    filters.roomTypes.length > 0 ||
    filters.amenities.length > 0 ||
    filters.minPrice > PRICE_MIN ||
    filters.maxPrice < PRICE_MAX ||
    filters.sort !== 'newest';

  // Fetch when filters change
  useEffect(() => {
    let cancelled = false;
    const apiParams = {
      page: filters.page,
      size: PAGE_SIZE,
      ...(filters.city && { city: filters.city }),
      ...(filters.district && { district: filters.district }),
      ...(filters.roomTypes.length === 1 && { roomType: filters.roomTypes[0] }),
      ...(filters.minPrice > PRICE_MIN && { minPrice: filters.minPrice }),
      ...(filters.maxPrice < PRICE_MAX && { maxPrice: filters.maxPrice }),
    };

    setIsLoading(true);
    setError(null);
    postApi
      .search(apiParams)
      .then((res) => {
        if (cancelled) return;
        const list = res?.items ?? [];
        const total = res?.totalCount ?? list.length;
        if (list.length > 0) {
          setPosts(list);
          setTotalCount(total);
        } else {
          // empty server response → fall back to local filtering of demo data
          const filtered = sortPosts(FALLBACK_POSTS.filter((p) => matchesFilters(p, filters)), filters.sort);
          setTotalCount(filtered.length);
          const start = (filters.page - 1) * PAGE_SIZE;
          setPosts(filtered.slice(start, start + PAGE_SIZE));
        }
      })
      .catch(() => {
        if (cancelled) return;
        setError('Không thể kết nối tới máy chủ. Hiển thị dữ liệu mẫu.');
        const filtered = sortPosts(FALLBACK_POSTS.filter((p) => matchesFilters(p, filters)), filters.sort);
        setTotalCount(filtered.length);
        const start = (filters.page - 1) * PAGE_SIZE;
        setPosts(filtered.slice(start, start + PAGE_SIZE));
      })
      .finally(() => !cancelled && setIsLoading(false));

    return () => {
      cancelled = true;
    };
  }, [filters]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const onPageChange = (p) => {
    update({ page: p }, { resetPage: false });
    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
      <div className="grid grid-cols-1 lg:grid-cols-[18rem_1fr] gap-8">
        {/* ── Desktop sidebar ── */}
        <div className="hidden lg:block">
          <div className="sticky top-24 max-h-[calc(100vh-6rem)] overflow-hidden">
            <FilterSidebar
              filters={filters}
              update={update}
              reset={reset}
              anyActive={anyActive}
            />
          </div>
        </div>

        {/* ── Results ── */}
        <div ref={resultsRef} className="min-w-0">
          {/* Action bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <p className="text-sm text-ink-600 dark:text-ink-200">
              <span className="font-semibold text-ink-900 dark:text-ink-50">
                {totalCount.toLocaleString('vi-VN')}
              </span>{' '}
              phòng tìm thấy
            </p>
            <div className="flex items-center gap-2">
              <select
                value={filters.sort}
                onChange={(e) => update({ sort: e.target.value })}
                className="h-9 rounded-lg bg-white dark:bg-ink-900 border border-ink-100 dark:border-ink-700 text-sm text-ink-900 dark:text-ink-50 px-2.5 pr-7 focus:border-primary-500 outline-none transition-colors"
                aria-label="Sắp xếp"
              >
                {SORT_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
              <div className="inline-flex rounded-lg border border-ink-100 dark:border-ink-700 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={[
                    'inline-flex h-9 w-9 items-center justify-center transition-colors',
                    viewMode === 'grid'
                      ? 'bg-primary-500 text-white'
                      : 'text-ink-600 dark:text-ink-200 hover:bg-ink-100 dark:hover:bg-ink-800',
                  ].join(' ')}
                  aria-pressed={viewMode === 'grid'}
                  aria-label="Lưới"
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={[
                    'inline-flex h-9 w-9 items-center justify-center transition-colors',
                    viewMode === 'list'
                      ? 'bg-primary-500 text-white'
                      : 'text-ink-600 dark:text-ink-200 hover:bg-ink-100 dark:hover:bg-ink-800',
                  ].join(' ')}
                  aria-pressed={viewMode === 'list'}
                  aria-label="Danh sách"
                >
                  <ListIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Active filter tags */}
          <ActiveFilterTags filters={filters} update={update} reset={reset} />

          {/* Error banner */}
          {error ? (
            <div className="mb-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10 p-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-300 shrink-0 mt-0.5" />
              <p className="flex-1 text-sm text-amber-800 dark:text-amber-200">{error}</p>
              <Button
                size="sm"
                variant="ghost"
                icon={RotateCw}
                onClick={() => update({}, { resetPage: false })}
              >
                Thử lại
              </Button>
            </div>
          ) : null}

          {/* Results body */}
          {isLoading ? (
            <div
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5'
                  : 'space-y-4'
              }
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.06 }}
                >
                  <Skeleton variant="card" />
                </motion.div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <EmptyState
              icon={SearchIcon}
              title="Không tìm thấy phòng phù hợp"
              description="Thử thay đổi bộ lọc hoặc mở rộng khu vực tìm kiếm."
              action={{ label: 'Xoá bộ lọc', onClick: reset, icon: X }}
            />
          ) : (
            <motion.div
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.04 } },
              }}
              initial="hidden"
              animate="visible"
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5'
                  : 'space-y-4'
              }
            >
              <AnimatePresence mode="popLayout">
                {posts.map((post) => (
                  <motion.div
                    key={post.id}
                    layout
                    variants={{
                      hidden: { opacity: 0, scale: 0.95, y: 20 },
                      visible: { opacity: 1, scale: 1, y: 0 },
                    }}
                    exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                    transition={{ duration: 0.3, ease: easings.outExpo }}
                  >
                    <RoomCard post={post} viewMode={viewMode} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Pagination */}
          {!isLoading && posts.length > 0 ? (
            <Pagination current={filters.page} total={totalPages} onChange={onPageChange} />
          ) : null}
        </div>
      </div>

      {/* ── Mobile filter button (FAB) ── */}
      <button
        type="button"
        onClick={() => setSidebarOpen(true)}
        className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-30 inline-flex items-center gap-2 h-12 px-5 rounded-full bg-primary-500 hover:bg-primary-700 text-white text-sm font-semibold shadow-elevated transition-colors"
      >
        <SlidersHorizontal className="h-4 w-4" />
        Bộ lọc
      </button>

      {/* ── Mobile drawer ── */}
      <AnimatePresence>
        {sidebarOpen ? (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.div
              key="drawer"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={springs.smooth}
              className="lg:hidden fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw] shadow-elevated"
            >
              <FilterSidebar
                filters={filters}
                update={update}
                reset={reset}
                anyActive={anyActive}
                onClose={() => setSidebarOpen(false)}
              />
              <div className="absolute bottom-0 inset-x-0 p-4 bg-white dark:bg-ink-900 border-t border-ink-100 dark:border-ink-700">
                <Button fullWidth onClick={() => setSidebarOpen(false)} icon={Check}>
                  Áp dụng
                </Button>
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export default SearchPage;
