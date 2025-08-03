-- Create sample plans if they don't exist
INSERT INTO public.plans (name, price_kes, speed_limit_mbps, validity_days, description, is_active) 
VALUES 
  ('Basic Plan', 500, 10, 30, 'Perfect for basic internet browsing and social media', true),
  ('Premium Plan', 1200, 25, 30, 'Great for streaming and online work', true),
  ('Ultimate Plan', 2500, 50, 30, 'Best for heavy usage and gaming', true)
WHERE NOT EXISTS (SELECT 1 FROM public.plans WHERE name = 'Basic Plan');

-- Ensure proper indexes exist for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_plans_active ON public.plans(is_active);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status ON public.subscriptions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_payments_user_status ON public.payments(user_id, status);