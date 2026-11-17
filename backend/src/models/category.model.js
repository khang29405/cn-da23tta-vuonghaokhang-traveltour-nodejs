import { sql, getPool } from '../config/db.js';

// Các bảng danh mục: LOAI_TOUR, DIEM_DEN, DIEM_KHOI_HANH, PHUONG_TIEN.
// Tên bảng/cột viết cố định trong câu SQL, giá trị luôn truyền qua tham số.

const query = async (text, bindInputs = () => {}) => {
  const pool = await getPool();
  const request = pool.request();
  bindInputs(request);
  const result = await request.query(text);
  return result.recordset ?? [];
};

/* ---------- Loại tour ---------- */

export const findAllTourTypes = () =>
  query('SELECT ma_loai_tour, ten_loai_tour, mo_ta_ngan FROM LOAI_TOUR ORDER BY ma_loai_tour');

export const findTourTypeById = async (id) => {
  const rows = await query(
    'SELECT ma_loai_tour, ten_loai_tour, mo_ta_ngan FROM LOAI_TOUR WHERE ma_loai_tour = @id',
    (r) => r.input('id', sql.Int, id),
  );
  return rows[0] ?? null;
};

// excludeId: bỏ qua chính bản ghi đang sửa khi kiểm tra trùng tên
export const existsTourTypeName = async (name, excludeId = null) => {
  const rows = await query(
    `SELECT 1 AS co FROM LOAI_TOUR
     WHERE ten_loai_tour = @name AND (@excludeId IS NULL OR ma_loai_tour <> @excludeId)`,
    (r) => r.input('name', sql.NVarChar(100), name).input('excludeId', sql.Int, excludeId),
  );
  return rows.length > 0;
};

export const createTourType = async ({ tenLoaiTour, moTaNgan }) => {
  const rows = await query(
    `INSERT INTO LOAI_TOUR (ten_loai_tour, mo_ta_ngan)
     OUTPUT inserted.ma_loai_tour, inserted.ten_loai_tour, inserted.mo_ta_ngan
     VALUES (@ten, @moTa)`,
    (r) => r.input('ten', sql.NVarChar(100), tenLoaiTour).input('moTa', sql.NVarChar(500), moTaNgan),
  );
  return rows[0];
};

export const updateTourType = async (id, { tenLoaiTour, moTaNgan }) => {
  const rows = await query(
    `UPDATE LOAI_TOUR SET ten_loai_tour = @ten, mo_ta_ngan = @moTa
     OUTPUT inserted.ma_loai_tour, inserted.ten_loai_tour, inserted.mo_ta_ngan
     WHERE ma_loai_tour = @id`,
    (r) =>
      r
        .input('id', sql.Int, id)
        .input('ten', sql.NVarChar(100), tenLoaiTour)
        .input('moTa', sql.NVarChar(500), moTaNgan),
  );
  return rows[0] ?? null;
};

export const deleteTourType = (id) =>
  query('DELETE FROM LOAI_TOUR WHERE ma_loai_tour = @id', (r) => r.input('id', sql.Int, id));

// Đếm cả tour đang ẩn: tour ẩn vẫn còn tham chiếu tới loại tour
export const countToursByTourType = async (id) => {
  const rows = await query('SELECT COUNT(*) AS so_tour FROM TOUR WHERE ma_loai_tour = @id', (r) =>
    r.input('id', sql.Int, id),
  );
  return rows[0].so_tour;
};

/* ---------- Điểm đến ---------- */

const DESTINATION_COLUMNS = 'ma_diem_den, ten_diem_den, tinh_thanh, mo_ta_ngan';

export const findAllDestinations = () =>
  query(`SELECT ${DESTINATION_COLUMNS} FROM DIEM_DEN ORDER BY ten_diem_den`);

export const findDestinationById = async (id) => {
  const rows = await query(`SELECT ${DESTINATION_COLUMNS} FROM DIEM_DEN WHERE ma_diem_den = @id`, (r) =>
    r.input('id', sql.Int, id),
  );
  return rows[0] ?? null;
};

export const existsDestinationName = async (name, excludeId = null) => {
  const rows = await query(
    `SELECT 1 AS co FROM DIEM_DEN
     WHERE ten_diem_den = @name AND (@excludeId IS NULL OR ma_diem_den <> @excludeId)`,
    (r) => r.input('name', sql.NVarChar(100), name).input('excludeId', sql.Int, excludeId),
  );
  return rows.length > 0;
};

