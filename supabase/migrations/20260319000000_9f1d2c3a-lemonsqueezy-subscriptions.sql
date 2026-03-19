ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS lemon_squeezy_customer_id text,
  ADD COLUMN IF NOT EXISTS subscription_id text,
  ADD COLUMN IF NOT EXISTS variant_id text,
  ADD COLUMN IF NOT EXISTS subscription_status text,
  ADD COLUMN IF NOT EXISTS current_period_end timestamp with time zone;

ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS has_lifetime_access;

DROP TABLE IF EXISTS public.user_subscriptions;

