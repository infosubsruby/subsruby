import type { Goal } from "@/domain/financeModels";
import { mapDbGoalToGoal, mapGoalStatusToDbStatus, mapGoalToDbInsert } from "@/lib/supabase/mappers";
import { createProfileForUser } from "@/lib/auth/authService";
import { getSupabaseClient } from "@/lib/supabase/client";
import { fail, ok, toFriendlyError, type ServiceResult } from "@/services/core/serviceResult";
import type { GoalCreateInput, GoalUpdateInput } from "@/services/core/goalMockService";
import type { Database } from "@/integrations/supabase/types";
import type { User } from "@supabase/supabase-js";

type GoalRow = Database["public"]["Tables"]["goals"]["Row"];
type GoalInsert = Database["public"]["Tables"]["goals"]["Insert"];
type GoalUpdate = Database["public"]["Tables"]["goals"]["Update"];

const UNAVAILABLE_MESSAGE = "Goals are unavailable because Supabase is not configured.";

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

const mapGoalInputToDbUpdate = (input: GoalUpdateInput): GoalUpdate => {
  const update: GoalUpdate = {};
  if (typeof input.title === "string") update.title = input.title;
  if (typeof input.targetAmount === "number") update.target_amount = input.targetAmount;
  if (typeof input.currentAmount === "number") update.current_amount = input.currentAmount;
  if (typeof input.currency === "string") update.currency = input.currency;
  if (input.deadline !== undefined) update.deadline = input.deadline;
  if (typeof input.status === "string") {
    update.status = mapGoalStatusToDbStatus(input.status);
  }
  if (typeof input.monthlyTarget === "number") update.monthly_target = input.monthlyTarget;
  if (input.predictedCompletionDate !== undefined) {
    update.predicted_completion_date = input.predictedCompletionDate;
  }
  if (input.aiRecommendation !== undefined) update.ai_recommendation = input.aiRecommendation;
  if (typeof input.priority === "string") update.priority = input.priority;
  update.updated_at = new Date().toISOString();
  return update;
};

export const fetchGoalsSupabase = async (userId: string): Promise<ServiceResult<Goal[]>> => {
  const supabase = getClientOrFail();
  if (!supabase) return fail(UNAVAILABLE_MESSAGE);
  try {
    const { data, error } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) {
      if (import.meta.env.DEV) {
        console.error("[Goals][fetch] Supabase error", {
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
    const rows = (data ?? []) as GoalRow[];
    return ok(rows.map((row) => mapDbGoalToGoal(row)));
  } catch (error) {
    if (import.meta.env.DEV) console.error("[Goals][fetch] Unexpected error", { userId, error });
    return fail(toFriendlyError(error, "Failed to fetch goals."));
  }
};

export const createGoalSupabase = async (
  userId: string,
  input: GoalCreateInput
): Promise<ServiceResult<Goal>> => {
  const supabase = getClientOrFail();
  if (!supabase) return fail(UNAVAILABLE_MESSAGE);
  const now = new Date().toISOString();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  const authUserId = authData.user?.id ?? null;
  if (!authUserId) {
    if (import.meta.env.DEV) {
      console.error("[Goals][create] No authenticated user", {
        passedUserId: userId,
        authError: authError?.message ?? null,
      });
    }
    return fail(import.meta.env.DEV ? "Not authenticated (no current user)." : "Please sign in to save this data.");
  }

  if (authUserId !== userId && import.meta.env.DEV) {
    console.error("[Goals][create] Passed userId does not match auth user id", {
      passedUserId: userId,
      authUserId,
    });
  }

  const profileEnsure = await ensureProfileExists(supabase, authUserId, authData.user);
  if (profileEnsure.error) {
    if (import.meta.env.DEV) {
      console.error("[Goals][create] Failed to ensure profile exists", {
        authUserId,
        passedUserId: userId,
        error: profileEnsure.error,
      });
    }
    return fail(
      import.meta.env.DEV
        ? `Could not ensure profile exists: ${profileEnsure.error}`
        : "Could not save goal. Please check authentication or permissions."
    );
  }

  const goalForMapper: Goal = {
    id: input.id ?? "",
    userId: authUserId,
    title: input.title,
    targetAmount: input.targetAmount,
    currentAmount: input.currentAmount,
    currency: input.currency,
    deadline: input.deadline,
    status: input.status,
    monthlyTarget: input.monthlyTarget,
    predictedCompletionDate: input.predictedCompletionDate,
    aiRecommendation: input.aiRecommendation ?? null,
    priority: input.priority,
    createdAt: now,
    updatedAt: now,
  };
  const payload: GoalInsert = {
    ...mapGoalToDbInsert(goalForMapper),
    id: input.id,
    user_id: authUserId,
  };
  try {
    const { data, error } = await supabase.from("goals").insert(payload).select("*").single();
    if (error || !data) {
      if (import.meta.env.DEV && error) {
        console.error("[Goals][create] Supabase insert failed", {
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
            : "Could not save goal. Please check authentication or permissions."
        );
      }
      return fail("Could not save goal. Please check authentication or permissions.");
    }
    return ok(mapDbGoalToGoal(data as GoalRow));
  } catch (error) {
    if (import.meta.env.DEV) console.error("[Goals][create] Unexpected error", { passedUserId: userId, payload, error });
    return fail(
      import.meta.env.DEV
        ? toFriendlyError(error, "Could not save goal.")
        : "Could not save goal. Please check authentication or permissions."
    );
  }
};

export const updateGoalSupabase = async (
  userId: string,
  goalId: string,
  input: GoalUpdateInput
): Promise<ServiceResult<Goal | null>> => {
  const supabase = getClientOrFail();
  if (!supabase) return fail(UNAVAILABLE_MESSAGE);
  const payload = mapGoalInputToDbUpdate(input);
  try {
    const { data, error } = await supabase
      .from("goals")
      .update(payload)
      .eq("id", goalId)
      .eq("user_id", userId)
      .select("*")
      .maybeSingle();
    if (error) {
      if (import.meta.env.DEV) {
        console.error("[Goals][update] Supabase error", {
          userId,
          goalId,
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
    return ok(mapDbGoalToGoal(data as GoalRow));
  } catch (error) {
    if (import.meta.env.DEV) console.error("[Goals][update] Unexpected error", { userId, goalId, payload, error });
    return fail(toFriendlyError(error, "Failed to update goal."));
  }
};

export const deleteGoalSupabase = async (userId: string, goalId: string): Promise<ServiceResult<boolean>> => {
  const supabase = getClientOrFail();
  if (!supabase) return fail(UNAVAILABLE_MESSAGE);
  try {
    const { data, error } = await supabase
      .from("goals")
      .delete()
      .eq("id", goalId)
      .eq("user_id", userId)
      .select("id");
    if (error) {
      if (import.meta.env.DEV) {
        console.error("[Goals][delete] Supabase error", {
          userId,
          goalId,
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
    if (import.meta.env.DEV) console.error("[Goals][delete] Unexpected error", { userId, goalId, error });
    return fail(toFriendlyError(error, "Failed to delete goal."));
  }
};
