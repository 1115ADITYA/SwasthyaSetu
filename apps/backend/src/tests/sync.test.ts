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
});
