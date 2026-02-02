import { supabase } from "@/integrations/supabase/client";
import type { CreateSubscriptionData, Subscription } from "./types";

const DEFAULT_CURRENCY = "USD";
const DEFAULT_CARD_COLOR = "#E50914";

function normalizeSubscription(row: any): Subscription {
  return {
    ...(row as Subscription),
    currency: (row?.currency ?? DEFAULT_CURRENCY) as string,
    card_color: (row?.card_color ?? DEFAULT_CARD_COLOR) as string,
  };
}

export async function fetchSubscriptions(userId: string): Promise<Subscription[]> {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(normalizeSubscription);
}

export async function insertSubscription(userId: string, payload: CreateSubscriptionData): Promise<Subscription> {
  // Ensure price is a number
  const price = typeof payload.price === 'string' ? parseFloat(payload.price) : Number(payload.price);
  
  if (isNaN(price)) {
    console.error("Invalid price value:", payload.price);
    throw new Error("Invalid price value");
  }

  const { data, error } = await supabase
    .from("subscriptions")
    .insert([
      {
        ...payload,
        price,
        user_id: userId,
      },
    ])
    .select("*")
    .single();

  if (error) {
    console.error("Supabase insert error:", error);
    throw error;
  }
  
  return normalizeSubscription(data);
}

export async function patchSubscription(id: number, payload: Partial<CreateSubscriptionData>): Promise<void> {
  const { error } = await supabase.from("subscriptions").update(payload).eq("id", id);
  if (error) throw error;
}

export async function removeSubscription(id: number): Promise<void> {
  const { error } = await supabase.from("subscriptions").delete().eq("id", id);
  if (error) throw error;
}
