import { Router } from 'express';
import { login, register } from './auth.controller';
import rateLimit from 'express-rate-limit';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login requests per windowMs
  message: { message: 'Too many login attempts, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});


const router = Router();

router.post('/register', register);
router.post('/login', loginLimiter, login);

export default router;
