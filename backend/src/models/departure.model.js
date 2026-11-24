import { sql, getPool } from '../config/db.js';
import { BOOKING_STATUS, DEPARTURE_STATUS } from '../utils/constants.js';

// Bảng LICH_KHOI_HANH (đọc thêm DON_DAT_TOUR để tính số chỗ đã đặt).
// Hàm ghi nhận `transaction` từ service khi cần; không truyền thì chạy thẳng trên pool.

const createRequest = async (transaction) => new sql.Request(transaction ?? (await getPool()));

// Lịch "còn chỗ" (khách xem và đặt được) = đang mở bán, còn ít nhất 1 chỗ, khởi hành sau hôm nay
// (giống điều kiện tạo lịch: ngày khởi hành phải sau hôm nay). Câu SQL dùng điều kiện này phải đặt alias bảng lịch là l.
export const BOOKABLE_DEPARTURE = 'l.trang_thai = @openStatus AND l.so_cho_con_lai > 0 AND l.ngay_khoi_hanh > @today';

export const bindBookableInputs = (request, today) =>
  request.input('openStatus', sql.VarChar(20), DEPARTURE_STATUS.OPEN).input('today', sql.Date, today);

// Các lịch còn chỗ của một tour cho trang chi tiết, ngày gần nhất trước
export const findBookableDeparturesByTour = async (tourId, today) => {
  const request = bindBookableInputs(await createRequest(), today);
  const result = await request.input('tourId', sql.Int, tourId).query(`
    SELECT l.ma_lich_khoi_hanh, CONVERT(CHAR(10), l.ngay_khoi_hanh, 23) AS ngay_khoi_hanh,
           l.tong_so_cho, l.so_cho_con_lai
    FROM LICH_KHOI_HANH l
    WHERE l.ma_tour = @tourId AND ${BOOKABLE_DEPARTURE}
    ORDER BY l.ngay_khoi_hanh, l.ma_lich_khoi_hanh`);
  return result.recordset;
};

// Ngày trả về dạng chuỗi YYYY-MM-DD (CONVERT kiểu 23) thay vì đối tượng Date để không lệch múi giờ.
// so_cho_da_dat: tổng khách của các đơn chưa hủy; so_don: số đơn (kể cả đơn đã hủy) để biết có xóa được không.
// lock = true: khóa dòng lịch đến hết transaction (UPDLOCK) để không ai đặt chỗ/sửa chen vào giữa lúc tính lại số chỗ.
const departureSelect = (where, lock = false) => `
  SELECT l.ma_lich_khoi_hanh, CONVERT(CHAR(10), l.ngay_khoi_hanh, 23) AS ngay_khoi_hanh,
         l.tong_so_cho, l.so_cho_con_lai, l.trang_thai, l.ma_tour,
         ISNULL(d.so_cho_da_dat, 0) AS so_cho_da_dat, ISNULL(d.so_don, 0) AS so_don
  FROM LICH_KHOI_HANH l ${lock ? 'WITH (UPDLOCK, HOLDLOCK)' : ''}
  OUTER APPLY (
    SELECT SUM(CASE WHEN dd.trang_thai_don <> @cancelled THEN dd.so_luong_khach ELSE 0 END) AS so_cho_da_dat,
           COUNT(*) AS so_don
    FROM DON_DAT_TOUR dd WHERE dd.ma_lich_khoi_hanh = l.ma_lich_khoi_hanh
  ) d
  ${where}`;

const withCancelled = (request) => request.input('cancelled', sql.VarChar(20), BOOKING_STATUS.CANCELLED);

// Lọc theo "sắp tới" (từ hôm nay trở đi) hoặc "đã qua" (trước hôm nay)
const VIEW_CONDITION = {
  upcoming: 'l.ngay_khoi_hanh >= @today',
  past: 'l.ngay_khoi_hanh < @today',
};
// Sắp tới: ngày gần nhất trước; đã qua: ngày mới qua trước
const VIEW_ORDER = { upcoming: 'ASC', past: 'DESC' };

// Số lịch sắp tới và đã qua của tour (để hiện trên nút chọn)
export const countDeparturesByView = async (tourId, today) => {
  const request = await createRequest();
  const result = await request.input('tourId', sql.Int, tourId).input('today', sql.Date, today).query(`
    SELECT ISNULL(SUM(CASE WHEN ngay_khoi_hanh >= @today THEN 1 ELSE 0 END), 0) AS upcoming,
           ISNULL(SUM(CASE WHEN ngay_khoi_hanh < @today THEN 1 ELSE 0 END), 0) AS past
    FROM LICH_KHOI_HANH WHERE ma_tour = @tourId`);
  return result.recordset[0];
};

