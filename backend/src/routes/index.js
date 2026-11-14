import { Router } from 'express';
import healthRoutes from './health.routes.js';

// Gom tất cả route, gắn vào /api trong app.js
const router = Router();

router.use('/health', healthRoutes);

export default router;
