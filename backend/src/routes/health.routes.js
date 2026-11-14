import { Router } from 'express';
import { kiemTra } from '../controllers/health.controller.js';

const router = Router();

router.get('/', kiemTra);

export default router;
