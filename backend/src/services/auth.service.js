import bcrypt from 'bcrypt';
import AppError from '../utils/AppError.js';
import { ROLES, ACCOUNT_STATUS } from '../utils/constants.js';
import { signToken, verifyToken } from '../utils/token.js';
import { requirePassword } from '../utils/validation.js';
import { findUserByEmail, findUserById, createUser } from '../models/user.model.js';

// Giống giá trị trong scripts/hash-password.js
const SALT_ROUNDS = 10;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Số điện thoại Việt Nam: 10 chữ số, bắt đầu bằng 0
const PHONE_PATTERN = /^0\d{9}$/;

// Mã lỗi SQL Server khi vi phạm UNIQUE (hai người đăng ký cùng email cùng lúc)
const SQL_DUPLICATE_KEY_ERRORS = [2601, 2627];

const LOCKED_MESSAGE = 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ hotline để được hỗ trợ';

const toText = (value) => (typeof value === 'string' ? value.trim() : '');

// Bỏ mã băm mật khẩu trước khi trả về client
const toPublicUser = ({ mat_khau, ...user }) => user;

const validateRegisterInput = (body) => {
  const hoTen = toText(body.ho_ten);
  const email = toText(body.email).toLowerCase();
  const soDienThoai = toText(body.so_dien_thoai) || null;
  const diaChi = toText(body.dia_chi) || null;

  if (!hoTen) throw new AppError('Vui lòng nhập họ tên', 400);
  if (hoTen.length > 100) throw new AppError('Họ tên tối đa 100 ký tự', 400);
  if (!EMAIL_PATTERN.test(email) || email.length > 100) throw new AppError('Email không hợp lệ', 400);
  const matKhau = requirePassword(body.mat_khau);
  if (soDienThoai && !PHONE_PATTERN.test(soDienThoai)) {
    throw new AppError('Số điện thoại phải gồm 10 chữ số và bắt đầu bằng 0', 400);
  }
  if (diaChi && diaChi.length > 255) throw new AppError('Địa chỉ tối đa 255 ký tự', 400);

  return { hoTen, email, matKhau, soDienThoai, diaChi };
};

// Đăng ký luôn tạo tài khoản khách hàng; vai trò không lấy từ dữ liệu client gửi lên
export const register = async (body) => {
  const { hoTen, email, matKhau, soDienThoai, diaChi } = validateRegisterInput(body);

  if (await findUserByEmail(email)) {
    throw new AppError('Email đã được sử dụng', 409);
  }

  const matKhauBam = await bcrypt.hash(matKhau, SALT_ROUNDS);

  try {
    const userId = await createUser({
      hoTen,
      email,
      matKhauBam,
      soDienThoai,
      diaChi,
      vaiTro: ROLES.CUSTOMER,
    });
    return findUserById(userId);
  } catch (err) {
    if (SQL_DUPLICATE_KEY_ERRORS.includes(err.number)) {
      throw new AppError('Email đã được sử dụng', 409);
    }
    throw err;
  }
};

export const login = async (body) => {
  const email = toText(body.email).toLowerCase();
  const matKhau = typeof body.mat_khau === 'string' ? body.mat_khau : '';

  if (!email || !matKhau) {
    throw new AppError('Vui lòng nhập email và mật khẩu', 400);
  }

  const user = await findUserByEmail(email);
  // Cùng một thông báo cho "sai email" và "sai mật khẩu" để không lộ email nào đã đăng ký
  const isMatch = user ? await bcrypt.compare(matKhau, user.mat_khau) : false;
  if (!isMatch) {
    throw new AppError('Email hoặc mật khẩu không đúng', 401);
  }

  if (user.trang_thai_tai_khoan === ACCOUNT_STATUS.LOCKED) {
    throw new AppError(LOCKED_MESSAGE, 403);
  }

  const nguoiDung = toPublicUser(user);
  return { token: signToken(nguoiDung), nguoi_dung: nguoiDung };
};

// Dùng cho middleware authenticate: đọc lại người dùng từ CSDL ở mỗi request,
// nhờ vậy token cũ của tài khoản đã bị xóa hoặc bị khóa không dùng được nữa
export const getUserFromToken = async (token) => {
  const payload = verifyToken(token);
  if (!payload) {
    throw new AppError('Phiên đăng nhập không hợp lệ hoặc đã hết hạn, vui lòng đăng nhập lại', 401);
  }

  const user = await findUserById(payload.ma_nguoi_dung);
  if (!user) {
    throw new AppError('Tài khoản không còn tồn tại, vui lòng đăng nhập lại', 401);
  }
  if (user.trang_thai_tai_khoan === ACCOUNT_STATUS.LOCKED) {
    throw new AppError(LOCKED_MESSAGE, 403);
  }

  return user;
};
