/**
 * consultation.referral.test.ts — Phase 2C-2
 *
 * Tests for:
 *   POST /api/visits/:id/consultation
 *   POST /api/referrals
 *   GET  /api/referrals
 *   PATCH /api/referrals/:id/status
 *
 * Strategy: real DB records, graceful skip when DB is unavailable.
 * Two-facility setup mirrors scoping.test.ts and visits.test.ts.
 */
import request from 'supertest';
import app from '../app';
import prisma from '../core/db/prisma';

// ---------------------------------------------------------------------------
// Shared test state
// ---------------------------------------------------------------------------
let facilityAId      = '';
let facilityBId      = '';
let doctorAId        = '';   // User.id of Doctor A (Facility A)
let doctorAToken     = '';
let doctorBToken     = '';   // Doctor in Facility B
let adminToken       = '';
let ashaToken        = '';
let patientAId       = '';
let dbAvailable      = false;

// Visit IDs created per-test to avoid state leaking between state-machine tests
// (each consultation test needs a fresh visit)
let visitPendingId   = '';   // fresh PENDING_REVIEW visit
let visitInReviewId  = '';   // fresh IN_REVIEW visit
let visitCompletedId = '';   // fresh COMPLETED visit (for referral tests)
let visitCancelledId = '';   // fresh CANCELLED visit

const rand = () => Math.floor(1000000000 + Math.random() * 9000000000);

async function registerAndLogin(role: string, facilityId?: string) {
  const phone = `+91${rand()}`;
  await request(app).post('/api/auth/register').send({
    phoneNumber: phone, password: 'testpassword', role,
  });
  if (facilityId) {
    await prisma.user.updateMany({
      where: { phoneNumber: phone },
      data:  { facilityId },
    });
  }
  const login = await request(app).post('/api/auth/login').send({
    phoneNumber: phone, password: 'testpassword',
  });
  const token = login.body?.token ?? '';
  const user  = await prisma.user.findFirst({ where: { phoneNumber: phone } });
  return { token, userId: user?.id ?? '' };
}

async function makeVisit(
  facilityId: string,
  ashaId: string,
  status: 'PENDING_REVIEW' | 'IN_REVIEW' | 'COMPLETED' | 'CANCELLED' = 'PENDING_REVIEW',
  patientId?: string,
) {
  const pid = patientId ?? patientAId;
  return prisma.visit.create({
    data: {
      patientId:  pid,
      facilityId,
      ashaId,
      visitDate:  new Date('2026-09-10'),
      reason:     `Test visit (${status})`,
      status,
    },
  });
}

// ---------------------------------------------------------------------------
// beforeAll
// ---------------------------------------------------------------------------
beforeAll(async () => {
  try {
    const facA = await prisma.facility.create({
      data: { name: 'Consult Test PHC A', type: 'PHC', location: 'District A' },
    });
    const facB = await prisma.facility.create({
      data: { name: 'Consult Test PHC B', type: 'PHC', location: 'District B' },
    });
    facilityAId = facA.id;
    facilityBId = facB.id;

    const drA   = await registerAndLogin('DOCTOR', facilityAId);
    doctorAToken = drA.token;
    doctorAId    = drA.userId;

    const drB   = await registerAndLogin('DOCTOR', facilityBId);
    doctorBToken = drB.token;

    const adm   = await registerAndLogin('ADMIN');
    adminToken   = adm.token;

    const asha  = await registerAndLogin('ASHA', facilityAId);
    ashaToken    = asha.token;
    const ashaId = asha.userId;

    const pt = await prisma.patientProfile.create({
      data: {
        firstName: 'ConsultPatient', lastName: 'TestA',
        dateOfBirth: new Date('1990-01-01'), gender: 'F',
        facilityId: facilityAId,
      },
    });
    patientAId = pt.id;

    // Create a set of visits in different initial states
    const [vPending, vInReview, vCompleted, vCancelled] = await Promise.all([
      makeVisit(facilityAId, ashaId, 'PENDING_REVIEW'),
      makeVisit(facilityAId, ashaId, 'IN_REVIEW'),
      makeVisit(facilityAId, ashaId, 'COMPLETED'),
      makeVisit(facilityAId, ashaId, 'CANCELLED'),
    ]);
    visitPendingId   = vPending.id;
    visitInReviewId  = vInReview.id;
    visitCompletedId = vCompleted.id;
    visitCancelledId = vCancelled.id;

    dbAvailable = !!(doctorAToken && adminToken && ashaToken);
  } catch {
    dbAvailable = false;
  }
});

