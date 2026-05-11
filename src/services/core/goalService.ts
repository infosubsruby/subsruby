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

const isDemoUser = (userId: string): boolean => userId === "demo-user" || userId.startsWith("demo-");

const resolveGoalCall = async <T>(
  userId: string,
  supabaseCall: () => Promise<ServiceResult<T>>,
  mockCall: () => Promise<ServiceResult<T>>
): Promise<ServiceResult<T>> => {
  if (!isSupabaseMode() || isDemoUser(userId)) return mockCall();
  return supabaseCall();
};

export const fetchGoalsSafe = async (userId: string): Promise<ServiceResult<Goal[]>> =>
  resolveGoalCall(userId, () => fetchGoalsSupabase(userId), () => fetchGoalsMock(userId));

export const fetchGoals = async (userId: string): Promise<Goal[]> => {
  const result = await fetchGoalsSafe(userId);
  return result.data ?? [];
};

export const createGoal = async (
  userId: string,
  input: GoalCreateInput
): Promise<ServiceResult<Goal>> =>
  resolveGoalCall(userId, () => createGoalSupabase(userId, input), () => createGoalMock(userId, input));

export const updateGoal = async (
  userId: string,
  goalId: string,
  input: GoalUpdateInput
): Promise<ServiceResult<Goal | null>> =>
  resolveGoalCall(
    userId,
    () => updateGoalSupabase(userId, goalId, input),
    () => updateGoalMock(userId, goalId, input)
  );

export const deleteGoal = async (userId: string, goalId: string): Promise<ServiceResult<boolean>> =>
  resolveGoalCall(userId, () => deleteGoalSupabase(userId, goalId), () => deleteGoalMock(userId, goalId));
