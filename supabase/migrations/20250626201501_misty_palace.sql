/*
  # Fix Investment Display in Dashboard
  
  1. New Functions
    - Recreates get_user_investments_with_applications with proper return types
    - Recreates get_admin_investments_with_users with proper return types
    - Adds debug logging to track investment retrieval
  
  2. Changes
    - Ensures investments are properly created and linked to applications
    - Fixes status synchronization between applications and investments
    - Adds proper error handling and logging
    
  3. Security
    - Maintains existing security model
    - Grants proper permissions to authenticated users
*/

-- Create improved function to get user investments with applications
CREATE OR REPLACE FUNCTION public.get_user_investments_with_applications(p_user_id uuid)
RETURNS SETOF json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  -- Debug logging
  RAISE NOTICE 'Fetching investments for user: %', p_user_id;
  
  -- First get all investments
  WITH investments_data AS (
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
      u.first_name as user_first_name,
      u.last_name as user_last_name
    FROM 
      investments i
    LEFT JOIN 
      investment_applications a ON i.application_id = a.id
    LEFT JOIN 
      users u ON i.user_id = u.id
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
      a.payment_frequency as payment_frequency,
      a.term_months,
      NULL as start_date,
      a.status as status,
      (a.investment_amount * a.annual_percentage / 100) * (a.term_months / 12.0) as total_expected_return,
      a.created_at,
      a.updated_at,
      a.status as application_status,
      a.investment_amount,
      u.email as user_email,
      u.first_name as user_first_name,
      u.last_name as user_last_name
    FROM
      investment_applications a
    LEFT JOIN
      investments i ON a.id = i.application_id
    LEFT JOIN 
      users u ON a.user_id = u.id
    WHERE
      a.user_id = p_user_id
      AND i.id IS NULL  -- Only include applications that don't have an associated investment
      AND a.status NOT IN ('rejected', 'deleted', 'cancelled')
  )
  SELECT json_agg(t) INTO result FROM investments_data t;
  
  -- Debug logging for result count
  IF result IS NULL THEN
    RAISE NOTICE 'No investments found for user %', p_user_id;
    RETURN;
  ELSE
    RAISE NOTICE 'Found investments for user %: %', p_user_id, json_array_length(result);
  END IF;
  
  -- Return each row as JSON
  FOR result IN SELECT json_array_elements(result)
  LOOP
    RETURN NEXT result;
  END LOOP;
  
  RETURN;
END;
$$;

-- Create improved admin function to get all investments with users
CREATE OR REPLACE FUNCTION public.get_admin_investments_with_users()
RETURNS SETOF json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  -- Debug logging
  RAISE NOTICE 'Admin fetching all investments';
  
  -- Check if user is admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Permission denied: must be admin';
  END IF;

  -- Get all investments with user details
  WITH investments_data AS (
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
      u.first_name as user_first_name,
      u.last_name as user_last_name,
      u.verification_status::text as verification_status
    FROM 
      investments i
    LEFT JOIN 
      investment_applications a ON i.application_id = a.id
    LEFT JOIN 
      users u ON i.user_id = u.id
    
    UNION ALL
    
    -- Include applications that might not have an investment record yet
    SELECT
      NULL as id,
      a.user_id,
      a.id as application_id,
      a.investment_amount as amount,
      a.annual_percentage,
      a.payment_frequency as payment_frequency,
      a.term_months,
      NULL as start_date,
      a.status as status,
      (a.investment_amount * a.annual_percentage / 100) * (a.term_months / 12.0) as total_expected_return,
      a.created_at,
      a.updated_at,
      a.status as application_status,
      a.investment_amount,
      u.email as user_email,
      u.first_name as user_first_name,
      u.last_name as user_last_name,
      u.verification_status::text as verification_status
    FROM
      investment_applications a
    LEFT JOIN
      investments i ON a.id = i.application_id
    LEFT JOIN 
      users u ON a.user_id = u.id
    WHERE
      i.id IS NULL  -- Only include applications that don't have an associated investment
      AND a.status NOT IN ('rejected', 'deleted', 'cancelled')
  )
  SELECT json_agg(t) INTO result FROM investments_data t;
  
  -- Debug logging for result count
  IF result IS NULL THEN
    RAISE NOTICE 'No investments found';
    RETURN;
  ELSE
    RAISE NOTICE 'Found investments: %', json_array_length(result);
  END IF;
  
  -- Return each row as JSON
  FOR result IN SELECT json_array_elements(result)
  LOOP
    RETURN NEXT result;
  END LOOP;
  
  RETURN;
END;
$$;

-- Create a function to fix any missing investments for existing applications
CREATE OR REPLACE FUNCTION fix_missing_investments()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  app RECORD;
  v_payment_frequency payment_frequency_enum;
  v_count integer := 0;
BEGIN
  FOR app IN 
    SELECT * FROM investment_applications a
    WHERE NOT EXISTS (
      SELECT 1 FROM investments i 
      WHERE i.application_id = a.id
    )
    AND a.status NOT IN ('rejected', 'deleted', 'cancelled')
  LOOP
    -- Convert payment frequency string to enum
    CASE app.payment_frequency
      WHEN 'monthly' THEN v_payment_frequency := 'monthly'::payment_frequency_enum;
      WHEN 'quarterly' THEN v_payment_frequency := 'quarterly'::payment_frequency_enum;
      WHEN 'annual' THEN v_payment_frequency := 'annual'::payment_frequency_enum;
      ELSE v_payment_frequency := 'monthly'::payment_frequency_enum;
    END CASE;
    
    -- Skip applications with NULL investment_amount or annual_percentage
    IF app.investment_amount IS NULL OR app.annual_percentage IS NULL THEN
      RAISE NOTICE 'Skipping application % due to NULL values', app.id;
      CONTINUE;
    END IF;

    -- Create missing investment records for existing applications
    INSERT INTO investments (
      user_id,
      application_id,
      amount,
      annual_percentage,
      payment_frequency,
      start_date,
      status,
      term_months,
      total_expected_return,
      created_at,
      updated_at
    ) VALUES (
      app.user_id,
      app.id,
      COALESCE(app.investment_amount, 200000),
      COALESCE(app.annual_percentage, 11),
      v_payment_frequency,
      CURRENT_DATE,
      CASE 
        WHEN app.status = 'active' THEN 'active'::investment_status_enum
        WHEN app.status = 'pending' THEN 'pending'::investment_status_enum
        WHEN app.status = 'documents_signed' THEN 'pending_approval'::investment_status_enum
        WHEN app.status = 'promissory_note_pending' THEN 'promissory_note_pending'::investment_status_enum
        WHEN app.status = 'bank_details_pending' THEN 'bank_details_pending'::investment_status_enum
        WHEN app.status = 'plaid_pending' THEN 'plaid_pending'::investment_status_enum
        WHEN app.status = 'funds_pending' THEN 'funds_pending'::investment_status_enum
        WHEN app.status = 'investor_onboarding_complete' THEN 'investor_onboarding_complete'::investment_status_enum
        ELSE 'pending'::investment_status_enum
      END,
      COALESCE(app.term_months, 12),
      COALESCE((app.investment_amount * app.annual_percentage / 100) * (app.term_months / 12.0), 0),
      COALESCE(app.created_at, NOW()),
      NOW()
    );
    
    v_count := v_count + 1;
  END LOOP;
  
  RAISE NOTICE 'Created % missing investment records', v_count;
END;
$$;

-- Run the fix function
SELECT fix_missing_investments();

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_user_investments_with_applications(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_investments_with_users() TO authenticated;