import { getDatabase } from '../database';
import { LocalWalletCache } from '../../types/wallet.types';

export async function getWalletCache(): Promise<LocalWalletCache> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<Record<string, unknown>>(
    'SELECT * FROM local_wallet_cache WHERE id = 1'
  );
  if (!row) {
    return { balance: 0, lastSyncedAt: '' };
  }
  return {
    balance: (row.balance ?? 0) as number,
    lastSyncedAt: (row.last_synced_at ?? row.lastSyncedAt ?? '') as string,
  };
}

export async function updateWalletCache(balance: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO local_wallet_cache (id, balance, last_synced_at) VALUES (1, ?, datetime('now'))`,
    [balance]
  );
}

export async function deductFromWalletCache(amount: number): Promise<number> {
  const db = await getDatabase();
  const current = await getWalletCache();
  const newBalance = Math.max(0, current.balance - amount);
  await updateWalletCache(newBalance);
  return newBalance;
}

export async function canAffordPrescription(cost: number): Promise<boolean> {
  const cache = await getWalletCache();
  return cache.balance >= cost;
}
