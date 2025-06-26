--
-- FIX SCRIPT for Dashboard and Admin Panel Display Issues
--

-- 1. Fix the function for the ADMIN dashboard
-- This ensures the 'status' column is returned as plain text.
DROP FUNCTION IF EXISTS public.get_user_investments_with_applications(uuid);

CREATE OR REPLACE FUNCTION public.get_user_investments_with_applications(p_user_id uuid)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  amount numeric,
  annual_percentage numeric,
  payment_frequency text,
  start_date date,
  end_date date,
  status text, -- CORRECTED: Changed from investment_status_enum to text
  term_months integer,
  total_expected_return numeric,
  created_at timestamptz,
  updated_at timestamptz,
  application_id uuid,
  application_status text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
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
    COALESCE(ia.status, 'no_application'::text) as application_status
  FROM investments i
  LEFT JOIN investment_applications ia ON i.application_id = ia.id
  WHERE i.user_id = p_user_id
  ORDER BY i.created_at DESC;
END;
$$;

-- 2. Fix the function for the USER dashboard
-- This ensures all "in-progress" statuses are considered active.
DROP FUNCTION IF EXISTS public.user_has_active_investments(uuid);

CREATE OR REPLACE FUNCTION public.user_has_active_investments(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  has_investments BOOLEAN;
BEGIN
  -- Check if user has any active investments
  SELECT EXISTS (
    SELECT 1 
    FROM investments 
    WHERE user_id = p_user_id 
    AND status = 'active'
  ) INTO has_investments;
  
  -- If no active investments, check for pending applications that are in progress
  IF NOT has_investments THEN
    SELECT EXISTS (
      SELECT 1 
      FROM investment_applications 
      WHERE user_id = p_user_id 
      AND status IN (
          'pending_approval', 
          'subscription_agreement_signed', -- Added this
          'admin_approved', 
          'promissory_note_pending', 
          'bank_details_pending', 
          'plaid_pending', 
          'documents_signed'
      )
    ) INTO has_investments;
  END IF;
  
  RETURN has_investments;
END;
$$ LANGUAGE plpgsql;