-- Fix database security issues and add account status tracking

-- First, fix the security definer functions with proper search_path
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
    NEW.phone
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Fix is_admin function with proper search_path
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'pg_catalog', 'public'
AS $$
  SELECT (auth.jwt() -> 'app_metadata' ->> 'role')::text = 'admin'
  OR EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'admin'
  );
$$;

-- Fix log_activity functions with proper search_path
CREATE OR REPLACE FUNCTION public.log_activity(
  p_user_id uuid, 
  p_action text, 
  p_details jsonb DEFAULT NULL::jsonb, 
  p_ip_address inet DEFAULT NULL::inet, 
  p_user_agent text DEFAULT NULL::text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'pg_catalog', 'public'
AS $$
BEGIN
    INSERT INTO public.activity_logs (user_id, action, details, ip_address, user_agent)
    VALUES (p_user_id, p_action, p_details, p_ip_address, p_user_agent);
END;
$$;

-- Add account status and billing integration columns to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS account_status text DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'delinquent', 'inactive')),
ADD COLUMN IF NOT EXISTS last_login_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS failed_login_attempts integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS account_locked_until timestamp with time zone,
ADD COLUMN IF NOT EXISTS password_changed_at timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS require_password_change boolean DEFAULT false;

-- Create index for performance on account status and login tracking
CREATE INDEX IF NOT EXISTS idx_users_account_status ON public.users(account_status);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON public.users(last_login_at);
CREATE INDEX IF NOT EXISTS idx_users_failed_attempts ON public.users(failed_login_attempts);

-- Create function to check account status during authentication
CREATE OR REPLACE FUNCTION public.check_account_status(user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'pg_catalog', 'public'
AS $$
DECLARE
  user_record public.users%ROWTYPE;
  result jsonb := '{"allowed": false, "reason": "unknown"}'::jsonb;
BEGIN
  SELECT * INTO user_record FROM public.users WHERE id = user_id;
  
  IF NOT FOUND THEN
    RETURN '{"allowed": false, "reason": "user_not_found"}'::jsonb;
  END IF;
  
  -- Check if account is locked
  IF user_record.account_locked_until IS NOT NULL AND user_record.account_locked_until > now() THEN
    RETURN jsonb_build_object(
      'allowed', false, 
      'reason', 'account_locked',
      'locked_until', user_record.account_locked_until
    );
  END IF;
  
  -- Check account status
  IF user_record.account_status != 'active' THEN
    RETURN jsonb_build_object(
      'allowed', false, 
      'reason', 'account_' || user_record.account_status,
      'status', user_record.account_status
    );
  END IF;
  
  -- Account is active and not locked
  RETURN jsonb_build_object(
    'allowed', true, 
    'reason', 'account_active',
    'require_password_change', COALESCE(user_record.require_password_change, false)
  );
END;
$$;

-- Create function to handle failed login attempts
CREATE OR REPLACE FUNCTION public.handle_failed_login(user_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'pg_catalog', 'public'
AS $$
DECLARE
  max_attempts integer := 5;
  lockout_duration interval := '30 minutes';
BEGIN
  UPDATE public.users 
  SET 
    failed_login_attempts = failed_login_attempts + 1,
    account_locked_until = CASE 
      WHEN failed_login_attempts + 1 >= max_attempts 
      THEN now() + lockout_duration
      ELSE account_locked_until
    END
  WHERE email = user_email;
END;
$$;

-- Create function to handle successful login
CREATE OR REPLACE FUNCTION public.handle_successful_login(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'pg_catalog', 'public'
AS $$
BEGIN
  UPDATE public.users 
  SET 
    failed_login_attempts = 0,
    account_locked_until = NULL,
    last_login_at = now()
  WHERE id = user_id;
END;
$$;

-- Add RLS policy for account status checks
CREATE POLICY "Users can check their own account status" 
ON public.users 
FOR SELECT 
USING (auth.uid() = id);

-- Enable RLS on users table if not already enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;