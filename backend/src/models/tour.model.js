import { sql, getPool } from '../config/db.js';

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

export const countTours = async () => {
  const request = await createRequest();
  const result = await request.query('SELECT COUNT(*) AS total FROM TOUR');
  return result.recordset[0].total;
};

// Gồm cả tour đang ẩn; tour mới thêm đứng đầu
export const findTours = async ({ offset, limit }) => {
  const request = await createRequest();
  const result = await request
    .input('offset', sql.Int, offset)
    .input('limit', sql.Int, limit)
    .query(`${TOUR_SELECT} ${TOUR_JOINS}
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
