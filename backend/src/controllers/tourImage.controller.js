import * as tourImageService from '../services/tourImage.service.js';
import { sendSuccess } from '../utils/response.js';
import { parseId } from '../utils/validation.js';

// /api/admin/tours/:id/images (chỉ quản trị viên)

// Mã tour được kiểm tra trong service để còn xóa các file Multer đã lưu khi mã sai
export const uploadImages = async (req, res) => {
  const files = req.files ?? [];
  const images = await tourImageService.uploadImages(req.params.id, files);
  sendSuccess(res, images, `Đã tải lên ${files.length} ảnh`, 201);
};

export const setCoverImage = async (req, res) => {
  const images = await tourImageService.setCoverImage(parseId(req.params.id), parseId(req.params.imageId));
  sendSuccess(res, images, 'Đã chọn ảnh đại diện');
};

export const deleteImage = async (req, res) => {
  const images = await tourImageService.deleteImage(parseId(req.params.id), parseId(req.params.imageId));
  sendSuccess(res, images, 'Đã xóa ảnh');
};
