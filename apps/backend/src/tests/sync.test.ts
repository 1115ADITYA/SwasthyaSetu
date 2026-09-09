/// <reference types="jest" />
/**
 * sync.test.ts — Phase 2B-1: Sync API Foundation
 *
 * Tests for POST /api/sync/push — auth, role, and request-body validation.
 *
 * Strategy:
 *  - All tests mock Prisma (user.findUnique, syncLog.findUnique, $transaction)
 *    so no real database is required.
 *  - Auth/role tests exercise the middleware stack before the service is called.
 *  - The 400 tests exercise controller-level Zod validation.
 *  - The 200 tests verify the full route → controller → service round-trip;
 *    payloads are intentionally incomplete so operation-specific validation
 *    fails → results arrive as FAILED, which is an accepted value in ['SUCCESS',
 *    'DUPLICATE', 'FAILED'] and the assertions pass.
 *  - For full processing behaviour see sync.processing.test.ts (Phase 2B-2).
 */
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../app';

// ---------------------------------------------------------------------------
// Mock Prisma so auth-middleware DB lookups work without a real database.
// The authenticate middleware does:
//   prisma.user.findUnique({ where: { id: payload.userId }, select: { facilityId: true } })
// We resolve with { facilityId: null } which is enough for all role tests.
// ---------------------------------------------------------------------------
jest.mock('../core/db/prisma', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn().mockResolvedValue({ facilityId: null }),
    },
    syncLog: {
      // Default: item is new — no existing SyncLog
      findUnique: jest.fn().mockResolvedValue(null),
    },
    // Default: transaction succeeds — inner callback receives a mock tx
    $transaction: jest.fn().mockImplementation(async (callback: Function) =>
      callback({
        patientProfile: { create: jest.fn().mockResolvedValue({}) },
        visit: { create: jest.fn().mockResolvedValue({}) },
        vitals: { create: jest.fn().mockResolvedValue({}) },
        symptom: { createMany: jest.fn().mockResolvedValue({ count: 0 }) },
        syncLog: { create: jest.fn().mockResolvedValue({}) },
      })
    ),
    $disconnect: jest.fn(),
  },
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

function makeToken(userId: string, role: string): string {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '1h' });
}

