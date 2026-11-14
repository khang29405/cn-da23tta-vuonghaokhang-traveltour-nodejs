import { sendSuccess } from '../utils/response.js';

// GET /api/health: kiểm tra máy chủ đang chạy
export const getHealth = (req, res) =>
  sendSuccess(res, { timestamp: new Date().toISOString() }, 'Máy chủ đang hoạt động');
