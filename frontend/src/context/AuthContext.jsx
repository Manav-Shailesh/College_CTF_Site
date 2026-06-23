import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { fetchMe } from '../api/auth.js';

const AuthContext = createContext(null);

const USER_TOKEN_KEY = 'nox_user_token';
const ADMIN_TOKEN_KEY = 'nox_admin_token';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => sessionStorage.getItem(USER_TOKEN_KEY));
  const [adminToken, setAdminToken] = useState(() => sessionStorage.getItem(ADMIN_TOKEN_KEY));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    fetchMe(token)
      .then((data) => setUser(data.user))
      .catch(() => {
        setToken(null);
        sessionStorage.removeItem(USER_TOKEN_KEY);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const loginAs = useCallback((nextToken, nextUser) => {
    sessionStorage.setItem(USER_TOKEN_KEY, nextToken);
    setToken(nextToken);
    setUser(nextUser);
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(USER_TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const loginAsAdmin = useCallback((nextToken) => {
    sessionStorage.setItem(ADMIN_TOKEN_KEY, nextToken);
    setAdminToken(nextToken);
  }, []);

  const adminLogout = useCallback(() => {
    sessionStorage.removeItem(ADMIN_TOKEN_KEY);
    setAdminToken(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, token, loading, loginAs, logout, adminToken, loginAsAdmin, adminLogout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}