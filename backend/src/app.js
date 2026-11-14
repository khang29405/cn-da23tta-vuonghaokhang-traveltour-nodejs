// Phải import đầu tiên: nạp biến môi trường từ .env trước khi các module khác đọc process.env
import 'dotenv/config';

import path from 'node:path';
import express from 'express';
import cors from 'cors';

import routes from './routes/index.js';
import { notFound, errorHandler } from './middlewares/errorHandler.js';

const app = express();

app.use(cors());
app.use(express.json());

// Ảnh tour tải lên được phục vụ tại /uploads/<ten-file>
// ES Modules không có __dirname, dùng import.meta.dirname (thư mục chứa file này)
app.use('/uploads', express.static(path.join(import.meta.dirname, '..', 'uploads')));

app.use('/api', routes);

// Hai middleware này phải đặt cuối cùng
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Máy chủ đang chạy tại http://localhost:${PORT}`);
});
