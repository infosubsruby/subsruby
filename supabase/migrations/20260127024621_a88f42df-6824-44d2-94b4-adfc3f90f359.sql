-- Add has_lifetime_access column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN has_lifetime_access boolean NOT NULL DEFAULT false;