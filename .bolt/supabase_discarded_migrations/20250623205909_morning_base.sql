-- Remove unverified status and add messaging/investment tables

-- First, check if verification_status column exists and handle accordingly
DO $$
BEGIN
    -- Check if the column exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'verification_status' 
        AND table_schema = 'public'
    ) THEN
        -- Update any existing 'unverified' users to 'pending' if the column exists
        UPDATE public.users 
        SET verification_status = 'pending'
        WHERE verification_status::text = 'unverified';
        
        -- Drop the column temporarily
        ALTER TABLE public.users DROP COLUMN verification_status;
    END IF;
END $$;

-- Drop and recreate the enum type
DROP TYPE IF EXISTS public.verification_status CASCADE;
CREATE TYPE public.verification_status AS ENUM ('pending', 'verified');

-- Add the verification_status column back with the new enum
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS verification_status public.verification_status DEFAULT 'pending';

-- Add messages table for user-admin communication
CREATE TABLE IF NOT EXISTS public.messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id uuid REFERENCES auth.users(id) NOT NULL,
    receiver_id uuid REFERENCES auth.users(id) NOT NULL,
    subject text,
    content text NOT NULL,
    is_read boolean DEFAULT false,
    parent_message_id uuid REFERENCES public.messages(id),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages (sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON public.messages (receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_read ON public.messages (is_read);

-- Enable RLS on messages table
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Messages policies
DROP POLICY IF EXISTS "Users can view own messages" ON public.messages;
CREATE POLICY "Users can view own messages" ON public.messages 
FOR SELECT TO authenticated 
USING (auth.uid() = sender_id OR auth.uid() = receiver_id OR (SELECT public.is_admin()));

DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
CREATE POLICY "Users can send messages" ON public.messages 
FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Users can update own messages" ON public.messages;
CREATE POLICY "Users can update own messages" ON public.messages 
FOR UPDATE TO authenticated 
USING (auth.uid() = receiver_id OR auth.uid() = sender_id OR (SELECT public.is_admin()));

DROP POLICY IF EXISTS "Admins can manage all messages" ON public.messages;
CREATE POLICY "Admins can manage all messages" ON public.messages 
FOR ALL TO authenticated 
USING ((SELECT public.is_admin()));

-- Add investments table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.investments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) NOT NULL,
    amount numeric NOT NULL CHECK (amount > 0),
    annual_percentage numeric NOT NULL CHECK (annual_percentage > 0 AND annual_percentage <= 100),
    payment_frequency public.payment_frequency_enum NOT NULL,
    start_date date NOT NULL,
    end_date date,
    status public.investment_status_enum DEFAULT 'pending' NOT NULL,
    term_months integer,
    total_expected_return numeric,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_investments_user_id ON public.investments (user_id);
CREATE INDEX IF NOT EXISTS idx_investments_status ON public.investments (status);

-- Enable RLS on investments table
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;

-- Investments policies
DROP POLICY IF EXISTS "Users can view own investments" ON public.investments;
CREATE POLICY "Users can view own investments" ON public.investments 
FOR SELECT TO authenticated 
USING (auth.uid() = user_id OR (SELECT public.is_admin()));

DROP POLICY IF EXISTS "Users can insert own investments" ON public.investments;
CREATE POLICY "Users can insert own investments" ON public.investments 
FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all investments" ON public.investments;
CREATE POLICY "Admins can manage all investments" ON public.investments 
FOR ALL TO authenticated 
USING ((SELECT public.is_admin()));

-- Add payments table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.payments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    investment_id uuid REFERENCES public.investments(id) NOT NULL,
    amount numeric NOT NULL CHECK (amount > 0),
    payment_date date NOT NULL,
    status public.payment_status_enum DEFAULT 'scheduled' NOT NULL,
    payment_method text,
    transaction_reference text,
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_investment_id ON public.payments (investment_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments (status);
CREATE INDEX IF NOT EXISTS idx_payments_date ON public.payments (payment_date);

-- Enable RLS on payments table
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Payments policies
DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
CREATE POLICY "Users can view own payments" ON public.payments 
FOR SELECT TO authenticated 
USING (EXISTS (
    SELECT 1 FROM public.investments i 
    WHERE i.id = payments.investment_id 
    AND (i.user_id = auth.uid() OR (SELECT public.is_admin()))
));

DROP POLICY IF EXISTS "Admins can manage all payments" ON public.payments;
CREATE POLICY "Admins can manage all payments" ON public.payments 
FOR ALL TO authenticated 
USING ((SELECT public.is_admin()));

-- Create view for investments with user data
DROP VIEW IF EXISTS public.investment_with_users;
CREATE VIEW public.investment_with_users AS
SELECT 
    i.*,
    u.email,
    u.first_name,
    u.last_name,
    u.verification_status
FROM public.investments i
JOIN public.users u ON i.user_id = u.id;

COMMENT ON VIEW public.investment_with_users IS 'Use this view in the Admin dashboard with: supabase.from("investment_with_users").select("*")';

-- Add function to send message to all admins
CREATE OR REPLACE FUNCTION public.send_message_to_admins(
    p_subject text,
    p_content text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    admin_user RECORD;
BEGIN
    -- Insert message to all admin users
    FOR admin_user IN 
        SELECT id FROM public.users WHERE role IN ('admin', 'sub_admin')
    LOOP
        INSERT INTO public.messages (sender_id, receiver_id, subject, content)
        VALUES (auth.uid(), admin_user.id, p_subject, p_content);
    END LOOP;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.send_message_to_admins(text, text) TO authenticated;