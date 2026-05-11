import type { WalletAccount } from "@/domain/financeModels";
import { mapDbWalletToWallet, mapWalletToDbInsert } from "@/lib/supabase/mappers";
import { createProfileForUser } from "@/lib/auth/authService";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { fail, ok, toFriendlyError, type ServiceResult } from "@/services/core/serviceResult";
import type { WalletCreateInput, WalletUpdateInput } from "@/services/core/walletMockService";
import type { User } from "@supabase/supabase-js";

type WalletRow = Database["public"]["Tables"]["wallets"]["Row"];
type WalletInsert = Database["public"]["Tables"]["wallets"]["Insert"];
type WalletUpdate = Database["public"]["Tables"]["wallets"]["Update"];

const UNAVAILABLE_MESSAGE = "Wallets are unavailable because Supabase is not configured.";

const getClientOrFail = (): ReturnType<typeof getSupabaseClient> => getSupabaseClient();

type PostgrestErrorLike = {
  message: string;
  code?: string | null;
  details?: string | null;
  hint?: string | null;
};

const formatPostgrestError = (error: PostgrestErrorLike): string => {
  const parts: string[] = [error.message];
  if (error.code) parts.push(`code=${error.code}`);
  if (error.details) parts.push(`details=${error.details}`);
  if (error.hint) parts.push(`hint=${error.hint}`);
  return parts.join(" | ");
};

const ensureProfileExists = async (
  supabase: NonNullable<ReturnType<typeof getSupabaseClient>>,
  userId: string,
  authUser: User
) => {
  const { data: existingProfile, error: selectError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (selectError) {
    return { error: formatPostgrestError(selectError as unknown as PostgrestErrorLike) };
  }

  if (existingProfile) return { error: null };

  const { error: createError } = await createProfileForUser(authUser);
  if (createError) {
    return { error: formatPostgrestError(createError as unknown as PostgrestErrorLike) };
  }

  return { error: null };
};

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
    if (error) {
      if (import.meta.env.DEV) {
        console.error("[Wallets][fetch] Supabase error", {
          userId,
          error: {
            message: error.message,
            code: (error as unknown as PostgrestErrorLike).code,
            details: (error as unknown as PostgrestErrorLike).details,
            hint: (error as unknown as PostgrestErrorLike).hint,
          },
        });
      }
      return fail(import.meta.env.DEV ? formatPostgrestError(error as unknown as PostgrestErrorLike) : error.message);
    }
    const rows = (data ?? []) as WalletRow[];
    return ok(rows.map((row) => mapDbWalletToWallet(row)));
  } catch (error) {
    if (import.meta.env.DEV) console.error("[Wallets][fetch] Unexpected error", { userId, error });
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
  const { data: authData, error: authError } = await supabase.auth.getUser();
  const authUserId = authData.user?.id ?? null;
  if (!authUserId) {
    if (import.meta.env.DEV) {
      console.error("[Wallets][create] No authenticated user", {
        passedUserId: userId,
        authError: authError?.message ?? null,
      });
    }
    return fail(import.meta.env.DEV ? "Not authenticated (no current user)." : "Please sign in to save this data.");
  }

  if (authUserId !== userId && import.meta.env.DEV) {
    console.error("[Wallets][create] Passed userId does not match auth user id", {
      passedUserId: userId,
      authUserId,
    });
  }

  const profileEnsure = await ensureProfileExists(supabase, authUserId, authData.user);
  if (profileEnsure.error) {
    if (import.meta.env.DEV) {
      console.error("[Wallets][create] Failed to ensure profile exists", {
        authUserId,
        passedUserId: userId,
        error: profileEnsure.error,
      });
    }
    return fail(
      import.meta.env.DEV
        ? `Could not ensure profile exists: ${profileEnsure.error}`
        : "Could not save wallet. Please check authentication or permissions."
    );
  }

  const walletForMapper: WalletAccount = {
    id: input.id ?? "",
    userId: authUserId,
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
    user_id: authUserId,
  };
  try {
    const { data, error } = await supabase.from("wallets").insert(payload).select("*").single();
    if (error || !data) {
      if (import.meta.env.DEV && error) {
        console.error("[Wallets][create] Supabase insert failed", {
          passedUserId: userId,
          authUserId,
          payload,
          error: {
            message: error.message,
            code: (error as unknown as PostgrestErrorLike).code,
            details: (error as unknown as PostgrestErrorLike).details,
            hint: (error as unknown as PostgrestErrorLike).hint,
          },
        });
      }
      if (error) {
        return fail(
          import.meta.env.DEV
            ? formatPostgrestError(error as unknown as PostgrestErrorLike)
            : "Could not save wallet. Please check authentication or permissions."
        );
      }
      return fail("Could not save wallet. Please check authentication or permissions.");
    }
    return ok(mapDbWalletToWallet(data as WalletRow));
  } catch (error) {
    if (import.meta.env.DEV) console.error("[Wallets][create] Unexpected error", { passedUserId: userId, payload, error });
    return fail(
      import.meta.env.DEV
        ? toFriendlyError(error, "Could not save wallet.")
        : "Could not save wallet. Please check authentication or permissions."
    );
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
    if (error) {
      if (import.meta.env.DEV) {
        console.error("[Wallets][update] Supabase error", {
          userId,
          walletId,
          payload,
          error: {
            message: error.message,
            code: (error as unknown as PostgrestErrorLike).code,
            details: (error as unknown as PostgrestErrorLike).details,
            hint: (error as unknown as PostgrestErrorLike).hint,
          },
        });
      }
      return fail(import.meta.env.DEV ? formatPostgrestError(error as unknown as PostgrestErrorLike) : error.message);
    }
    if (!data) return ok(null);
    return ok(mapDbWalletToWallet(data as WalletRow));
  } catch (error) {
    if (import.meta.env.DEV) console.error("[Wallets][update] Unexpected error", { userId, walletId, payload, error });
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
    if (error) {
      if (import.meta.env.DEV) {
        console.error("[Wallets][delete] Supabase error", {
          userId,
          walletId,
          error: {
            message: error.message,
            code: (error as unknown as PostgrestErrorLike).code,
            details: (error as unknown as PostgrestErrorLike).details,
            hint: (error as unknown as PostgrestErrorLike).hint,
          },
        });
      }
      return fail(import.meta.env.DEV ? formatPostgrestError(error as unknown as PostgrestErrorLike) : error.message);
    }
    return ok((data?.length ?? 0) > 0);
  } catch (error) {
    if (import.meta.env.DEV) console.error("[Wallets][delete] Unexpected error", { userId, walletId, error });
    return fail(toFriendlyError(error, "Failed to delete wallet."));
  }
};
