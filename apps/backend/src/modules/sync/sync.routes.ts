import { Router } from 'express';
import { syncData } from './sync.controller';
import { authenticate, authorize } from '../../core/middlewares/auth.middleware';

const router = Router();

// Only ASHA can sync field data
router.use(authenticate);
router.post('/', authorize(['ASHA']), syncData);

export default router;
