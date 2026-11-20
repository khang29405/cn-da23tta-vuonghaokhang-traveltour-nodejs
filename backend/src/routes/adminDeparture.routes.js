import { Router } from 'express';
import {
  getDeparturesByTour,
  createDeparture,
  updateDeparture,
  deleteDeparture,
} from '../controllers/departure.controller.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import { ROLES } from '../utils/constants.js';

// Gắn tại /api/admin; mọi API lịch khởi hành nằm chung file này:
// xem/thêm theo tour (/tours/:id/departures), sửa/xóa theo mã lịch (/departures/:id)
const router = Router();
router.use(authenticate, authorize(ROLES.ADMIN));

router.get('/tours/:id/departures', getDeparturesByTour);
router.post('/tours/:id/departures', createDeparture);
router.put('/departures/:id', updateDeparture);
router.delete('/departures/:id', deleteDeparture);

export default router;
