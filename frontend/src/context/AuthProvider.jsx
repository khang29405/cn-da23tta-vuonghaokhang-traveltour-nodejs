import { useCallback, useEffect, useMemo, useState } from 'react';
import { AuthContext } from './authContext.js';
import * as authApi from '../api/authApi.js';
import { setUnauthorizedHandler } from '../api/axiosClient.js';
import { getToken, getStoredUser, saveAuth, clearAuth } from '../utils/authStorage.js';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getStoredUser);

  const logout = useCallback(() => {
    clearAuth();
    setUser(null);
  }, []);

  const login = useCallback(async (credentials) => {
    const { token, nguoi_dung: nguoiDung } = await authApi.login(credentials);
    saveAuth(token, nguoiDung);
    setUser(nguoiDung);
    return nguoiDung;
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null));
    return () => setUnauthorizedHandler(null);
  }, []);

  // Đọc lại thông tin từ backend khi mở trang: tài khoản bị khóa hoặc đổi vai trò sau lần đăng nhập trước
  // sẽ được cập nhật ngay (401 đã được axiosClient xử lý, ở đây chỉ cần xử lý 403 tài khoản bị khóa)
  useEffect(() => {
    const token = getToken();
    if (!token) return;

    authApi
      .getMe()
      .then((freshUser) => {
        saveAuth(token, freshUser);
        setUser(freshUser);
      })
      .catch((error) => {
        if (error.response?.status === 403) logout();
      });
  }, [logout]);

  const value = useMemo(() => ({ user, login, logout }), [user, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
