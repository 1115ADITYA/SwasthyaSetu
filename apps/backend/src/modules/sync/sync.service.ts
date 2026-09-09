import { SyncItem } from './sync.schema';

/**
 * Result for a single sync item returned to the ASHA client.
 */
export interface SyncItemResult {
  clientSyncId: string;
  status: 'SUCCESS' | 'DUPLICATE' | 'FAILED';
  entityId: string;
  error?: string;
}

/**
 * processSyncBatch
 *
 * Phase 2B-1: Foundation stub.
 *
 * This function is intentionally NOT implemented yet.  Phase 2B-2 will add:
 *   - SyncLog idempotency check (DUPLICATE detection via clientSyncId)
 *   - REGISTER_PATIENT handler
 *   - CREATE_VISIT handler
 *
 * Each item is returned with status FAILED and a clear "not implemented" error
 * so that callers can distinguish a stub response from a real SUCCESS/DUPLICATE.
 * This makes it impossible to confuse stub output with real sync processing.
 */
export async function processSyncBatch(
  items: SyncItem[],
  _ashaId: string,
): Promise<SyncItemResult[]> {
  return items.map((item) => ({
    clientSyncId: item.clientSyncId,
    status: 'FAILED' as const,
    entityId: item.entityId,
    error: 'NOT_IMPLEMENTED: sync processing will be added in Phase 2B-2',
  }));
}
