import { thanhCong } from '../utils/response.js';

// GET /api/health: kiểm tra máy chủ đang chạy
export const kiemTra = (req, res) =>
  thanhCong(res, { thoiGian: new Date().toISOString() }, 'Máy chủ đang hoạt động');
