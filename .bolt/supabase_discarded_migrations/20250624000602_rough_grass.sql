/*
  # Get User Active Application Function

  1. New Function
    - `get_user_active_application`: Retrieves user's active investment application
    - Returns application details for onboarding flow
    - Includes current status for step determination

  2. Security
    - Users can only access their own applications
    - Admins can access any application
*/

-- Function to get user's active application for onboarding
CREATE OR REPLACE FUNCTION get_user_active_application()
RETURNS TABLE (
  id uuid,
  status text,
  investment_amount numeric,
  annual_percentage numeric,
  payment_frequency text,
  term_months integer,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  -- Return active application for current user
  RETURN QUERY
  SELECT 
    ia.id,
    ia.status,
    ia.investment_amount,
    ia.annual_percentage,
    ia.payment_frequency,
    ia.term_months,
    ia.created_at,
    ia.updated_at
  FROM investment_applications ia
  WHERE ia.user_id = v_user_id
    AND ia.status IN (
      'promissory_note_pending',
      'bank_details_pending',
      'plaid_pending'
    )
  ORDER BY ia.updated_at DESC
  LIMIT 1;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_active_application TO authenticated;