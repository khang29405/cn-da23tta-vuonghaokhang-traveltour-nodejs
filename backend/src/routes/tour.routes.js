import { Router } from 'express';
import { getHomeTours, getTours, getTourById } from '../controllers/publicTour.controller.js';

// Gắn tại /api/tours, ai cũng xem được (chỉ tour đang hiện)
const router = Router();

// /home phải khai báo trước /:id, nếu không "home" sẽ bị hiểu là mã tour
router.get('/home', getHomeTours);
router.get('/', getTours);
router.get('/:id', getTourById);

export default router;
