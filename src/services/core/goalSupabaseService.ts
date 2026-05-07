import type { Goal } from "@/domain/financeModels";
import { fail, type ServiceResult } from "@/services/core/serviceResult";
import type { GoalCreateInput, GoalUpdateInput } from "@/services/core/goalMockService";

const UNAVAILABLE_MESSAGE = "Goals table is not available in the current Supabase schema.";

export const fetchGoalsSupabase = async (userId: string): Promise<ServiceResult<Goal[]>> => {
  void userId;
  return fail(UNAVAILABLE_MESSAGE);
};

export const createGoalSupabase = async (
  userId: string,
  input: GoalCreateInput
): Promise<ServiceResult<Goal>> => {
  void userId;
  void input;
  return fail(UNAVAILABLE_MESSAGE);
};

export const updateGoalSupabase = async (
  userId: string,
  goalId: string,
  input: GoalUpdateInput
): Promise<ServiceResult<Goal | null>> => {
  void userId;
  void goalId;
  void input;
  return fail(UNAVAILABLE_MESSAGE);
};

export const deleteGoalSupabase = async (userId: string, goalId: string): Promise<ServiceResult<boolean>> => {
  void userId;
  void goalId;
  return fail(UNAVAILABLE_MESSAGE);
};
