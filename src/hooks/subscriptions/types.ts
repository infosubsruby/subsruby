export interface Subscription {
  id: number;
  user_id: string;
  name: string;
  slug: string;
  price: number;
  currency: string;
  billing_cycle: "monthly" | "yearly" | null;
  start_date: string;
  next_payment_date: string | null;
  website_url: string | null;
  // Stored as a hex string (e.g. "#E50914"). We normalize nulls to a default in the API layer.
  card_color: string;
  created_at: string;
}

export interface CreateSubscriptionData {
  name: string;
  slug: string;
  price: number;
  currency: string;
  billing_cycle: "monthly" | "yearly";
  start_date: string;
  next_payment_date: string;
  website_url?: string;
  card_color: string;
}
