import type { Goal } from "@/domain/financeModels";
import { asyncResolve, mockStore } from "@/services/core/baseMockStore";

export const fetchGoals = async (userId: string): Promise<Goal[]> => {
  const items = mockStore.goals.get().filter((item) => item.userId === userId);
  return asyncResolve(items);
};

export const createGoal = async (payload: Goal): Promise<Goal> => {
  const next = [...mockStore.goals.get(), payload];
  mockStore.goals.set(next);
  return asyncResolve(payload);
};

export const updateGoal = async (id: string, payload: Partial<Goal>): Promise<Goal | null> => {
  const items = mockStore.goals.get();
  const index = items.findIndex((item) => item.id === id);
  if (index < 0) return asyncResolve(null);
  const updated = { ...items[index], ...payload, updatedAt: new Date().toISOString() };
  items[index] = updated;
  mockStore.goals.set(items);
  return asyncResolve(updated);
};

export const deleteGoal = async (id: string): Promise<boolean> => {
  const current = mockStore.goals.get();
  const next = current.filter((item) => item.id !== id);
  mockStore.goals.set(next);
  return asyncResolve(next.length !== current.length);
};
