import { Router } from 'express';
import { getFacilities } from './facilities.controller';
import { authenticate, authorize } from '../../core/middlewares/auth.middleware';

const router = Router();

router.use(authenticate);
router.get('/', authorize(['ASHA', 'DOCTOR', 'ADMIN']), getFacilities);

export default router;