// ---------------------------------------------------------------------------
// afterAll — clean up in FK-safe order
// ---------------------------------------------------------------------------
afterAll(async () => {
  if (dbAvailable) {
    // Remove referrals first (FK → visits)
    await prisma.referral.deleteMany({
      where: {
        OR: [
          { sourceFacilityId:      facilityAId },
          { destinationFacilityId: facilityAId },
          { sourceFacilityId:      facilityBId },
          { destinationFacilityId: facilityBId },
        ],
      },
    });
    // Consultations
    await prisma.consultation.deleteMany({
      where: { visit: { facilityId: { in: [facilityAId, facilityBId] } } },
    });
    // Visits
    await prisma.visit.deleteMany({
      where: { facilityId: { in: [facilityAId, facilityBId] } },
    });
    // Patients
    await prisma.patientProfile.deleteMany({
      where: { facilityId: { in: [facilityAId, facilityBId] } },
    });
    // Facilities
    await prisma.facility.deleteMany({
      where: { id: { in: [facilityAId, facilityBId] } },
    });
  }
  await prisma.$disconnect();
});

// ===========================================================================
// describe: POST /api/visits/:id/consultation
// ===========================================================================
describe('POST /api/visits/:id/consultation', () => {

  // ── Auth / role guards ──────────────────────────────────────────────────

  it('returns 401 when unauthenticated', async () => {
    const res = await request(app)
      .post(`/api/visits/${visitPendingId}/consultation`)
      .send({ diagnosis: 'Flu' });
    expect(res.status).toBe(401);
  });

  it('returns 403 for ADMIN role', async () => {
    if (!dbAvailable) return;
    const res = await request(app)
      .post(`/api/visits/${visitPendingId}/consultation`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ diagnosis: 'Flu' });
    expect(res.status).toBe(403);
  });

  it('returns 403 for ASHA role', async () => {
    if (!dbAvailable) return;
    const res = await request(app)
      .post(`/api/visits/${visitPendingId}/consultation`)
      .set('Authorization', `Bearer ${ashaToken}`)
      .send({ diagnosis: 'Flu' });
    expect(res.status).toBe(403);
  });

  // ── Payload validation ──────────────────────────────────────────────────

  it('returns 400 when diagnosis is missing', async () => {
    if (!dbAvailable) return;
    const res = await request(app)
      .post(`/api/visits/${visitPendingId}/consultation`)
      .set('Authorization', `Bearer ${doctorAToken}`)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.message).toContain('diagnosis');
  });

  // ── State machine — PENDING_REVIEW ──────────────────────────────────────

  it('creates consultation for PENDING_REVIEW visit and transitions it to COMPLETED', async () => {
    if (!dbAvailable) return;
    // Need a fresh PENDING_REVIEW visit so this test is independent
    const ashaUser = await prisma.user.findFirst({ where: { facilityId: facilityAId, role: 'ASHA' } });
    const freshVisit = await makeVisit(facilityAId, ashaUser!.id, 'PENDING_REVIEW');

    const res = await request(app)
      .post(`/api/visits/${freshVisit.id}/consultation`)
      .set('Authorization', `Bearer ${doctorAToken}`)
      .send({ diagnosis: 'Viral fever', treatment: 'Paracetamol', notes: 'Rest advised' });

    expect(res.status).toBe(201);
    expect(res.body.visit.status).toBe('COMPLETED');
    expect(res.body.visit.doctorId).toBe(doctorAId);
    expect(res.body.consultation.diagnosis).toBe('Viral fever');

    // DB confirmation
    const dbVisit = await prisma.visit.findUnique({ where: { id: freshVisit.id } });
    expect(dbVisit?.status).toBe('COMPLETED');
    expect(dbVisit?.doctorId).toBe(doctorAId);
  });

  // ── State machine — IN_REVIEW ───────────────────────────────────────────

  it('creates consultation for IN_REVIEW visit and transitions it to COMPLETED', async () => {
    if (!dbAvailable) return;
    const ashaUser = await prisma.user.findFirst({ where: { facilityId: facilityAId, role: 'ASHA' } });
    const freshVisit = await makeVisit(facilityAId, ashaUser!.id, 'IN_REVIEW');

    const res = await request(app)
      .post(`/api/visits/${freshVisit.id}/consultation`)
      .set('Authorization', `Bearer ${doctorAToken}`)
      .send({ diagnosis: 'Hypertension', prescription: 'Amlodipine 5mg' });

    expect(res.status).toBe(201);
    expect(res.body.visit.status).toBe('COMPLETED');
    expect(res.body.consultation.prescription).toBe('Amlodipine 5mg');
  });

  // ── State machine — COMPLETED (reject duplicate) ────────────────────────

  it('returns 422 for a COMPLETED visit', async () => {
    if (!dbAvailable) return;
    const res = await request(app)
      .post(`/api/visits/${visitCompletedId}/consultation`)
      .set('Authorization', `Bearer ${doctorAToken}`)
      .send({ diagnosis: 'Should fail' });
    expect(res.status).toBe(422);
    expect(res.body.message).toContain('already exists');
  });

  // ── State machine — CANCELLED ───────────────────────────────────────────

  it('returns 422 for a CANCELLED visit', async () => {
    if (!dbAvailable) return;
    const res = await request(app)
      .post(`/api/visits/${visitCancelledId}/consultation`)
      .set('Authorization', `Bearer ${doctorAToken}`)
      .send({ diagnosis: 'Should fail' });
    expect(res.status).toBe(422);
    expect(res.body.message).toContain('cancelled');
  });

  // ── Facility isolation ──────────────────────────────────────────────────

  it('Doctor B (different facility) gets 404 on Facility A visit', async () => {
    if (!dbAvailable) return;
    const ashaUser = await prisma.user.findFirst({ where: { facilityId: facilityAId, role: 'ASHA' } });
    const freshVisit = await makeVisit(facilityAId, ashaUser!.id, 'PENDING_REVIEW');

    const res = await request(app)
      .post(`/api/visits/${freshVisit.id}/consultation`)
      .set('Authorization', `Bearer ${doctorBToken}`)
      .send({ diagnosis: 'Should get 404' });

    expect(res.status).toBe(404);
  });

  // ── doctorId is server-authoritative ───────────────────────────────────

  it('ignores doctorId in request body and uses authenticated doctor identity', async () => {
    if (!dbAvailable) return;
    const ashaUser = await prisma.user.findFirst({ where: { facilityId: facilityAId, role: 'ASHA' } });
    const freshVisit = await makeVisit(facilityAId, ashaUser!.id, 'PENDING_REVIEW');

    const res = await request(app)
      .post(`/api/visits/${freshVisit.id}/consultation`)
      .set('Authorization', `Bearer ${doctorAToken}`)
      .send({ diagnosis: 'Test', doctorId: 'spoofed-id-should-be-ignored' });

    expect(res.status).toBe(201);
    expect(res.body.visit.doctorId).toBe(doctorAId);
    expect(res.body.consultation.doctorId).toBe(doctorAId);
  });

});

