import { Router } from 'express';
import {
  createTourType,
  updateTourType,
  deleteTourType,
  createDestination,
  updateDestination,
  createDeparturePoint,
  updateDeparturePoint,
} from '../controllers/category.controller.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import { ROLES } from '../utils/constants.js';

// Gắn tại /api/admin. Gắn quyền ở từng route (không dùng router.use) để không ảnh hưởng các route
// /api/admin khác sẽ thêm ở các bước sau.
const router = Router();
const adminOnly = [authenticate, authorize(ROLES.ADMIN)];

router.post('/tour-types', adminOnly, createTourType);
router.put('/tour-types/:id', adminOnly, updateTourType);
router.delete('/tour-types/:id', adminOnly, deleteTourType);

router.post('/destinations', adminOnly, createDestination);
router.put('/destinations/:id', adminOnly, updateDestination);

router.post('/departure-points', adminOnly, createDeparturePoint);
router.put('/departure-points/:id', adminOnly, updateDeparturePoint);

export default router;
