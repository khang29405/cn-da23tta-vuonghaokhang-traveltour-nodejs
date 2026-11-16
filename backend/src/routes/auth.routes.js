import { Router } from 'express';
import { register, login, getMe, checkAdmin } from '../controllers/auth.controller.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import { ROLES } from '../utils/constants.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, getMe);

// Route kiểm thử phân quyền (401 khi thiếu token, 403 khi không phải quản trị).
// Bước 6 có API quản trị thật thì có thể xóa route này.
router.get('/check-admin', authenticate, authorize(ROLES.ADMIN), checkAdmin);

export default router;
