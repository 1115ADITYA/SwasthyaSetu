import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import {
  enqueueSyncItem,
  getPendingOrFailedQueueItems,
  updateQueueItemStatus,
  removeQueueItem,
  getPendingQueueCount,
} from '../db/syncQueue.repo';
import { insertLocalVisit } from '../db/visits.repo';
import { upsertPatient, markPatientSynced } from '../db/patients.repo';
import { pushSyncBatchApi } from '../api/sync.api';
import { createPatientApi } from '../api/patients.api';
import { createVisitApi } from '../api/visits.api';
import { useSyncStore } from '../store/syncStore';
import { useAuthStore } from '../store/authStore';
import { Visit, Patient, SyncQueueItem } from '../types';
import { ENV } from '../config/env';

// Simple lightweight client UUID generator (RFC4122 v4 compliant)
export const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

let syncTimer: NodeJS.Timeout | null = null;

export const queueLocalVisit = async (visitInput: {
  patientId: string;
  notes?: string;
  vitals: any;
  symptoms: any[];
  status?: string;
}): Promise<{ visitId: string; clientSyncId: string }> => {
  const clientSyncId = generateUUID();
  const visitId = clientSyncId;
  const now = new Date().toISOString();

  const visit: Visit = {
    id: visitId,
    patientId: visitInput.patientId,
    status: visitInput.status || 'COMPLETED',
    notes: visitInput.notes,
    vitals: visitInput.vitals,
    symptoms: visitInput.symptoms,
    createdAt: now,
    isLocalOnly: true,
  };

  // 1. Save visit to local SQLite
  await insertLocalVisit(visit);

  // 2. Enqueue in SQLite sync_queue table
  await enqueueSyncItem({
    clientSyncId,
    operation: 'CREATE_VISIT',
    entityType: 'HealthVisit',
    entityId: visitId,
    payload: {
      patientId: visitInput.patientId,
      status: visit.status,
      notes: visitInput.notes || '',
      vitals: visitInput.vitals,
      symptoms: visitInput.symptoms,
    },
  });

  // 3. Update sync store count
  await useSyncStore.getState().refreshPendingCount();

  // 4. If online and authenticated, trigger background push
  const { isOnline } = useSyncStore.getState();
  const { isAuthenticated } = useAuthStore.getState();
  if (isOnline && isAuthenticated) {
    processSyncQueue().catch((e) => console.warn('[SyncEngine] Immediate sync caught:', e));
  }

  return { visitId, clientSyncId };
};

export const queueLocalPatientRegistration = async (patientInput: {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  facilityId: string;
  abhaId?: string;
}): Promise<{ patient: Patient; clientSyncId: string }> => {
  const clientSyncId = generateUUID();
  const patientId = clientSyncId;
  const now = new Date().toISOString();

  const patient: Patient = {
    id: patientId,
    firstName: patientInput.firstName,
    lastName: patientInput.lastName,
    dateOfBirth: patientInput.dateOfBirth,
    gender: patientInput.gender,
    facilityId: patientInput.facilityId,
    abhaId: patientInput.abhaId || undefined,
    createdAt: now,
    updatedAt: now,
    isLocalOnly: true,
  };

  // 1. Save locally to SQLite
  await upsertPatient(patient, true);

  // 2. Enqueue in SQLite sync_queue
  await enqueueSyncItem({
    clientSyncId,
    operation: 'REGISTER_PATIENT',
    entityType: 'PatientProfile',
    entityId: patientId,
    payload: {
      firstName: patient.firstName,
      lastName: patient.lastName,
      dateOfBirth: patient.dateOfBirth,
      gender: patient.gender,
      facilityId: patient.facilityId,
      abhaId: patient.abhaId,
    },
  });

  // 3. Update sync store
  await useSyncStore.getState().refreshPendingCount();

  // 4. If online and authenticated, trigger push
  const { isOnline } = useSyncStore.getState();
  const { isAuthenticated } = useAuthStore.getState();
  if (isOnline && isAuthenticated) {
    processSyncQueue().catch((e) => console.warn('[SyncEngine] Immediate sync caught:', e));
  }

  return { patient, clientSyncId };
};