export const createDestination = async ({ tenDiemDen, tinhThanh, moTaNgan }) => {
  const rows = await query(
    `INSERT INTO DIEM_DEN (ten_diem_den, tinh_thanh, mo_ta_ngan)
     OUTPUT inserted.ma_diem_den, inserted.ten_diem_den, inserted.tinh_thanh, inserted.mo_ta_ngan
     VALUES (@ten, @tinhThanh, @moTa)`,
    (r) =>
      r
        .input('ten', sql.NVarChar(100), tenDiemDen)
        .input('tinhThanh', sql.NVarChar(100), tinhThanh)
        .input('moTa', sql.NVarChar(500), moTaNgan),
  );
  return rows[0];
};

export const updateDestination = async (id, { tenDiemDen, tinhThanh, moTaNgan }) => {
  const rows = await query(
    `UPDATE DIEM_DEN SET ten_diem_den = @ten, tinh_thanh = @tinhThanh, mo_ta_ngan = @moTa
     OUTPUT inserted.ma_diem_den, inserted.ten_diem_den, inserted.tinh_thanh, inserted.mo_ta_ngan
     WHERE ma_diem_den = @id`,
    (r) =>
      r
        .input('id', sql.Int, id)
        .input('ten', sql.NVarChar(100), tenDiemDen)
        .input('tinhThanh', sql.NVarChar(100), tinhThanh)
        .input('moTa', sql.NVarChar(500), moTaNgan),
  );
  return rows[0] ?? null;
};

/* ---------- Điểm khởi hành ---------- */

const DEPARTURE_COLUMNS = 'ma_diem_khoi_hanh, ten_diem_khoi_hanh, tinh_thanh';

// Giữ thứ tự nhập trong seed.sql (TP. Hồ Chí Minh, Hà Nội, Đà Nẵng, Cần Thơ) cho khớp khung tìm kiếm
export const findAllDeparturePoints = () =>
  query(`SELECT ${DEPARTURE_COLUMNS} FROM DIEM_KHOI_HANH ORDER BY ma_diem_khoi_hanh`);

export const findDeparturePointById = async (id) => {
  const rows = await query(
    `SELECT ${DEPARTURE_COLUMNS} FROM DIEM_KHOI_HANH WHERE ma_diem_khoi_hanh = @id`,
    (r) => r.input('id', sql.Int, id),
  );
  return rows[0] ?? null;
};

export const existsDeparturePointName = async (name, excludeId = null) => {
  const rows = await query(
    `SELECT 1 AS co FROM DIEM_KHOI_HANH
     WHERE ten_diem_khoi_hanh = @name AND (@excludeId IS NULL OR ma_diem_khoi_hanh <> @excludeId)`,
    (r) => r.input('name', sql.NVarChar(100), name).input('excludeId', sql.Int, excludeId),
  );
  return rows.length > 0;
};

export const createDeparturePoint = async ({ tenDiemKhoiHanh, tinhThanh }) => {
  const rows = await query(
    `INSERT INTO DIEM_KHOI_HANH (ten_diem_khoi_hanh, tinh_thanh)
     OUTPUT inserted.ma_diem_khoi_hanh, inserted.ten_diem_khoi_hanh, inserted.tinh_thanh
     VALUES (@ten, @tinhThanh)`,
    (r) => r.input('ten', sql.NVarChar(100), tenDiemKhoiHanh).input('tinhThanh', sql.NVarChar(100), tinhThanh),
  );
  return rows[0];
};

export const updateDeparturePoint = async (id, { tenDiemKhoiHanh, tinhThanh }) => {
  const rows = await query(
    `UPDATE DIEM_KHOI_HANH SET ten_diem_khoi_hanh = @ten, tinh_thanh = @tinhThanh
     OUTPUT inserted.ma_diem_khoi_hanh, inserted.ten_diem_khoi_hanh, inserted.tinh_thanh
     WHERE ma_diem_khoi_hanh = @id`,
    (r) =>
      r
        .input('id', sql.Int, id)
        .input('ten', sql.NVarChar(100), tenDiemKhoiHanh)
        .input('tinhThanh', sql.NVarChar(100), tinhThanh),
  );
  return rows[0] ?? null;
};

/* ---------- Phương tiện (chỉ đọc, cố định từ seed.sql) ---------- */

export const findAllTransports = () =>
  query('SELECT ma_phuong_tien, ten_phuong_tien FROM PHUONG_TIEN ORDER BY ma_phuong_tien');
