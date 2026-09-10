/**
 * scoping.test.ts
 *
 * Phase 1 — Doctor Data Scoping Tests
 *
 * These tests verify that:
 *   1. A Doctor sees ONLY patients from their own facility.
 *   2. A Doctor gets 404 (not a patient from another facility) on GET /api/patients/:id.
 *   3. A Doctor's search results are facility-scoped.
 *   4. A Doctor's stats are facility-scoped (totalFacilities = 1).
 *   5. An Admin still sees all facilities and all patients.
 *   6. Unauthenticated and wrong-role requests still get 401/403.
 *
 * Strategy: Tests create real DB records in beforeAll and clean up in afterAll.
 * They are gracefully skipped when the database is not available.
 */
import request from 'supertest';
import app from '../app';
import prisma from '../core/db/prisma';

// --- Shared test state ---
let facilityAId = '';
let facilityBId = '';
let doctorAToken = '';   // Doctor assigned to Facility A
let adminToken = '';     // Admin (no facility required)
let patientAId = '';     // Patient in Facility A
let patientBId = '';     // Patient in Facility B
let dbAvailable = false;

const rand = () => Math.floor(1000000000 + Math.random() * 9000000000);

// --- Setup ---
beforeAll(async () => {
  try {
    // 1. Create two facilities
    const facA = await prisma.facility.create({
      data: { name: 'Scoping Test PHC A', type: 'PHC', location: 'District A' },
    });
    const facB = await prisma.facility.create({
      data: { name: 'Scoping Test PHC B', type: 'PHC', location: 'District B' },
    });
    facilityAId = facA.id;
    facilityBId = facB.id;

    // 2. Register a Doctor for Facility A
    const doctorPhone = `+91${rand()}`;
    await request(app).post('/api/auth/register').send({
      phoneNumber: doctorPhone,
      password: 'testpassword',
      role: 'DOCTOR',
    });
    // Assign facilityId directly via Prisma (register endpoint does not expose facilityId)
    await prisma.user.updateMany({
      where: { phoneNumber: doctorPhone },
      data: { facilityId: facilityAId },
    });
    const doctorLoginRes = await request(app).post('/api/auth/login').send({
      phoneNumber: doctorPhone,
      password: 'testpassword',
    });
    doctorAToken = doctorLoginRes.body?.token ?? '';

    // 3. Register an Admin (no facility needed)
    const adminPhone = `+91${rand()}`;
    await request(app).post('/api/auth/register').send({
      phoneNumber: adminPhone,
      password: 'testpassword',
      role: 'ADMIN',
    });
    const adminLoginRes = await request(app).post('/api/auth/login').send({
      phoneNumber: adminPhone,
      password: 'testpassword',
    });
    adminToken = adminLoginRes.body?.token ?? '';

    // 4. Create one patient in each facility
    const ptA = await prisma.patientProfile.create({
      data: {
        firstName: 'ScopingAlice',
        lastName: 'FacilityA',
        dateOfBirth: new Date('1990-01-01'),
        gender: 'F',
        facilityId: facilityAId,
      },
    });
    const ptB = await prisma.patientProfile.create({
      data: {
        firstName: 'ScopingBob',
        lastName: 'FacilityB',
        dateOfBirth: new Date('1985-05-15'),
        gender: 'M',
        facilityId: facilityBId,
      },
    });
    patientAId = ptA.id;
    patientBId = ptB.id;

    dbAvailable = !!(doctorAToken && adminToken);
  } catch {
    // DB not running — all tests will be skipped gracefully
    dbAvailable = false;
  }
});

// --- Teardown ---
afterAll(async () => {
  if (dbAvailable) {
    await prisma.patientProfile.deleteMany({
      where: { id: { in: [patientAId, patientBId].filter(Boolean) } },
    });
    await prisma.facility.deleteMany({
      where: { id: { in: [facilityAId, facilityBId].filter(Boolean) } },
    });
  }
  await prisma.$disconnect();
});

// --- Tests ---
describe('Doctor Data Scoping — Phase 1', () => {

  it('Doctor sees ONLY own-facility patients on GET /api/patients', async () => {
    if (!dbAvailable || !doctorAToken) return;
    const res = await request(app)
      .get('/api/patients')
      .set('Authorization', `Bearer ${doctorAToken}`);
    expect(res.status).toBe(200);
    const ids = res.body.map((p: any) => p.id);
    expect(ids).toContain(patientAId);
    expect(ids).not.toContain(patientBId);
    res.body.forEach((p: any) => {
      expect(p.facilityId).toBe(facilityAId);
    });
  });

  it('Doctor gets 404 when accessing a patient from another facility by ID', async () => {
    if (!dbAvailable || !doctorAToken) return;
    const res = await request(app)
      .get(`/api/patients/${patientBId}`)
      .set('Authorization', `Bearer ${doctorAToken}`);
    expect(res.status).toBe(404);
  });

  it("Doctor's search results are scoped to their own facility", async () => {
    if (!dbAvailable || !doctorAToken) return;
    const res = await request(app)
      .get('/api/patients/search?q=Scoping')
      .set('Authorization', `Bearer ${doctorAToken}`);
    expect(res.status).toBe(200);
    const ids = res.body.map((p: any) => p.id);
    expect(ids).toContain(patientAId);
    expect(ids).not.toContain(patientBId);
  });

  it("Doctor's stats show only their own facility (totalFacilities = 1)", async () => {
    if (!dbAvailable || !doctorAToken) return;
    const res = await request(app)
      .get('/api/stats')
      .set('Authorization', `Bearer ${doctorAToken}`);
    expect(res.status).toBe(200);
    expect(res.body.totalFacilities).toBe(1);
    expect(res.body.countByFacility).toHaveLength(1);
    expect(res.body.countByFacility[0].facilityId).toBe(facilityAId);
    expect(typeof res.body.totalPatients).toBe('number');
  });

  it('Admin still sees ALL facilities and ALL patients (district-wide)', async () => {
    if (!dbAvailable || !adminToken) return;
    const patientsRes = await request(app)
      .get('/api/patients')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(patientsRes.status).toBe(200);
    const ids = patientsRes.body.map((p: any) => p.id);
    expect(ids).toContain(patientAId);
    expect(ids).toContain(patientBId);

    const statsRes = await request(app)
      .get('/api/stats')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(statsRes.status).toBe(200);
    expect(statsRes.body.totalFacilities).toBeGreaterThanOrEqual(2);
  });

  it('Unauthenticated request returns 401', async () => {
    const res = await request(app).get('/api/patients');
    expect(res.status).toBe(401);
  });

  it('PATIENT role cannot access GET /api/patients (403)', async () => {
    if (!dbAvailable) return;
    const ptPhone = `+91${rand()}`;
    await request(app).post('/api/auth/register').send({
      phoneNumber: ptPhone,
      password: 'testpassword',
      role: 'PATIENT',
    });
    const loginRes = await request(app).post('/api/auth/login').send({
      phoneNumber: ptPhone,
      password: 'testpassword',
    });
    const ptToken = loginRes.body?.token;
    if (!ptToken) return;
    const res = await request(app)
      .get('/api/patients')
      .set('Authorization', `Bearer ${ptToken}`);
    expect(res.status).toBe(403);
  });
});
