import { apiClient } from './client';
import { SyncBatchResponse } from '../types';

/**
 * Push a batch of sync items to the backend.
 *
 * Endpoint: POST /api/sync/push   (claude-aditya-web backend)
 */
export const pushSyncBatchApi = async (items: Array<{
  clientSyncId: string;
  operation: string;
  entityType: string;
  entityId?: string;
  payload: any;
}>): Promise<SyncBatchResponse> => {
  const response = await apiClient.post<SyncBatchResponse>('/api/sync/push', { items });
  return response.data;
};
