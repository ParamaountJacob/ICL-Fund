-- Emergency fix for missing functions
-- This provides a simple implementation of the missing functions

-- First drop any existing functions to be safe
DROP FUNCTION IF EXISTS public.get_user_investments_with_applications(uuid);

-- Create a simple version of the function that just works
CREATE OR REPLACE FUNCTION public.get_user_investments_with_applications(p_user_id uuid)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  application_id uuid,
  amount numeric,
  annual_percentage numeric,
  payment_frequency text,
  term_months integer,
  start_date date,
  status text,
  total_expected_return numeric,
  created_at timestamptz,
  updated_at timestamptz,
  application_status text,
  investment_amount numeric,
  user_email text,
  user_first_name text,
  user_last_name text
) AS $$
BEGIN
  -- This simplified version just returns investments data
  RETURN QUERY
  SELECT 
    i.id,
    i.user_id,
    i.application_id,
    i.amount,
    i.annual_percentage,
    i.payment_frequency::text,
    i.term_months,
    i.start_date,
    i.status::text,
    i.total_expected_return,
    i.created_at,
    i.updated_at,
    a.status as application_status,
    a.investment_amount,
    u.email as user_email,
    (u.raw_user_meta_data->>'first_name')::text as user_first_name,
    (u.raw_user_meta_data->>'last_name')::text as user_last_name
  FROM 
    investments i
  LEFT JOIN 
    investment_applications a ON i.application_id = a.id
  LEFT JOIN 
    auth.users u ON i.user_id = u.id
  WHERE 
    i.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_user_investments_with_applications(uuid) TO authenticated;

-- Do the same for admin function
DROP FUNCTION IF EXISTS public.get_admin_investments_with_users();

CREATE OR REPLACE FUNCTION public.get_admin_investments_with_users()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  application_id uuid,
  amount numeric,
  annual_percentage numeric,
  payment_frequency text,
  term_months integer,
  start_date date,
  status text,
  total_expected_return numeric,
  created_at timestamptz,
  updated_at timestamptz,
  application_status text,
  investment_amount numeric,
  user_email text,
  user_first_name text,
  user_last_name text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id,
    i.user_id,
    i.application_id,
    i.amount,
    i.annual_percentage,
    i.payment_frequency::text,
    i.term_months,
    i.start_date,
    i.status::text,
    i.total_expected_return,
    i.created_at,
    i.updated_at,
    a.status as application_status,
    a.investment_amount,
    u.email as user_email,
    (u.raw_user_meta_data->>'first_name')::text as user_first_name,
    (u.raw_user_meta_data->>'last_name')::text as user_last_name
  FROM 
    investments i
  LEFT JOIN 
    investment_applications a ON i.application_id = a.id
  LEFT JOIN 
    auth.users u ON i.user_id = u.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_admin_investments_with_users() TO authenticated;
