import * as authService from '../services/auth.service.js';
import { sendSuccess } from '../utils/response.js';

// POST /api/auth/register
export const register = async (req, res) => {
  const nguoiDung = await authService.register(req.body ?? {});
  sendSuccess(res, nguoiDung, 'Đăng ký thành công, mời bạn đăng nhập', 201);
};

// POST /api/auth/login
export const login = async (req, res) => {
  const result = await authService.login(req.body ?? {});
  sendSuccess(res, result, 'Đăng nhập thành công');
};

// GET /api/auth/me: req.user đã được middleware authenticate đọc từ CSDL
export const getMe = (req, res) => sendSuccess(res, req.user, 'Thông tin tài khoản');

// GET /api/auth/check-admin: chỉ để kiểm thử authorize
export const checkAdmin = (req, res) =>
  sendSuccess(res, { vai_tro: req.user.vai_tro }, 'Bạn có quyền quản trị');
