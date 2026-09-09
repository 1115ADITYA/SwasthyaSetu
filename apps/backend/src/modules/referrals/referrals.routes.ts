import { Router } from 'express';
import { authenticate, authorize } from '../../core/middlewares/auth.middleware';
import { createReferral, getReferrals, patchReferralStatus } from './referrals.controller';

const router = Router();

router.use(authenticate);

// ASHA and PATIENT have no access
router.post('/',              authorize(['DOCTOR']),         createReferral);
router.get('/',               authorize(['DOCTOR', 'ADMIN']), getReferrals);
router.patch('/:id/status',   authorize(['DOCTOR', 'ADMIN']), patchReferralStatus);

export default router;
