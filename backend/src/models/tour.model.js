import { sql, getPool } from '../config/db.js';
import { BOOKABLE_DEPARTURE, bindBookableInputs } from './departure.model.js';

// Bảng TOUR, LICH_TRINH (và đọc ANH_TOUR, LICH_KHOI_HANH khi cần).
// Hàm ghi nhận `transaction` từ service để nhiều câu lệnh cùng thành công hoặc cùng hủy;
// không truyền thì chạy thẳng trên pool.

const createRequest = async (transaction) => new sql.Request(transaction ?? (await getPool()));

// Thông tin tour kèm tên danh mục, dùng chung cho danh sách và chi tiết
const TOUR_SELECT = `
  SELECT t.ma_tour, t.ten_tour, t.so_ngay, t.so_dem, t.gia, t.trang_thai_hien_thi, t.ngay_tao,
         t.ma_loai_tour, lt.ten_loai_tour,
         t.ma_diem_den, dd.ten_diem_den,
         t.ma_diem_khoi_hanh, dkh.ten_diem_khoi_hanh,
         t.ma_phuong_tien, pt.ten_phuong_tien`;

const TOUR_JOINS = `
  FROM TOUR t
  JOIN LOAI_TOUR lt       ON lt.ma_loai_tour = t.ma_loai_tour
  JOIN DIEM_DEN dd        ON dd.ma_diem_den = t.ma_diem_den
  JOIN DIEM_KHOI_HANH dkh ON dkh.ma_diem_khoi_hanh = t.ma_diem_khoi_hanh
  JOIN PHUONG_TIEN pt     ON pt.ma_phuong_tien = t.ma_phuong_tien`;

/* ---------- Đọc ---------- */

// Ghép điều kiện lọc tour, dùng chung cho danh sách của quản trị và danh sách công khai;
// chỉ thêm điều kiện của bộ lọc có giá trị (bộ lọc không truyền thì bỏ qua).
// Mọi giá trị đều đi qua tham số, chuỗi SQL chỉ ghép các đoạn cố định.
// keyword là mẫu LIKE đã thoát ký tự đặc biệt; tên tour so khớp không phân biệt hoa thường và dấu
// (Latin1_General_CI_AI; Vietnamese_CI_AI vẫn coi "Đ" khác "D") để gõ "da lat" vẫn ra "Đà Lạt".
// tourCode có khi từ khóa là một con số (chỉ quản trị tìm theo mã tour).
const buildTourConditions = (request, filters) => {
  const { keyword, tourCode, tourType, destination, departurePoint, transport, minPrice, maxPrice, visible } = filters;
  const conditions = [];
  if (keyword) {
    request.input('keyword', sql.NVarChar(210), keyword);
    if (tourCode) {
      request.input('tourCode', sql.Int, tourCode);
      conditions.push("(t.ten_tour COLLATE Latin1_General_CI_AI LIKE @keyword ESCAPE '\\' OR t.ma_tour = @tourCode)");
    } else {
      conditions.push("t.ten_tour COLLATE Latin1_General_CI_AI LIKE @keyword ESCAPE '\\'");
    }
  }
  if (tourType) {
    request.input('tourType', sql.Int, tourType);
    conditions.push('t.ma_loai_tour = @tourType');
  }
  if (destination) {
    request.input('destination', sql.Int, destination);
    conditions.push('t.ma_diem_den = @destination');
  }
  if (departurePoint) {
    request.input('departurePoint', sql.Int, departurePoint);
    conditions.push('t.ma_diem_khoi_hanh = @departurePoint');
  }
  if (transport) {
    request.input('transport', sql.Int, transport);
    conditions.push('t.ma_phuong_tien = @transport');
  }
  if (minPrice !== null && minPrice !== undefined) {
    request.input('minPrice', sql.Decimal(12, 0), minPrice);
    conditions.push('t.gia >= @minPrice');
  }
  if (maxPrice !== null && maxPrice !== undefined) {
    request.input('maxPrice', sql.Decimal(12, 0), maxPrice);
    conditions.push('t.gia <= @maxPrice');
  }
  if (visible !== null && visible !== undefined) {
    request.input('visible', sql.Bit, visible);
    conditions.push('t.trang_thai_hien_thi = @visible');
  }
  return conditions;
};

