import type { Goal } from "@/domain/financeModels";
import { mapDbGoalToGoal, mapGoalStatusToDbStatus, mapGoalToDbInsert } from "@/lib/supabase/mappers";
import { getSupabaseClient } from "@/lib/supabase/client";
import { fail, ok, toFriendlyError, type ServiceResult } from "@/services/core/serviceResult";
import type { GoalCreateInput, GoalUpdateInput } from "@/services/core/goalMockService";
import type { Database } from "@/integrations/supabase/types";

type GoalRow = Database["public"]["Tables"]["goals"]["Row"];
type GoalInsert = Database["public"]["Tables"]["goals"]["Insert"];
type GoalUpdate = Database["public"]["Tables"]["goals"]["Update"];

const UNAVAILABLE_MESSAGE = "Goals are unavailable because Supabase is not configured.";

const getClientOrFail = (): ReturnType<typeof getSupabaseClient> => getSupabaseClient();

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
    if (error) return fail(error.message);
    const rows = (data ?? []) as GoalRow[];
    return ok(rows.map((row) => mapDbGoalToGoal(row)));
  } catch (error) {
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
  const goalForMapper: Goal = {
    id: input.id ?? "",
    userId,
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
    user_id: userId,
  };
  try {
    const { data, error } = await supabase.from("goals").insert([payload]).select("*").maybeSingle();
    if (error || !data) return fail(error?.message ?? "Failed to create goal.");
    return ok(mapDbGoalToGoal(data as GoalRow));
  } catch (error) {
    return fail(toFriendlyError(error, "Failed to create goal."));
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
    if (error) return fail(error.message);
    if (!data) return ok(null);
    return ok(mapDbGoalToGoal(data as GoalRow));
  } catch (error) {
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
    if (error) return fail(error.message);
    return ok((data?.length ?? 0) > 0);
  } catch (error) {
    return fail(toFriendlyError(error, "Failed to delete goal."));
  }
};
