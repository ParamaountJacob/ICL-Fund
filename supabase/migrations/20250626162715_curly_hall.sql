/*
  # Fix Function Return Type Error

  1. Changes
    - Properly drops the get_admin_investments_with_users function before recreating it
    - Ensures update_application_onboarding_status function exists and works correctly
    - Fixes other related functions for consistency
*/

-- First, drop the function causing the return type error
DROP FUNCTION IF EXISTS public.get_admin_investments_with_users();

-- Create update_application_onboarding_status function that's missing
CREATE OR REPLACE FUNCTION update_application_onboarding_status(
  p_application_id uuid,
  p_new_status text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_investment_id uuid;
BEGIN
  -- Get the application's user ID
  SELECT user_id INTO v_user_id 
  FROM investment_applications 
  WHERE id = p_application_id;
  
  -- Authorization check (allow user who owns the application or admins)
  IF NOT (auth.uid() = v_user_id OR is_admin()) THEN
    RAISE EXCEPTION 'Not authorized to update this application';
  END IF;
  
  -- Validate the new status
  IF NOT (p_new_status = ANY (ARRAY[
    'pending', 'admin_approved', 'onboarding', 'documents_signed', 'funding_complete', 'active', 
    'rejected', 'deleted', 'cancelled', 'promissory_note_pending', 'promissory_note_sent', 
    'bank_details_pending', 'plaid_pending', 'funds_pending', 'investor_onboarding_complete'
  ])) THEN
    RAISE EXCEPTION 'Invalid status: %', p_new_status;
  END IF;

  -- Update the application status
  UPDATE investment_applications
  SET status = p_new_status, updated_at = now()
  WHERE id = p_application_id;

  -- If there's an investment record, update its status too
  SELECT id INTO v_investment_id 
  FROM investments 
  WHERE application_id = p_application_id;

  IF FOUND THEN
    UPDATE investments
    SET status = 
      CASE
        WHEN p_new_status = 'documents_signed' THEN 'pending_approval'::investment_status_enum
        WHEN p_new_status = 'promissory_note_pending' THEN 'promissory_note_pending'::investment_status_enum
        WHEN p_new_status = 'promissory_note_sent' THEN 'promissory_note_sent'::investment_status_enum
        WHEN p_new_status = 'bank_details_pending' THEN 'bank_details_pending'::investment_status_enum
        WHEN p_new_status = 'plaid_pending' THEN 'plaid_pending'::investment_status_enum
        WHEN p_new_status = 'funds_pending' THEN 'funds_pending'::investment_status_enum
        WHEN p_new_status = 'investor_onboarding_complete' THEN 'investor_onboarding_complete'::investment_status_enum
        WHEN p_new_status = 'active' THEN 'active'::investment_status_enum
        ELSE status
      END,
      updated_at = now()
    WHERE id = v_investment_id;
  END IF;
END;
$$;

-- Recreate get_admin_investments_with_users function with correct return type
CREATE OR REPLACE FUNCTION get_admin_investments_with_users()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  amount numeric,
  annual_percentage numeric,
  payment_frequency text,
  start_date date,
  end_date date,
  status text,
  term_months integer,
  total_expected_return numeric,
  created_at timestamptz,
  updated_at timestamptz,
  application_id uuid,
  application_status text,
  email text,
  first_name text,
  last_name text,
  verification_status text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Permission denied: must be admin';
  END IF;

  RETURN QUERY
  SELECT 
    i.id,
    i.user_id,
    i.amount,
    i.annual_percentage,
    i.payment_frequency::text, -- Cast enum to text
    i.start_date,
    i.end_date,
    i.status::text, -- Cast enum to text
    i.term_months,
    i.total_expected_return,
    i.created_at,
    i.updated_at,
    i.application_id,
    COALESCE(ia.status, 'no_application'::text) as application_status,
    u.email,
    u.first_name,
    u.last_name,
    u.verification_status::text -- Cast enum to text
  FROM investments i
  LEFT JOIN investment_applications ia ON i.application_id = ia.id
  JOIN users u ON i.user_id = u.id
  LEFT JOIN user_profiles up ON i.user_id = up.user_id
  ORDER BY i.created_at DESC;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION update_application_onboarding_status(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_investments_with_users() TO authenticated;