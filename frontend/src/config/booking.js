import { faBuildingColumns, faMoneyBillWave } from '@fortawesome/free-solid-svg-icons';

// Giá trị khớp với backend (utils/constants.js)
export const BOOKING_STATUS_LABELS = {
  cho_xac_nhan: 'Chờ xác nhận',
  da_xac_nhan: 'Đã xác nhận',
  da_huy: 'Đã hủy',
  hoan_tat: 'Hoàn tất',
};

export const PAYMENT_STATUS_LABELS = {
  chua_thanh_toan: 'Chưa thanh toán',
  da_dat_coc: 'Đã đặt cọc',
  da_thanh_toan: 'Đã thanh toán',
};

// Icon giống cột Thanh toán ở Footer
export const PAYMENT_METHODS = [
  { value: 'Chuyển khoản', note: 'Nhân viên gửi số tài khoản khi gọi xác nhận đơn', icon: faBuildingColumns },
  { value: 'Tiền mặt', note: 'Thanh toán tại văn phòng công ty', icon: faMoneyBillWave },
];

// Bước 22 làm trang này
export const MY_BOOKINGS_PATH = '/don-cua-toi';

export const bookingPath = (tourId, departureId) =>
  departureId ? `/tour/${tourId}/dat-tour?lich=${departureId}` : `/tour/${tourId}/dat-tour`;
