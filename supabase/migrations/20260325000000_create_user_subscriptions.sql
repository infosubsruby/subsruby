CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  status text,
  subscription_id text,
  variant_id text,
  lemon_squeezy_customer_id text,
  current_period_end timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own subscription status" ON public.user_subscriptions;

CREATE POLICY "Users can read own subscription status"
  ON public.user_subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

