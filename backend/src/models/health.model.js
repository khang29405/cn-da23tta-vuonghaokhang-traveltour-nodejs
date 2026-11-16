import { getPool } from '../config/db.js';

// Câu truy vấn nhẹ nhất để thử kết nối, trả về tên cơ sở dữ liệu đang dùng
export const pingDatabase = async () => {
  const pool = await getPool();
  const result = await pool.request().query('SELECT DB_NAME() AS ten_csdl');
  return result.recordset[0].ten_csdl;
};
