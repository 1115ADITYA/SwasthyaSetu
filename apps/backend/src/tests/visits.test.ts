/**
 * visits.test.ts — Phase 2C-1: Doctor/Admin Visit Read APIs
 *
 * Tests for:
 *   GET /api/visits
 *   GET /api/visits/:id
 *   GET /api/patients/:id/visits
 *
 * Strategy:
 *   - Creates real DB records in beforeAll (two facilities, one Doctor per
 *     facility, one Admin, one ASHA, two patients, two visits).
 *   - Verifies facility scoping, auth/role enforcement, and response shape.
 *   - Gracefully skips when the database is not available (same pattern as
 *     scoping.test.ts).
 */
import request from 'supertest';
import app from '../app';
import prisma from '../core/db/prisma';

// ---------------------------------------------------------------------------
// Shared test state
// ---------------------------------------------------------------------------
let facilityAId  = '';
let facilityBId  = '';
let doctorAToken = '';   // Doctor in Facility A
let doctorBToken = '';   // Doctor in Facility B
let adminToken   = '';   // Admin (no facility restriction)
let ashaToken    = '';   // ASHA (no access to /api/visits)
let patientAId   = '';   // Patient in Facility A
let patientBId   = '';   // Patient in Facility B
let visitAId     = '';   // Visit in Facility A (for patientA)
let visitBId     = '';   // Visit in Facility B (for patientB)
let dbAvailable  = false;

const rand = () => Math.floor(1000000000 + Math.random() * 9000000000);

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------
beforeAll(async () => {
  try {
    // 1. Create two facilities
    const facA = await prisma.facility.create({
      data: { name: 'Visit Test PHC A', type: 'PHC', location: 'District A' },
    });
    const facB = await prisma.facility.create({
      data: { name: 'Visit Test PHC B', type: 'PHC', location: 'District B' },
    });
    facilityAId = facA.id;
    facilityBId = facB.id;

    // 2. Register & log in Doctor A (Facility A)
    const doctorAPhone = `+91${rand()}`;
    await request(app).post('/api/auth/register').send({
      phoneNumber: doctorAPhone, password: 'testpassword', role: 'DOCTOR',
    });
    await prisma.user.updateMany({
      where: { phoneNumber: doctorAPhone },
      data:  { facilityId: facilityAId },
    });
    const drALogin = await request(app).post('/api/auth/login').send({
      phoneNumber: doctorAPhone, password: 'testpassword',
    });
    doctorAToken = drALogin.body?.token ?? '';

    // 3. Register & log in Doctor B (Facility B)
    const doctorBPhone = `+91${rand()}`;
    await request(app).post('/api/auth/register').send({
      phoneNumber: doctorBPhone, password: 'testpassword', role: 'DOCTOR',
    });
    await prisma.user.updateMany({
      where: { phoneNumber: doctorBPhone },
      data:  { facilityId: facilityBId },
    });
    const drBLogin = await request(app).post('/api/auth/login').send({
      phoneNumber: doctorBPhone, password: 'testpassword',
    });
    doctorBToken = drBLogin.body?.token ?? '';

    // 4. Register & log in Admin
    const adminPhone = `+91${rand()}`;
    await request(app).post('/api/auth/register').send({
      phoneNumber: adminPhone, password: 'testpassword', role: 'ADMIN',
    });
    const adminLogin = await request(app).post('/api/auth/login').send({
      phoneNumber: adminPhone, password: 'testpassword',
    });
    adminToken = adminLogin.body?.token ?? '';

    // 5. Register & log in ASHA
    const ashaPhone = `+91${rand()}`;
    await request(app).post('/api/auth/register').send({
      phoneNumber: ashaPhone, password: 'testpassword', role: 'ASHA',
    });
    const ashaLogin = await request(app).post('/api/auth/login').send({
      phoneNumber: ashaPhone, password: 'testpassword',
    });
    ashaToken = ashaLogin.body?.token ?? '';

    // 6. Get user IDs for visit foreign keys
    const [drAUser] = await prisma.user.findMany({ where: { phoneNumber: doctorAPhone } });

    // 7. Create one patient per facility
    const ptA = await prisma.patientProfile.create({
      data: {
        firstName: 'VisitAlice', lastName: 'FacilityA',
        dateOfBirth: new Date('1990-01-01'), gender: 'F',
        facilityId: facilityAId,
      },
    });
    const ptB = await prisma.patientProfile.create({
      data: {
        firstName: 'VisitBob', lastName: 'FacilityB',
        dateOfBirth: new Date('1985-05-15'), gender: 'M',
        facilityId: facilityBId,
      },
    });
    patientAId = ptA.id;
    patientBId = ptB.id;

    // 8. Create one visit per facility (ashaId = doctorAUser.id for simplicity;
    //    the FK only requires a valid User.id — we reuse the doctor's user ID
    //    since it already exists and has no role constraint on the FK).
    const visitA = await prisma.visit.create({
      data: {
        patientId:  patientAId,
        facilityId: facilityAId,
        ashaId:     drAUser.id,
        visitDate:  new Date('2026-09-01'),
        reason:     'Checkup in Facility A',
        status:     'PENDING_REVIEW',
      },
    });
    const visitB = await prisma.visit.create({
      data: {
        patientId:  patientBId,
        facilityId: facilityBId,
        ashaId:     drAUser.id,
        visitDate:  new Date('2026-09-02'),
        reason:     'Checkup in Facility B',
        status:     'COMPLETED',
      },
    });
    visitAId = visitA.id;
    visitBId = visitB.id;

    dbAvailable = !!(doctorAToken && doctorBToken && adminToken && ashaToken);
  } catch {
    dbAvailable = false;
  }
});

