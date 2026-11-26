import { sql, getPool } from '../config/db.js';
import { DEPARTURE_STATUS } from '../utils/constants.js';

const createRequest = async (transaction) => new sql.Request(transaction ?? (await getPool()));

// UPDLOCK giữ dòng lịch tới hết transaction: hai người cùng đặt chỗ cuối thì người sau phải chờ và đọc số chỗ mới
export const findDepartureForBooking = async (id, transaction) => {
  const request = await createRequest(transaction);
  const result = await request.input('id', sql.Int, id).query(`
    SELECT l.ma_lich_khoi_hanh, CONVERT(CHAR(10), l.ngay_khoi_hanh, 23) AS ngay_khoi_hanh,
           l.so_cho_con_lai, l.trang_thai, t.gia, t.trang_thai_hien_thi
    FROM LICH_KHOI_HANH l WITH (UPDLOCK, ROWLOCK)
    JOIN TOUR t ON t.ma_tour = l.ma_tour
    WHERE l.ma_lich_khoi_hanh = @id`);
  return result.recordset[0] ?? null;
};

export const insertBooking = async (booking, transaction) => {
  const request = await createRequest(transaction);
  const result = await request
    .input('soKhach', sql.Int, booking.soLuongKhach)
    .input('donGia', sql.Decimal(12, 0), booking.donGia)
    .input('tongTien', sql.Decimal(12, 0), booking.tongTien)
    .input('hoTen', sql.NVarChar(100), booking.hoTenLienHe)
    .input('soDienThoai', sql.VarChar(15), booking.soDienThoaiLienHe)
    .input('ghiChu', sql.NVarChar(500), booking.ghiChu)
    .input('phuongThuc', sql.NVarChar(50), booking.phuongThuc)
    .input('lichId', sql.Int, booking.maLichKhoiHanh)
    .input('khachId', sql.Int, booking.maKhachHang).query(`
      INSERT INTO DON_DAT_TOUR (so_luong_khach, don_gia, tong_tien, ho_ten_lien_he, so_dien_thoai_lien_he,
                                ghi_chu, phuong_thuc_thanh_toan, ma_lich_khoi_hanh, ma_khach_hang)
      OUTPUT inserted.ma_don
      VALUES (@soKhach, @donGia, @tongTien, @hoTen, @soDienThoai, @ghiChu, @phuongThuc, @lichId, @khachId)`);
  return result.recordset[0].ma_don;
};

// Điều kiện so_cho_con_lai >= @soKhach là chốt chặn cuối: nếu lỡ thiếu khóa dòng thì cũng không trừ ra số âm
export const takeSeats = async (departureId, soKhach, transaction) => {
  const request = await createRequest(transaction);
  const result = await request
    .input('id', sql.Int, departureId)
    .input('soKhach', sql.Int, soKhach)
    .input('full', sql.VarChar(20), DEPARTURE_STATUS.FULL).query(`
      UPDATE LICH_KHOI_HANH
      SET so_cho_con_lai = so_cho_con_lai - @soKhach,
          trang_thai = CASE WHEN so_cho_con_lai = @soKhach THEN @full ELSE trang_thai END
      WHERE ma_lich_khoi_hanh = @id AND so_cho_con_lai >= @soKhach`);
  return result.rowsAffected[0] === 1;
};

// Ngày giờ trả về dạng chuỗi giờ máy chủ (CONVERT kiểu 126) để giao diện không bị lệch múi giờ
const BOOKING_SELECT = `
  SELECT d.ma_don, CONVERT(CHAR(19), d.ngay_dat, 126) AS ngay_dat, d.so_luong_khach, d.don_gia, d.tong_tien,
         d.trang_thai_don, d.ma_lich_khoi_hanh, CONVERT(CHAR(10), l.ngay_khoi_hanh, 23) AS ngay_khoi_hanh,
         t.ma_tour, t.ten_tour, t.so_ngay, t.so_dem,
         (SELECT TOP 1 a.duong_dan_anh FROM ANH_TOUR a
          WHERE a.ma_tour = t.ma_tour
          ORDER BY a.la_anh_dai_dien DESC, a.thu_tu_hien_thi, a.ma_anh) AS anh_dai_dien,
         d.trang_thai_thanh_toan`;

const BOOKING_FROM = `
  FROM DON_DAT_TOUR d
  JOIN LICH_KHOI_HANH l ON l.ma_lich_khoi_hanh = d.ma_lich_khoi_hanh
  JOIN TOUR t ON t.ma_tour = l.ma_tour`;

export const countBookingsByCustomer = async (customerId) => {
  const request = await createRequest();
  const result = await request
    .input('khachId', sql.Int, customerId)
    .query('SELECT COUNT(*) AS total FROM DON_DAT_TOUR WHERE ma_khach_hang = @khachId');
  return result.recordset[0].total;
};

export const findBookingsByCustomer = async (customerId, { offset, limit }) => {
  const request = await createRequest();
  const result = await request
    .input('khachId', sql.Int, customerId)
    .input('offset', sql.Int, offset)
    .input('limit', sql.Int, limit).query(`
      ${BOOKING_SELECT}
      ${BOOKING_FROM}
      WHERE d.ma_khach_hang = @khachId
      ORDER BY d.ngay_dat DESC, d.ma_don DESC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`);
  return result.recordset;
};

// Lọc luôn theo khách nên đơn của người khác trả về null giống đơn không tồn tại
export const findCustomerBookingById = async (id, customerId) => {
  const request = await createRequest();
  const result = await request.input('id', sql.Int, id).input('khachId', sql.Int, customerId).query(`
    ${BOOKING_SELECT},
           d.phuong_thuc_thanh_toan, d.ho_ten_lien_he, d.so_dien_thoai_lien_he, d.ghi_chu,
           CONVERT(CHAR(19), d.ngay_huy, 126) AS ngay_huy,
           dkh.ten_diem_khoi_hanh, dd.ten_diem_den, pt.ten_phuong_tien
    ${BOOKING_FROM}
    JOIN DIEM_KHOI_HANH dkh ON dkh.ma_diem_khoi_hanh = t.ma_diem_khoi_hanh
    JOIN DIEM_DEN dd        ON dd.ma_diem_den = t.ma_diem_den
    JOIN PHUONG_TIEN pt     ON pt.ma_phuong_tien = t.ma_phuong_tien
    WHERE d.ma_don = @id AND d.ma_khach_hang = @khachId`);
  return result.recordset[0] ?? null;
};

export const findPaymentsByBooking = async (bookingId) => {
  const request = await createRequest();
  const result = await request.input('maDon', sql.Int, bookingId).query(`
    SELECT ma_thanh_toan, phuong_thuc, so_tien, CONVERT(CHAR(19), ngay_ghi_nhan, 126) AS ngay_ghi_nhan
    FROM THANH_TOAN WHERE ma_don = @maDon
    ORDER BY ngay_ghi_nhan, ma_thanh_toan`);
  return result.recordset;
};
