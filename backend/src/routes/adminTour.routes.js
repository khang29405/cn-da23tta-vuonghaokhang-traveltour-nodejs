import { Router } from 'express';
import { getTours, getTourById, createTour, updateTour, deleteTour } from '../controllers/tour.controller.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import { ROLES } from '../utils/constants.js';

// Gắn tại /api/admin/tours; mọi route trong file này chỉ dành cho quản trị viên
const router = Router();
router.use(authenticate, authorize(ROLES.ADMIN));

router.get('/', getTours);
router.get('/:id', getTourById);
router.post('/', createTour);
router.put('/:id', updateTour);
router.delete('/:id', deleteTour);

export default router;
