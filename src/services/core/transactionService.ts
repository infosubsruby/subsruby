import type { Transaction } from "@/domain/financeModels";
import { asyncResolve, mockStore } from "@/services/core/baseMockStore";

export const fetchTransactions = async (userId: string): Promise<Transaction[]> => {
  const items = mockStore.transactions.get().filter((item) => item.userId === userId);
  return asyncResolve(items);
};

export const createTransaction = async (payload: Transaction): Promise<Transaction> => {
  const next = [...mockStore.transactions.get(), payload];
  mockStore.transactions.set(next);
  return asyncResolve(payload);
};

export const updateTransaction = async (id: string, payload: Partial<Transaction>): Promise<Transaction | null> => {
  const items = mockStore.transactions.get();
  const index = items.findIndex((item) => item.id === id);
  if (index < 0) return asyncResolve(null);
  const updated = { ...items[index], ...payload, updatedAt: new Date().toISOString() };
  items[index] = updated;
  mockStore.transactions.set(items);
  return asyncResolve(updated);
};

export const deleteTransaction = async (id: string): Promise<boolean> => {
  const current = mockStore.transactions.get();
  const next = current.filter((item) => item.id !== id);
  mockStore.transactions.set(next);
  return asyncResolve(next.length !== current.length);
};
