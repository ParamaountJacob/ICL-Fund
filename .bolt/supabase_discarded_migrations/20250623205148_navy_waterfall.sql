-- Remove 'unverified' from verification_status enum and update existing data
-- This migration updates the verification_status enum to only include 'pending' and 'verified'

/*
  # Update Verification Status Enum

  1. Changes
    - Remove 'unverified' status from verification_status enum
    - Update existing 'unverified' users to 'pending'
    - Set default to 'pending' instead of 'unverified'

  2. Security
    - Maintains existing RLS policies
*/

-- First, update any existing 'unverified' users to 'pending'
UPDATE public.users 
SET verification_status = 'pending'::public.verification_status 
WHERE verification_status = 'unverified'::public.verification_status;

-- Drop and recreate the enum type
DROP TYPE IF EXISTS public.verification_status CASCADE;
CREATE TYPE public.verification_status AS ENUM ('pending', 'verified');

-- Recreate the users table column with the new enum and default
ALTER TABLE public.users 
ALTER COLUMN verification_status TYPE public.verification_status 
USING verification_status::text::public.verification_status;

ALTER TABLE public.users 
ALTER COLUMN verification_status SET DEFAULT 'pending'::public.verification_status;

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
CREATE POLICY "Users can view own messages" ON public.messages 
FOR SELECT TO authenticated 
USING (auth.uid() = sender_id OR auth.uid() = receiver_id OR (SELECT public.is_admin()));

CREATE POLICY "Users can send messages" ON public.messages 
FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update own messages" ON public.messages 
FOR UPDATE TO authenticated 
USING (auth.uid() = receiver_id OR auth.uid() = sender_id OR (SELECT public.is_admin()));

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
CREATE POLICY "Users can view own investments" ON public.investments 
FOR SELECT TO authenticated 
USING (auth.uid() = user_id OR (SELECT public.is_admin()));

CREATE POLICY "Users can insert own investments" ON public.investments 
FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = user_id);

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
CREATE POLICY "Users can view own payments" ON public.payments 
FOR SELECT TO authenticated 
USING (EXISTS (
    SELECT 1 FROM public.investments i 
    WHERE i.id = payments.investment_id 
    AND (i.user_id = auth.uid() OR (SELECT public.is_admin()))
));

CREATE POLICY "Admins can manage all payments" ON public.payments 
FOR ALL TO authenticated 
USING ((SELECT public.is_admin()));

-- Create view for investments with user data
CREATE OR REPLACE VIEW public.investment_with_users AS
SELECT 
    i.*,
    u.email,
    u.first_name,
    u.last_name,
    u.verification_status
FROM public.investments i
JOIN public.users u ON i.user_id = u.id;

COMMENT ON VIEW public.investment_with_users IS 'Use this view in the Admin dashboard with: supabase.from("investment_with_users").select("*")';