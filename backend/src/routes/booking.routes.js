import { Router } from 'express';
import { createBooking, getMyBookings, getMyBookingById } from '../controllers/booking.controller.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import { ROLES } from '../utils/constants.js';

// Chỉ khách hàng đặt tour; nhân viên và quản trị xử lý đơn ở /api/manage/bookings
const router = Router();
router.use(authenticate, authorize(ROLES.CUSTOMER));

router.post('/', createBooking);
// /me phải đứng trước /:id
router.get('/me', getMyBookings);
router.get('/:id', getMyBookingById);

export default router;
