import { Router } from 'express';
import { authenticate, authorize } from '../../core/middlewares/auth.middleware';
import { getVisits, getVisitById } from './visits.controller';

const router = Router();

// All visits routes require authentication
router.use(authenticate);

// ASHA and PATIENT have no access to visits (403)
// Only DOCTOR (facility-scoped) and ADMIN (district-wide)
router.get('/',    authorize(['DOCTOR', 'ADMIN']), getVisits);
router.get('/:id', authorize(['DOCTOR', 'ADMIN']), getVisitById);

export default router;
