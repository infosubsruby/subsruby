import type { Transaction } from "@/domain/financeModels";
import { asyncResolve, mockStore } from "@/services/core/baseMockStore";
import { ok, type ServiceResult } from "@/services/core/serviceResult";

export type TransactionCreateInput = Omit<Transaction, "id" | "userId" | "createdAt" | "updatedAt"> & {
  id?: string;
};

export type TransactionUpdateInput = Partial<TransactionCreateInput>;

const createId = () =>
  globalThis.crypto?.randomUUID?.() ?? `mock-transaction-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export const fetchTransactionsMock = async (userId: string): Promise<ServiceResult<Transaction[]>> => {
  const items = mockStore.transactions.get().filter((item) => item.userId === userId);
  return ok(await asyncResolve(items));
};

export const createTransactionMock = async (
  userId: string,
  input: TransactionCreateInput
): Promise<ServiceResult<Transaction>> => {
  const now = new Date().toISOString();
  const payload: Transaction = {
    id: input.id ?? createId(),
    userId,
    walletId: input.walletId,
    merchant: input.merchant,
    description: input.description,
    amount: input.amount,
    currency: input.currency,
    type: input.type,
    category: input.category,
    date: input.date,
    tags: input.tags,
    isRecurring: input.isRecurring,
    aiFlags: input.aiFlags,
    confidenceScore: input.confidenceScore,
    createdAt: now,
    updatedAt: now,
  };
  const next = [...mockStore.transactions.get(), payload];
  mockStore.transactions.set(next);
  return ok(await asyncResolve(payload));
};

export const updateTransactionMock = async (
  userId: string,
  transactionId: string,
  input: TransactionUpdateInput
): Promise<ServiceResult<Transaction | null>> => {
  const items = mockStore.transactions.get();
  const index = items.findIndex((item) => item.id === transactionId && item.userId === userId);
  if (index < 0) return ok(await asyncResolve(null));
  const updated: Transaction = {
    ...items[index],
    ...input,
    userId,
    updatedAt: new Date().toISOString(),
  };
  items[index] = updated;
  mockStore.transactions.set(items);
  return ok(await asyncResolve(updated));
};

export const deleteTransactionMock = async (
  userId: string,
  transactionId: string
): Promise<ServiceResult<boolean>> => {
  const current = mockStore.transactions.get();
  const next = current.filter((item) => !(item.id === transactionId && item.userId === userId));
  mockStore.transactions.set(next);
  return ok(await asyncResolve(next.length !== current.length));
};

