import AppError from './AppError.js';

// Các hàm kiểm tra dữ liệu gửi lên dùng chung cho nhiều service.
// Hàm nào gặp dữ liệu sai thì ném AppError 400 với thông báo tiếng Việt.

const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);

const toText = (value) => (typeof value === 'string' ? value.trim() : '');

export const requireText = (value, label, maxLength) => {
  const text = toText(value);
  if (!text) throw new AppError(`Vui lòng nhập ${label}`, 400);
  if (text.length > maxLength) throw new AppError(`${capitalize(label)} tối đa ${maxLength} ký tự`, 400);
  return text;
};

export const optionalText = (value, label, maxLength) => {
  const text = toText(value);
  if (text.length > maxLength) throw new AppError(`${capitalize(label)} tối đa ${maxLength} ký tự`, 400);
  return text || null;
};

// Nhận số nguyên dạng number (3) hoặc chuỗi chữ số ("3", form HTML gửi lên thường là chuỗi)
const toInteger = (value) => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && /^-?\d+$/.test(value.trim())) return Number(value);
  return Number.NaN;
};

export const requireInteger = (value, label, { min, max } = {}) => {
  if (value === undefined || value === null || value === '') throw new AppError(`Vui lòng nhập ${label}`, 400);
  const number = toInteger(value);
  if (!Number.isSafeInteger(number)) throw new AppError(`${capitalize(label)} phải là số nguyên`, 400);
  if (min !== undefined && number < min) throw new AppError(`${capitalize(label)} phải từ ${min} trở lên`, 400);
  if (max !== undefined && number > max) throw new AppError(`${capitalize(label)} tối đa ${max}`, 400);
  return number;
};

// Mã khóa ngoại (ma_loai_tour, ma_diem_den...) phải là số nguyên dương
export const requireId = (value, label) => {
  const id = toInteger(value);
  if (value === undefined || value === null || value === '') throw new AppError(`Vui lòng chọn ${label}`, 400);
  if (!Number.isSafeInteger(id) || id <= 0) throw new AppError(`${capitalize(label)} không hợp lệ`, 400);
  return id;
};

// Nhận true/false hoặc 1/0 (cột BIT); không gửi thì dùng giá trị mặc định
export const optionalBoolean = (value, label, defaultValue) => {
  if (value === undefined || value === null) return defaultValue;
  if (value === true || value === 1) return true;
  if (value === false || value === 0) return false;
  throw new AppError(`${capitalize(label)} chỉ nhận true/false`, 400);
};

// Ngày dạng YYYY-MM-DD (input type="date" của HTML gửi đúng dạng này) và phải là ngày có thật
export const requireDate = (value, label) => {
  if (value === undefined || value === null || value === '') throw new AppError(`Vui lòng chọn ${label}`, 400);
  const match = typeof value === 'string' ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim()) : null;
  if (!match) throw new AppError(`${capitalize(label)} phải có dạng YYYY-MM-DD`, 400);
  const [, year, month, day] = match.map(Number);
  // new Date tự "trôi" ngày sai (31/02 thành 03/03) nên so lại từng phần để bắt ngày không có thật
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    throw new AppError(`${capitalize(label)} không hợp lệ`, 400);
  }
  return value.trim();
};

// Số điện thoại Việt Nam: 10 chữ số, bắt đầu bằng 0
export const requirePhone = (value, label) => {
  const phone = toText(value);
  if (!phone) throw new AppError(`Vui lòng nhập ${label}`, 400);
  if (!/^0\d{9}$/.test(phone)) throw new AppError(`${capitalize(label)} phải gồm 10 chữ số và bắt đầu bằng 0`, 400);
  return phone;
};

export const MIN_PASSWORD_LENGTH = 8;
// bcrypt chỉ băm 72 byte đầu, phần sau bị bỏ qua nên phải chặn độ dài.
// Đếm theo byte UTF-8: chữ có dấu chiếm 2–3 byte nên mật khẩu có dấu được ít ký tự hơn.
export const MAX_PASSWORD_BYTES = 72;

// Mật khẩu mới (đăng ký, tạo nhân viên, đổi mật khẩu): 8–72 ký tự, có cả chữ cái và chữ số.
// Đăng nhập không dùng hàm này để tài khoản cũ vẫn đăng nhập được.
export const requirePassword = (value, label = 'mật khẩu') => {
  const password = typeof value === 'string' ? value : '';
  if (!password) throw new AppError(`Vui lòng nhập ${label}`, 400);
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new AppError(`${capitalize(label)} phải có ít nhất ${MIN_PASSWORD_LENGTH} ký tự`, 400);
  }
  if (Buffer.byteLength(password, 'utf8') > MAX_PASSWORD_BYTES) {
    throw new AppError(`${capitalize(label)} tối đa ${MAX_PASSWORD_BYTES} ký tự`, 400);
  }
  if (!/\p{L}/u.test(password) || !/\d/.test(password)) {
    throw new AppError(`${capitalize(label)} phải có cả chữ cái và chữ số`, 400);
  }
  return password;
};

// Mã trên đường dẫn (:id) phải là số nguyên dương
export const parseId = (value) => {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw new AppError('Mã không hợp lệ', 400);
  return id;
};
