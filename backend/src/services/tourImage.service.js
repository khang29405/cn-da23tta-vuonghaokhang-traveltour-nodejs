import AppError from '../utils/AppError.js';
import * as tourModel from '../models/tour.model.js';
import * as tourImageModel from '../models/tourImage.model.js';
import { runInTransaction } from '../utils/transaction.js';
import { parseId } from '../utils/validation.js';
import { toPublicPath, removeUploadedFile, removeUploadedFiles } from '../utils/uploadStorage.js';

const ensureTourExists = async (tourId) => {
  if (!(await tourModel.findTourById(tourId))) throw new AppError('Không tìm thấy tour', 404);
};

const findTourImage = async (tourId, imageId) => {
  const image = await tourImageModel.findImage(tourId, imageId);
  if (!image) throw new AppError('Không tìm thấy ảnh của tour này', 404);
  return image;
};

// Các hàm trả về danh sách ảnh mới nhất của tour (ảnh đại diện đứng đầu) để giao diện vẽ lại ngay

// Multer đã lưu file xuống đĩa trước khi vào đây, nên mã tour cũng được kiểm tra trong khối try:
// lỗi bất kỳ (mã sai, tour không tồn tại, lỗi CSDL) thì xóa các file vừa lưu để không sinh file rác.
export const uploadImages = async (rawTourId, files) => {
  let tourId;
  try {
    tourId = parseId(rawTourId);
    if (files.length === 0) throw new AppError('Vui lòng chọn ít nhất 1 ảnh', 400);
    await ensureTourExists(tourId);

    await runInTransaction(async (transaction) => {
      for (const file of files) {
        await tourImageModel.insertImage(tourId, toPublicPath(file.filename), transaction);
      }
    });
  } catch (err) {
    await removeUploadedFiles(files.map((file) => toPublicPath(file.filename)));
    throw err;
  }
  return tourModel.findImagesByTourId(tourId);
};

export const setCoverImage = async (tourId, imageId) => {
  await ensureTourExists(tourId);
  await findTourImage(tourId, imageId);
  await tourImageModel.setCoverImage(tourId, imageId);
  return tourModel.findImagesByTourId(tourId);
};

// Xóa ảnh đại diện thì ảnh đứng đầu còn lại tự thành ảnh đại diện. File trên đĩa xóa sau khi CSDL đã xóa xong.
export const deleteImage = async (tourId, imageId) => {
  await ensureTourExists(tourId);
  const image = await findTourImage(tourId, imageId);

  await runInTransaction(async (transaction) => {
    await tourImageModel.deleteImage(imageId, transaction);
    if (image.la_anh_dai_dien) await tourImageModel.promoteFirstImageToCover(tourId, transaction);
  });
  await removeUploadedFile(image.duong_dan_anh);
  return tourModel.findImagesByTourId(tourId);
};
