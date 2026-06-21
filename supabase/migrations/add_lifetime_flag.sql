-- Add is_perminent_paid_user column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_perminent_paid_user BOOLEAN DEFAULT FALSE;
