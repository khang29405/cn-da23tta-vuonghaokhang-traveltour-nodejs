// Phải import đầu tiên: nạp biến môi trường từ .env trước khi các module khác đọc process.env
import 'dotenv/config';

import express from 'express';
import cors from 'cors';

import routes from './routes/index.js';
import { notFound, errorHandler } from './middlewares/errorHandler.js';
import { UPLOAD_DIR } from './utils/uploadStorage.js';

const app = express();

app.use(cors());
app.use(express.json());

// Ảnh tour tải lên được phục vụ tại /uploads/<ten-file>
app.use('/uploads', express.static(UPLOAD_DIR));

app.use('/api', routes);

// Hai middleware này phải đặt cuối cùng
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
// Express 5 truyền lỗi khởi động (ví dụ cổng đã bị chương trình khác chiếm) vào callback;
// không kiểm tra thì vẫn in "đang chạy" rồi tắt im lặng
app.listen(PORT, (err) => {
  if (err) {
    const reason = err.code === 'EADDRINUSE' ? `cổng ${PORT} đang được chương trình khác sử dụng` : err.message;
    console.error(`Không khởi động được máy chủ: ${reason}`);
    process.exit(1);
  }
  console.log(`Máy chủ đang chạy tại http://localhost:${PORT}`);
});
