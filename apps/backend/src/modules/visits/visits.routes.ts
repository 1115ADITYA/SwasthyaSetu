import { Router } from 'express';
import { createVisit, getVisitsByPatient } from './visits.controller';
import { authenticate, authorize } from '../../core/middlewares/auth.middleware';

const router = Router();

// Only ASHA and DOCTOR can manage visits
router.use(authenticate);

router.post('/', authorize(['ASHA', 'DOCTOR']), createVisit);
router.get('/patient/:patientId', authorize(['ASHA', 'DOCTOR']), getVisitsByPatient);

export default router;
