/*
  # Fix safe_upsert_user_profile function overloading

  1. Problem
    - Two versions of safe_upsert_user_profile function exist
    - One with p_full_name parameter
    - One with p_first_name and p_last_name parameters
    - This creates ambiguity when calling the function

  2. Solution
    - Drop the version that uses p_full_name parameter
    - Keep the version that uses p_first_name and p_last_name parameters
    - This matches what the application code expects

  3. Changes
    - Remove the conflicting function definition
    - Ensure only one version remains for proper function resolution
*/

-- Drop the function that uses p_full_name parameter to resolve overloading
DROP FUNCTION IF EXISTS public.safe_upsert_user_profile(
  p_user_id uuid,
  p_full_name text,
  p_phone text,
  p_address text,
  p_ira_accounts text,
  p_investment_goals text,
  p_risk_tolerance text,
  p_net_worth text,
  p_annual_income text
);

-- Ensure the correct function exists with first_name and last_name parameters
CREATE OR REPLACE FUNCTION public.safe_upsert_user_profile(
  p_user_id uuid,
  p_first_name text DEFAULT NULL,
  p_last_name text DEFAULT NULL,
  p_phone text DEFAULT NULL,
  p_address text DEFAULT NULL,
  p_ira_accounts text DEFAULT NULL,
  p_investment_goals text DEFAULT NULL,
  p_risk_tolerance text DEFAULT NULL,
  p_net_worth text DEFAULT NULL,
  p_annual_income text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_profiles (
    user_id,
    first_name,
    last_name,
    phone,
    address,
    ira_accounts,
    investment_goals,
    risk_tolerance,
    net_worth,
    annual_income,
    updated_at
  )
  VALUES (
    p_user_id,
    p_first_name,
    p_last_name,
    p_phone,
    p_address,
    p_ira_accounts,
    p_investment_goals,
    p_risk_tolerance,
    p_net_worth,
    p_annual_income,
    now()
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    first_name = COALESCE(EXCLUDED.first_name, user_profiles.first_name),
    last_name = COALESCE(EXCLUDED.last_name, user_profiles.last_name),
    phone = COALESCE(EXCLUDED.phone, user_profiles.phone),
    address = COALESCE(EXCLUDED.address, user_profiles.address),
    ira_accounts = COALESCE(EXCLUDED.ira_accounts, user_profiles.ira_accounts),
    investment_goals = COALESCE(EXCLUDED.investment_goals, user_profiles.investment_goals),
    risk_tolerance = COALESCE(EXCLUDED.risk_tolerance, user_profiles.risk_tolerance),
    net_worth = COALESCE(EXCLUDED.net_worth, user_profiles.net_worth),
    annual_income = COALESCE(EXCLUDED.annual_income, user_profiles.annual_income),
    updated_at = now();
END;
$$;