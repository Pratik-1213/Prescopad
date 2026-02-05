import { create } from 'zustand';
import { Transaction, LocalWalletCache } from '../types/wallet.types';
import * as WalletCache from '../database/queries/walletCacheQueries';
import { APP_CONFIG } from '../constants/config';

interface WalletStore {
  balance: number;
  transactions: Transaction[];
  isLoading: boolean;
  lastSyncedAt: string;

  loadCachedBalance: () => Promise<void>;
  syncBalance: (cloudBalance: number) => Promise<void>;
  deductForPrescription: () => Promise<boolean>;
  recharge: (amount: number) => Promise<void>;
  canAfford: () => Promise<boolean>;
  setTransactions: (transactions: Transaction[]) => void;
}

export const useWalletStore = create<WalletStore>((set, get) => ({
  balance: 0,
  transactions: [],
  isLoading: false,
  lastSyncedAt: '',

  loadCachedBalance: async () => {
    const cache = await WalletCache.getWalletCache();
    set({ balance: cache.balance, lastSyncedAt: cache.lastSyncedAt });
  },

  syncBalance: async (cloudBalance: number) => {
    await WalletCache.updateWalletCache(cloudBalance);
    set({ balance: cloudBalance, lastSyncedAt: new Date().toISOString() });
  },

  deductForPrescription: async () => {
    const cost = APP_CONFIG.wallet.costPerPrescription;
    const canPay = await WalletCache.canAffordPrescription(cost);
    if (!canPay) return false;

    const newBalance = await WalletCache.deductFromWalletCache(cost);
    set({ balance: newBalance });
    return true;
  },

  recharge: async (amount: number) => {
    const newBalance = get().balance + amount;
    await WalletCache.updateWalletCache(newBalance);
    set({ balance: newBalance });
  },

  canAfford: async () => {
    return WalletCache.canAffordPrescription(APP_CONFIG.wallet.costPerPrescription);
  },

  setTransactions: (transactions) => set({ transactions }),
}));
