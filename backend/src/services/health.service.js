import { pingDatabase } from '../models/health.model.js';

// Kiểm tra kết nối CSDL; không ném lỗi ra ngoài để /api/health luôn trả lời được
export const checkDatabase = async () => {
  try {
    const name = await pingDatabase();
    return { connected: true, name };
  } catch (err) {
    console.error('Không kết nối được cơ sở dữ liệu:', err.message);
    return { connected: false, name: process.env.DB_NAME ?? null };
  }
};
