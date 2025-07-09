
-- Enable pg_cron extension for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create a scheduled job to run subscription expiry check daily at midnight
SELECT cron.schedule(
  'expire-subscriptions-daily',
  '0 0 * * *', -- Daily at midnight
  $$
  SELECT net.http_post(
    url := 'https://ejyzldnrcgglcnpbxmda.supabase.co/functions/v1/subscription-manager',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqeXpsZG5yY2dnbGNucGJ4bWRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5MzAwODksImV4cCI6MjA2NzUwNjA4OX0.nGe9iaFfQ3nl9WZGfI4gCW9qaNViIIamdVFnTyoIHjQ"}'::jsonb,
    body := '{"action": "expire_subscriptions"}'::jsonb
  );
  $$
);

-- Create user_connections table to track network connections
CREATE TABLE IF NOT EXISTS public.user_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  router_id UUID NOT NULL REFERENCES public.routers(id) ON DELETE CASCADE,
  ip_address INET,
  mac_address TEXT,
  connection_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  connection_end TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'disconnected', 'blocked')),
  bytes_downloaded BIGINT DEFAULT 0,
  bytes_uploaded BIGINT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create usage_statistics table for tracking data usage
CREATE TABLE IF NOT EXISTS public.usage_statistics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  bytes_downloaded BIGINT DEFAULT 0,
  bytes_uploaded BIGINT DEFAULT 0,
  session_duration INTEGER DEFAULT 0, -- in minutes
  peak_speed_mbps NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for user_connections
ALTER TABLE public.user_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own connections" 
  ON public.user_connections 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all connections" 
  ON public.user_connections 
  FOR ALL 
  USING (get_current_user_role() = 'admin'::user_role);

-- Add RLS policies for usage_statistics
ALTER TABLE public.usage_statistics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own usage stats" 
  ON public.usage_statistics 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all usage stats" 
  ON public.usage_statistics 
  FOR ALL 
  USING (get_current_user_role() = 'admin'::user_role);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_connections_user_id ON public.user_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_user_connections_status ON public.user_connections(status);
CREATE INDEX IF NOT EXISTS idx_usage_statistics_user_id ON public.usage_statistics(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_statistics_date ON public.usage_statistics(date);

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_connections;
ALTER PUBLICATION supabase_realtime ADD TABLE public.usage_statistics;
ALTER PUBLICATION supabase_realtime ADD TABLE public.subscriptions;

-- Set replica identity for proper realtime updates
ALTER TABLE public.user_connections REPLICA IDENTITY FULL;
ALTER TABLE public.usage_statistics REPLICA IDENTITY FULL;
ALTER TABLE public.subscriptions REPLICA IDENTITY FULL;
