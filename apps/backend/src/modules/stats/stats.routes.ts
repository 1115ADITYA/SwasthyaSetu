import { Router } from 'express';
import { getStats } from './stats.controller';
import { authenticate, authorize } from '../../core/middlewares/auth.middleware';

const router = Router();

router.use(authenticate);
router.get('/', authorize(['DOCTOR', 'ADMIN']), getStats);

export default router;