const toWhere = (conditions) => (conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '');

const applyTourFilters = (request, filters) => toWhere(buildTourConditions(request, filters));

export const countTours = async (filters) => {
  const request = await createRequest();
  const where = applyTourFilters(request, filters);
  const result = await request.query(`SELECT COUNT(*) AS total FROM TOUR t ${where}`);
  return result.recordset[0].total;
};

// Gồm cả tour đang ẩn; tour mới thêm đứng đầu. anh_dai_dien là đường dẫn ảnh đại diện (NULL khi tour chưa có ảnh)
export const findTours = async (filters, { offset, limit }) => {
  const request = await createRequest();
  const where = applyTourFilters(request, filters);
  const result = await request
    .input('offset', sql.Int, offset)
    .input('limit', sql.Int, limit)
    .query(`${TOUR_SELECT},
        (SELECT TOP 1 a.duong_dan_anh FROM ANH_TOUR a
         WHERE a.ma_tour = t.ma_tour
         ORDER BY a.la_anh_dai_dien DESC, a.thu_tu_hien_thi, a.ma_anh) AS anh_dai_dien
      ${TOUR_JOINS}
      ${where}
      ORDER BY t.ngay_tao DESC, t.ma_tour DESC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`);
  return result.recordset;
};

export const findTourById = async (id) => {
  const request = await createRequest();
  const result = await request
    .input('id', sql.Int, id)
    .query(`${TOUR_SELECT}, t.mo_ta_tong_quan ${TOUR_JOINS} WHERE t.ma_tour = @id`);
  return result.recordset[0] ?? null;
};

export const findItineraryByTourId = async (tourId) => {
  const request = await createRequest();
  const result = await request.input('tourId', sql.Int, tourId).query(
    `SELECT ma_lich_trinh, ngay_thu, tieu_de, noi_dung_hoat_dong
     FROM LICH_TRINH WHERE ma_tour = @tourId ORDER BY ngay_thu`,
  );
  return result.recordset;
};

export const findImagesByTourId = async (tourId) => {
  const request = await createRequest();
  const result = await request.input('tourId', sql.Int, tourId).query(
    `SELECT ma_anh, duong_dan_anh, la_anh_dai_dien, thu_tu_hien_thi
     FROM ANH_TOUR WHERE ma_tour = @tourId ORDER BY la_anh_dai_dien DESC, thu_tu_hien_thi, ma_anh`,
  );
  return result.recordset;
};

// Kiểm tra 4 mã danh mục có tồn tại không (1 = có, 0 = không) trong một lần truy vấn
export const checkCategoryReferences = async ({ maLoaiTour, maDiemDen, maDiemKhoiHanh, maPhuongTien }) => {
  const request = await createRequest();
  const result = await request
    .input('maLoaiTour', sql.Int, maLoaiTour)
    .input('maDiemDen', sql.Int, maDiemDen)
    .input('maDiemKhoiHanh', sql.Int, maDiemKhoiHanh)
    .input('maPhuongTien', sql.Int, maPhuongTien).query(`
      SELECT
        CASE WHEN EXISTS (SELECT 1 FROM LOAI_TOUR WHERE ma_loai_tour = @maLoaiTour) THEN 1 ELSE 0 END AS co_loai_tour,
        CASE WHEN EXISTS (SELECT 1 FROM DIEM_DEN WHERE ma_diem_den = @maDiemDen) THEN 1 ELSE 0 END AS co_diem_den,
        CASE WHEN EXISTS (SELECT 1 FROM DIEM_KHOI_HANH WHERE ma_diem_khoi_hanh = @maDiemKhoiHanh)
          THEN 1 ELSE 0 END AS co_diem_khoi_hanh,
        CASE WHEN EXISTS (SELECT 1 FROM PHUONG_TIEN WHERE ma_phuong_tien = @maPhuongTien)
          THEN 1 ELSE 0 END AS co_phuong_tien`);
  return result.recordset[0];
};

