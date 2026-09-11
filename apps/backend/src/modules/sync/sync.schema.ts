import { z } from 'zod';

/**
 * Valid sync operations — mirrors the Prisma SyncOperation enum.
 * Keep this in sync with schema.prisma if new operations are added.
 */
export const SyncOperationEnum = z.enum(['REGISTER_PATIENT', 'CREATE_VISIT']);

/**
 * Schema for a single sync item in a push batch.
 */
export const syncItemSchema = z.object({
  clientSyncId: z.string().uuid({ message: 'clientSyncId must be a valid UUID' }),
  operation: SyncOperationEnum,
  entityId: z.string().uuid({ message: 'entityId must be a valid UUID' }),
  payload: z.record(z.string(), z.unknown()),
});

/**
 * Schema for the full POST /api/sync/push request body.
 */
export const syncPushBodySchema = z.object({
  items: z
    .array(syncItemSchema)
    .min(1, { message: 'items must contain at least one entry' }),
});

// ---------------------------------------------------------------------------
// REGISTER_PATIENT payload schema
// ---------------------------------------------------------------------------

export const registerPatientPayloadSchema = z.object({
  firstName: z.string().min(1, { message: 'firstName is required' }),
  lastName: z.string().min(1, { message: 'lastName is required' }),
  dateOfBirth: z
    .string()
    .refine((d) => !isNaN(Date.parse(d)), { message: 'Invalid dateOfBirth' }),
  gender: z.string().min(1, { message: 'gender is required' }),
  abhaId: z.string().optional(),
  // Facility.id is a plain Prisma String id (@default(uuid()) is only a default,
  // not an enforced format — real facilities in this project can have
  // human-readable ids, e.g. "facility-phc-andheria"). Matches the plain
  // z.string() used for facilityId in patients.controller.ts.
  facilityId: z.string().min(1, { message: 'facilityId is required' }),
});

// ---------------------------------------------------------------------------
// CREATE_VISIT payload schema
// ---------------------------------------------------------------------------

export const vitalsPayloadSchema = z.object({
  temperature: z.number().optional(),
  systolic: z.number().int().optional(),
  diastolic: z.number().int().optional(),
  heartRate: z.number().int().optional(),
  spO2: z.number().optional(),
  respiratoryRate: z.number().int().optional(),
  weight: z.number().optional(),
  recordedAt: z
    .string()
    .refine((d) => !isNaN(Date.parse(d)), { message: 'Invalid recordedAt' })
    .optional(),
});

export const symptomPayloadSchema = z.object({
  name: z.string().min(1, { message: 'symptom name is required' }),
  severity: z.enum(['MILD', 'MODERATE', 'SEVERE']),
  durationDays: z.number().int().min(1),
  notes: z.string().optional(),
});

export const createVisitPayloadSchema = z.object({
  patientId: z.string().uuid({ message: 'patientId must be a valid UUID' }),
  // See registerPatientPayloadSchema above — facilityId is not guaranteed UUID-shaped.
  facilityId: z.string().min(1, { message: 'facilityId is required' }),
  /** Ignored at processing time — authenticated ASHA identity is always used. */
  ashaId: z.string().uuid().optional(),
  doctorId: z.string().uuid().optional(),
  visitDate: z
    .string()
    .refine((d) => !isNaN(Date.parse(d)), { message: 'Invalid visitDate' }),
  reason: z.string().min(1, { message: 'reason is required' }),
  status: z.enum(['PENDING_REVIEW', 'IN_REVIEW', 'COMPLETED', 'CANCELLED']).optional(),
  notes: z.string().optional(),
  vitals: vitalsPayloadSchema.optional(),
  symptoms: z.array(symptomPayloadSchema).optional(),
});

export type SyncItem = z.infer<typeof syncItemSchema>;
export type SyncPushBody = z.infer<typeof syncPushBodySchema>;
export type RegisterPatientPayload = z.infer<typeof registerPatientPayloadSchema>;
export type CreateVisitPayload = z.infer<typeof createVisitPayloadSchema>;
