-- Add SMS logs table for tracking all SMS communications
CREATE TABLE IF NOT EXISTS public.sms_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  phone_number TEXT NOT NULL,
  message TEXT NOT NULL,
  message_type TEXT NOT NULL CHECK (message_type IN ('payment_success', 'payment_failure', 'subscription_expiry', 'subscription_reminder', 'support_update', 'network_alert', 'general')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  provider_response JSONB,
  cost_kes DECIMAL(10,2) DEFAULT 0,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add support tickets table for customer support system
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('technical', 'billing', 'general', 'network', 'account')),
  internal_notes TEXT,
  resolution_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Add reseller management tables
CREATE TABLE IF NOT EXISTS public.resellers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  commission_rate DECIMAL(5,2) NOT NULL DEFAULT 10.00 CHECK (commission_rate >= 0 AND commission_rate <= 100),
  total_sales_kes DECIMAL(12,2) DEFAULT 0,
  total_commission_kes DECIMAL(12,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add commission tracking table
CREATE TABLE IF NOT EXISTS public.commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reseller_id UUID NOT NULL REFERENCES public.resellers(id) ON DELETE CASCADE,
  payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
  sale_amount_kes DECIMAL(10,2) NOT NULL,
  commission_rate DECIMAL(5,2) NOT NULL,
  commission_amount_kes DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add grace periods configuration table
CREATE TABLE IF NOT EXISTS public.grace_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES public.plans(id) ON DELETE CASCADE,
  grace_period_hours INTEGER NOT NULL DEFAULT 24 CHECK (grace_period_hours >= 0),
  reminder_hours_before INTEGER NOT NULL DEFAULT 24 CHECK (reminder_hours_before >= 0),
  auto_disconnect BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add bandwidth usage caps table
CREATE TABLE IF NOT EXISTS public.usage_caps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  monthly_limit_gb INTEGER CHECK (monthly_limit_gb > 0),
  daily_limit_gb INTEGER CHECK (daily_limit_gb > 0),
  speed_after_limit_mbps INTEGER DEFAULT 1 CHECK (speed_after_limit_mbps > 0),
  cap_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add email logs table for tracking email communications
CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  email_address TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  message_type TEXT NOT NULL CHECK (message_type IN ('payment_success', 'payment_failure', 'subscription_expiry', 'subscription_reminder', 'support_update', 'network_alert', 'invoice', 'general')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  provider_response JSONB,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add system configuration table for application settings
CREATE TABLE IF NOT EXISTS public.system_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  data_type TEXT NOT NULL DEFAULT 'string' CHECK (data_type IN ('string', 'number', 'boolean', 'json')),
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sms_logs_user_id ON public.sms_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_sms_logs_status ON public.sms_logs(status);
CREATE INDEX IF NOT EXISTS idx_sms_logs_message_type ON public.sms_logs(message_type);

CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON public.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned_to ON public.support_tickets(assigned_to);

CREATE INDEX IF NOT EXISTS idx_resellers_user_id ON public.resellers(user_id);
CREATE INDEX IF NOT EXISTS idx_commissions_reseller_id ON public.commissions(reseller_id);
CREATE INDEX IF NOT EXISTS idx_commissions_payment_id ON public.commissions(payment_id);

CREATE INDEX IF NOT EXISTS idx_email_logs_user_id ON public.email_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON public.email_logs(status);

-- Enable RLS on new tables
ALTER TABLE public.sms_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grace_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_caps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies for SMS logs
CREATE POLICY "Users can view their own SMS logs" ON public.sms_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all SMS logs" ON public.sms_logs
  FOR SELECT USING (public.get_current_user_role() IN ('admin', 'subadmin'));

CREATE POLICY "System can insert SMS logs" ON public.sms_logs
  FOR INSERT WITH CHECK (true);

-- RLS Policies for support tickets
CREATE POLICY "Users can view their own tickets" ON public.support_tickets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all tickets" ON public.support_tickets
  FOR SELECT USING (public.get_current_user_role() IN ('admin', 'subadmin'));

CREATE POLICY "Users can create their own tickets" ON public.support_tickets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all tickets" ON public.support_tickets
  FOR ALL USING (public.get_current_user_role() IN ('admin', 'subadmin'));

-- RLS Policies for resellers
CREATE POLICY "Users can view their own reseller info" ON public.resellers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all resellers" ON public.resellers
  FOR ALL USING (public.get_current_user_role() = 'admin');

-- RLS Policies for commissions
CREATE POLICY "Resellers can view their commissions" ON public.commissions
  FOR SELECT USING (
    reseller_id IN (
      SELECT id FROM public.resellers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all commissions" ON public.commissions
  FOR ALL USING (public.get_current_user_role() = 'admin');

-- RLS Policies for other tables
CREATE POLICY "Admins can manage grace periods" ON public.grace_periods
  FOR ALL USING (public.get_current_user_role() = 'admin');

CREATE POLICY "Admins can manage usage caps" ON public.usage_caps
  FOR ALL USING (public.get_current_user_role() = 'admin');

CREATE POLICY "Users can view their email logs" ON public.email_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all email logs" ON public.email_logs
  FOR SELECT USING (public.get_current_user_role() IN ('admin', 'subadmin'));

CREATE POLICY "System can insert email logs" ON public.email_logs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can manage system config" ON public.system_config
  FOR ALL USING (public.get_current_user_role() = 'admin');

CREATE POLICY "Everyone can view public config" ON public.system_config
  FOR SELECT USING (is_public = true);

-- Add triggers for updated_at timestamps
CREATE TRIGGER update_support_tickets_updated_at 
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_resellers_updated_at 
  BEFORE UPDATE ON public.resellers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_grace_periods_updated_at 
  BEFORE UPDATE ON public.grace_periods
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_usage_caps_updated_at 
  BEFORE UPDATE ON public.usage_caps
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_system_config_updated_at 
  BEFORE UPDATE ON public.system_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add realtime subscriptions for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.sms_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.email_logs;

-- Set replica identity for proper realtime updates
ALTER TABLE public.sms_logs REPLICA IDENTITY FULL;
ALTER TABLE public.support_tickets REPLICA IDENTITY FULL;
ALTER TABLE public.email_logs REPLICA IDENTITY FULL;

-- Insert default system configuration
INSERT INTO public.system_config (key, value, description, data_type, is_public) VALUES
('company_name', 'PrimeBill Solutions', 'Company name for branding', 'string', true),
('company_timezone', 'Africa/Nairobi', 'Default timezone for the system', 'string', true),
('currency', 'KES', 'Default currency', 'string', true),
('sms_enabled', 'true', 'Enable SMS notifications', 'boolean', false),
('email_enabled', 'true', 'Enable email notifications', 'boolean', false),
('auto_disconnect_enabled', 'true', 'Enable automatic disconnection on expiry', 'boolean', false),
('default_grace_period_hours', '24', 'Default grace period in hours', 'number', false),
('max_concurrent_sessions', '1', 'Maximum concurrent sessions per user', 'number', false)
ON CONFLICT (key) DO NOTHING;

-- Create function to send automated notifications
CREATE OR REPLACE FUNCTION public.send_notification(
  p_user_id UUID,
  p_type TEXT,
  p_message TEXT,
  p_send_sms BOOLEAN DEFAULT true,
  p_send_email BOOLEAN DEFAULT true
)
RETURNS void AS $$
DECLARE
  user_record RECORD;
BEGIN
  -- Get user information
  SELECT * INTO user_record FROM public.users WHERE id = p_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  -- Send SMS if enabled
  IF p_send_sms AND (SELECT value::boolean FROM public.system_config WHERE key = 'sms_enabled') THEN
    PERFORM net.http_post(
      url := (SELECT value FROM public.system_config WHERE key = 'supabase_url') || '/functions/v1/sms-notifications',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || 
                 (SELECT value FROM public.system_config WHERE key = 'supabase_service_key') || '"}'::jsonb,
      body := json_build_object(
        'phone', user_record.phone,
        'message', p_message,
        'user_id', p_user_id,
        'type', p_type
      )::jsonb
    );
  END IF;
  
  -- Send email if enabled
  IF p_send_email AND (SELECT value::boolean FROM public.system_config WHERE key = 'email_enabled') THEN
    PERFORM net.http_post(
      url := (SELECT value FROM public.system_config WHERE key = 'supabase_url') || '/functions/v1/email-notifications',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || 
                 (SELECT value FROM public.system_config WHERE key = 'supabase_service_key') || '"}'::jsonb,
      body := json_build_object(
        'email', user_record.email,
        'subject', 'Notification from ' || (SELECT value FROM public.system_config WHERE key = 'company_name'),
        'message', p_message,
        'user_id', p_user_id,
        'type', p_type
      )::jsonb
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;