// Các tháng có lịch (dạng YYYY-MM, CONVERT kiểu 23 lấy 7 ký tự đầu) kèm số lịch mỗi tháng
export const findDepartureMonths = async (tourId, view, today) => {
  const request = await createRequest();
  const result = await request.input('tourId', sql.Int, tourId).input('today', sql.Date, today).query(`
    SELECT CONVERT(CHAR(7), l.ngay_khoi_hanh, 23) AS month, COUNT(*) AS total
    FROM LICH_KHOI_HANH l
    WHERE l.ma_tour = @tourId AND ${VIEW_CONDITION[view]}
    GROUP BY CONVERT(CHAR(7), l.ngay_khoi_hanh, 23)
    ORDER BY month ${VIEW_ORDER[view]}`);
  return result.recordset;
};

// Lịch của một tháng trong chế độ xem đã chọn (view chỉ nhận 'upcoming'/'past' do service kiểm tra)
export const findDeparturesByTour = async (tourId, { view, month, today }) => {
  const request = withCancelled(await createRequest());
  const result = await request
    .input('tourId', sql.Int, tourId)
    .input('today', sql.Date, today)
    .input('month', sql.Char(7), month)
    .query(
      departureSelect(`
        WHERE l.ma_tour = @tourId AND ${VIEW_CONDITION[view]}
          AND CONVERT(CHAR(7), l.ngay_khoi_hanh, 23) = @month
        ORDER BY l.ngay_khoi_hanh ${VIEW_ORDER[view]}, l.ma_lich_khoi_hanh`),
    );
  return result.recordset;
};

export const findDepartureById = async (id, { transaction, lock = false } = {}) => {
  const request = withCancelled(await createRequest(transaction));
  const result = await request.input('id', sql.Int, id).query(departureSelect('WHERE l.ma_lich_khoi_hanh = @id', lock));
  return result.recordset[0] ?? null;
};

// Một tour không có hai lịch cùng ngày; excludeId để bỏ qua chính lịch đang sửa
export const existsDepartureOnDate = async (tourId, ngayKhoiHanh, excludeId = null) => {
  const request = await createRequest();
  const result = await request
    .input('tourId', sql.Int, tourId)
    .input('ngay', sql.Date, ngayKhoiHanh)
    .input('excludeId', sql.Int, excludeId)
    .query(`SELECT CASE WHEN EXISTS (
              SELECT 1 FROM LICH_KHOI_HANH
              WHERE ma_tour = @tourId AND ngay_khoi_hanh = @ngay
                AND (@excludeId IS NULL OR ma_lich_khoi_hanh <> @excludeId)
            ) THEN 1 ELSE 0 END AS co_lich`);
  return result.recordset[0].co_lich === 1;
};

export const insertDeparture = async ({ tourId, ngayKhoiHanh, tongSoCho, trangThai }) => {
  const request = await createRequest();
  const result = await request
    .input('tourId', sql.Int, tourId)
    .input('ngay', sql.Date, ngayKhoiHanh)
    .input('tongSoCho', sql.Int, tongSoCho)
    .input('trangThai', sql.VarChar(20), trangThai).query(`
      INSERT INTO LICH_KHOI_HANH (ngay_khoi_hanh, tong_so_cho, so_cho_con_lai, trang_thai, ma_tour)
      OUTPUT inserted.ma_lich_khoi_hanh
      VALUES (@ngay, @tongSoCho, @tongSoCho, @trangThai, @tourId)`);
  return result.recordset[0].ma_lich_khoi_hanh;
};

export const updateDeparture = async (id, { ngayKhoiHanh, tongSoCho, soChoConLai, trangThai }, transaction) => {
  const request = await createRequest(transaction);
  await request
    .input('id', sql.Int, id)
    .input('ngay', sql.Date, ngayKhoiHanh)
    .input('tongSoCho', sql.Int, tongSoCho)
    .input('conLai', sql.Int, soChoConLai)
    .input('trangThai', sql.VarChar(20), trangThai).query(`
      UPDATE LICH_KHOI_HANH
      SET ngay_khoi_hanh = @ngay, tong_so_cho = @tongSoCho, so_cho_con_lai = @conLai, trang_thai = @trangThai
      WHERE ma_lich_khoi_hanh = @id`);
};

export const deleteDeparture = async (id) => {
  const request = await createRequest();
  await request.input('id', sql.Int, id).query('DELETE FROM LICH_KHOI_HANH WHERE ma_lich_khoi_hanh = @id');
};
