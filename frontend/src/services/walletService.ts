import api, { isOnline } from './api';
import { Transaction } from '../types/wallet.types';

export async function fetchWalletBalance(): Promise<number> {
  const online = await isOnline();
  if (!online) return -1; // Indicates offline, use cache

  const response = await api.get('/wallet');
  return response.data.wallet.balance;
}

export async function rechargeWallet(amount: number): Promise<{
  balance: number;
  transactionId: string;
}> {
  const online = await isOnline();
  if (!online) {
    throw new Error('Cannot recharge while offline. Please check your internet connection and ensure the server is running.');
  }
  const response = await api.post('/wallet/recharge', { amount });
  return response.data;
}

export async function deductWallet(
  amount: number,
  description: string,
  referenceId: string
): Promise<{ balance: number; transactionId: string }> {
  const online = await isOnline();
  if (!online) {
    throw new Error('Cannot process payment while offline. Please check your connection.');
  }
  const response = await api.post('/wallet/deduct', {
    amount,
    description,
    referenceId,
  });
  return response.data;
}

export async function fetchTransactions(
  limit = 50,
  offset = 0
): Promise<Transaction[]> {
  const online = await isOnline();
  if (!online) return [];

  const response = await api.get('/wallet/transactions', {
    params: { limit, offset },
  });
  return response.data.transactions;
}

export async function updateAutoRefill(
  autoRefill: boolean,
  autoRefillAmount?: number,
  autoRefillThreshold?: number
): Promise<void> {
  const online = await isOnline();
  if (!online) {
    throw new Error('Cannot update settings while offline. Please check your connection.');
  }
  await api.put('/wallet/auto-refill', {
    autoRefill,
    autoRefillAmount,
    autoRefillThreshold,
  });
}
