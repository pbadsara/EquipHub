import { createContext, useContext, useState, useCallback } from 'react';

const API_URL = 'http://localhost:5050/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('equiphub_token'));
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('equiphub_user');
    return stored ? JSON.parse(stored) : null;
  });

  const persist = (newToken, newUser) => {
    localStorage.setItem('equiphub_token', newToken);
    localStorage.setItem('equiphub_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const login = useCallback(async (email, password) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    persist(data.token, data.user);
    return data.user;
  }, []);

  const register = useCallback(async (name, email, password, role) => {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    persist(data.token, data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('equiphub_token');
    localStorage.removeItem('equiphub_user');
    setToken(null);
    setUser(null);
  }, []);

  const value = { token, user, login, register, logout, isAuthenticated: !!token };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components -- standard context+hook pairing
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
