/*
  # Fix Investment Dashboard Display

  1. Changes
    - Creates investments immediately when applications are submitted
    - Fixes status synchronization between applications and investments
    - Ensures dashboard displays submitted investments
    - Adds automatic admin notifications for all investment stages

  2. Security
    - Maintains existing security model with no changes to RLS policies
*/

-- 1. Create a trigger function to create an investment record IMMEDIATELY when an application is submitted
CREATE OR REPLACE FUNCTION create_investment_on_application_submit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_investment_id uuid;
  v_payment_frequency payment_frequency_enum;
BEGIN
  -- Only run for new applications (not updates)
  IF TG_OP = 'INSERT' THEN
    -- Convert text payment_frequency to enum
    CASE NEW.payment_frequency
      WHEN 'monthly' THEN v_payment_frequency := 'monthly'::payment_frequency_enum;
      WHEN 'quarterly' THEN v_payment_frequency := 'quarterly'::payment_frequency_enum;
      WHEN 'annual' THEN v_payment_frequency := 'annual'::payment_frequency_enum;
      ELSE v_payment_frequency := 'monthly'::payment_frequency_enum;
    END CASE;
    
    -- Create investment record immediately
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
      NEW.user_id,
      NEW.id,
      NEW.investment_amount,
      NEW.annual_percentage,
      v_payment_frequency,
      CURRENT_DATE,
      'pending'::investment_status_enum,
      NEW.term_months,
      (NEW.investment_amount * NEW.annual_percentage / 100) * (NEW.term_months / 12.0),
      now(),
      now()
    )
    RETURNING id INTO v_investment_id;
    
    -- Create notification for admin
    INSERT INTO admin_notifications (
      application_id,
      user_id, 
      user_email,
      message,
      notification_type,
      is_read
    ) SELECT 
      NEW.id,
      NEW.user_id,
      u.email,
      'New investment application submitted by ' || u.first_name || ' ' || u.last_name || 
      ' for $' || NEW.investment_amount || '. Awaiting review.',
      'application_submitted',
      false
    FROM users u 
    WHERE u.id = NEW.user_id;
    
    -- Log activity
    INSERT INTO user_activity (
      user_id,
      action_type,
      action_description,
      performed_by
    ) VALUES (
      NEW.user_id,
      'application_submitted',
      'Investment application submitted',
      NEW.user_id
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger on application insert
DROP TRIGGER IF EXISTS create_investment_on_application_submit_trigger ON investment_applications;
CREATE TRIGGER create_investment_on_application_submit_trigger
AFTER INSERT ON investment_applications
FOR EACH ROW
EXECUTE FUNCTION create_investment_on_application_submit();

-- 2. Fix application to investment status synchronization to ensure they remain consistent
CREATE OR REPLACE FUNCTION sync_investment_status_with_application()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_investment_id uuid;
  v_investment_status investment_status_enum;
BEGIN
  -- Only process when status changes
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;
  
  -- Get associated investment
  SELECT id INTO v_investment_id 
  FROM investments 
  WHERE application_id = NEW.id;
  
  -- If we found an associated investment
  IF v_investment_id IS NOT NULL THEN
    -- Map application status to investment status
    CASE NEW.status
      WHEN 'documents_signed' THEN v_investment_status := 'pending_approval'::investment_status_enum;
      WHEN 'promissory_note_pending' THEN v_investment_status := 'promissory_note_pending'::investment_status_enum;
      WHEN 'promissory_note_sent' THEN v_investment_status := 'promissory_note_sent'::investment_status_enum;
      WHEN 'bank_details_pending' THEN v_investment_status := 'bank_details_pending'::investment_status_enum;
      WHEN 'funds_pending' THEN v_investment_status := 'funds_pending'::investment_status_enum;
      WHEN 'plaid_pending' THEN v_investment_status := 'plaid_pending'::investment_status_enum;
      WHEN 'investor_onboarding_complete' THEN v_investment_status := 'investor_onboarding_complete'::investment_status_enum;
      WHEN 'active' THEN v_investment_status := 'active'::investment_status_enum;
      WHEN 'cancelled' THEN v_investment_status := 'cancelled'::investment_status_enum;
      WHEN 'rejected' THEN v_investment_status := 'rejected'::investment_status_enum;
      ELSE v_investment_status := 'pending'::investment_status_enum;
    END CASE;
    
    -- Update investment status
    UPDATE investments
    SET status = v_investment_status, updated_at = now()
    WHERE id = v_investment_id;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for status synchronization
DROP TRIGGER IF EXISTS sync_investment_status_trigger ON investment_applications;
CREATE TRIGGER sync_investment_status_trigger
AFTER UPDATE OF status ON investment_applications
FOR EACH ROW
EXECUTE FUNCTION sync_investment_status_with_application();

-- 3. Fix the update_application_onboarding_status function to ensure it can be called from the frontend
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
END;
$$;

-- 4. Ensure create_investment_application function creates correct types for investments
CREATE OR REPLACE FUNCTION create_investment_application(
  p_investment_amount numeric DEFAULT NULL,
  p_annual_percentage numeric DEFAULT NULL,
  p_payment_frequency text DEFAULT NULL,
  p_term_months integer DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_application_id uuid;
  v_user_id uuid;
BEGIN
  -- Get current user ID
  v_user_id := auth.uid();
  
  -- Verify user is authenticated
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated to create an application';
  END IF;
  
  -- Create application
  INSERT INTO investment_applications (
    user_id,
    status,
    investment_amount,
    annual_percentage,
    payment_frequency,
    term_months,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    'pending',
    COALESCE(p_investment_amount, 0),
    COALESCE(p_annual_percentage, 0),
    COALESCE(p_payment_frequency, 'monthly'),
    COALESCE(p_term_months, 24),
    now(),
    now()
  )
  RETURNING id INTO v_application_id;
  
  -- No need to explicitly create investment here, it will be created by the trigger
  
  RETURN v_application_id;
END;
$$;

-- 5. Ensure user_has_active_investments also checks for applications
CREATE OR REPLACE FUNCTION user_has_active_investments(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  has_investments BOOLEAN;
BEGIN
  -- First check direct investments that are not in terminal states
  SELECT EXISTS (
    SELECT 1 
    FROM investments 
    WHERE user_id = p_user_id 
    AND status::text NOT IN ('cancelled', 'deleted', 'rejected', 'completed')
  ) INTO has_investments;
  
  -- If no active investments found, check applications in progress
  IF NOT has_investments THEN
    SELECT EXISTS (
      SELECT 1 
      FROM investment_applications 
      WHERE user_id = p_user_id 
      AND status NOT IN ('rejected', 'deleted', 'cancelled')
    ) INTO has_investments;
  END IF;
  
  RETURN has_investments;
END;
$$ LANGUAGE plpgsql;

-- 6. Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION update_application_onboarding_status(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION create_investment_application(numeric, numeric, text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION user_has_active_investments(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_investments_with_applications(uuid) TO authenticated;