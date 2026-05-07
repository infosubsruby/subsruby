import type { Transaction } from "@/domain/financeModels";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import {
  fail,
  ok,
  toFriendlyError,
  type ServiceResult,
} from "@/services/core/serviceResult";
import type {
  TransactionCreateInput,
  TransactionUpdateInput,
} from "@/services/core/transactionMockService";

const createId = () =>
  globalThis.crypto?.randomUUID?.() ?? `sb-transaction-${Date.now()}-${Math.random().toString(16).slice(2)}`;

type TransactionRow = Database["public"]["Tables"]["transactions"]["Row"];
type TransactionInsert = Database["public"]["Tables"]["transactions"]["Insert"];
type TransactionUpdate = Database["public"]["Tables"]["transactions"]["Update"];

const mapDbTransactionToDomain = (row: TransactionRow): Transaction => ({
  id: row.id,
  userId: row.user_id,
  walletId: "",
  merchant: "",
  description: row.description ?? "",
  amount: Number(row.amount ?? 0),
  currency: "USD",
  type: row.type === "income" ? "income" : "expense",
  category: row.category,
  date: row.date,
  tags: [],
  isRecurring: false,
  aiFlags: [],
  confidenceScore: 0,
  createdAt: row.created_at,
  updatedAt: row.created_at,
});

const createTransactionEntity = (
  userId: string,
  input: TransactionCreateInput,
  now = new Date().toISOString()
): Transaction => ({
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
});

const mapInsertInputToDb = (entity: Transaction): TransactionInsert => ({
  id: entity.id,
  user_id: entity.userId,
  amount: entity.amount,
  type: entity.type,
  category: entity.category,
  description: entity.description || null,
  date: entity.date,
  created_at: entity.createdAt,
});

const mapUpdateInputToDbUpdate = (input: TransactionUpdateInput): TransactionUpdate => {
  const updates: TransactionUpdate = {};
  if (input.description !== undefined) updates.description = input.description;
  if (input.amount !== undefined) updates.amount = input.amount;
  if (input.type !== undefined) updates.type = input.type;
  if (input.category !== undefined) updates.category = input.category;
  if (input.date !== undefined) updates.date = input.date;
  return updates;
};

export const fetchTransactionsSupabase = async (
  userId: string
): Promise<ServiceResult<Transaction[]>> => {
  const client = getSupabaseClient();
  if (!client) return fail("Supabase is not configured.");
  try {
    const { data, error } = await client
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: false });
    if (error || !data) return fail(error?.message ?? "Unable to fetch transactions.");
    return ok(data.map(mapDbTransactionToDomain));
  } catch (error) {
    return fail(toFriendlyError(error, "Unable to fetch transactions."));
  }
};

export const createTransactionSupabase = async (
  userId: string,
  input: TransactionCreateInput
): Promise<ServiceResult<Transaction>> => {
  const client = getSupabaseClient();
  if (!client) return fail("Supabase is not configured.");
  try {
    const entity = createTransactionEntity(userId, input);
    const insert = mapInsertInputToDb(entity);
    const { data, error } = await client.from("transactions").insert(insert).select("*").single();
    if (error || !data) return fail(error?.message ?? "Unable to create transaction.");
    return ok(mapDbTransactionToDomain(data));
  } catch (error) {
    return fail(toFriendlyError(error, "Unable to create transaction."));
  }
};

export const updateTransactionSupabase = async (
  userId: string,
  transactionId: string,
  input: TransactionUpdateInput
): Promise<ServiceResult<Transaction | null>> => {
  const client = getSupabaseClient();
  if (!client) return fail("Supabase is not configured.");
  try {
    const updates = mapUpdateInputToDbUpdate(input);
    const { data, error } = await client
      .from("transactions")
      .update(updates)
      .eq("id", transactionId)
      .eq("user_id", userId)
      .select("*")
      .maybeSingle();
    if (error) return fail(error.message);
    if (!data) return ok(null);
    return ok(mapDbTransactionToDomain(data));
  } catch (error) {
    return fail(toFriendlyError(error, "Unable to update transaction."));
  }
};

export const deleteTransactionSupabase = async (
  userId: string,
  transactionId: string
): Promise<ServiceResult<boolean>> => {
  const client = getSupabaseClient();
  if (!client) return fail("Supabase is not configured.");
  try {
    const { error } = await client
      .from("transactions")
      .delete()
      .eq("id", transactionId)
      .eq("user_id", userId);
    if (error) return fail(error.message);
    return ok(true);
  } catch (error) {
    return fail(toFriendlyError(error, "Unable to delete transaction."));
  }
};
