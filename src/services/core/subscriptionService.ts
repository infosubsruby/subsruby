import type { Subscription } from "@/domain/financeModels";
import { asyncResolve, mockStore } from "@/services/core/baseMockStore";

export const fetchSubscriptions = async (userId: string): Promise<Subscription[]> => {
  const items = mockStore.subscriptions.get().filter((item) => item.userId === userId);
  return asyncResolve(items);
};

export const createSubscription = async (payload: Subscription): Promise<Subscription> => {
  const next = [...mockStore.subscriptions.get(), payload];
  mockStore.subscriptions.set(next);
  return asyncResolve(payload);
};

export const updateSubscription = async (
  id: string,
  payload: Partial<Subscription>
): Promise<Subscription | null> => {
  const items = mockStore.subscriptions.get();
  const index = items.findIndex((item) => item.id === id);
  if (index < 0) return asyncResolve(null);
  const updated = { ...items[index], ...payload, updatedAt: new Date().toISOString() };
  items[index] = updated;
  mockStore.subscriptions.set(items);
  return asyncResolve(updated);
};

export const deleteSubscription = async (id: string): Promise<boolean> => {
  const current = mockStore.subscriptions.get();
  const next = current.filter((item) => item.id !== id);
  mockStore.subscriptions.set(next);
  return asyncResolve(next.length !== current.length);
};
