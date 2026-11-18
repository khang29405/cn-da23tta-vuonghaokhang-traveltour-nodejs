import { Router } from 'express';
import { getTours, getTourById, createTour, updateTour, deleteTour } from '../controllers/tour.controller.js';
import { uploadImages, setCoverImage, deleteImage } from '../controllers/tourImage.controller.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import { uploadTourImages } from '../middlewares/upload.js';
import { ROLES } from '../utils/constants.js';

// Gắn tại /api/admin/tours; mọi route trong file này chỉ dành cho quản trị viên
// (kiểm tra quyền chạy trước Multer nên người không có quyền không lưu được file nào)
const router = Router();
router.use(authenticate, authorize(ROLES.ADMIN));

router.get('/', getTours);
router.get('/:id', getTourById);
router.post('/', createTour);
router.put('/:id', updateTour);
router.delete('/:id', deleteTour);

router.post('/:id/images', uploadTourImages, uploadImages);
router.put('/:id/images/:imageId/cover', setCoverImage);
router.delete('/:id/images/:imageId', deleteImage);

export default router;
