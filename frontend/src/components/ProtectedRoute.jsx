import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * Gates a route behind authentication and (optionally) a specific role.
 * Unauthenticated users are sent to /login; authenticated users with the
 * wrong role are sent to their own dashboard rather than shown a 403 page.
 */
export function ProtectedRoute({ role, children }) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (role && user?.role !== role) {
    return <Navigate to={`/dashboard/${user.role}`} replace />;
  }

  return children;
}
