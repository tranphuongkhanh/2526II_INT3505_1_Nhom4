import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Construction, ArrowLeft } from 'lucide-react';
import { springs } from '../lib/animations';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

function Placeholder({ title, description }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springs.smooth}
      className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12"
    >
      <Card padding="lg" className="text-center">
        <div className="mx-auto mb-5 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-50 dark:bg-primary-900/30 text-primary-500">
          <Construction className="h-8 w-8" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-semibold text-ink-900 dark:text-ink-50">{title}</h1>
        {description ? (
          <p className="mt-2 text-ink-600 dark:text-ink-200">{description}</p>
        ) : null}
        <p className="mt-1 text-sm text-ink-400">
          Trang đang được xây dựng — phần giao diện này sẽ được hoàn thiện ở các bước tiếp theo.
        </p>
      </Card>
    </motion.div>
  );
}

// ── Public ──
// LandingPage moved to ./LandingPage.jsx
// SearchPage moved to ./SearchPage.jsx
export const PostDetailPage = () => (
  <Placeholder title="Chi tiết bài đăng" description="Thông tin phòng trọ và liên hệ chủ trọ." />
);

// ── Auth pages live in ./auth/ ──

// ── Protected (any role) ──
// ProfilePage → pages/ProfilePage.jsx
// ChatPage    → pages/ChatPage.jsx
// NotificationsPage → pages/NotificationsPage.jsx
// FavoritesPage   → pages/renter/FavoritesPage.jsx
// MyReportsPage   → pages/renter/MyReportsPage.jsx
// MyContractsPage → pages/renter/MyContractsPage.jsx
// MyReviewsPage   → pages/renter/MyReviewsPage.jsx

// ── Owner ──
export const OwnerDashboardPage = () => <Placeholder title="Tổng quan chủ trọ" />;
export const RoomManagementPage = () => <Placeholder title="Quản lý phòng" />;
export const PostManagementPage = () => <Placeholder title="Quản lý bài đăng" />;
export const ContractManagementPage = () => <Placeholder title="Quản lý hợp đồng" />;
export const BillManagementPage = () => <Placeholder title="Quản lý hoá đơn" />;
export const VehicleManagementPage = () => <Placeholder title="Quản lý xe" />;
export const PaymentHistoryPage = () => <Placeholder title="Lịch sử thanh toán" />;

// ── Admin ──
export const AdminDashboardPage = () => <Placeholder title="Tổng quan quản trị" />;
export const UserManagementPage = () => <Placeholder title="Quản lý người dùng" />;
export const PostModerationPage = () => <Placeholder title="Kiểm duyệt bài đăng" />;
export const ReviewModerationPage = () => <Placeholder title="Kiểm duyệt đánh giá" />;
export const ReportManagementPage = () => <Placeholder title="Xử lý báo cáo" />;

// ── 404 ──
export const NotFoundPage = () => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={springs.smooth}
    className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6"
  >
    <p className="font-display text-7xl font-bold text-primary-500">404</p>
    <h1 className="mt-4 text-2xl font-semibold text-ink-900 dark:text-ink-50">
      Trang không tồn tại
    </h1>
    <p className="mt-2 max-w-md text-ink-600 dark:text-ink-200">
      Đường dẫn bạn truy cập có thể đã bị xoá hoặc chưa từng tồn tại.
    </p>
    <div className="mt-6">
      <Link to="/">
        <Button icon={ArrowLeft}>Về trang chủ</Button>
      </Link>
    </div>
  </motion.div>
);
