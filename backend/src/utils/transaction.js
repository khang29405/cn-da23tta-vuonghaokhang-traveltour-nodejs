import { sql, getPool } from '../config/db.js';

// Chạy `work(transaction)`: mọi câu lệnh bên trong cùng thành công (commit) hoặc cùng hủy (rollback).
// Các câu lệnh trong một transaction phải chạy lần lượt (await từng câu), không chạy song song.
export const runInTransaction = async (work) => {
  const transaction = new sql.Transaction(await getPool());
  await transaction.begin();
  try {
    const result = await work(transaction);
    await transaction.commit();
    return result;
  } catch (err) {
    // SQL Server có thể đã tự hủy transaction khi gặp lỗi; khi đó rollback báo lỗi và được bỏ qua
    await transaction.rollback().catch(() => {});
    throw err;
  }
};
