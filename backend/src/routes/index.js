import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import categoryRoutes from './category.routes.js';
import adminCategoryRoutes from './adminCategory.routes.js';
import adminTourRoutes from './adminTour.routes.js';
import adminDepartureRoutes from './adminDeparture.routes.js';

// Gom tất cả route, gắn vào /api trong app.js
const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);
router.use('/admin', adminCategoryRoutes);
router.use('/admin', adminDepartureRoutes);
router.use('/admin/tours', adminTourRoutes);

export default router;
