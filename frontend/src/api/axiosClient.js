import axios from 'axios';
import { getToken, clearAuth } from '../utils/authStorage.js';

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

let handleUnauthorized = null;

// AuthContext đăng ký hàm này để xóa người dùng khỏi state khi token không còn hợp lệ
export const setUnauthorizedHandler = (handler) => {
  handleUnauthorized = handler;
};

axiosClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Chỉ đăng xuất khi request có gửi token; 401 do nhập sai mật khẩu lúc đăng nhập thì không
    if (error.response?.status === 401 && error.config?.headers?.Authorization) {
      clearAuth();
      handleUnauthorized?.();
    }
    return Promise.reject(error);
  },
);

export const getErrorMessage = (error) =>
  error.response?.data?.message ?? 'Không kết nối được máy chủ, vui lòng thử lại sau';

export default axiosClient;
