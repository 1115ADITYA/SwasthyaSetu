import { apiClient } from './client';
import { SyncBatchResponse } from '../types';

export const pushSyncBatchApi = async (items: Array<{
  clientSyncId: string;
  operation: string;
  entityType: string;
  entityId?: string;
  payload: any;
}>): Promise<SyncBatchResponse> => {
  const response = await apiClient.post<SyncBatchResponse>('/api/sync', { items });
  return response.data;
};
