import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import AppError from '../utils/AppError.js';
import { UPLOAD_DIR } from '../utils/uploadStorage.js';

// Tên trường chứa ảnh trong form-data (Postman: Body → form-data, key "anh", kiểu File)
export const TOUR_IMAGE_FIELD = 'anh';
const MAX_IMAGE_SIZE_MB = 5;
const MAX_IMAGES_PER_UPLOAD = 10;

// Định dạng được nhận → đuôi file khi lưu. Đuôi lấy theo định dạng, không lấy theo tên gốc người dùng gửi lên.
const IMAGE_TYPES = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Tên file ngẫu nhiên: không trùng, không lộ tên gốc, không chứa ký tự lạ
const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename: (req, file, cb) => cb(null, `tour-${randomUUID()}${IMAGE_TYPES[file.mimetype]}`),
});

// Kiểm tra cả loại nội dung lẫn đuôi tên file
const fileFilter = (req, file, cb) => {
  const extension = path.extname(file.originalname).toLowerCase();
  if (IMAGE_TYPES[file.mimetype] && IMAGE_EXTENSIONS.includes(extension)) return cb(null, true);
  cb(new AppError('Chỉ nhận ảnh JPG, PNG hoặc WEBP', 400));
};

const receiveTourImages = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_IMAGE_SIZE_MB * 1024 * 1024, files: MAX_IMAGES_PER_UPLOAD },
}).array(TOUR_IMAGE_FIELD, MAX_IMAGES_PER_UPLOAD);

const toUploadError = (err) => {
  if (err.code === 'LIMIT_FILE_SIZE') return `Mỗi ảnh tối đa ${MAX_IMAGE_SIZE_MB} MB`;
  // Gửi quá số ảnh cho phép trong đúng trường "anh" cũng báo LIMIT_UNEXPECTED_FILE
  if (err.code === 'LIMIT_FILE_COUNT' || (err.code === 'LIMIT_UNEXPECTED_FILE' && err.field === TOUR_IMAGE_FIELD)) {
    return `Mỗi lần tải tối đa ${MAX_IMAGES_PER_UPLOAD} ảnh`;
  }
  if (err.code === 'LIMIT_UNEXPECTED_FILE') return `Ảnh phải gửi trong trường "${TOUR_IMAGE_FIELD}"`;
  return 'Dữ liệu tải lên không hợp lệ';
};

// Nhận nhiều ảnh vào req.files. Khi có lỗi, Multer tự xóa các file đã lưu của request này;
// ở đây chỉ đổi lỗi của Multer thành AppError 400 với thông báo tiếng Việt.
export const uploadTourImages = (req, res, next) => {
  receiveTourImages(req, res, (err) => {
    if (!err || err instanceof AppError) return next(err);
    if (err instanceof multer.MulterError) return next(new AppError(toUploadError(err), 400));
    // Lỗi đọc/ghi đĩa là lỗi máy chủ; lỗi còn lại là body multipart sai cấu trúc
    if (err.syscall) return next(err);
    next(new AppError('Dữ liệu tải lên không hợp lệ', 400));
  });
};
