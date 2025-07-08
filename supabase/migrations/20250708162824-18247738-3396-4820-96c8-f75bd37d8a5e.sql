
-- Add missing fields to payments table for callback data
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS mpesa_receipt_number TEXT,
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster checkout request lookups
CREATE INDEX IF NOT EXISTS idx_payments_checkout_request_id ON public.payments(checkout_request_id);

-- Create errors table for logging callback failures (optional but recommended)
CREATE TABLE IF NOT EXISTS public.mpesa_callback_errors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    callback_payload JSONB NOT NULL,
    error_message TEXT NOT NULL,
    error_details JSONB,
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS on errors table
ALTER TABLE public.mpesa_callback_errors ENABLE ROW LEVEL SECURITY;

-- Only admins can view callback errors
CREATE POLICY "Admins can view callback errors" ON public.mpesa_callback_errors
    FOR SELECT USING (public.get_current_user_role() = 'admin');

CREATE POLICY "System can insert callback errors" ON public.mpesa_callback_errors
    FOR INSERT WITH CHECK (true);
