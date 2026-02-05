import { create } from 'zustand';
import { ConnectionStatus, PairingData } from '../types/sync.types';

interface SyncStore {
  connectionStatus: ConnectionStatus;
  pairedDevice: PairingData | null;
  lastSyncTime: string | null;
  syncErrors: string[];

  setConnectionStatus: (status: ConnectionStatus) => void;
  setPairedDevice: (device: PairingData | null) => void;
  updateLastSync: () => void;
  addSyncError: (error: string) => void;
  clearErrors: () => void;
  disconnect: () => void;
}

export const useSyncStore = create<SyncStore>((set) => ({
  connectionStatus: ConnectionStatus.DISCONNECTED,
  pairedDevice: null,
  lastSyncTime: null,
  syncErrors: [],

  setConnectionStatus: (status) => set({ connectionStatus: status }),

  setPairedDevice: (device) => set({ pairedDevice: device }),

  updateLastSync: () => set({ lastSyncTime: new Date().toISOString() }),

  addSyncError: (error) =>
    set((state) => ({ syncErrors: [...state.syncErrors.slice(-9), error] })),

  clearErrors: () => set({ syncErrors: [] }),

  disconnect: () =>
    set({
      connectionStatus: ConnectionStatus.DISCONNECTED,
      pairedDevice: null,
    }),
}));