export const processSyncQueue = async (): Promise<void> => {
  const syncStore = useSyncStore.getState();
  const authStore = useAuthStore.getState();

  if (syncStore.isSyncing) return;
  if (!syncStore.isOnline || !authStore.token) return;

  syncStore.setSyncing(true);

  try {
    const queueItems = await getPendingOrFailedQueueItems();
    if (queueItems.length === 0) {
      syncStore.setSyncing(false);
      await syncStore.refreshPendingCount();
      return;
    }

    console.log(`[SyncEngine] Processing ${queueItems.length} queued sync item(s)...`);

    // Attempt batched sync first via POST /api/sync
    try {
      const batchPayload = queueItems.map((item) => ({
        clientSyncId: item.clientSyncId,
        operation: item.operation,
        entityType: item.entityType,
        entityId: item.entityId,
        payload: item.payload,
      }));

      const syncResult = await pushSyncBatchApi(batchPayload);

      // Process per-item results from backend
      if (syncResult?.results && Array.isArray(syncResult.results)) {
        for (const res of syncResult.results) {
          if (res.status === 'success' || res.status === 'duplicate') {
            const originalItem = queueItems.find(q => q.clientSyncId === res.clientSyncId);
            if (originalItem && originalItem.operation === 'REGISTER_PATIENT' && originalItem.entityId) {
              await markPatientSynced(originalItem.entityId);
            }
            await removeQueueItem(res.clientSyncId);
          } else {
            const errorMsg = (res as any).error || res.message || 'Sync failed';
            await updateQueueItemStatus(res.clientSyncId, 'FAILED', errorMsg);
          }
          await syncStore.refreshPendingCount(); // Update immediately per item
        }
      } else {
        // If backend returned 200 without itemized results, mark all processed items clean
        for (const item of queueItems) {
          if (item.operation === 'REGISTER_PATIENT' && item.entityId) {
            await markPatientSynced(item.entityId);
          }
          await removeQueueItem(item.clientSyncId);
        }
        await syncStore.refreshPendingCount();
      }

      syncStore.setSyncResult(true);
    } catch (batchError: any) {
      // Fallback: If /api/sync endpoint is not yet mounted on backend, sync per-item using direct resource endpoints
      console.warn('[SyncEngine] Batched /api/sync failed, trying individual item fallback:', batchError?.message);

      for (const item of queueItems) {
        try {
          await updateQueueItemStatus(item.clientSyncId, 'SYNCING');

          if (item.operation === 'REGISTER_PATIENT') {
            const res = await createPatientApi({ ...item.payload, id: item.entityId });
            if (res?.patient) {
              await upsertPatient(res.patient, false);
            }
            await removeQueueItem(item.clientSyncId);
          } else if (item.operation === 'CREATE_VISIT') {
            await createVisitApi(item.payload);
            await removeQueueItem(item.clientSyncId);
          } else {
            // Unknown operation: remove to avoid blocking
            await removeQueueItem(item.clientSyncId);
          }
        } catch (itemErr: any) {
          const errMsg = itemErr?.response?.data?.message || itemErr?.message || 'Failed to sync item';
          console.error(`[SyncEngine] Failed syncing item ${item.clientSyncId}:`, errMsg);
          await updateQueueItemStatus(item.clientSyncId, 'FAILED', errMsg);
        }
        await syncStore.refreshPendingCount(); // Update immediately per fallback item
      }

      syncStore.setSyncResult(true);
    }
  } catch (globalError: any) {
    console.error('[SyncEngine] Global sync error:', globalError);
    syncStore.setSyncResult(false, globalError?.message || 'Sync processing failed');
  } finally {
    syncStore.setSyncing(false);
    await syncStore.refreshPendingCount();
  }
};

export const initSyncEngine = () => {
  // Initial connectivity check
  NetInfo.fetch().then((state: NetInfoState) => {
    const connected = !!(state.isConnected && state.isInternetReachable !== false);
    useSyncStore.getState().setOnline(connected);
    useSyncStore.getState().refreshPendingCount();
  });

  // Subscribe to network connectivity changes
  const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
    const connected = !!(state.isConnected && state.isInternetReachable !== false);
    const wasOnline = useSyncStore.getState().isOnline;
    useSyncStore.getState().setOnline(connected);

    // If connectivity was just restored, automatically run sync queue
    if (!wasOnline && connected) {
      console.log('[SyncEngine] Connection restored! Triggering auto-sync...');
      processSyncQueue().catch((e) => console.warn('[SyncEngine] Auto-sync caught:', e));
    }
  });

  // Subscribe to auth changes to trigger sync immediately on login
  const unsubscribeAuth = useAuthStore.subscribe((state, prevState) => {
    if (state.isAuthenticated && !prevState.isAuthenticated) {
      if (useSyncStore.getState().isOnline) {
        console.log('[SyncEngine] User logged in! Triggering auto-sync...');
        processSyncQueue().catch((e) => console.warn('[SyncEngine] Auth-sync caught:', e));
      }
    }
  });

  // Periodic interval runner when online
  if (syncTimer) clearInterval(syncTimer);
  syncTimer = setInterval(() => {
    const { isOnline, pendingCount, isSyncing } = useSyncStore.getState();
    const { isAuthenticated } = useAuthStore.getState();
    if (isOnline && pendingCount > 0 && !isSyncing && isAuthenticated) {
      processSyncQueue().catch((e) => console.warn('[SyncEngine] Periodic sync caught:', e));
    }
  }, ENV.SYNC_INTERVAL_MS);

  return () => {
    unsubscribe();
    unsubscribeAuth();
    if (syncTimer) clearInterval(syncTimer);
  };
};