// ===========================================================================
// describe: POST /api/referrals
// ===========================================================================
describe('POST /api/referrals', () => {

  it('returns 401 when unauthenticated', async () => {
    const res = await request(app).post('/api/referrals').send({});
    expect(res.status).toBe(401);
  });

  it('returns 403 for ASHA role', async () => {
    if (!dbAvailable) return;
    const res = await request(app)
      .post('/api/referrals')
      .set('Authorization', `Bearer ${ashaToken}`)
      .send({ visitId: visitCompletedId, destinationFacilityId: facilityBId, reason: 'x' });
    expect(res.status).toBe(403);
  });

  it('returns 403 for ADMIN role', async () => {
    if (!dbAvailable) return;
    const res = await request(app)
      .post('/api/referrals')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ visitId: visitCompletedId, destinationFacilityId: facilityBId, reason: 'x' });
    expect(res.status).toBe(403);
  });

  it('returns 400 when visitId is missing', async () => {
    if (!dbAvailable) return;
    const res = await request(app)
      .post('/api/referrals')
      .set('Authorization', `Bearer ${doctorAToken}`)
      .send({ destinationFacilityId: facilityBId, reason: 'Specialist' });
    expect(res.status).toBe(400);
  });

  it('returns 422 when visit is not COMPLETED', async () => {
    if (!dbAvailable) return;
    const res = await request(app)
      .post('/api/referrals')
      .set('Authorization', `Bearer ${doctorAToken}`)
      .send({ visitId: visitPendingId, destinationFacilityId: facilityBId, reason: 'Specialist' });
    expect(res.status).toBe(422);
    expect(res.body.message).toContain('COMPLETED');
  });

  it('creates referral for a COMPLETED visit and returns 201', async () => {
    if (!dbAvailable) return;
    // Create a fresh COMPLETED visit (visitCompletedId may get a referral in a later test)
    const ashaUser = await prisma.user.findFirst({ where: { facilityId: facilityAId, role: 'ASHA' } });
    const freshCompleted = await makeVisit(facilityAId, ashaUser!.id, 'COMPLETED');

    const res = await request(app)
      .post('/api/referrals')
      .set('Authorization', `Bearer ${doctorAToken}`)
      .send({
        visitId:               freshCompleted.id,
        destinationFacilityId: facilityBId,
        reason:                'Requires specialist care',
      });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('INITIATED');
    expect(res.body.sourceFacilityId).toBe(facilityAId);
    expect(res.body.destinationFacilityId).toBe(facilityBId);
    expect(res.body.referringDoctorId).toBe(doctorAId);
    expect(res.body.patientId).toBe(patientAId);
  });

  it('returns 422 on duplicate referral for same visit', async () => {
    if (!dbAvailable) return;
    const ashaUser = await prisma.user.findFirst({ where: { facilityId: facilityAId, role: 'ASHA' } });
    const freshCompleted = await makeVisit(facilityAId, ashaUser!.id, 'COMPLETED');

    // First referral
    await request(app)
      .post('/api/referrals')
      .set('Authorization', `Bearer ${doctorAToken}`)
      .send({ visitId: freshCompleted.id, destinationFacilityId: facilityBId, reason: 'First' });

    // Duplicate
    const res = await request(app)
      .post('/api/referrals')
      .set('Authorization', `Bearer ${doctorAToken}`)
      .send({ visitId: freshCompleted.id, destinationFacilityId: facilityBId, reason: 'Second' });

    expect(res.status).toBe(422);
    expect(res.body.message).toContain('already exists');
  });

  it('Doctor B cannot create referral for Facility A visit', async () => {
    if (!dbAvailable) return;
    const ashaUser = await prisma.user.findFirst({ where: { facilityId: facilityAId, role: 'ASHA' } });
    const freshCompleted = await makeVisit(facilityAId, ashaUser!.id, 'COMPLETED');

    const res = await request(app)
      .post('/api/referrals')
      .set('Authorization', `Bearer ${doctorBToken}`)
      .send({ visitId: freshCompleted.id, destinationFacilityId: facilityAId, reason: 'Cross-facility attempt' });

    expect(res.status).toBe(404);
  });

});

