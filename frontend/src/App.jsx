import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ToastProvider } from './components/ui/Toast';
import ProtectedRoute from './routes/ProtectedRoute';
import RoleRoute from './routes/RoleRoute';

import PublicLayout from './layouts/PublicLayout';
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';
import ChatLayout from './layouts/ChatLayout';

import LandingPage from './pages/LandingPage';
import SearchPage from './pages/SearchPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import PostDetailPage from './pages/PostDetailPage';
import ProfilePage from './pages/ProfilePage';
import ChatPage from './pages/ChatPage';
import NotificationsPage from './pages/NotificationsPage';
import ReviewsForumPage from './pages/ReviewsForumPage';
import FavoritesPage from './pages/renter/FavoritesPage';
import MyReportsPage from './pages/renter/MyReportsPage';
import MyContractsPage from './pages/renter/MyContractsPage';
import MyReviewsPage from './pages/renter/MyReviewsPage';
import CurrentRentPage from './pages/renter/CurrentRentPage';
import OwnerDashboardPage from './pages/owner/OwnerDashboardPage';
import RoomManagementPage from './pages/owner/RoomManagementPage';
import PostManagementPage from './pages/owner/PostManagementPage';
import ContractManagementPage from './pages/owner/ContractManagementPage';
import BillManagementPage from './pages/owner/BillManagementPage';
import VehicleManagementPage from './pages/owner/VehicleManagementPage';
import PaymentHistoryPage from './pages/owner/PaymentHistoryPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import UserManagementPage from './pages/admin/UserManagementPage';
import PostModerationPage from './pages/admin/PostModerationPage';
import ReviewModerationPage from './pages/admin/ReviewModerationPage';
import ReportManagementPage from './pages/admin/ReportManagementPage';
import { NotFoundPage } from './pages/_placeholders';

function ProtectedShell({ children }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
           <NotificationProvider>
            <Routes>
              {/* Public + shared shell */}
              <Route element={<PublicLayout />}>
                <Route index element={<LandingPage />} />
                <Route path="posts" element={<SearchPage />} />
                <Route path="posts/:postId" element={<PostDetailPage />} />
                <Route path="reviews-forum" element={<ReviewsForumPage />} />

                {/* Protected — any authenticated user */}
                <Route
                  path="profile"
                  element={
                    <ProtectedShell>
                      <ProfilePage />
                    </ProtectedShell>
                  }
                />
                <Route
                  path="notifications"
                  element={
                    <ProtectedShell>
                      <NotificationsPage />
                    </ProtectedShell>
                  }
                />
                <Route
                  path="favorites"
                  element={
                    <ProtectedShell>
                      <FavoritesPage />
                    </ProtectedShell>
                  }
                />
                <Route
                  path="my-reports"
                  element={
                    <ProtectedShell>
                      <MyReportsPage />
                    </ProtectedShell>
                  }
                />
                <Route
                  path="my-contracts"
                  element={
                    <ProtectedShell>
                      <MyContractsPage />
                    </ProtectedShell>
                  }
                />
                <Route
                  path="current-rent"
                  element={
                    <ProtectedShell>
                      <CurrentRentPage />
                    </ProtectedShell>
                  }
                />
                <Route
                  path="my-reviews"
                  element={
                    <ProtectedShell>
                      <MyReviewsPage />
                    </ProtectedShell>
                  }
                />
              </Route>

              {/* Auth shell */}
              <Route element={<AuthLayout />}>
                <Route path="login" element={<LoginPage />} />
                <Route path="register" element={<RegisterPage />} />
                <Route path="forgot-password" element={<ForgotPasswordPage />} />
                <Route path="reset-password" element={<ResetPasswordPage />} />
              </Route>

              {/* Chat shell — protected */}
              <Route
                element={
                  <ProtectedShell>
                    <ChatLayout />
                  </ProtectedShell>
                }
              >
                <Route path="chat" element={<ChatPage />} />
                <Route path="chat/:conversationId" element={<ChatPage />} />
              </Route>

              {/* Owner dashboard */}
              <Route
                path="owner"
                element={
                  <ProtectedShell>
                    <RoleRoute role="OWNER">
                      <DashboardLayout />
                    </RoleRoute>
                  </ProtectedShell>
                }
              >
                <Route index element={<OwnerDashboardPage />} />
                <Route path="rooms" element={<RoomManagementPage />} />
                <Route path="posts" element={<PostManagementPage />} />
                <Route path="contracts" element={<ContractManagementPage />} />
                <Route path="bills" element={<BillManagementPage />} />
                <Route path="vehicles" element={<VehicleManagementPage />} />
                <Route path="payments" element={<PaymentHistoryPage />} />
              </Route>

              {/* Admin dashboard */}
              <Route
                path="admin"
                element={
                  <ProtectedShell>
                    <RoleRoute role="ADMIN">
                      <DashboardLayout />
                    </RoleRoute>
                  </ProtectedShell>
                }
              >
                <Route index element={<AdminDashboardPage />} />
                <Route path="users" element={<UserManagementPage />} />
                <Route path="posts" element={<PostModerationPage />} />
                <Route path="reviews" element={<ReviewModerationPage />} />
                <Route path="reports" element={<ReportManagementPage />} />
              </Route>

              {/* 404 */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
           </NotificationProvider>
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
