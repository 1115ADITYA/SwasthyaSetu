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

export type SyncItem = z.infer<typeof syncItemSchema>;
export type SyncPushBody = z.infer<typeof syncPushBodySchema>;
