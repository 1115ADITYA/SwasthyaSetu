import { getDatabase } from './database';
import { SyncQueueItem, SyncStatus, SyncOperation } from '../types';

export const enqueueSyncItem = async (params: {
  clientSyncId: string;
  operation: SyncOperation;
  entityType: string;
  entityId?: string;
  payload: any;
}): Promise<void> => {
  const db = await getDatabase();
  const now = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO sync_queue (id, clientSyncId, operation, entityType, entityId, payloadJson, status, retryCount, errorMessage, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, 'PENDING', 0, NULL, ?, ?)
     ON CONFLICT(clientSyncId) DO UPDATE SET
       payloadJson=excluded.payloadJson,
       status='PENDING',
       updatedAt=excluded.updatedAt;`,
    [
      params.clientSyncId,
      params.clientSyncId,
      params.operation,
      params.entityType,
      params.entityId || null,
      JSON.stringify(params.payload),
      now,
      now,
    ]
  );
};

export const getPendingOrFailedQueueItems = async (): Promise<SyncQueueItem[]> => {
  const db = await getDatabase();
  // Includes 'SYNCING' as well: if the app is killed or crashes mid-sync (common on
  // low-end devices with flaky rural connectivity), an item can be left stuck in
  // SYNCING forever. Without retrying it here, it would never be picked up again by
  // any future auto-sync, periodic sync, or manual "Force Sync Now" attempt.
  const rows = await db.getAllAsync<any>(
    `SELECT * FROM sync_queue WHERE status IN ('PENDING', 'FAILED', 'SYNCING') ORDER BY createdAt ASC;`
  );

  return rows.map((r) => ({
    id: r.id,
    clientSyncId: r.clientSyncId,
    operation: r.operation as SyncOperation,
    entityType: r.entityType,
    entityId: r.entityId || undefined,
    payload: JSON.parse(r.payloadJson || '{}'),
    status: r.status as SyncStatus,
    retryCount: r.retryCount || 0,
    errorMessage: r.errorMessage || undefined,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }));
};

export const getPendingQueueCount = async (): Promise<number> => {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM sync_queue WHERE status IN ('PENDING', 'FAILED', 'SYNCING');`
  );
  return row?.count || 0;
};

export const updateQueueItemStatus = async (
  clientSyncId: string,
  status: SyncStatus,
  errorMessage?: string
): Promise<void> => {
  const db = await getDatabase();
  const now = new Date().toISOString();

  if (status === 'FAILED') {
    await db.runAsync(
      `UPDATE sync_queue
       SET status = ?, retryCount = retryCount + 1, errorMessage = ?, updatedAt = ?
       WHERE clientSyncId = ?;`,
      [status, errorMessage || null, now, clientSyncId]
    );
  } else {
    await db.runAsync(
      `UPDATE sync_queue
       SET status = ?, errorMessage = ?, updatedAt = ?
       WHERE clientSyncId = ?;`,
      [status, errorMessage || null, now, clientSyncId]
    );
  }
};

export const removeQueueItem = async (clientSyncId: string): Promise<void> => {
  const db = await getDatabase();
  await db.runAsync(`DELETE FROM sync_queue WHERE clientSyncId = ?;`, [clientSyncId]);
};

export const getAllQueueItems = async (): Promise<SyncQueueItem[]> => {
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>(`SELECT * FROM sync_queue ORDER BY createdAt DESC;`);

  return rows.map((r) => ({
    id: r.id,
    clientSyncId: r.clientSyncId,
    operation: r.operation as SyncOperation,
    entityType: r.entityType,
    entityId: r.entityId || undefined,
    payload: JSON.parse(r.payloadJson || '{}'),
    status: r.status as SyncStatus,
    retryCount: r.retryCount || 0,
    errorMessage: r.errorMessage || undefined,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }));
};
