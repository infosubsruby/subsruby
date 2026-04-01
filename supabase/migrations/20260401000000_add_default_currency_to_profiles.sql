ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS default_currency text;