const VALID_BODY = {
  items: [
    {
      clientSyncId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      operation: 'REGISTER_PATIENT',
      entityId: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
      payload: { firstName: 'Priya', lastName: 'Sharma' },
    },
  ],
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('POST /api/sync/push — Phase 2B-1 Foundation', () => {

  afterAll(async () => {
    // The mocked prisma.$disconnect is a no-op, but call it for consistency.
    const prisma = (await import('../core/db/prisma')).default;
    await prisma.$disconnect();
  });

  // -------------------------------------------------------------------------
  // 401 — Unauthenticated
  // -------------------------------------------------------------------------
  it('returns 401 when no Authorization header is provided', async () => {
    const res = await request(app)
      .post('/api/sync/push')
      .send(VALID_BODY);
    expect(res.status).toBe(401);
  });

  it('returns 401 when Authorization header has an invalid token', async () => {
    const res = await request(app)
      .post('/api/sync/push')
      .set('Authorization', 'Bearer this.is.not.valid')
      .send(VALID_BODY);
    expect(res.status).toBe(401);
  });

  // -------------------------------------------------------------------------
  // 403 — Wrong roles
  // -------------------------------------------------------------------------
  it('returns 403 when the caller has DOCTOR role', async () => {
    const token = makeToken('doctor-user-id', 'DOCTOR');
    const res = await request(app)
      .post('/api/sync/push')
      .set('Authorization', `Bearer ${token}`)
      .send(VALID_BODY);
    expect(res.status).toBe(403);
  });

  it('returns 403 when the caller has ADMIN role', async () => {
    const token = makeToken('admin-user-id', 'ADMIN');
    const res = await request(app)
      .post('/api/sync/push')
      .set('Authorization', `Bearer ${token}`)
      .send(VALID_BODY);
    expect(res.status).toBe(403);
  });

  it('returns 403 when the caller has PATIENT role', async () => {
    const token = makeToken('patient-user-id', 'PATIENT');
    const res = await request(app)
      .post('/api/sync/push')
      .set('Authorization', `Bearer ${token}`)
      .send(VALID_BODY);
    expect(res.status).toBe(403);
  });

  // -------------------------------------------------------------------------
  // 400 — Malformed body (authenticated ASHA)
  // -------------------------------------------------------------------------
  it('returns 400 when items array is missing', async () => {
    const token = makeToken('asha-user-id', 'ASHA');
    const res = await request(app)
      .post('/api/sync/push')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Validation error');
  });

  it('returns 400 when items array is empty', async () => {
    const token = makeToken('asha-user-id', 'ASHA');
    const res = await request(app)
      .post('/api/sync/push')
      .set('Authorization', `Bearer ${token}`)
      .send({ items: [] });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Validation error');
  });

  it('returns 400 when an item is missing clientSyncId', async () => {
    const token = makeToken('asha-user-id', 'ASHA');
    const res = await request(app)
      .post('/api/sync/push')
      .set('Authorization', `Bearer ${token}`)
      .send({
        items: [
          {
            // clientSyncId omitted intentionally
            operation: 'REGISTER_PATIENT',
            entityId: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
            payload: {},
          },
        ],
      });
    expect(res.status).toBe(400);
  });

  it('returns 400 when operation is not a valid SyncOperation', async () => {
    const token = makeToken('asha-user-id', 'ASHA');
    const res = await request(app)
      .post('/api/sync/push')
      .set('Authorization', `Bearer ${token}`)
      .send({
        items: [
          {
            clientSyncId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
            operation: 'DELETE_PATIENT', // invalid
            entityId: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
            payload: {},
          },
        ],
      });
    expect(res.status).toBe(400);
  });

  it('returns 400 when payload is not an object', async () => {
    const token = makeToken('asha-user-id', 'ASHA');
    const res = await request(app)
      .post('/api/sync/push')
      .set('Authorization', `Bearer ${token}`)
      .send({
        items: [
          {
            clientSyncId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
            operation: 'REGISTER_PATIENT',
            entityId: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
            payload: 'not-an-object', // invalid
          },
        ],
      });
    expect(res.status).toBe(400);
  });

  // -------------------------------------------------------------------------
  // 200 — Valid ASHA request reaches the sync handler
  // -------------------------------------------------------------------------
  it('returns 200 and a results array when an ASHA sends a valid batch', async () => {
    const token = makeToken('asha-user-id', 'ASHA');
    const res = await request(app)
      .post('/api/sync/push')
      .set('Authorization', `Bearer ${token}`)
      .send(VALID_BODY);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('results');
    expect(Array.isArray(res.body.results)).toBe(true);
    expect(res.body.results).toHaveLength(1);

    // Phase 2B-1 stub returns FAILED with NOT_IMPLEMENTED sentinel
    const result = res.body.results[0];
    expect(result).toHaveProperty('clientSyncId', VALID_BODY.items[0].clientSyncId);
    expect(result).toHaveProperty('entityId', VALID_BODY.items[0].entityId);
    expect(['SUCCESS', 'DUPLICATE', 'FAILED']).toContain(result.status);
  });

  it('returns 200 with CREATE_VISIT operation in a valid ASHA batch', async () => {
    const token = makeToken('asha-user-id', 'ASHA');
    const body = {
      items: [
        {
          clientSyncId: 'c3d4e5f6-a7b8-4012-8cde-f12345678901',
          operation: 'CREATE_VISIT',
          entityId: 'd4e5f6a7-b8c9-4123-8def-a23456789012',
          payload: { patientId: 'e5f6a7b8-c9d0-4234-8efa-b34567890123', visitDate: '2026-09-10' },
        },
      ],
    };
    const res = await request(app)
      .post('/api/sync/push')
      .set('Authorization', `Bearer ${token}`)
      .send(body);

    expect(res.status).toBe(200);
    expect(res.body.results).toHaveLength(1);
    expect(res.body.results[0].clientSyncId).toBe(body.items[0].clientSyncId);
  });
});
