import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      authAPI.getProfile()
        .then(res => setUser(res.data))
        .catch(() => {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (emailOrUsername, password) => {
    const cleanId = String(emailOrUsername || '').trim();
    const cleanPass = String(password || '').trim();
    const res = await authAPI.login({
      email: cleanId,
      username: cleanId,
      password: cleanPass
    });
    localStorage.setItem('access_token', res.data.access);
    localStorage.setItem('refresh_token', res.data.refresh);
    if (res.data.user) {
      setUser(res.data.user);
    }
    try {
      const profile = await authAPI.getProfile();
      setUser(profile.data);
      return profile.data;
    } catch {
      return res.data.user;
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
