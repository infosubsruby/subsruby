import type { Goal } from "@/domain/financeModels";
import { asyncResolve, mockStore } from "@/services/core/baseMockStore";
import { ok, type ServiceResult } from "@/services/core/serviceResult";

export type GoalCreateInput = Omit<Goal, "id" | "userId" | "createdAt" | "updatedAt"> & {
  id?: string;
};
export type GoalUpdateInput = Partial<GoalCreateInput>;

const createId = () =>
  globalThis.crypto?.randomUUID?.() ?? `mock-goal-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export const fetchGoalsMock = async (userId: string): Promise<ServiceResult<Goal[]>> => {
  const items = mockStore.goals.get().filter((item) => item.userId === userId);
  return ok(await asyncResolve(items));
};

export const createGoalMock = async (userId: string, input: GoalCreateInput): Promise<ServiceResult<Goal>> => {
  const now = new Date().toISOString();
  const payload: Goal = {
    id: input.id ?? createId(),
    userId,
    title: input.title,
    targetAmount: input.targetAmount,
    currentAmount: input.currentAmount,
    currency: input.currency,
    deadline: input.deadline,
    status: input.status,
    monthlyTarget: input.monthlyTarget,
    predictedCompletionDate: input.predictedCompletionDate,
    priority: input.priority,
    createdAt: now,
    updatedAt: now,
  };
  mockStore.goals.set([...mockStore.goals.get(), payload]);
  return ok(await asyncResolve(payload));
};

export const updateGoalMock = async (
  userId: string,
  goalId: string,
  input: GoalUpdateInput
): Promise<ServiceResult<Goal | null>> => {
  const goals = mockStore.goals.get();
  const index = goals.findIndex((item) => item.id === goalId && item.userId === userId);
  if (index < 0) return ok(await asyncResolve(null));
  const updated: Goal = {
    ...goals[index],
    ...input,
    userId,
    updatedAt: new Date().toISOString(),
  };
  goals[index] = updated;
  mockStore.goals.set(goals);
  return ok(await asyncResolve(updated));
};

export const deleteGoalMock = async (userId: string, goalId: string): Promise<ServiceResult<boolean>> => {
  const current = mockStore.goals.get();
  const next = current.filter((item) => !(item.id === goalId && item.userId === userId));
  mockStore.goals.set(next);
  return ok(await asyncResolve(next.length !== current.length));
};