// ===========================================================================
// describe: GET /api/referrals
// ===========================================================================
describe('GET /api/referrals', () => {

  // Referral created in this describe's beforeAll for listing tests
  let listReferralId = '';

  beforeAll(async () => {
    if (!dbAvailable) return;
    const ashaUser = await prisma.user.findFirst({ where: { facilityId: facilityAId, role: 'ASHA' } });
    const v = await makeVisit(facilityAId, ashaUser!.id, 'COMPLETED');
    const ref = await prisma.referral.create({
      data: {
        visitId:              v.id,
        patientId:            patientAId,
        referringDoctorId:    doctorAId,
        sourceFacilityId:     facilityAId,
        destinationFacilityId: facilityBId,
        reason:               'Listing test referral',
        status:               'INITIATED',
      },
    });
    listReferralId = ref.id;
  });

  it('returns 401 when unauthenticated', async () => {
    const res = await request(app).get('/api/referrals');
    expect(res.status).toBe(401);
  });

  it('returns 403 for ASHA role', async () => {
    if (!dbAvailable) return;
    const res = await request(app)
      .get('/api/referrals')
      .set('Authorization', `Bearer ${ashaToken}`);
    expect(res.status).toBe(403);
  });

  it('Doctor A sees referrals involving Facility A (as source)', async () => {
    if (!dbAvailable || !listReferralId) return;
    const res = await request(app)
      .get('/api/referrals')
      .set('Authorization', `Bearer ${doctorAToken}`);
    expect(res.status).toBe(200);
    const ids = res.body.map((r: any) => r.id);
    expect(ids).toContain(listReferralId);
  });

  it('Doctor B sees referrals involving Facility B (as destination)', async () => {
    if (!dbAvailable || !listReferralId) return;
    const res = await request(app)
      .get('/api/referrals')
      .set('Authorization', `Bearer ${doctorBToken}`);
    expect(res.status).toBe(200);
    const ids = res.body.map((r: any) => r.id);
    expect(ids).toContain(listReferralId); // B is the destination
  });

  it('Admin sees all referrals', async () => {
    if (!dbAvailable || !listReferralId) return;
    const res = await request(app)
      .get('/api/referrals')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    const ids = res.body.map((r: any) => r.id);
    expect(ids).toContain(listReferralId);
  });

});

