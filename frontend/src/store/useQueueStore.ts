import { create } from 'zustand';
import { QueueItem, QueueStatus } from '../types/queue.types';
import * as QueueDB from '../database/queries/queueQueries';

interface QueueStore {
  queueItems: QueueItem[];
  activeItem: QueueItem | null;
  stats: { total: number; waiting: number; inProgress: number; completed: number };
  isLoading: boolean;
  doctorReady: boolean;

  loadQueue: () => Promise<void>;
  loadStats: () => Promise<void>;
  addToQueue: (patientId: string, addedBy: string, notes?: string) => Promise<QueueItem>;
  startConsult: (queueItemId: string) => Promise<void>;
  completeConsult: (queueItemId: string) => Promise<void>;
  cancelQueueItem: (queueItemId: string) => Promise<void>;
  removeFromQueue: (queueItemId: string) => Promise<void>;
  setDoctorReady: (ready: boolean) => void;
  getNextPatient: () => QueueItem | undefined;
}

export const useQueueStore = create<QueueStore>((set, get) => ({
  queueItems: [],
  activeItem: null,
  stats: { total: 0, waiting: 0, inProgress: 0, completed: 0 },
  isLoading: false,
  doctorReady: false,

  loadQueue: async () => {
    set({ isLoading: true });
    const queueItems = await QueueDB.getTodayQueue();
    const activeItem = queueItems.find((q) => q.status === QueueStatus.IN_PROGRESS) ?? null;
    set({ queueItems, activeItem, isLoading: false });
  },

  loadStats: async () => {
    const stats = await QueueDB.getTodayStats();
    set({ stats });
  },

  addToQueue: async (patientId, addedBy, notes) => {
    const item = await QueueDB.addToQueue(patientId, addedBy, notes);
    await get().loadQueue();
    await get().loadStats();
    return item;
  },

  startConsult: async (queueItemId) => {
    await QueueDB.updateQueueStatus(queueItemId, QueueStatus.IN_PROGRESS);
    await get().loadQueue();
    await get().loadStats();
  },

  completeConsult: async (queueItemId) => {
    await QueueDB.updateQueueStatus(queueItemId, QueueStatus.COMPLETED);
    set({ activeItem: null });
    await get().loadQueue();
    await get().loadStats();
  },

  cancelQueueItem: async (queueItemId) => {
    await QueueDB.updateQueueStatus(queueItemId, QueueStatus.CANCELLED);
    await get().loadQueue();
    await get().loadStats();
  },

  removeFromQueue: async (queueItemId) => {
    await QueueDB.removeFromQueue(queueItemId);
    await get().loadQueue();
    await get().loadStats();
  },

  setDoctorReady: (ready) => set({ doctorReady: ready }),

  getNextPatient: () => {
    const { queueItems } = get();
    return queueItems.find((q) => q.status === QueueStatus.WAITING);
  },
}));
