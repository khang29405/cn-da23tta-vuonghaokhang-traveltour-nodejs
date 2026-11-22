// Cùng quy tắc với backend (auth.service.js, utils/validation.js); backend vẫn kiểm tra lại
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_PATTERN = /^0\d{9}$/;
export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_BYTES = 72;
export const PASSWORD_HINT = `Từ ${MIN_PASSWORD_LENGTH} ký tự, có cả chữ cái và chữ số`;

// Đếm byte UTF-8 như backend vì bcrypt chỉ băm 72 byte đầu (chữ có dấu chiếm 2–3 byte)
export const getPasswordError = (password, label = 'Mật khẩu') => {
  if (!password) return `Vui lòng nhập ${label.toLowerCase()}`;
  if (password.length < MIN_PASSWORD_LENGTH) return `${label} phải có ít nhất ${MIN_PASSWORD_LENGTH} ký tự`;
  if (new TextEncoder().encode(password).length > MAX_PASSWORD_BYTES) {
    return `${label} tối đa ${MAX_PASSWORD_BYTES} ký tự`;
  }
  if (!/\p{L}/u.test(password) || !/\d/.test(password)) return `${label} phải có cả chữ cái và chữ số`;
  return '';
};
