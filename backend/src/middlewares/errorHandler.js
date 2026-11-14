import AppError from '../utils/AppError.js';
import { sendError } from '../utils/response.js';

// Đường dẫn không tồn tại
export const notFound = (req, res) =>
  sendError(res, `Không tìm thấy đường dẫn ${req.method} ${req.originalUrl}`, 404);

// Xử lý lỗi tập trung: mọi lỗi ném ra trong route/controller/service đều về đây
// Express nhận biết middleware lỗi nhờ đủ 4 tham số, nên phải giữ cả `next`
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  if (err instanceof AppError) {
    return sendError(res, err.message, err.statusCode);
  }

  // Body JSON gửi lên sai cú pháp
  if (err.type === 'entity.parse.failed') {
    return sendError(res, 'Dữ liệu JSON không hợp lệ', 400);
  }

  // Lỗi không lường trước: ghi log ở server, không lộ chi tiết cho client
  console.error(err);
  return sendError(res, 'Lỗi máy chủ, vui lòng thử lại sau', 500);
};
