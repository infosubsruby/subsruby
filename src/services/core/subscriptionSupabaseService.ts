import type { Subscription } from "@/domain/financeModels";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { fail, ok, toFriendlyError, type ServiceResult } from "@/services/core/serviceResult";
import type {
  SubscriptionCreateInput,
  SubscriptionUpdateInput,
} from "@/services/core/subscriptionMockService";

type SubscriptionRow = Database["public"]["Tables"]["subscriptions"]["Row"];
type SubscriptionInsert = Database["public"]["Tables"]["subscriptions"]["Insert"];
type SubscriptionUpdate = Database["public"]["Tables"]["subscriptions"]["Update"];

const toBillingCycle = (value: string | null): "weekly" | "monthly" | "yearly" => {
  if (value === "weekly" || value === "monthly" || value === "yearly") return value;
  return "monthly";
};

const toDomainSubscription = (row: SubscriptionRow): Subscription => {
  const billingCycle = toBillingCycle(row.billing_cycle);
  const amount = Number(row.price ?? 0);
  return {
    id: String(row.id),
    userId: row.user_id,
    name: row.name,
    amount,
    currency: row.currency ?? "USD",
    billingCycle,
    nextBillingDate: row.next_payment_date ?? row.start_date,
    category: "Subscriptions",
    status: "active",
    yearlyCost: billingCycle === "yearly" ? amount : amount * 12,
    optimizationStatus: "monitor",
    aiRecommendation: "",
    createdAt: row.created_at,
    updatedAt: row.created_at,
  };
};

const createSubscriptionEntity = (
  userId: string,
  input: SubscriptionCreateInput,
  now = new Date().toISOString()
): Subscription => ({
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
});

const toSlug = (name: string) =>
  name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "subscription";

const mapInsertToDb = (entity: Subscription): SubscriptionInsert => ({
  user_id: entity.userId,
  name: entity.name,
  slug: toSlug(entity.name),
  price: entity.amount,
  currency: entity.currency,
  billing_cycle: entity.billingCycle,
  start_date: entity.createdAt.slice(0, 10),
  next_payment_date: entity.nextBillingDate,
  card_color: "#E50914",
  website_url: null,
  country_code: null,
});

const mapSubscriptionUpdateToDb = (input: SubscriptionUpdateInput): SubscriptionUpdate => {
  const updates: SubscriptionUpdate = {};
  if (input.name !== undefined) updates.name = input.name;
  if (input.name !== undefined) updates.slug = toSlug(input.name);
  if (input.amount !== undefined) updates.price = input.amount;
  if (input.currency !== undefined) updates.currency = input.currency;
  if (input.billingCycle !== undefined) updates.billing_cycle = input.billingCycle;
  if (input.nextBillingDate !== undefined) updates.next_billing_date = input.nextBillingDate;
  if (input.createdAt !== undefined) updates.start_date = input.createdAt.slice(0, 10);
  return updates;
};

export const fetchSubscriptionsSupabase = async (userId: string): Promise<ServiceResult<Subscription[]>> => {
  const client = getSupabaseClient();
  if (!client) return fail("Supabase is not configured.");
  try {
    const { data, error } = await client
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error || !data) return fail(error?.message ?? "Unable to fetch subscriptions.");
    return ok(data.map(toDomainSubscription));
  } catch (error) {
    return fail(toFriendlyError(error, "Unable to fetch subscriptions."));
  }
};

export const createSubscriptionSupabase = async (
  userId: string,
  input: SubscriptionCreateInput
): Promise<ServiceResult<Subscription>> => {
  const client = getSupabaseClient();
  if (!client) return fail("Supabase is not configured.");
  try {
    const entity = createSubscriptionEntity(userId, input);
    const insert = mapInsertToDb(entity);
    const { data, error } = await client.from("subscriptions").insert(insert).select("*").single();
    if (error || !data) return fail(error?.message ?? "Unable to create subscription.");
    return ok(toDomainSubscription(data));
  } catch (error) {
    return fail(toFriendlyError(error, "Unable to create subscription."));
  }
};

export const updateSubscriptionSupabase = async (
  userId: string,
  subscriptionId: string,
  input: SubscriptionUpdateInput
): Promise<ServiceResult<Subscription | null>> => {
  const client = getSupabaseClient();
  if (!client) return fail("Supabase is not configured.");
  try {
    const numericId = Number(subscriptionId);
    if (!Number.isFinite(numericId)) return ok(null);
    const { data, error } = await client
      .from("subscriptions")
      .update(mapSubscriptionUpdateToDb(input))
      .eq("id", numericId)
      .eq("user_id", userId)
      .select("*")
      .maybeSingle();
    if (error) return fail(error.message);
    if (!data) return ok(null);
    return ok(toDomainSubscription(data));
  } catch (error) {
    return fail(toFriendlyError(error, "Unable to update subscription."));
  }
};

export const deleteSubscriptionSupabase = async (
  userId: string,
  subscriptionId: string
): Promise<ServiceResult<boolean>> => {
  const client = getSupabaseClient();
  if (!client) return fail("Supabase is not configured.");
  try {
    const numericId = Number(subscriptionId);
    if (!Number.isFinite(numericId)) return ok(false);
    const { error } = await client
      .from("subscriptions")
      .delete()
      .eq("id", numericId)
      .eq("user_id", userId);
    if (error) return fail(error.message);
    return ok(true);
  } catch (error) {
    return fail(toFriendlyError(error, "Unable to delete subscription."));
  }
};