export const countDeparturesByTour = async (tourId) => {
  const request = await createRequest();
  const result = await request
    .input('tourId', sql.Int, tourId)
    .query('SELECT COUNT(*) AS so_lich FROM LICH_KHOI_HANH WHERE ma_tour = @tourId');
  return result.recordset[0].so_lich;
};

/* ---------- Đọc cho khách (công khai) ---------- */

// Dữ liệu thẻ tour dùng chung cho /api/tours/home và /api/tours (cùng định dạng).
// Các cột "gần nhất" lấy từ lịch còn chỗ gần nhất (OUTER APPLY nên tour chưa có lịch còn chỗ vẫn có mặt, các cột này là NULL).
const TOUR_CARD_COLUMNS = `
  t.ma_tour, t.ten_tour, t.so_ngay, t.so_dem, t.gia,
  t.ma_loai_tour, lt.ten_loai_tour,
  t.ma_diem_den, dd.ten_diem_den,
  t.ma_diem_khoi_hanh, dkh.ten_diem_khoi_hanh,
  t.ma_phuong_tien, pt.ten_phuong_tien,
  (SELECT TOP 1 a.duong_dan_anh FROM ANH_TOUR a
   WHERE a.ma_tour = t.ma_tour
   ORDER BY a.la_anh_dai_dien DESC, a.thu_tu_hien_thi, a.ma_anh) AS anh_dai_dien,
  gn.ma_lich_khoi_hanh AS ma_lich_gan_nhat,
  CONVERT(CHAR(10), gn.ngay_khoi_hanh, 23) AS ngay_khoi_hanh_gan_nhat,
  gn.so_cho_con_lai AS so_cho_con_lai_gan_nhat`;

// departureCondition: điều kiện chọn lịch (bí danh l) để lấy lịch gần nhất
const tourCardFrom = (departureCondition) => `
  ${TOUR_JOINS}
  OUTER APPLY (
    SELECT TOP 1 l.ma_lich_khoi_hanh, l.ngay_khoi_hanh, l.so_cho_con_lai
    FROM LICH_KHOI_HANH l
    WHERE l.ma_tour = t.ma_tour AND ${departureCondition}
    ORDER BY l.ngay_khoi_hanh, l.ma_lich_khoi_hanh
  ) gn`;

const TOUR_CARD_FROM = `${tourCardFrom(BOOKABLE_DEPARTURE)}
  WHERE t.trang_thai_hien_thi = 1`;

// Lịch còn chỗ từ ngày khách chọn trở đi (bộ lọc departureFrom); ngày đã qua vẫn bị BOOKABLE_DEPARTURE loại
const BOOKABLE_FROM_DATE = `${BOOKABLE_DEPARTURE} AND l.ngay_khoi_hanh >= @departureFrom`;

// Thứ tự mặc định cho khách: tour có lịch còn chỗ lên trước (ngày gần nhất trước), sau đó tour mới thêm
const NEAREST_FIRST = `CASE WHEN gn.ngay_khoi_hanh IS NULL THEN 1 ELSE 0 END, gn.ngay_khoi_hanh,
  t.ngay_tao DESC, t.ma_tour DESC`;

const createCardRequest = async (today) => bindBookableInputs(await createRequest(), today);

// Dải "Sắp khởi hành": chỉ tour có lịch còn chỗ
export const findUpcomingTourCards = async (today, limit) => {
  const request = await createCardRequest(today);
  const result = await request.input('limit', sql.Int, limit).query(`
    SELECT TOP (@limit) ${TOUR_CARD_COLUMNS} ${TOUR_CARD_FROM}
      AND gn.ma_lich_khoi_hanh IS NOT NULL
    ORDER BY gn.ngay_khoi_hanh, t.ma_tour`);
  return result.recordset;
};

