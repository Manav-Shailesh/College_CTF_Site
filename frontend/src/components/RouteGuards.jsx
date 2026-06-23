import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

// Redirects to /login if the user is not authenticated.
export function RequireUser({ children }) {
  const { token, loading } = useAuth();
  if (loading) return <p className="text-center text-noxAsh py-8 text-sm">Loading session...</p>;
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

// Redirects to /admin if already logged in as admin.
export function RequireAdmin({ children }) {
  const { adminToken } = useAuth();
  if (!adminToken) return <Navigate to="/admin/login" replace />;
  return children;
}

// Redirects already-logged-in users away from /login and /register.
export function RedirectIfUser({ children }) {
  const { token, loading } = useAuth();
  if (loading) return <p className="text-center text-noxAsh py-8 text-sm">Loading session...</p>;
  if (token) return <Navigate to="/terminal" replace />;
  return children;
}

// Redirects already-logged-in admins away from /admin/login.
export function RedirectIfAdmin({ children }) {
  const { adminToken } = useAuth();
  if (adminToken) return <Navigate to="/admin" replace />;
  return children;
}