import type { Goal } from "@/domain/financeModels";
import { isSupabaseMode } from "@/lib/config/dataMode";
import type { ServiceResult } from "@/services/core/serviceResult";
import {
  createGoalMock,
  deleteGoalMock,
  fetchGoalsMock,
  updateGoalMock,
  type GoalCreateInput,
  type GoalUpdateInput,
} from "@/services/core/goalMockService";
import {
  createGoalSupabase,
  deleteGoalSupabase,
  fetchGoalsSupabase,
  updateGoalSupabase,
} from "@/services/core/goalSupabaseService";

const withFallback = async <T>(
  supabaseCall: () => Promise<ServiceResult<T>>,
  mockCall: () => Promise<ServiceResult<T>>
): Promise<ServiceResult<T>> => {
  if (!isSupabaseMode()) return mockCall();
  const result = await supabaseCall();
  if (result.error) return mockCall();
  return result;
};

export const fetchGoalsSafe = async (userId: string): Promise<ServiceResult<Goal[]>> =>
  withFallback(() => fetchGoalsSupabase(userId), () => fetchGoalsMock(userId));

export const fetchGoals = async (userId: string): Promise<Goal[]> => {
  const result = await fetchGoalsSafe(userId);
  return result.data ?? [];
};

export const createGoal = async (
  userId: string,
  input: GoalCreateInput
): Promise<ServiceResult<Goal>> =>
  withFallback(() => createGoalSupabase(userId, input), () => createGoalMock(userId, input));

export const updateGoal = async (
  userId: string,
  goalId: string,
  input: GoalUpdateInput
): Promise<ServiceResult<Goal | null>> =>
  withFallback(() => updateGoalSupabase(userId, goalId, input), () => updateGoalMock(userId, goalId, input));

export const deleteGoal = async (userId: string, goalId: string): Promise<ServiceResult<boolean>> =>
  withFallback(() => deleteGoalSupabase(userId, goalId), () => deleteGoalMock(userId, goalId));