// Dải "Tour mới": tour mới thêm trước, kể cả tour chưa có lịch còn chỗ
export const findNewestTourCards = async (today, limit) => {
  const request = await createCardRequest(today);
  const result = await request.input('limit', sql.Int, limit).query(`
    SELECT TOP (@limit) ${TOUR_CARD_COLUMNS} ${TOUR_CARD_FROM}
    ORDER BY t.ngay_tao DESC, t.ma_tour DESC`);
  return result.recordset;
};

// Mỗi loại tour lấy tối đa @limit tour (ROW_NUMBER đánh số trong từng loại); loại không có tour hiển thị thì không có dòng.
// Cột thu_tu chỉ dùng để lọc, service bỏ đi trước khi trả về.
export const findTourCardsByType = async (today, limitPerType) => {
  const request = await createCardRequest(today);
  const result = await request.input('limit', sql.Int, limitPerType).query(`
    SELECT * FROM (
      SELECT ${TOUR_CARD_COLUMNS},
        ROW_NUMBER() OVER (PARTITION BY t.ma_loai_tour ORDER BY ${NEAREST_FIRST}) AS thu_tu
      ${TOUR_CARD_FROM}
    ) x
    WHERE x.thu_tu <= @limit
    ORDER BY x.ma_loai_tour, x.thu_tu`);
  return result.recordset;
};

// Danh sách tour cho khách (GET /api/tours): chỉ tour đang hiện, cộng các bộ lọc khách chọn.
// departureFrom: tour phải có ít nhất một lịch còn chỗ từ ngày đó trở đi (EXISTS).
const applyPublicTourFilters = (request, filters) => {
  const conditions = ['t.trang_thai_hien_thi = 1', ...buildTourConditions(request, filters)];
  if (filters.departureFrom) {
    request.input('departureFrom', sql.Date, filters.departureFrom);
    conditions.push(`EXISTS (SELECT 1 FROM LICH_KHOI_HANH l WHERE l.ma_tour = t.ma_tour AND ${BOOKABLE_FROM_DATE})`);
  }
  return toWhere(conditions);
};

// Giá trị sort hợp lệ và câu ORDER BY tương ứng (thêm ma_tour để thứ tự cố định khi trùng giá, giữa các trang không lặp tour)
const PUBLIC_SORT_ORDERS = {
  price_asc: 't.gia, t.ma_tour',
  price_desc: 't.gia DESC, t.ma_tour DESC',
  newest: 't.ngay_tao DESC, t.ma_tour DESC',
};

export const PUBLIC_TOUR_SORTS = Object.keys(PUBLIC_SORT_ORDERS);

export const countPublicTours = async (today, filters) => {
  const request = await createCardRequest(today);
  const where = applyPublicTourFilters(request, filters);
  const result = await request.query(`SELECT COUNT(*) AS total FROM TOUR t ${where}`);
  return result.recordset[0].total;
};

// Có lọc theo ngày thì lịch gần nhất trên thẻ tour cũng tính từ ngày lọc.
// Không chọn sort thì dùng thứ tự mặc định (tour có lịch gần nhất trước).
export const findPublicTourCards = async (today, filters, { offset, limit }) => {
  const request = await createCardRequest(today);
  const where = applyPublicTourFilters(request, filters);
  const departureCondition = filters.departureFrom ? BOOKABLE_FROM_DATE : BOOKABLE_DEPARTURE;
  const orderBy = Object.hasOwn(PUBLIC_SORT_ORDERS, filters.sort) ? PUBLIC_SORT_ORDERS[filters.sort] : NEAREST_FIRST;
  const result = await request.input('offset', sql.Int, offset).input('limit', sql.Int, limit).query(`
    SELECT ${TOUR_CARD_COLUMNS} ${tourCardFrom(departureCondition)}
    ${where}
    ORDER BY ${orderBy}
    OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`);
  return result.recordset;
};

