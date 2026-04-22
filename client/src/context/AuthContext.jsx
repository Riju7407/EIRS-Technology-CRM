import React, { createContext, useContext, useState, useCallback } from 'react';
import API from '../api/axios';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('crm_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(false);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const { data } = await API.post('/auth/signin', { email, password });
      const token = data?.token;
      const backendUser = data?.data || {};

      if (!token || !backendUser?.id) {
        throw new Error('Invalid login response from server');
      }

      if (!backendUser.isAdmin && backendUser.role !== 'admin') {
        throw new Error('Only admin users can access CRM');
      }

      const normalizedUser = {
        id: backendUser.id,
        name: backendUser.name,
        email: backendUser.email,
        isAdmin: Boolean(backendUser.isAdmin || backendUser.role === 'admin'),
        role: backendUser.role || 'admin',
      };

      localStorage.setItem('crm_token', token);
      localStorage.setItem('crm_user', JSON.stringify(normalizedUser));
      setUser(normalizedUser);
      toast.success(`Welcome back, ${normalizedUser.name}!`);
      return { success: true };
    } catch (error) {
      const msg = error.response?.data?.message || error.message || 'Login failed';
      toast.error(msg);
      console.error('Login error:', error);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('crm_token');
    localStorage.removeItem('crm_user');
    setUser(null);
    toast.success('Logged out successfully');
  }, []);

  const isAdmin = Boolean(user?.isAdmin || user?.role === 'admin');

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
