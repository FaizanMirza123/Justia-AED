import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getCurrentUser, loginUser, registerUser, migrateThreads } from '../api/authApi';

const AuthContext = createContext(null);

// Generate a stable session ID for anonymous users
function getSessionId() {
  let id = localStorage.getItem('anon_session_id');
  if (!id) {
    id = 'anon_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem('anon_session_id', id);
  }
  return id;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionId] = useState(getSessionId);

  // Check for existing token on mount
  useEffect(() => {
    getCurrentUser()
      .then((u) => setUser(u))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await loginUser(email, password);
    localStorage.setItem('auth_token', data.token);
    setUser(data.user);
    // Migrate anonymous threads to the user's account
    await migrateThreads(sessionId).catch(() => {});
    return data.user;
  }, [sessionId]);

  const register = useCallback(async (name, email, password) => {
    const data = await registerUser(name, email, password);
    localStorage.setItem('auth_token', data.token);
    setUser(data.user);
    await migrateThreads(sessionId).catch(() => {});
    return data.user;
  }, [sessionId]);

  const logout = useCallback(() => {
    localStorage.removeItem('auth_token');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, sessionId, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
