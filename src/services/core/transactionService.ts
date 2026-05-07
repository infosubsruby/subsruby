import type { Transaction } from "@/domain/financeModels";
import { isSupabaseMode } from "@/lib/config/dataMode";
import {
  createTransactionMock,
  deleteTransactionMock,
  fetchTransactionsMock,
  updateTransactionMock,
  type TransactionCreateInput,
  type TransactionUpdateInput,
} from "@/services/core/transactionMockService";
import {
  createTransactionSupabase,
  deleteTransactionSupabase,
  fetchTransactionsSupabase,
  updateTransactionSupabase,
} from "@/services/core/transactionSupabaseService";
import type { ServiceResult } from "@/services/core/serviceResult";

const withFallback = async <T>(
  supabaseCall: () => Promise<ServiceResult<T>>,
  mockCall: () => Promise<ServiceResult<T>>
): Promise<ServiceResult<T>> => {
  if (!isSupabaseMode()) return mockCall();
  const result = await supabaseCall();
  if (result.error) {
    return mockCall();
  }
  return result;
};

export const fetchTransactionsSafe = async (userId: string): Promise<ServiceResult<Transaction[]>> =>
  withFallback(() => fetchTransactionsSupabase(userId), () => fetchTransactionsMock(userId));

export const fetchTransactions = async (userId: string): Promise<Transaction[]> => {
  const result = await fetchTransactionsSafe(userId);
  return result.data ?? [];
};

export const createTransaction = async (
  userId: string,
  input: TransactionCreateInput
): Promise<ServiceResult<Transaction>> =>
  withFallback(() => createTransactionSupabase(userId, input), () => createTransactionMock(userId, input));

export const updateTransaction = async (
  userId: string,
  transactionId: string,
  input: TransactionUpdateInput
): Promise<ServiceResult<Transaction | null>> =>
  withFallback(
    () => updateTransactionSupabase(userId, transactionId, input),
    () => updateTransactionMock(userId, transactionId, input)
  );

export const deleteTransaction = async (
  userId: string,
  transactionId: string
): Promise<ServiceResult<boolean>> =>
  withFallback(
    () => deleteTransactionSupabase(userId, transactionId),
    () => deleteTransactionMock(userId, transactionId)
  );
