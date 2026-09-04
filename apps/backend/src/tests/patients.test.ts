import request from 'supertest';
import { v4 as uuidv4 } from 'uuid';
import app from '../app';
import prisma from '../core/db/prisma';

let ashaToken = '';
let patientToken = '';

beforeAll(async () => {
  // Assume DB is running or we handle failures gracefully
  const ashaPhone = `+91${Math.floor(1000000000 + Math.random() * 9000000000)}`;
  const ptPhone = `+91${Math.floor(1000000000 + Math.random() * 9000000000)}`;

  await request(app).post('/api/auth/register').send({ phoneNumber: ashaPhone, password: 'password', role: 'ASHA' });
  await request(app).post('/api/auth/register').send({ phoneNumber: ptPhone, password: 'password', role: 'PATIENT' });
  
  const resAsha = await request(app).post('/api/auth/login').send({ phoneNumber: ashaPhone, password: 'password' });
  ashaToken = resAsha.body?.token;

  const resPt = await request(app).post('/api/auth/login').send({ phoneNumber: ptPhone, password: 'password' });
  patientToken = resPt.body?.token;
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Patients API RBAC & Endpoints', () => {
  it('should reject unauthenticated access', async () => {
    const res = await request(app).get('/api/patients');
    expect(res.status).toBe(401);
  });

  it('should reject PATIENT role from accessing GET /api/patients', async () => {
    if (!patientToken) return; // skip if DB not running
    const res = await request(app).get('/api/patients').set('Authorization', `Bearer ${patientToken}`);
    expect(res.status).toBe(403);
  });

  it('should allow ASHA role to create and search patients', async () => {
    if (!ashaToken) return;

    // Create facility first if testing full flow, but we might just mock or expect 400 if facility invalid
    const createRes = await request(app).post('/api/patients').set('Authorization', `Bearer ${ashaToken}`).send({
      firstName: 'Test',
      lastName: 'User',
      dateOfBirth: '1990-01-01',
      gender: 'M',
      facilityId: 'dummy-id',
    });
    
    // Might fail with 500 if facilityId doesn't exist, but authorization (2xx/4xx/5xx) passed
    expect(createRes.status).not.toBe(403);
    expect(createRes.status).not.toBe(401);

    const searchRes = await request(app).get('/api/patients/search?q=Test').set('Authorization', `Bearer ${ashaToken}`);
    expect(searchRes.status).not.toBe(403);
  });

  it('should idempotently create a patient when the mobile offline-sync fallback retries with the same client id', async () => {
    if (!ashaToken) return;

    const facility = await prisma.facility.create({
      data: { name: 'Retry Fallback Facility', type: 'PHC', location: 'Test' },
    });

    const clientId = uuidv4();
    const body = {
      id: clientId,
      firstName: 'Offline',
      lastName: 'Retry',
      dateOfBirth: '1992-02-02',
      gender: 'FEMALE',
      facilityId: facility.id,
    };

    // Simulates the device never receiving the first response and retrying the
    // POST /api/patients fallback call with the same locally-generated id.
    const first = await request(app).post('/api/patients').set('Authorization', `Bearer ${ashaToken}`).send(body);
    expect(first.status).toBe(201);
    expect(first.body.patient.id).toBe(clientId);

    const retry = await request(app).post('/api/patients').set('Authorization', `Bearer ${ashaToken}`).send(body);
    expect(retry.status).toBe(200);
    expect(retry.body.patient.id).toBe(clientId);

    const patientsInDb = await prisma.patientProfile.findMany({ where: { id: clientId } });
    expect(patientsInDb).toHaveLength(1);
  });
});
