import { Router } from 'express';
import { createPatient, getPatients, updatePatient, searchPatient } from './patients.controller';
import { authenticate, authorize } from '../../core/middlewares/auth.middleware';

const router = Router();

// Only authenticated users can access patient routes
router.use(authenticate);

// ASHA and DOCTOR can create patients, PATIENT can't
router.post('/', authorize(['ASHA', 'DOCTOR', 'ADMIN']), createPatient);
router.get('/', authorize(['ASHA', 'DOCTOR', 'ADMIN']), getPatients);
router.get('/search', authorize(['ASHA', 'DOCTOR', 'ADMIN']), searchPatient);
router.put('/:id', authorize(['ASHA', 'DOCTOR', 'ADMIN']), updatePatient);

export default router;