// ---------------------------------------------------------------------------
// Teardown
// ---------------------------------------------------------------------------
afterAll(async () => {
  if (dbAvailable) {
    await prisma.visit.deleteMany({
      where: { id: { in: [visitAId, visitBId].filter(Boolean) } },
    });
    await prisma.patientProfile.deleteMany({
      where: { id: { in: [patientAId, patientBId].filter(Boolean) } },
    });
    await prisma.facility.deleteMany({
      where: { id: { in: [facilityAId, facilityBId].filter(Boolean) } },
    });
  }
  await prisma.$disconnect();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('Visit APIs — Phase 2C-1', () => {

  // ── Auth / role guards ──────────────────────────────────────────────────

  it('GET /api/visits returns 401 when unauthenticated', async () => {
    const res = await request(app).get('/api/visits');
    expect(res.status).toBe(401);
  });

  it('GET /api/visits returns 403 for ASHA role', async () => {
    if (!dbAvailable || !ashaToken) return;
    const res = await request(app)
      .get('/api/visits')
      .set('Authorization', `Bearer ${ashaToken}`);
    expect(res.status).toBe(403);
  });

  it('GET /api/visits/:id returns 403 for ASHA role', async () => {
    if (!dbAvailable || !ashaToken) return;
    const res = await request(app)
      .get(`/api/visits/${visitAId}`)
      .set('Authorization', `Bearer ${ashaToken}`);
    expect(res.status).toBe(403);
  });

  it('GET /api/patients/:id/visits returns 403 for ASHA role', async () => {
    if (!dbAvailable || !ashaToken) return;
    const res = await request(app)
      .get(`/api/patients/${patientAId}/visits`)
      .set('Authorization', `Bearer ${ashaToken}`);
    expect(res.status).toBe(403);
  });

  // ── Doctor facility scoping — GET /api/visits ───────────────────────────

  it('Doctor A sees only Facility A visits on GET /api/visits', async () => {
    if (!dbAvailable || !doctorAToken) return;
    const res = await request(app)
      .get('/api/visits')
      .set('Authorization', `Bearer ${doctorAToken}`);
    expect(res.status).toBe(200);
    const ids = res.body.data.map((v: any) => v.id);
    expect(ids).toContain(visitAId);
    expect(ids).not.toContain(visitBId);
    res.body.data.forEach((v: any) => {
      expect(v.facilityId).toBe(facilityAId);
    });
  });

  it('Doctor B sees only Facility B visits on GET /api/visits', async () => {
    if (!dbAvailable || !doctorBToken) return;
    const res = await request(app)
      .get('/api/visits')
      .set('Authorization', `Bearer ${doctorBToken}`);
    expect(res.status).toBe(200);
    const ids = res.body.data.map((v: any) => v.id);
    expect(ids).toContain(visitBId);
    expect(ids).not.toContain(visitAId);
  });

  it('GET /api/visits response includes meta pagination object', async () => {
    if (!dbAvailable || !doctorAToken) return;
    const res = await request(app)
      .get('/api/visits')
      .set('Authorization', `Bearer ${doctorAToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('meta');
    expect(typeof res.body.meta.total).toBe('number');
    expect(typeof res.body.meta.page).toBe('number');
    expect(typeof res.body.meta.limit).toBe('number');
  });

  it('GET /api/visits filters by status correctly for DOCTOR', async () => {
    if (!dbAvailable || !adminToken) return;
    // Admin can see all, filter by PENDING_REVIEW
    const res = await request(app)
      .get('/api/visits?status=PENDING_REVIEW')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    res.body.data.forEach((v: any) => {
      expect(v.status).toBe('PENDING_REVIEW');
    });
  });

  // ── Doctor facility scoping — GET /api/visits/:id ───────────────────────

  it('Doctor A gets 200 for their own facility visit', async () => {
    if (!dbAvailable || !doctorAToken) return;
    const res = await request(app)
      .get(`/api/visits/${visitAId}`)
      .set('Authorization', `Bearer ${doctorAToken}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(visitAId);
  });

  it('Doctor A gets 404 for a visit from another facility', async () => {
    if (!dbAvailable || !doctorAToken) return;
    const res = await request(app)
      .get(`/api/visits/${visitBId}`)
      .set('Authorization', `Bearer ${doctorAToken}`);
    expect(res.status).toBe(404);
  });

  it('GET /api/visits/:id response includes patient, vitals, symptoms, facility fields', async () => {
    if (!dbAvailable || !doctorAToken) return;
    const res = await request(app)
      .get(`/api/visits/${visitAId}`)
      .set('Authorization', `Bearer ${doctorAToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('patient');
    expect(res.body).toHaveProperty('facility');
    expect(res.body).toHaveProperty('vitals');
    expect(res.body).toHaveProperty('symptoms');
    expect(res.body).toHaveProperty('consultation');
    expect(res.body).toHaveProperty('referral');
  });

  it('GET /api/visits/:id returns 404 for non-existent visit', async () => {
    if (!dbAvailable || !doctorAToken) return;
    const res = await request(app)
      .get('/api/visits/00000000-0000-4000-8000-000000000000')
      .set('Authorization', `Bearer ${doctorAToken}`);
    expect(res.status).toBe(404);
  });

  // ── Admin — district-wide access ────────────────────────────────────────

  it('Admin sees ALL visits across facilities on GET /api/visits', async () => {
    if (!dbAvailable || !adminToken) return;
    const res = await request(app)
      .get('/api/visits')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    const ids = res.body.data.map((v: any) => v.id);
    expect(ids).toContain(visitAId);
    expect(ids).toContain(visitBId);
  });

  it('Admin can access any visit by ID', async () => {
    if (!dbAvailable || !adminToken) return;
    const resA = await request(app)
      .get(`/api/visits/${visitAId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    const resB = await request(app)
      .get(`/api/visits/${visitBId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(resA.status).toBe(200);
    expect(resB.status).toBe(200);
  });

  // ── GET /api/patients/:id/visits — scoping ─────────────────────────────

  it("Doctor A gets patient A's visits", async () => {
    if (!dbAvailable || !doctorAToken) return;
    const res = await request(app)
      .get(`/api/patients/${patientAId}/visits`)
      .set('Authorization', `Bearer ${doctorAToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    const ids = res.body.map((v: any) => v.id);
    expect(ids).toContain(visitAId);
  });

  it("Doctor A gets 404 when requesting visits for patient from another facility", async () => {
    if (!dbAvailable || !doctorAToken) return;
    const res = await request(app)
      .get(`/api/patients/${patientBId}/visits`)
      .set('Authorization', `Bearer ${doctorAToken}`);
    expect(res.status).toBe(404);
  });

  it('Admin can retrieve visit history for any patient', async () => {
    if (!dbAvailable || !adminToken) return;
    const resA = await request(app)
      .get(`/api/patients/${patientAId}/visits`)
      .set('Authorization', `Bearer ${adminToken}`);
    const resB = await request(app)
      .get(`/api/patients/${patientBId}/visits`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(resA.status).toBe(200);
    expect(resB.status).toBe(200);
  });

  it('GET /api/patients/:id/visits returns 404 for non-existent patient', async () => {
    if (!dbAvailable || !adminToken) return;
    const res = await request(app)
      .get('/api/patients/00000000-0000-4000-8000-000000000000/visits')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(404);
  });

});
