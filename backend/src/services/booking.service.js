import AppError from '../utils/AppError.js';
import * as bookingModel from '../models/booking.model.js';
import { runInTransaction } from '../utils/transaction.js';
import { getToday, formatDate } from '../utils/date.js';
import { parsePagination, buildPagination, toPaginatedData } from '../utils/pagination.js';
import { requireId, requireInteger, requireText, optionalText, requirePhone } from '../utils/validation.js';
import { BOOKING_STATUS, DEPARTURE_STATUS, PAYMENT_METHODS } from '../utils/constants.js';

// Cột tiền là DECIMAL(12, 0)
const MAX_AMOUNT = 999_999_999_999;
const BOOKING_NOT_FOUND = 'Không tìm thấy đơn đặt tour';

const parsePaymentMethod = (value) => {
  if (value === undefined || value === null || value === '') throw new AppError('Vui lòng chọn phương thức thanh toán', 400);
  if (!PAYMENT_METHODS.includes(value)) {
    throw new AppError(`Phương thức thanh toán chỉ nhận: ${PAYMENT_METHODS.join(', ')}`, 400);
  }
  return value;
};

const validateBooking = (body) => ({
  maLichKhoiHanh: requireId(body.ma_lich_khoi_hanh, 'lịch khởi hành'),
  soLuongKhach: requireInteger(body.so_luong_khach, 'số lượng khách', { min: 1 }),
  hoTenLienHe: requireText(body.ho_ten_lien_he, 'họ tên người liên hệ', 100),
  soDienThoaiLienHe: requirePhone(body.so_dien_thoai_lien_he, 'số điện thoại liên hệ'),
  ghiChu: optionalText(body.ghi_chu, 'ghi chú', 500),
  phuongThuc: parsePaymentMethod(body.phuong_thuc),
});

// Lịch của tour đang ẩn coi như không tồn tại, giống trang chi tiết tour không cho khách thấy tour ẩn
const ensureBookable = (departure, soLuongKhach) => {
  if (!departure || !departure.trang_thai_hien_thi) throw new AppError('Không tìm thấy lịch khởi hành', 404);

  const ngay = formatDate(departure.ngay_khoi_hanh);
  if (departure.trang_thai === DEPARTURE_STATUS.CANCELLED) {
    throw new AppError(`Lịch khởi hành ngày ${ngay} đã bị hủy, vui lòng chọn ngày khác`, 409);
  }
  // Chỉ nhận đặt trước ngày khởi hành, cùng điều kiện với danh sách lịch còn chỗ khách nhìn thấy
  if (departure.trang_thai === DEPARTURE_STATUS.DEPARTED || departure.ngay_khoi_hanh <= getToday()) {
    throw new AppError(`Lịch khởi hành ngày ${ngay} đã hết hạn đặt chỗ, vui lòng chọn ngày khác`, 409);
  }
  if (departure.so_cho_con_lai === 0) {
    throw new AppError(`Lịch khởi hành ngày ${ngay} đã hết chỗ, vui lòng chọn ngày khác`, 409);
  }
  if (soLuongKhach > departure.so_cho_con_lai) {
    throw new AppError(`Lịch khởi hành ngày ${ngay} chỉ còn ${departure.so_cho_con_lai} chỗ`, 409);
  }
};

// Đặt tour = tạm giữ chỗ: trừ chỗ ngay để người khác không đặt trùng, đơn chờ nhân viên xác nhận.
// Chưa tạo phiếu thu vì khách chưa trả tiền; giá lưu vào đơn nên tour đổi giá sau này không ảnh hưởng.
export const createBooking = async (customerId, body) => {
  const booking = validateBooking(body);

  const bookingId = await runInTransaction(async (transaction) => {
    const departure = await bookingModel.findDepartureForBooking(booking.maLichKhoiHanh, transaction);
    ensureBookable(departure, booking.soLuongKhach);

    const tongTien = departure.gia * booking.soLuongKhach;
    if (tongTien > MAX_AMOUNT) throw new AppError('Tổng tiền vượt quá giới hạn, vui lòng giảm số lượng khách', 400);

    const id = await bookingModel.insertBooking(
      { ...booking, maKhachHang: customerId, donGia: departure.gia, tongTien },
      transaction,
    );
    if (!(await bookingModel.takeSeats(booking.maLichKhoiHanh, booking.soLuongKhach, transaction))) {
      throw new AppError('Lịch khởi hành không còn đủ chỗ, vui lòng thử lại', 409);
    }
    return id;
  });

  return getMyBookingDetail(customerId, bookingId);
};

// ?status= lọc theo trạng thái đơn, giá trị sai thì bỏ qua như các bộ lọc khác.
// counts luôn tính trên mọi đơn của khách để các tab hiện đủ số lượng dù đang lọc.
export const getMyBookings = async (customerId, query) => {
  const status = Object.values(BOOKING_STATUS).includes(query.status) ? query.status : null;
  const [total, statusRows] = await Promise.all([
    bookingModel.countBookingsByCustomer(customerId, status),
    bookingModel.countBookingsByStatus(customerId),
  ]);
  const pagination = buildPagination(parsePagination(query), total);
  const bookings = await bookingModel.findBookingsByCustomer(customerId, status, pagination);

  const counts = Object.fromEntries(Object.values(BOOKING_STATUS).map((value) => [value, 0]));
  for (const row of statusRows) counts[row.trang_thai_don] = row.total;
  counts.all = statusRows.reduce((sum, row) => sum + row.total, 0);

  return { ...toPaginatedData(bookings, pagination), filter: { status }, counts };
};

// Đơn của người khác trả 404 như đơn không tồn tại để không lộ mã đơn nào đang có
export const getMyBookingDetail = async (customerId, id) => {
  const booking = await bookingModel.findCustomerBookingById(id, customerId);
  if (!booking) throw new AppError(BOOKING_NOT_FOUND, 404);
  return { ...booking, thanh_toan: await bookingModel.findPaymentsByBooking(id) };
};
