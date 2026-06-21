-- ==========================================
-- UPDATE PROFILES TO INCLUDE FULL NAME
-- ==========================================

-- Add full_name to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;

-- Update profiles with existing metadata if possible
-- Note: This requires permissions to access auth schema which may 
-- need to be run as service_role, but for a migration it's usually fine.
UPDATE public.profiles p
SET full_name = (SELECT (raw_user_meta_data->>'full_name') FROM auth.users u WHERE u.id = p.id)
WHERE p.full_name IS NULL;

-- Update the handle_new_user function to sync full_name
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (new.id, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
