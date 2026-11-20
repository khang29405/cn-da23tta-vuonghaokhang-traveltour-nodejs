// Ngày được so sánh dưới dạng chuỗi YYYY-MM-DD theo giờ của máy chủ (giờ Việt Nam),
// cùng dạng với cột DATE trả về từ CSDL nên so sánh chuỗi là đủ.

const pad = (number) => String(number).padStart(2, '0');

export const toDateString = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export const getToday = () => toDateString(new Date());

// 2027-01-10 → 10/01/2027 (dùng trong thông báo lỗi)
export const formatDate = (dateString) => dateString.split('-').reverse().join('/');
