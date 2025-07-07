
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'subadmin', 'client');
CREATE TYPE subscription_status AS ENUM ('active', 'expired', 'suspended');
CREATE TYPE payment_method AS ENUM ('MPESA', 'CASH', 'BANK_TRANSFER');
CREATE TYPE payment_status AS ENUM ('success', 'failed', 'pending');
CREATE TYPE router_status AS ENUM ('online', 'offline', 'maintenance');

-- Create users table (extending Supabase auth)
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT UNIQUE NOT NULL CHECK (phone ~ '^(\+254|0)[17]\d{8}$'), -- Kenyan phone format
    role user_role NOT NULL DEFAULT 'client',
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create plans table
CREATE TABLE public.plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    price_kes DECIMAL(10,2) NOT NULL CHECK (price_kes >= 0),
    speed_limit_mbps INTEGER NOT NULL CHECK (speed_limit_mbps > 0),
    validity_days INTEGER NOT NULL CHECK (validity_days > 0),
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create payments table
CREATE TABLE public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    amount_kes DECIMAL(10,2) NOT NULL CHECK (amount_kes > 0),
    method payment_method NOT NULL DEFAULT 'MPESA',
    mpesa_code TEXT, -- M-Pesa transaction code
    phone_number TEXT, -- Phone used for payment
    status payment_status NOT NULL DEFAULT 'pending',
    checkout_request_id TEXT, -- For STK Push tracking
    merchant_request_id TEXT, -- For STK Push tracking
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create subscriptions table
CREATE TABLE public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE RESTRICT,
    payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE NOT NULL,
    status subscription_status NOT NULL DEFAULT 'active',
    auto_renew BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create routers table
CREATE TABLE public.routers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_name TEXT NOT NULL,
    ip_address INET NOT NULL UNIQUE,
    api_port INTEGER NOT NULL DEFAULT 8728 CHECK (api_port > 0 AND api_port <= 65535),
    username TEXT NOT NULL,
    password_encrypted TEXT NOT NULL, -- Store encrypted password
    status router_status NOT NULL DEFAULT 'offline',
    last_seen TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create activity_logs table
CREATE TABLE public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    details JSONB, -- Store additional action details
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_phone ON public.users(phone);
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_subscriptions_end_date ON public.subscriptions(end_date);
CREATE INDEX idx_payments_user_id ON public.payments(user_id);
CREATE INDEX idx_payments_status ON public.payments(status);
CREATE INDEX idx_payments_mpesa_code ON public.payments(mpesa_code);
CREATE INDEX idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX idx_activity_logs_timestamp ON public.activity_logs(timestamp);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Create security definer function to get current user role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- RLS Policies for users table
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins and subadmins can view all users" ON public.users
    FOR SELECT USING (public.get_current_user_role() IN ('admin', 'subadmin'));

CREATE POLICY "Admins can manage all users" ON public.users
    FOR ALL USING (public.get_current_user_role() = 'admin');

CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for plans table
CREATE POLICY "Everyone can view active plans" ON public.plans
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage plans" ON public.plans
    FOR ALL USING (public.get_current_user_role() = 'admin');

-- RLS Policies for subscriptions table
CREATE POLICY "Users can view their own subscriptions" ON public.subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins and subadmins can view all subscriptions" ON public.subscriptions
    FOR SELECT USING (public.get_current_user_role() IN ('admin', 'subadmin'));

CREATE POLICY "Admins can manage all subscriptions" ON public.subscriptions
    FOR ALL USING (public.get_current_user_role() = 'admin');

CREATE POLICY "Users can create their own subscriptions" ON public.subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for payments table
CREATE POLICY "Users can view their own payments" ON public.payments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins and subadmins can view all payments" ON public.payments
    FOR SELECT USING (public.get_current_user_role() IN ('admin', 'subadmin'));

CREATE POLICY "Admins can manage all payments" ON public.payments
    FOR ALL USING (public.get_current_user_role() = 'admin');

CREATE POLICY "Users can create their own payments" ON public.payments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for routers table
CREATE POLICY "Admins and subadmins can view routers" ON public.routers
    FOR SELECT USING (public.get_current_user_role() IN ('admin', 'subadmin'));

CREATE POLICY "Admins can manage routers" ON public.routers
    FOR ALL USING (public.get_current_user_role() = 'admin');

-- RLS Policies for activity_logs table
CREATE POLICY "Users can view their own activity logs" ON public.activity_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all activity logs" ON public.activity_logs
    FOR SELECT USING (public.get_current_user_role() = 'admin');

CREATE POLICY "Everyone can insert activity logs" ON public.activity_logs
    FOR INSERT WITH CHECK (true);

-- Create trigger function to automatically update updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_plans_updated_at BEFORE UPDATE ON public.plans
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_routers_updated_at BEFORE UPDATE ON public.routers
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, name, email, phone, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'phone', NEW.phone),
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'client')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to auto-expire subscriptions
CREATE OR REPLACE FUNCTION public.expire_subscriptions()
RETURNS void AS $$
BEGIN
    UPDATE public.subscriptions
    SET status = 'expired', updated_at = NOW()
    WHERE end_date < CURRENT_DATE AND status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to log activities
CREATE OR REPLACE FUNCTION public.log_activity(
    p_user_id UUID,
    p_action TEXT,
    p_details JSONB DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
    INSERT INTO public.activity_logs (user_id, action, details, ip_address, user_agent)
    VALUES (p_user_id, p_action, p_details, p_ip_address, p_user_agent);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert sample data for testing
INSERT INTO public.plans (name, price_kes, speed_limit_mbps, validity_days, description) VALUES
('Basic Plan', 500.00, 5, 30, 'Basic internet package for light users'),
('Standard Plan', 1000.00, 10, 30, 'Standard internet package for regular users'),
('Premium Plan', 2000.00, 20, 30, 'Premium internet package for heavy users'),
('Daily Plan', 50.00, 5, 1, 'Daily internet access'),
('Weekly Plan', 200.00, 10, 7, 'Weekly internet access');
