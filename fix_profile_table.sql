-- Emergency fix for user_profiles table and function
-- Run this in your Supabase SQL editor

-- First, ensure the table exists with the correct structure
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name text,
    last_name text,
    email text,
    phone text,
    address text,
    ira_accounts jsonb,
    investment_goals text,
    risk_tolerance text,
    net_worth text,
    annual_income text,
    role text DEFAULT 'user',
    verification_status text DEFAULT 'pending',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS user_profiles_policy ON public.user_profiles;

-- Create RLS policy
CREATE POLICY user_profiles_policy ON public.user_profiles 
FOR ALL USING (id = auth.uid());

-- Grant permissions
GRANT ALL ON public.user_profiles TO authenticated;

-- Replace the problematic function with a simpler, working version
CREATE OR REPLACE FUNCTION public.safe_upsert_user_profile(
    p_user_id uuid,
    p_first_name text,
    p_last_name text,
    p_phone text DEFAULT NULL,
    p_address text DEFAULT NULL,
    p_ira_accounts jsonb DEFAULT NULL,
    p_investment_goals text DEFAULT NULL,
    p_risk_tolerance text DEFAULT NULL,
    p_net_worth text DEFAULT NULL,
    p_annual_income text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Direct insert/update without conditional table creation
    INSERT INTO public.user_profiles (
        id, first_name, last_name, phone, address, ira_accounts, 
        investment_goals, risk_tolerance, net_worth, annual_income, updated_at
    )
    VALUES (
        p_user_id, p_first_name, p_last_name, p_phone, p_address, p_ira_accounts,
        p_investment_goals, p_risk_tolerance, p_net_worth, p_annual_income, now()
    )
    ON CONFLICT (id) 
    DO UPDATE SET 
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        phone = COALESCE(EXCLUDED.phone, user_profiles.phone),
        address = COALESCE(EXCLUDED.address, user_profiles.address),
        ira_accounts = COALESCE(EXCLUDED.ira_accounts, user_profiles.ira_accounts),
        investment_goals = COALESCE(EXCLUDED.investment_goals, user_profiles.investment_goals),
        risk_tolerance = COALESCE(EXCLUDED.risk_tolerance, user_profiles.risk_tolerance),
        net_worth = COALESCE(EXCLUDED.net_worth, user_profiles.net_worth),
        annual_income = COALESCE(EXCLUDED.annual_income, user_profiles.annual_income),
        updated_at = now();
    
    RETURN true;
EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'Error in safe_upsert_user_profile: %', SQLERRM;
    RETURN false;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.safe_upsert_user_profile(uuid, text, text, text, text, jsonb, text, text, text, text) TO authenticated;

-- Test the function works
SELECT public.safe_upsert_user_profile(
    auth.uid(),
    'Test',
    'User',
    null,
    null,
    null,
    null,
    null,
    null,
    null
);

-- Check if the test worked
SELECT * FROM public.user_profiles WHERE id = auth.uid();
