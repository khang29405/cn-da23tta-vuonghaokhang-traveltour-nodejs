import { Router } from 'express';
import {
  getTourTypes,
  getDestinations,
  getDeparturePoints,
  getTransports,
} from '../controllers/category.controller.js';

// Gắn tại /api/categories, ai cũng xem được (chỉ đọc)
const router = Router();

router.get('/tour-types', getTourTypes);
router.get('/destinations', getDestinations);
router.get('/departure-points', getDeparturePoints);
router.get('/transports', getTransports);

export default router;
