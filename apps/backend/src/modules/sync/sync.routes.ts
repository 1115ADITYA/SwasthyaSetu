import { Router } from 'express';
import { authenticate, authorize } from '../../core/middlewares/auth.middleware';
import { syncPush } from './sync.controller';

const router = Router();

// All sync routes require authentication
router.use(authenticate);

// POST /api/sync/push — ASHA workers only
// PATIENT, DOCTOR, and ADMIN will receive 403 from the authorize middleware
router.post('/push', authorize(['ASHA']), syncPush);

export default router;
