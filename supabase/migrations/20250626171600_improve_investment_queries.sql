-- Improve investment retrieval functions
-- This migration enhances the function to get all user investments with applications

-- First drop existing functions
DROP FUNCTION IF EXISTS public.get_user_investments_with_applications(uuid);
DROP FUNCTION IF EXISTS public.get_admin_investments_with_users();

-- Improved function to get user investments with applications
CREATE FUNCTION public.get_user_investments_with_applications(p_user_id uuid)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  application_id uuid,
  amount numeric,
  annual_percentage numeric,
  payment_frequency payment_frequency_enum,
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
    i.payment_frequency,
    i.term_months,
    i.start_date,
    i.status::text,
    i.total_expected_return,
    i.created_at,
    i.updated_at,
    a.status as application_status,
    a.investment_amount,
    u.email as user_email,
    u.raw_user_meta_data->>'first_name' as user_first_name,
    u.raw_user_meta_data->>'last_name' as user_last_name
  FROM 
    investments i
  LEFT JOIN 
    investment_applications a ON i.application_id = a.id
  LEFT JOIN 
    auth.users u ON i.user_id = u.id
  WHERE 
    i.user_id = p_user_id
  
  UNION ALL
  
  -- Include applications that might not have an investment record yet
  SELECT
    NULL as id,
    a.user_id,
    a.id as application_id,
    a.investment_amount as amount,
    a.annual_percentage,
    NULL as payment_frequency,
    a.term_months,
    NULL as start_date,
    a.status as status,
    (a.investment_amount * a.annual_percentage / 100) * (a.term_months / 12.0) as total_expected_return,
    a.created_at,
    a.updated_at,
    a.status as application_status,
    a.investment_amount,
    u.email as user_email,
    u.raw_user_meta_data->>'first_name' as user_first_name,
    u.raw_user_meta_data->>'last_name' as user_last_name
  FROM
    investment_applications a
  LEFT JOIN
    investments i ON a.id = i.application_id
  LEFT JOIN 
    auth.users u ON a.user_id = u.id
  WHERE
    a.user_id = p_user_id
    AND i.id IS NULL  -- Only include applications that don't have an associated investment
    AND a.status NOT IN ('rejected', 'deleted', 'cancelled');
    
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Also improve the admin version of the function
CREATE FUNCTION public.get_admin_investments_with_users()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  application_id uuid,
  amount numeric,
  annual_percentage numeric,
  payment_frequency payment_frequency_enum,
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
    i.payment_frequency,
    i.term_months,
    i.start_date,
    i.status::text,
    i.total_expected_return,
    i.created_at,
    i.updated_at,
    a.status as application_status,
    a.investment_amount,
    u.email as user_email,
    u.raw_user_meta_data->>'first_name' as user_first_name,
    u.raw_user_meta_data->>'last_name' as user_last_name
  FROM 
    investments i
  LEFT JOIN 
    investment_applications a ON i.application_id = a.id
  LEFT JOIN 
    auth.users u ON i.user_id = u.id
  
  UNION ALL
  
  -- Include applications that might not have an investment record yet
  SELECT
    NULL as id,
    a.user_id,
    a.id as application_id,
    a.investment_amount as amount,
    a.annual_percentage,
    NULL as payment_frequency,
    a.term_months,
    NULL as start_date,
    a.status as status,
    (a.investment_amount * a.annual_percentage / 100) * (a.term_months / 12.0) as total_expected_return,
    a.created_at,
    a.updated_at,
    a.status as application_status,
    a.investment_amount,
    u.email as user_email,
    u.raw_user_meta_data->>'first_name' as user_first_name,
    u.raw_user_meta_data->>'last_name' as user_last_name
  FROM
    investment_applications a
  LEFT JOIN
    investments i ON a.id = i.application_id
  LEFT JOIN 
    auth.users u ON a.user_id = u.id
  WHERE
    i.id IS NULL  -- Only include applications that don't have an associated investment
    AND a.status NOT IN ('rejected', 'deleted', 'cancelled');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
-- Grant permissions after creating the functions
DO $$ 
BEGIN
  EXECUTE 'GRANT EXECUTE ON FUNCTION public.get_user_investments_with_applications(uuid) TO authenticated';
  EXECUTE 'GRANT EXECUTE ON FUNCTION public.get_admin_investments_with_users() TO authenticated';
END $$;
