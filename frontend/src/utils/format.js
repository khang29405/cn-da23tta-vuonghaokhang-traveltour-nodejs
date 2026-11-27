const numberFormatter = new Intl.NumberFormat('vi-VN');

export const formatNumber = (value) => numberFormatter.format(value);

export const formatPrice = (value) => `${numberFormatter.format(value)} đ`;

const dateFormatter = new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

export const formatDate = (value) => dateFormatter.format(new Date(value));

// Ngày không kèm giờ (YYYY-MM-DD) phải tách từng phần: new Date('2027-01-15') hiểu là 0 giờ UTC,
// ở múi giờ âm sẽ lùi sang ngày hôm trước
const parseDateOnly = (dateString) => {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const weekdayFormatter = new Intl.DateTimeFormat('vi-VN', { weekday: 'long' });

export const formatDateOnly = (dateString) => dateFormatter.format(parseDateOnly(dateString));

export const formatWeekday = (dateString) => weekdayFormatter.format(parseDateOnly(dateString));

// Cộng số ngày vào ngày dạng YYYY-MM-DD (ví dụ tính ngày về của tour)
export const addDays = (dateString, days) => {
  const date = parseDateOnly(dateString);
  date.setDate(date.getDate() + days);
  return toDateInputValue(date);
};

// Thứ viết tắt kiểu lịch Việt Nam: CN, T2 ... T7
export const formatWeekdayShort = (dateString) => {
  const day = parseDateOnly(dateString).getDay();
  return day === 0 ? 'CN' : `T${day + 1}`;
};

// 2026-11-26 → 26/11 (thẻ tour chỉ cần ngày và tháng)
export const formatDayMonth = (dateString) => {
  const [, month, day] = dateString.split('-');
  return `${day}/${month}`;
};

const pad = (number) => String(number).padStart(2, '0');

// Ngày theo giờ máy người dùng, dạng YYYY-MM-DD giống giá trị của input type="date"
export const toDateInputValue = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

// API trả ngày giờ dạng 2026-11-26T19:54:51 theo giờ máy chủ (không có múi giờ) → 26/11/2026 19:54
export const formatDateTime = (value) => {
  const [date, time = ''] = value.split('T');
  return `${formatDateOnly(date)} ${time.slice(0, 5)}`.trim();
};

export const formatDuration = (soNgay, soDem) => (soDem > 0 ? `${soNgay} ngày ${soDem} đêm` : `${soNgay} ngày`);
