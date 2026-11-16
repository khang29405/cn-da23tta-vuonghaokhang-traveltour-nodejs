import AppError from '../utils/AppError.js';
import { getUserFromToken } from '../services/auth.service.js';

// Bắt buộc đăng nhập: đọc header "Authorization: Bearer <token>", gán người dùng vào req.user
// Express 5 tự chuyển lỗi của hàm async sang errorHandler nên không cần try/catch
export const authenticate = async (req, res, next) => {
  const [scheme, token] = (req.headers.authorization ?? '').split(' ');
  if (scheme !== 'Bearer' || !token) {
    throw new AppError('Bạn chưa đăng nhập', 401);
  }

  req.user = await getUserFromToken(token);
  next();
};

// Chỉ cho các vai trò được liệt kê, ví dụ: authorize(ROLES.STAFF, ROLES.ADMIN)
// Phải đặt SAU authenticate. Quản trị viên chỉ có quyền nhân viên khi được liệt kê rõ ở route.
export const authorize =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user?.vai_tro)) {
      throw new AppError('Bạn không có quyền thực hiện thao tác này', 403);
    }
    next();
  };
