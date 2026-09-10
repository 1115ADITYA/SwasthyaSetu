import prisma from '../../core/db/prisma';
import {
  SyncItem,
  registerPatientPayloadSchema,
  createVisitPayloadSchema,
} from './sync.schema';

/**
 * Result for a single sync item returned to the ASHA client.
 */
export interface SyncItemResult {
  clientSyncId: string;
  status: 'SUCCESS' | 'DUPLICATE' | 'FAILED';
  entityId: string;
  error?: string;
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

/**
 * processSyncBatch — Phase 2B-2: Full Sync Processing
 *
 * Items are processed SEQUENTIALLY in the order received.
 * - No Promise.all — each item awaits the previous one.
 * - This ensures REGISTER_PATIENT is fully committed before
 *   a CREATE_VISIT that references the new patient runs.
 * - Each item is independent: a failed item does NOT abort the
 *   batch or rollback previously successful items.
 */
export async function processSyncBatch(
  items: SyncItem[],
  ashaId: string,
  ashaFacilityId: string | null,
): Promise<SyncItemResult[]> {
  const results: SyncItemResult[] = [];
  for (const item of items) {
    const result = await processSyncItem(item, ashaId, ashaFacilityId);
    results.push(result);
  }
  return results;
}

// ---------------------------------------------------------------------------
// Item dispatcher
// ---------------------------------------------------------------------------

async function processSyncItem(
  item: SyncItem,
  ashaId: string,
  ashaFacilityId: string | null,
): Promise<SyncItemResult> {
  try {
    // ── Idempotency check ──────────────────────────────────────────────────
    // SyncLog.clientSyncId is the sole idempotency key.
    // If it already exists, return DUPLICATE without touching any entity data.
    const existing = await prisma.syncLog.findUnique({
      where: { clientSyncId: item.clientSyncId },
    });
    if (existing) {
      return {
        clientSyncId: item.clientSyncId,
        status: 'DUPLICATE',
        entityId: item.entityId,
      };
    }

    // ── Dispatch to operation handler ──────────────────────────────────────
    if (item.operation === 'REGISTER_PATIENT') {
      return await handleRegisterPatient(item, ashaId, ashaFacilityId);
    }
    // item.operation === 'CREATE_VISIT' is the only remaining value in the union
    return await handleCreateVisit(item, ashaId, ashaFacilityId);
  } catch (error) {
    // Concurrency race: two requests raced past the findUnique check.
    // The SyncLog unique constraint caught the second one — treat as DUPLICATE.
    if (isPrismaP2002OnField(error, 'clientSyncId')) {
      return {
        clientSyncId: item.clientSyncId,
        status: 'DUPLICATE',
        entityId: item.entityId,
      };
    }

    return {
      clientSyncId: item.clientSyncId,
      status: 'FAILED',
      entityId: item.entityId,
      error:
        error instanceof Error
          ? error.message
          : 'Unexpected error during sync processing',
    };
  }
}

// ---------------------------------------------------------------------------
// REGISTER_PATIENT
// ---------------------------------------------------------------------------

async function handleRegisterPatient(
  item: SyncItem,
  ashaId: string,
  ashaFacilityId: string | null,
): Promise<SyncItemResult> {
  // Validate operation-specific payload fields
  const parsed = registerPatientPayloadSchema.safeParse(item.payload);
  if (!parsed.success) {
    return {
      clientSyncId: item.clientSyncId,
      status: 'FAILED',
      entityId: item.entityId,
      error: formatZodError(parsed.error),
    };
  }

  const { firstName, lastName, dateOfBirth, gender, abhaId, facilityId } =
    parsed.data;

  // Facility safety: ASHA may only register patients in their own facility.
  // If ashaFacilityId is null (not yet assigned), we allow the payload facilityId.
  if (ashaFacilityId !== null && facilityId !== ashaFacilityId) {
    return {
      clientSyncId: item.clientSyncId,
      status: 'FAILED',
      entityId: item.entityId,
      error: "facilityId does not match the authenticated ASHA's assigned facility",
    };
  }

  // Atomic transaction:
  //   1. Create PatientProfile — item.entityId becomes the actual DB id.
  //   2. Create SyncLog — records this clientSyncId so future pushes get DUPLICATE.
  //
  // If either fails, both are rolled back.  No partial data is left.
  await prisma.$transaction(async (tx) => {
    await tx.patientProfile.create({
      data: {
        id: item.entityId,          // client-generated UUID is the canonical DB id
        firstName,
        lastName,
        dateOfBirth: new Date(dateOfBirth),
        gender,
        abhaId,                     // undefined when not supplied — Prisma omits the field
        facilityId,
      },
    });

    await tx.syncLog.create({
      data: {
        clientSyncId: item.clientSyncId,
        operation: 'REGISTER_PATIENT',
        entityId: item.entityId,
        ashaId,
      },
    });
  });

  return {
    clientSyncId: item.clientSyncId,
    status: 'SUCCESS',
    entityId: item.entityId,
  };
}

// ---------------------------------------------------------------------------
// CREATE_VISIT
// ---------------------------------------------------------------------------

async function handleCreateVisit(
  item: SyncItem,
  ashaId: string,
  ashaFacilityId: string | null,
): Promise<SyncItemResult> {
  // Validate operation-specific payload fields
  const parsed = createVisitPayloadSchema.safeParse(item.payload);
  if (!parsed.success) {
    return {
      clientSyncId: item.clientSyncId,
      status: 'FAILED',
      entityId: item.entityId,
      error: formatZodError(parsed.error),
    };
  }

  const {
    patientId,
    facilityId,
    doctorId,
    visitDate,
    reason,
    status,
    notes,
    vitals,
    symptoms,
  } = parsed.data;
  // NOTE: parsed.data.ashaId is deliberately NOT used below.
  //       The authenticated ASHA identity (ashaId from JWT) always wins.

  // Facility safety
  if (ashaFacilityId !== null && facilityId !== ashaFacilityId) {
    return {
      clientSyncId: item.clientSyncId,
      status: 'FAILED',
      entityId: item.entityId,
      error: "facilityId does not match the authenticated ASHA's assigned facility",
    };
  }

  // Atomic transaction:
  //   1. Create Visit         — item.entityId becomes the actual DB id.
  //   2. Create Vitals        — if included in payload.
  //   3. Create Symptoms      — if included in payload.
  //   4. Create SyncLog       — records this clientSyncId for idempotency.
  //
  // If Vitals or Symptom creation fails, Visit and SyncLog are both rolled back.
  // No partial data is left.
  await prisma.$transaction(async (tx) => {
    await tx.visit.create({
      data: {
        id: item.entityId,          // client-generated UUID is the canonical DB id
        patientId,
        facilityId,
        ashaId,                     // authenticated ASHA — payload.ashaId is ignored
        doctorId,
        visitDate: new Date(visitDate),
        reason,
        status: status ?? 'PENDING_REVIEW',
        notes,
      },
    });

    if (vitals) {
      await tx.vitals.create({
        data: {
          visitId: item.entityId,
          temperature: vitals.temperature,
          systolic: vitals.systolic,
          diastolic: vitals.diastolic,
          heartRate: vitals.heartRate,
          spO2: vitals.spO2,
          respiratoryRate: vitals.respiratoryRate,
          weight: vitals.weight,
          recordedAt: vitals.recordedAt ? new Date(vitals.recordedAt) : new Date(),
        },
      });
    }

    if (symptoms && symptoms.length > 0) {
      await tx.symptom.createMany({
        data: symptoms.map((s) => ({
          visitId: item.entityId,
          name: s.name,
          severity: s.severity,
          durationDays: s.durationDays,
          notes: s.notes,
        })),
      });
    }

    await tx.syncLog.create({
      data: {
        clientSyncId: item.clientSyncId,
        operation: 'CREATE_VISIT',
        entityId: item.entityId,
        ashaId,
      },
    });
  });

  return {
    clientSyncId: item.clientSyncId,
    status: 'SUCCESS',
    entityId: item.entityId,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Duck-type check for Prisma P2002 unique constraint violations on a named field.
 * Using duck typing avoids a hard dependency on the Prisma runtime library path,
 * and allows plain objects to be thrown in unit tests.
 */
function isPrismaP2002OnField(error: unknown, field: string): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const err = error as Record<string, unknown>;
  if (err['code'] !== 'P2002') return false;
  const meta = err['meta'];
  if (typeof meta !== 'object' || meta === null) return false;
  const target = (meta as Record<string, unknown>)['target'];
  if (Array.isArray(target)) return (target as unknown[]).includes(field);
  if (typeof target === 'string') return target.includes(field);
  return false;
}

function formatZodError(error: { issues: Array<{ message: string }> }): string {
  return `Invalid payload: ${error.issues.map((i) => i.message).join(', ')}`;
}
