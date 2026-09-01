import request from 'supertest';
import app from '../app';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../core/db/prisma';

jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
}));

import jwt from 'jsonwebtoken';

describe('Sync API', () => {
  let ashaUser: any;
  
  beforeAll(async () => {
    const ashaDbUser = await prisma.user.create({
      data: { phoneNumber: uuidv4().substring(0, 10), passwordHash: 'hash', role: 'ASHA' }
    });
    ashaUser = { userId: ashaDbUser.id, role: 'ASHA' };
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should reject invalid sync payload', async () => {
    (jwt.verify as jest.Mock).mockReturnValue(ashaUser);
    
    const res = await request(app)
      .post('/api/sync')
      .set('Authorization', 'Bearer token')
      .send({ items: "not_an_array" });

    expect(res.status).toBe(400);
  });

  it('should process sync batch and handle duplicate idempotently', async () => {
    (jwt.verify as jest.Mock).mockReturnValue(ashaUser);
    
    // Create a real patient
    const patient = await prisma.patientProfile.create({
      data: {
        firstName: "TestSync",
        lastName: "Patient",
        dateOfBirth: new Date("1990-01-01"),
        gender: "MALE",
        facility: {
          create: { name: "Test Facility 2", type: "PHC", location: "Test" }
        }
      }
    });

    const clientSyncId1 = uuidv4();
    const clientSyncId2 = uuidv4();

    const payload = {
      items: [
        {
          clientSyncId: clientSyncId1,
          operation: 'CREATE_VISIT',
          entityType: 'HealthVisit',
          payload: { patientId: patient.id, status: 'COMPLETED' }
        },
        {
          clientSyncId: clientSyncId2,
          operation: 'CREATE_VISIT',
          entityType: 'HealthVisit',
          payload: { patientId: patient.id, status: 'COMPLETED' }
        }
      ]
    };

    // First request
    const res1 = await request(app)
      .post('/api/sync')
      .set('Authorization', 'Bearer token')
      .send(payload);

    expect(res1.status).toBe(200);
    expect(res1.body.results).toHaveLength(2);
    expect(res1.body.results[0].status).toBe('success');
    expect(res1.body.results[1].status).toBe('success');

    // Second request with same clientSyncIds
    const res2 = await request(app)
      .post('/api/sync')
      .set('Authorization', 'Bearer token')
      .send(payload);

    expect(res2.status).toBe(200);
    expect(res2.body.results).toHaveLength(2);
    
    // Both should now be duplicates
    expect(res2.body.results[0].status).toBe('duplicate');
    expect(res2.body.results[1].status).toBe('duplicate');
  });

  it('should process REGISTER_PATIENT and CREATE_VISIT in a mixed batch idempotently', async () => {
    (jwt.verify as jest.Mock).mockReturnValue(ashaUser);
    
    const facility = await prisma.facility.create({
      data: { name: "Mixed Batch Facility", type: "PHC", location: "Test" }
    });

    const clientPatientId = uuidv4();
    const clientVisitId = uuidv4();
    const clientSyncIdPatient = uuidv4();
    const clientSyncIdVisit = uuidv4();

    const payload = {
      items: [
        {
          clientSyncId: clientSyncIdPatient,
          operation: 'REGISTER_PATIENT',
          entityType: 'PatientProfile',
          entityId: clientPatientId,
          payload: {
            firstName: "Offline",
            lastName: "Patient",
            dateOfBirth: "1995-05-05",
            gender: "FEMALE",
            facilityId: facility.id
          }
        },
        {
          clientSyncId: clientSyncIdVisit,
          operation: 'CREATE_VISIT',
          entityType: 'HealthVisit',
          entityId: clientVisitId,
          payload: { patientId: clientPatientId, status: 'COMPLETED' }
        }
      ]
    };

    // First request
    const res1 = await request(app)
      .post('/api/sync')
      .set('Authorization', 'Bearer token')
      .send(payload);

    expect(res1.status).toBe(200);
    expect(res1.body.results).toHaveLength(2);
    expect(res1.body.results[0].status).toBe('success');
    expect(res1.body.results[0].serverEntityId).toBe(clientPatientId);
    expect(res1.body.results[1].status).toBe('success');
    expect(res1.body.results[1].serverEntityId).toBe(clientVisitId);

    // Verify in DB
    const patientInDb = await prisma.patientProfile.findUnique({ where: { id: clientPatientId } });
    expect(patientInDb).toBeDefined();
    expect(patientInDb?.firstName).toBe('Offline');

    const visitInDb = await prisma.healthVisit.findUnique({ where: { id: clientVisitId } });
    expect(visitInDb).toBeDefined();
    expect(visitInDb?.patientId).toBe(clientPatientId);

    // Duplicate test
    const res2 = await request(app)
      .post('/api/sync')
      .set('Authorization', 'Bearer token')
      .send(payload);

    expect(res2.status).toBe(200);
    expect(res2.body.results).toHaveLength(2);
    expect(res2.body.results[0].status).toBe('duplicate');
    expect(res2.body.results[1].status).toBe('duplicate');
  });

  it('should reject batch if REGISTER_PATIENT has invalid payload', async () => {
    (jwt.verify as jest.Mock).mockReturnValue(ashaUser);
    
    const payload = {
      items: [
        {
          clientSyncId: uuidv4(),
          operation: 'REGISTER_PATIENT',
          entityType: 'PatientProfile',
          entityId: uuidv4(),
          payload: {
            firstName: "MissingFields"
          }
        }
      ]
    };

    const res = await request(app)
      .post('/api/sync')
      .set('Authorization', 'Bearer token')
      .send(payload);

    // Invalid item payload throws inside transaction, but sync array validation succeeds.
    // Wait, since we are doing safeParse inside the loop, it should return 200 with status: 'failed'
    expect(res.status).toBe(200);
    expect(res.body.results[0].status).toBe('failed');
    expect(res.body.results[0].error).toContain('Invalid payload for REGISTER_PATIENT');
  });
});
