import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import authRoutes from './modules/auth/auth.routes';
import patientRoutes from './modules/patients/patients.routes';
import facilityRoutes from './modules/facilities/facilities.routes';
import statsRoutes from './modules/stats/stats.routes';
import syncRoutes from './modules/sync/sync.routes';
import visitRoutes from './modules/visits/visits.routes';
import referralRoutes from './modules/referrals/referrals.routes';

dotenv.config();

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/facilities', facilityRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/visits', visitRoutes);
app.use('/api/referrals', referralRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

export default app;
