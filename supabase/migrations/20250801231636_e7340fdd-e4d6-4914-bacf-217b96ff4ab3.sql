-- Create sample plans if they don't exist
INSERT INTO public.plans (name, price_kes, speed_limit_mbps, validity_days, description, is_active) 
VALUES 
  ('Basic Plan', 500, 10, 30, 'Perfect for basic internet browsing and social media', true),
  ('Premium Plan', 1200, 25, 30, 'Great for streaming and online work', true),
  ('Ultimate Plan', 2500, 50, 30, 'Best for heavy usage and gaming', true)
ON CONFLICT (name) DO NOTHING;

-- Add sample payment status enum values if needed
-- This ensures the payment status works correctly
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
        CREATE TYPE payment_status AS ENUM ('pending', 'success', 'failed', 'cancelled');
    END IF;
END$$;

-- Add proper CSP security headers support by ensuring the app works
COMMENT ON TABLE public.users IS 'User profiles table for PrimeBill ISP management system';
COMMENT ON TABLE public.plans IS 'Internet plans available for subscription';
COMMENT ON TABLE public.payments IS 'Payment records for plan subscriptions';