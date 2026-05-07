import type { Budget } from "@/domain/financeModels";
import { asyncResolve, mockStore } from "@/services/core/baseMockStore";

export const fetchBudgets = async (userId: string): Promise<Budget[]> => {
  const items = mockStore.budgets.get().filter((item) => item.userId === userId);
  return asyncResolve(items);
};

export const createBudget = async (payload: Budget): Promise<Budget> => {
  const next = [...mockStore.budgets.get(), payload];
  mockStore.budgets.set(next);
  return asyncResolve(payload);
};

export const updateBudget = async (id: string, payload: Partial<Budget>): Promise<Budget | null> => {
  const items = mockStore.budgets.get();
  const index = items.findIndex((item) => item.id === id);
  if (index < 0) return asyncResolve(null);
  const updated = { ...items[index], ...payload, updatedAt: new Date().toISOString() };
  items[index] = updated;
  mockStore.budgets.set(items);
  return asyncResolve(updated);
};

export const deleteBudget = async (id: string): Promise<boolean> => {
  const current = mockStore.budgets.get();
  const next = current.filter((item) => item.id !== id);
  mockStore.budgets.set(next);
  return asyncResolve(next.length !== current.length);
};