/* ---------- Ghi (gọi trong transaction) ---------- */

const bindTourInputs = (request, tour) =>
  request
    .input('tenTour', sql.NVarChar(200), tour.tenTour)
    .input('moTa', sql.NVarChar(sql.MAX), tour.moTaTongQuan)
    .input('soNgay', sql.Int, tour.soNgay)
    .input('soDem', sql.Int, tour.soDem)
    .input('gia', sql.Decimal(12, 0), tour.gia)
    .input('hienThi', sql.Bit, tour.trangThaiHienThi)
    .input('maLoaiTour', sql.Int, tour.maLoaiTour)
    .input('maDiemDen', sql.Int, tour.maDiemDen)
    .input('maDiemKhoiHanh', sql.Int, tour.maDiemKhoiHanh)
    .input('maPhuongTien', sql.Int, tour.maPhuongTien);

export const insertTour = async (tour, transaction) => {
  const request = bindTourInputs(await createRequest(transaction), tour);
  const result = await request.query(`
    INSERT INTO TOUR (ten_tour, mo_ta_tong_quan, so_ngay, so_dem, gia, trang_thai_hien_thi,
                      ma_loai_tour, ma_diem_den, ma_diem_khoi_hanh, ma_phuong_tien)
    OUTPUT inserted.ma_tour
    VALUES (@tenTour, @moTa, @soNgay, @soDem, @gia, @hienThi,
            @maLoaiTour, @maDiemDen, @maDiemKhoiHanh, @maPhuongTien)`);
  return result.recordset[0].ma_tour;
};

export const updateTour = async (id, tour, transaction) => {
  const request = bindTourInputs(await createRequest(transaction), tour).input('id', sql.Int, id);
  await request.query(`
    UPDATE TOUR SET
      ten_tour = @tenTour, mo_ta_tong_quan = @moTa, so_ngay = @soNgay, so_dem = @soDem, gia = @gia,
      trang_thai_hien_thi = @hienThi, ma_loai_tour = @maLoaiTour, ma_diem_den = @maDiemDen,
      ma_diem_khoi_hanh = @maDiemKhoiHanh, ma_phuong_tien = @maPhuongTien
    WHERE ma_tour = @id`);
};

export const insertItineraryDay = async (tourId, { ngayThu, tieuDe, noiDung }, transaction) => {
  const request = await createRequest(transaction);
  await request
    .input('tourId', sql.Int, tourId)
    .input('ngayThu', sql.Int, ngayThu)
    .input('tieuDe', sql.NVarChar(200), tieuDe)
    .input('noiDung', sql.NVarChar(sql.MAX), noiDung)
    .query(`INSERT INTO LICH_TRINH (ma_tour, ngay_thu, tieu_de, noi_dung_hoat_dong)
            VALUES (@tourId, @ngayThu, @tieuDe, @noiDung)`);
};

export const deleteItineraryByTourId = async (tourId, transaction) => {
  const request = await createRequest(transaction);
  await request.input('tourId', sql.Int, tourId).query('DELETE FROM LICH_TRINH WHERE ma_tour = @tourId');
};

// Xóa tour cùng các dòng phụ thuộc (yêu thích, ảnh, lịch trình). Service chỉ gọi khi tour chưa có
// lịch khởi hành; nếu có, khóa ngoại của LICH_KHOI_HANH sẽ chặn câu DELETE TOUR (lỗi 547).
// File ảnh trên đĩa do service xóa sau khi transaction thành công.
export const deleteTourWithChildren = async (tourId, transaction) => {
  const request = await createRequest(transaction);
  await request.input('tourId', sql.Int, tourId).query(`
    DELETE FROM YEU_THICH  WHERE ma_tour = @tourId;
    DELETE FROM ANH_TOUR   WHERE ma_tour = @tourId;
    DELETE FROM LICH_TRINH WHERE ma_tour = @tourId;
    DELETE FROM TOUR       WHERE ma_tour = @tourId;`);
};