// ===========================================================================
// describe: PATCH /api/referrals/:id/status
// ===========================================================================
describe('PATCH /api/referrals/:id/status', () => {

  async function freshReferral() {
    if (!dbAvailable) return '';
    const ashaUser = await prisma.user.findFirst({ where: { facilityId: facilityAId, role: 'ASHA' } });
    const v = await makeVisit(facilityAId, ashaUser!.id, 'COMPLETED');
    const ref = await prisma.referral.create({
      data: {
        visitId:               v.id,
        patientId:             patientAId,
        referringDoctorId:     doctorAId,
        sourceFacilityId:      facilityAId,
        destinationFacilityId: facilityBId,
        reason:                'Status test referral',
        status:                'INITIATED',
      },
    });
    return ref.id;
  }

  it('returns 401 when unauthenticated', async () => {
    const res = await request(app)
      .patch('/api/referrals/some-id/status')
      .send({ status: 'IN_TRANSIT' });
    expect(res.status).toBe(401);
  });

  it('returns 403 for ASHA role', async () => {
    if (!dbAvailable) return;
    const refId = await freshReferral();
    if (!refId) return;
    const res = await request(app)
      .patch(`/api/referrals/${refId}/status`)
      .set('Authorization', `Bearer ${ashaToken}`)
      .send({ status: 'IN_TRANSIT' });
    expect(res.status).toBe(403);
  });

  it('INITIATED → IN_TRANSIT by source-facility Doctor A succeeds', async () => {
    if (!dbAvailable) return;
    const refId = await freshReferral();
    if (!refId) return;
    const res = await request(app)
      .patch(`/api/referrals/${refId}/status`)
      .set('Authorization', `Bearer ${doctorAToken}`)
      .send({ status: 'IN_TRANSIT' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('IN_TRANSIT');
  });

  it('INITIATED → IN_TRANSIT rejected when called by destination-facility Doctor B', async () => {
    if (!dbAvailable) return;
    const refId = await freshReferral();
    if (!refId) return;
    const res = await request(app)
      .patch(`/api/referrals/${refId}/status`)
      .set('Authorization', `Bearer ${doctorBToken}`)
      .send({ status: 'IN_TRANSIT' });
    expect(res.status).toBe(403);
    expect(res.body.message).toContain('source-facility');
  });

  it('Full forward progression INITIATED → IN_TRANSIT → RECEIVED → COMPLETED', async () => {
    if (!dbAvailable) return;
    const refId = await freshReferral();
    if (!refId) return;

    // A dispatches
    let res = await request(app)
      .patch(`/api/referrals/${refId}/status`)
      .set('Authorization', `Bearer ${doctorAToken}`)
      .send({ status: 'IN_TRANSIT' });
    expect(res.body.status).toBe('IN_TRANSIT');

    // B receives
    res = await request(app)
      .patch(`/api/referrals/${refId}/status`)
      .set('Authorization', `Bearer ${doctorBToken}`)
      .send({ status: 'RECEIVED' });
    expect(res.body.status).toBe('RECEIVED');

    // B completes
    res = await request(app)
      .patch(`/api/referrals/${refId}/status`)
      .set('Authorization', `Bearer ${doctorBToken}`)
      .send({ status: 'COMPLETED' });
    expect(res.body.status).toBe('COMPLETED');
  });

  it('Cannot transition a COMPLETED referral', async () => {
    if (!dbAvailable) return;
    // Create a referral already COMPLETED
    const ashaUser = await prisma.user.findFirst({ where: { facilityId: facilityAId, role: 'ASHA' } });
    const v = await makeVisit(facilityAId, ashaUser!.id, 'COMPLETED');
    const ref = await prisma.referral.create({
      data: {
        visitId:               v.id,
        patientId:             patientAId,
        referringDoctorId:     doctorAId,
        sourceFacilityId:      facilityAId,
        destinationFacilityId: facilityBId,
        reason:                'Terminal test',
        status:                'COMPLETED',
      },
    });

    const res = await request(app)
      .patch(`/api/referrals/${ref.id}/status`)
      .set('Authorization', `Bearer ${doctorAToken}`)
      .send({ status: 'CANCELLED' });
    expect(res.status).toBe(422);
    expect(res.body.message).toContain('terminal');
  });

  it('Source-facility Doctor A can cancel an INITIATED referral', async () => {
    if (!dbAvailable) return;
    const refId = await freshReferral();
    if (!refId) return;
    const res = await request(app)
      .patch(`/api/referrals/${refId}/status`)
      .set('Authorization', `Bearer ${doctorAToken}`)
      .send({ status: 'CANCELLED' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('CANCELLED');
  });

  it('Destination-facility Doctor B can also cancel an INITIATED referral', async () => {
    if (!dbAvailable) return;
    const refId = await freshReferral();
    if (!refId) return;
    const res = await request(app)
      .patch(`/api/referrals/${refId}/status`)
      .set('Authorization', `Bearer ${doctorBToken}`)
      .send({ status: 'CANCELLED' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('CANCELLED');
  });

  it('Invalid transition (INITIATED → RECEIVED) returns 422', async () => {
    if (!dbAvailable) return;
    const refId = await freshReferral();
    if (!refId) return;
    const res = await request(app)
      .patch(`/api/referrals/${refId}/status`)
      .set('Authorization', `Bearer ${doctorAToken}`)
      .send({ status: 'RECEIVED' });
    expect(res.status).toBe(422);
    expect(res.body.message).toContain('Invalid transition');
  });

  it('Doctor with no facility involvement gets 403', async () => {
    if (!dbAvailable) return;
    // Register a third doctor in neither facility
    const drC = await registerAndLogin('DOCTOR');
    const refId = await freshReferral();
    if (!refId) return;
    const res = await request(app)
      .patch(`/api/referrals/${refId}/status`)
      .set('Authorization', `Bearer ${drC.token}`)
      .send({ status: 'IN_TRANSIT' });
    expect(res.status).toBe(403);
    expect(res.body.message).toContain('not involved');
  });

});
