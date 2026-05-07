import type { Subscription } from "@/domain/financeModels";
import { isSupabaseMode } from "@/lib/config/dataMode";
import type { ServiceResult } from "@/services/core/serviceResult";
import {
  createSubscriptionMock,
  deleteSubscriptionMock,
  fetchSubscriptionsMock,
  updateSubscriptionMock,
  type SubscriptionCreateInput,
  type SubscriptionUpdateInput,
} from "@/services/core/subscriptionMockService";
import {
  createSubscriptionSupabase,
  deleteSubscriptionSupabase,
  fetchSubscriptionsSupabase,
  updateSubscriptionSupabase,
} from "@/services/core/subscriptionSupabaseService";

const withFallback = async <T>(
  supabaseCall: () => Promise<ServiceResult<T>>,
  mockCall: () => Promise<ServiceResult<T>>
): Promise<ServiceResult<T>> => {
  if (!isSupabaseMode()) return mockCall();
  const result = await supabaseCall();
  if (result.error) return mockCall();
  return result;
};

export const fetchSubscriptionsSafe = async (userId: string): Promise<ServiceResult<Subscription[]>> =>
  withFallback(() => fetchSubscriptionsSupabase(userId), () => fetchSubscriptionsMock(userId));

export const fetchSubscriptions = async (userId: string): Promise<Subscription[]> => {
  const result = await fetchSubscriptionsSafe(userId);
  return result.data ?? [];
};

export const createSubscription = async (
  userId: string,
  input: SubscriptionCreateInput
): Promise<ServiceResult<Subscription>> =>
  withFallback(
    () => createSubscriptionSupabase(userId, input),
    () => createSubscriptionMock(userId, input)
  );

export const updateSubscription = async (
  userId: string,
  subscriptionId: string,
  input: SubscriptionUpdateInput
): Promise<ServiceResult<Subscription | null>> =>
  withFallback(
    () => updateSubscriptionSupabase(userId, subscriptionId, input),
    () => updateSubscriptionMock(userId, subscriptionId, input)
  );

export const deleteSubscription = async (
  userId: string,
  subscriptionId: string
): Promise<ServiceResult<boolean>> =>
  withFallback(
    () => deleteSubscriptionSupabase(userId, subscriptionId),
    () => deleteSubscriptionMock(userId, subscriptionId)
  );
