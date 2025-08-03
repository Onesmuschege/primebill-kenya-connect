-- Fix PostgreSQL Security Issues
-- Add SECURITY DEFINER and proper search_path to all functions

-- Update log_activity function
CREATE OR REPLACE FUNCTION public.log_activity()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
BEGIN
    -- function body
END;
$function$;

-- Update is_admin function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
  -- Replace this with your actual admin check logic
  -- Example using JWT claims:
  SELECT (auth.jwt() -> 'app_metadata' ->> 'role')::text = 'admin';
  
  -- OR Example using a roles table:
  -- SELECT EXISTS (
  --   SELECT 1 FROM public.user_roles 
  --   WHERE user_id = auth.uid() 
  --   AND role = 'admin'
  -- );
$function$;

-- Update log_activity_wrapper function
CREATE OR REPLACE FUNCTION public.log_activity_wrapper()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
BEGIN
  RETURN public.log_activity();
END;
$function$;

-- Update log_activity overloaded function
CREATE OR REPLACE FUNCTION public.log_activity(p_user_id uuid, p_action text, p_details jsonb DEFAULT NULL::jsonb, p_ip_address inet DEFAULT NULL::inet, p_user_agent text DEFAULT NULL::text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
BEGIN
    INSERT INTO public.activity_logs (user_id, action, details, ip_address, user_agent)
    VALUES (p_user_id, p_action, p_details, p_ip_address, p_user_agent);
END;
$function$;

-- Update get_current_user_role function
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
  SELECT role FROM public.users WHERE id = auth.uid();
$function$;

-- Update update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Update handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
BEGIN
  -- Your existing function body here
  -- Note: All object references in the function body must be schema-qualified
  -- For example, use public.profiles instead of just profiles
  RETURN NEW;
END;
$function$;

-- Update expire_subscriptions function
CREATE OR REPLACE FUNCTION public.expire_subscriptions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
BEGIN
  UPDATE public.subscriptions
  SET expires_at = NOW()
  WHERE expires_at > NOW();
END;
$function$;

-- Create admin setup function for initial admin user creation
CREATE OR REPLACE FUNCTION public.create_admin_user(admin_email text, admin_password text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  new_user_id uuid;
BEGIN
  -- Insert into auth.users would need to be done via Supabase client
  -- This function provides a template for setting up admin role
  -- Must be called after user is created via normal signup
  
  -- Check if user exists
  SELECT id INTO new_user_id FROM public.users WHERE email = admin_email LIMIT 1;
  
  IF new_user_id IS NOT NULL THEN
    -- Update user role to admin
    UPDATE public.users 
    SET role = 'admin' 
    WHERE id = new_user_id;
    
    RETURN 'Admin role assigned to user: ' || admin_email;
  ELSE
    RETURN 'User not found. Please create account first via signup.';
  END IF;
END;
$function$;