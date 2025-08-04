-- Fix infinite recursion in RLS policies and handle phone constraint

-- Drop problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

-- Recreate policies using the security definer function to avoid recursion
CREATE POLICY "Admins can view all users" 
ON public.users 
FOR SELECT 
USING (get_current_user_role() = 'admin'::user_role);

CREATE POLICY "Users can view own profile" 
ON public.users 
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON public.users 
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Fix the handle_new_user function to handle phone properly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'pg_catalog', 'public'
AS $$
BEGIN
  INSERT INTO public.users (id, name, email, phone)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email), 
    NEW.email, 
    COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Make phone column nullable temporarily to avoid constraint violations
ALTER TABLE public.users ALTER COLUMN phone DROP NOT NULL;

-- Update existing records with empty phone to have a default value
UPDATE public.users SET phone = '' WHERE phone IS NULL;