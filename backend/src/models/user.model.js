import { sql, getPool } from '../config/db.js';

// Các cột trả về cho client: KHÔNG có mat_khau
const PUBLIC_COLUMNS = `
  nd.ma_nguoi_dung, nd.ho_ten, nd.email, nd.so_dien_thoai, nd.dia_chi,
  nd.trang_thai_tai_khoan, nd.ngay_tao, vt.ten_vai_tro AS vai_tro`;

// Dùng khi đăng nhập nên lấy thêm mat_khau (mã băm) để so sánh; service phải bỏ trường này trước khi trả về
export const findUserByEmail = async (email) => {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('email', sql.VarChar(100), email)
    .query(`
      SELECT ${PUBLIC_COLUMNS}, nd.mat_khau
      FROM NGUOI_DUNG nd
      JOIN VAI_TRO vt ON vt.ma_vai_tro = nd.ma_vai_tro
      WHERE nd.email = @email`);
  return result.recordset[0] ?? null;
};

export const findUserById = async (userId) => {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('maNguoiDung', sql.Int, userId)
    .query(`
      SELECT ${PUBLIC_COLUMNS}
      FROM NGUOI_DUNG nd
      JOIN VAI_TRO vt ON vt.ma_vai_tro = nd.ma_vai_tro
      WHERE nd.ma_nguoi_dung = @maNguoiDung`);
  return result.recordset[0] ?? null;
};

// Thêm người dùng, tra mã vai trò theo tên; trả về mã người dùng vừa tạo
export const createUser = async ({ hoTen, email, matKhauBam, soDienThoai, diaChi, vaiTro }) => {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('hoTen', sql.NVarChar(100), hoTen)
    .input('email', sql.VarChar(100), email)
    .input('matKhau', sql.VarChar(255), matKhauBam)
    .input('soDienThoai', sql.VarChar(15), soDienThoai)
    .input('diaChi', sql.NVarChar(255), diaChi)
    .input('vaiTro', sql.VarChar(20), vaiTro)
    .query(`
      INSERT INTO NGUOI_DUNG (ho_ten, email, mat_khau, so_dien_thoai, dia_chi, ma_vai_tro)
      OUTPUT inserted.ma_nguoi_dung
      SELECT @hoTen, @email, @matKhau, @soDienThoai, @diaChi, ma_vai_tro
      FROM VAI_TRO
      WHERE ten_vai_tro = @vaiTro`);
  return result.recordset[0].ma_nguoi_dung;
};
