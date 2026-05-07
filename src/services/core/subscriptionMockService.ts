import type { Subscription } from "@/domain/financeModels";
import { asyncResolve, mockStore } from "@/services/core/baseMockStore";
import { ok, type ServiceResult } from "@/services/core/serviceResult";

export type SubscriptionCreateInput = Omit<Subscription, "id" | "userId" | "createdAt" | "updatedAt"> & {
  id?: string;
};
export type SubscriptionUpdateInput = Partial<SubscriptionCreateInput>;

const createId = () =>
  globalThis.crypto?.randomUUID?.() ?? `mock-subscription-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export const fetchSubscriptionsMock = async (userId: string): Promise<ServiceResult<Subscription[]>> => {
  const items = mockStore.subscriptions.get().filter((item) => item.userId === userId);
  return ok(await asyncResolve(items));
};

export const createSubscriptionMock = async (
  userId: string,
  input: SubscriptionCreateInput
): Promise<ServiceResult<Subscription>> => {
  const now = new Date().toISOString();
  const payload: Subscription = {
    id: input.id ?? createId(),
    userId,
    name: input.name,
    amount: input.amount,
    currency: input.currency,
    billingCycle: input.billingCycle,
    nextBillingDate: input.nextBillingDate,
    category: input.category,
    status: input.status,
    yearlyCost: input.yearlyCost,
    optimizationStatus: input.optimizationStatus,
    aiRecommendation: input.aiRecommendation,
    createdAt: now,
    updatedAt: now,
  };
  mockStore.subscriptions.set([...mockStore.subscriptions.get(), payload]);
  return ok(await asyncResolve(payload));
};

export const updateSubscriptionMock = async (
  userId: string,
  subscriptionId: string,
  input: SubscriptionUpdateInput
): Promise<ServiceResult<Subscription | null>> => {
  const items = mockStore.subscriptions.get();
  const index = items.findIndex((item) => item.id === subscriptionId && item.userId === userId);
  if (index < 0) return ok(await asyncResolve(null));
  const updated: Subscription = {
    ...items[index],
    ...input,
    userId,
    updatedAt: new Date().toISOString(),
  };
  items[index] = updated;
  mockStore.subscriptions.set(items);
  return ok(await asyncResolve(updated));
};

export const deleteSubscriptionMock = async (
  userId: string,
  subscriptionId: string
): Promise<ServiceResult<boolean>> => {
  const current = mockStore.subscriptions.get();
  const next = current.filter((item) => !(item.id === subscriptionId && item.userId === userId));
  mockStore.subscriptions.set(next);
  return ok(await asyncResolve(next.length !== current.length));
};

