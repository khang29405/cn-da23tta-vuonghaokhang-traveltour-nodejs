import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';

// Gom tất cả route, gắn vào /api trong app.js
const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);

export default router;
