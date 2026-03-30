ALTER TABLE public.user_subscriptions
  ADD COLUMN IF NOT EXISTS customer_portal_url text;
