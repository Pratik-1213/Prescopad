import { create } from 'zustand';
import { performSync, performFullRestore, getSyncStatus } from '../services/cloudSync';

interface CloudSyncStore {
  isSyncing: boolean;
  lastPushedAt: string;
  lastPulledAt: string;
  unsyncedCount: number;
  lastError: string;

  sync: () => Promise<void>;
  fullRestore: () => Promise<number>;
  loadSyncStatus: () => Promise<void>;
}

export const useCloudSyncStore = create<CloudSyncStore>((set) => ({
  isSyncing: false,
  lastPushedAt: '',
  lastPulledAt: '',
  unsyncedCount: 0,
  lastError: '',

  sync: async () => {
    set({ isSyncing: true, lastError: '' });
    try {
      await performSync();
      const status = await getSyncStatus();
      set({
        isSyncing: false,
        lastPushedAt: status.lastPushedAt,
        lastPulledAt: status.lastPulledAt,
        unsyncedCount: status.unsyncedCount,
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Sync failed';
      set({ isSyncing: false, lastError: msg });
    }
  },

  fullRestore: async () => {
    set({ isSyncing: true, lastError: '' });
    try {
      const count = await performFullRestore();
      const status = await getSyncStatus();
      set({
        isSyncing: false,
        lastPushedAt: status.lastPushedAt,
        lastPulledAt: status.lastPulledAt,
        unsyncedCount: status.unsyncedCount,
      });
      return count;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Restore failed';
      set({ isSyncing: false, lastError: msg });
      return 0;
    }
  },

  loadSyncStatus: async () => {
    try {
      const status = await getSyncStatus();
      set({
        lastPushedAt: status.lastPushedAt,
        lastPulledAt: status.lastPulledAt,
        unsyncedCount: status.unsyncedCount,
      });
    } catch {
      // Ignore - non-critical
    }
  },
}));
