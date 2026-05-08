import type { WalletAccount } from "@/domain/financeModels";
import { mapDbWalletToWallet, mapWalletToDbInsert } from "@/lib/supabase/mappers";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { fail, ok, toFriendlyError, type ServiceResult } from "@/services/core/serviceResult";
import type { WalletCreateInput, WalletUpdateInput } from "@/services/core/walletMockService";

type WalletRow = Database["public"]["Tables"]["wallets"]["Row"];
type WalletInsert = Database["public"]["Tables"]["wallets"]["Insert"];
type WalletUpdate = Database["public"]["Tables"]["wallets"]["Update"];

const UNAVAILABLE_MESSAGE = "Wallets are unavailable because Supabase is not configured.";

const getClientOrFail = (): ReturnType<typeof getSupabaseClient> => getSupabaseClient();

const mapWalletInputToDbUpdate = (input: WalletUpdateInput): WalletUpdate => {
  const update: WalletUpdate = {};
  if (typeof input.name === "string") update.name = input.name;
  if (typeof input.type === "string") {
    update.type =
      input.type === "checking"
        ? "bank"
        : input.type === "credit"
        ? "credit_card"
        : input.type;
  }
  if (typeof input.balance === "number") update.balance = input.balance;
  if (typeof input.currency === "string") update.currency = input.currency;
  if (input.provider !== undefined) update.provider = input.provider;
  if (typeof input.isManual === "boolean") update.is_manual = input.isManual;
  if (input.lastSyncedAt !== undefined) update.last_synced_at = input.lastSyncedAt;
  update.updated_at = new Date().toISOString();
  return update;
};

export const fetchWalletsSupabase = async (userId: string): Promise<ServiceResult<WalletAccount[]>> => {
  const supabase = getClientOrFail();
  if (!supabase) return fail(UNAVAILABLE_MESSAGE);
  try {
    const { data, error } = await supabase
      .from("wallets")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) return fail(error.message);
    const rows = (data ?? []) as WalletRow[];
    return ok(rows.map((row) => mapDbWalletToWallet(row)));
  } catch (error) {
    return fail(toFriendlyError(error, "Failed to fetch wallets."));
  }
};

export const createWalletSupabase = async (
  userId: string,
  input: WalletCreateInput
): Promise<ServiceResult<WalletAccount>> => {
  const supabase = getClientOrFail();
  if (!supabase) return fail(UNAVAILABLE_MESSAGE);
  const now = new Date().toISOString();
  const walletForMapper: WalletAccount = {
    id: input.id ?? "",
    userId,
    name: input.name,
    type: input.type,
    balance: input.balance,
    currency: input.currency,
    provider: input.provider,
    isManual: input.isManual,
    lastSyncedAt: input.lastSyncedAt,
    createdAt: now,
    updatedAt: now,
  };
  const payload: WalletInsert = {
    ...mapWalletToDbInsert(walletForMapper),
    id: input.id,
    user_id: userId,
  };
  try {
    const { data, error } = await supabase.from("wallets").insert([payload]).select("*").maybeSingle();
    if (error || !data) return fail(error?.message ?? "Failed to create wallet.");
    return ok(mapDbWalletToWallet(data as WalletRow));
  } catch (error) {
    return fail(toFriendlyError(error, "Failed to create wallet."));
  }
};

export const updateWalletSupabase = async (
  userId: string,
  walletId: string,
  input: WalletUpdateInput
): Promise<ServiceResult<WalletAccount | null>> => {
  const supabase = getClientOrFail();
  if (!supabase) return fail(UNAVAILABLE_MESSAGE);
  const payload = mapWalletInputToDbUpdate(input);
  try {
    const { data, error } = await supabase
      .from("wallets")
      .update(payload)
      .eq("id", walletId)
      .eq("user_id", userId)
      .select("*")
      .maybeSingle();
    if (error) return fail(error.message);
    if (!data) return ok(null);
    return ok(mapDbWalletToWallet(data as WalletRow));
  } catch (error) {
    return fail(toFriendlyError(error, "Failed to update wallet."));
  }
};

export const deleteWalletSupabase = async (userId: string, walletId: string): Promise<ServiceResult<boolean>> => {
  const supabase = getClientOrFail();
  if (!supabase) return fail(UNAVAILABLE_MESSAGE);
  try {
    const { data, error } = await supabase
      .from("wallets")
      .delete()
      .eq("id", walletId)
      .eq("user_id", userId)
      .select("id");
    if (error) return fail(error.message);
    return ok((data?.length ?? 0) > 0);
  } catch (error) {
    return fail(toFriendlyError(error, "Failed to delete wallet."));
  }
};
