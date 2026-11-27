import { faBuildingColumns, faMoneyBillWave } from '@fortawesome/free-solid-svg-icons';

// Giá trị khớp với backend (utils/constants.js); badge là lớp màu status-badge--... trong global.css
export const BOOKING_STATUS = {
  cho_xac_nhan: { label: 'Chờ xác nhận', badge: 'warning' },
  da_xac_nhan: { label: 'Đã xác nhận', badge: 'info' },
  hoan_tat: { label: 'Hoàn tất', badge: 'visible' },
  da_huy: { label: 'Đã hủy', badge: 'hidden' },
};

export const PAYMENT_STATUS = {
  chua_thanh_toan: { label: 'Chưa thanh toán', badge: 'hidden' },
  da_dat_coc: { label: 'Đã đặt cọc', badge: 'info' },
  da_thanh_toan: { label: 'Đã thanh toán', badge: 'visible' },
};

// Icon giống cột Thanh toán ở Footer
export const PAYMENT_METHODS = [
  { value: 'Chuyển khoản', note: 'Nhân viên gửi số tài khoản khi gọi xác nhận đơn', icon: faBuildingColumns },
  { value: 'Tiền mặt', note: 'Thanh toán tại văn phòng công ty', icon: faMoneyBillWave },
];

export const MY_BOOKINGS_PATH = '/don-cua-toi';

export const myBookingPath = (bookingId) => `${MY_BOOKINGS_PATH}/${bookingId}`;

export const bookingPath = (tourId, departureId) =>
  departureId ? `/tour/${tourId}/dat-tour?lich=${departureId}` : `/tour/${tourId}/dat-tour`;
