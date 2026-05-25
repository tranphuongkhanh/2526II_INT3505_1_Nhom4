import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function RoleRoute({ role, children }) {
  const { role: currentRole, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base">
        <div className="h-10 w-10 rounded-full border-2 border-primary-500/30 border-t-primary-500 animate-spin" />
      </div>
    );
  }
  const allowed = Array.isArray(role) ? role.includes(currentRole) : currentRole === role;
  if (!allowed) return <Navigate to="/" replace />;
  return children;
}

export default RoleRoute;
