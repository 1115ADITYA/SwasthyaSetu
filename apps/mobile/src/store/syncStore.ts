import { create } from 'zustand';
import { getPendingQueueCount } from '../db/syncQueue.repo';

interface SyncState {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncTime: string | null;
  lastSyncStatus: 'idle' | 'success' | 'error';
  lastErrorMessage: string | null;

  setOnline: (isOnline: boolean) => void;
  setSyncing: (isSyncing: boolean) => void;
  setPendingCount: (count: number) => void;
  refreshPendingCount: () => Promise<void>;
  setSyncResult: (success: boolean, errorMessage?: string) => void;
}

export const useSyncStore = create<SyncState>((set) => ({
  isOnline: true,
  isSyncing: false,
  pendingCount: 0,
  lastSyncTime: null,
  lastSyncStatus: 'idle',
  lastErrorMessage: null,

  setOnline: (isOnline: boolean) => set({ isOnline }),
  setSyncing: (isSyncing: boolean) => set({ isSyncing }),
  setPendingCount: (pendingCount: number) => set({ pendingCount }),

  refreshPendingCount: async () => {
    try {
      const count = await getPendingQueueCount();
      set({ pendingCount: count });
    } catch (e) {
      console.error('[SyncStore] Error refreshing pending count:', e);
    }
  },

  setSyncResult: (success: boolean, errorMessage?: string) => {
    set({
      lastSyncTime: new Date().toISOString(),
      lastSyncStatus: success ? 'success' : 'error',
      lastErrorMessage: errorMessage || null,
    });
  },
}));
