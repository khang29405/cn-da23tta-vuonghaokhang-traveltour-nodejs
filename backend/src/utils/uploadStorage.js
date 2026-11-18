import fs from 'node:fs/promises';
import path from 'node:path';

// Thư mục backend/uploads; app.js phục vụ thư mục này tại đường dẫn /uploads
export const UPLOAD_DIR = path.join(import.meta.dirname, '..', '..', 'uploads');

// Đường dẫn lưu trong CSDL và dùng để mở ảnh: /uploads/<ten-file>
export const toPublicPath = (filename) => `/uploads/${filename}`;

// Xóa file theo đường dẫn đã lưu trong CSDL. Chỉ lấy phần tên file nên không thể xóa ra ngoài thư mục uploads.
// File không còn thì bỏ qua; lỗi khác chỉ ghi log vì dữ liệu trong CSDL đã xóa xong, không báo lỗi cho người dùng.
export const removeUploadedFile = async (publicPath) => {
  const filePath = path.join(UPLOAD_DIR, path.basename(publicPath));
  try {
    await fs.unlink(filePath);
  } catch (err) {
    if (err.code !== 'ENOENT') console.error(`Không xóa được file ${filePath}:`, err);
  }
};

export const removeUploadedFiles = (publicPaths) => Promise.all(publicPaths.map(removeUploadedFile));
