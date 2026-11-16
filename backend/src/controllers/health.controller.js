import { checkDatabase } from '../services/health.service.js';
import { sendSuccess } from '../utils/response.js';

// GET /api/health: kiểm tra máy chủ và kết nối cơ sở dữ liệu
// Mất kết nối CSDL thì trả 503 kèm trạng thái để dễ chẩn đoán
export const getHealth = async (req, res) => {
  const database = await checkDatabase();
  const data = { timestamp: new Date().toISOString(), database };

  if (!database.connected) {
    return res.status(503).json({
      success: false,
      message: 'Máy chủ đang chạy nhưng không kết nối được cơ sở dữ liệu',
      data,
    });
  }

  return sendSuccess(res, data, 'Máy chủ và cơ sở dữ liệu đang hoạt động');
};
