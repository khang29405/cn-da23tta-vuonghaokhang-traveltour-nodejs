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

// Mã trên đường dẫn (:id) phải là số nguyên dương
export const parseId = (value) => {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw new AppError('Mã không hợp lệ', 400);
  return id;
};
