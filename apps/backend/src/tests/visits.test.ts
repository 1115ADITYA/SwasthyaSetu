import request from 'supertest';
import app from '../app';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../core/db/prisma';

// Helper to mock jwt.verify
jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
  sign: jest.fn(),
}));

import jwt from 'jsonwebtoken';

describe('Visits API', () => {
  let ashaUser: any;
  let doctorUser: any;
  let patientUser: any;
  
  beforeAll(async () => {
    // Create users to satisfy foreign key constraints
    const ashaDbUser = await prisma.user.create({
      data: { phoneNumber: uuidv4().substring(0, 10), passwordHash: 'hash', role: 'ASHA' }
    });
    ashaUser = { userId: ashaDbUser.id, role: 'ASHA' };

    const docDbUser = await prisma.user.create({
      data: { phoneNumber: uuidv4().substring(0, 10), passwordHash: 'hash', role: 'DOCTOR' }
    });
    doctorUser = { userId: docDbUser.id, role: 'DOCTOR' };

    const patDbUser = await prisma.user.create({
      data: { phoneNumber: uuidv4().substring(0, 10), passwordHash: 'hash', role: 'PATIENT' }
    });
    patientUser = { userId: patDbUser.id, role: 'PATIENT' };
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/visits', () => {
    const validPayload = {
      patientId: uuidv4(),
      status: 'COMPLETED',
      vitals: { temperature: 36.5, heartRate: 72 },
    };

    it('should reject unauthenticated request', async () => {
      const res = await request(app).post('/api/visits').send(validPayload);
      expect(res.status).toBe(401);
    });

    it('should reject PATIENT role', async () => {
      (jwt.verify as jest.Mock).mockReturnValue(patientUser);
      const res = await request(app)
        .post('/api/visits')
        .set('Authorization', 'Bearer token')
        .send(validPayload);
      
      expect(res.status).toBe(403);
    });

    it('should allow ASHA role to create visit', async () => {
      (jwt.verify as jest.Mock).mockReturnValue(ashaUser);
      
      // Need a real patient to attach to
      const patient = await prisma.patientProfile.create({
        data: {
          firstName: "Test",
          lastName: "Patient",
          dateOfBirth: new Date("1990-01-01"),
          gender: "MALE",
          facility: {
            create: { name: "Test Facility", type: "PHC", location: "Test" }
          }
        }
      });
      const realPayload = { ...validPayload, patientId: patient.id };

      const res = await request(app)
        .post('/api/visits')
        .set('Authorization', 'Bearer token')
        .send(realPayload);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('visitId');
    });

    it('should reject invalid vitals', async () => {
      (jwt.verify as jest.Mock).mockReturnValue(ashaUser);
      const res = await request(app)
        .post('/api/visits')
        .set('Authorization', 'Bearer token')
        .send({
          ...validPayload,
          vitals: { heartRate: 300 } // Over max 250
        });

      expect(res.status).toBe(400);
      expect(res.body.errors.fieldErrors).toHaveProperty('vitals');
    });
  });

  describe('GET /api/visits/patient/:patientId', () => {
    it('should return patient history for DOCTOR', async () => {
      (jwt.verify as jest.Mock).mockReturnValue(doctorUser);

      const res = await request(app)
        .get(`/api/visits/patient/${uuidv4()}`)
        .set('Authorization', 'Bearer token');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('visits');
    });
  });
});
