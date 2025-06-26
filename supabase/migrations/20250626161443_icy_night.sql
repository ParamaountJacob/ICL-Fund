-- First, drop any functions we're going to modify to avoid return type errors
DROP FUNCTION IF EXISTS public.get_admin_investments_with_users();
DROP FUNCTION IF EXISTS public.get_user_investments_with_applications(uuid);
DROP FUNCTION IF EXISTS public.user_has_active_investments(uuid);
DROP FUNCTION IF EXISTS public.create_investment_from_application();
DROP FUNCTION IF EXISTS public.notify_admin_on_investment_status_change();
DROP FUNCTION IF EXISTS public.createOrUpdateDocumentSignature(uuid, text, text, boolean, boolean);

-- Create a trigger to notify admins about all investment status changes
CREATE OR REPLACE FUNCTION notify_admin_on_investment_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_email text;
  v_user_name text;
BEGIN
  -- Get user details
  SELECT 
    u.email,
    COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '')
  INTO
    v_user_email,
    v_user_name
  FROM users u
  WHERE u.id = NEW.user_id;
  
  -- Only notify if status changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Create admin notification for important status transitions
    INSERT INTO admin_notifications (
      application_id,
      user_id,
      user_email,
      message,
      notification_type,
      is_read
    ) VALUES (
      NEW.id,
      NEW.user_id,
      v_user_email,
      v_user_name || ' investment application status updated to ' || NEW.status,
      'investment_status_changed',
      false
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create or replace the trigger
DROP TRIGGER IF EXISTS investment_application_status_change_trigger ON investment_applications;
CREATE TRIGGER investment_application_status_change_trigger
  AFTER UPDATE OF status ON investment_applications
  FOR EACH ROW
  EXECUTE FUNCTION notify_admin_on_investment_status_change();

-- Improve the user_has_active_investments function to catch all relevant statuses
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
    AND status::text NOT IN ('cancelled', 'deleted', 'rejected')
  ) INTO has_investments;
  
  -- If no active investments found, check applications in progress
  IF NOT has_investments THEN
    SELECT EXISTS (
      SELECT 1 
      FROM investment_applications 
      WHERE user_id = p_user_id 
      AND status NOT IN ('rejected', 'deleted', 'cancelled')
      -- These statuses indicate a started but not fully cancelled or rejected application
      AND status IN (
          'pending', 
          'pending_approval',
          'admin_approved',
          'documents_signed',
          'promissory_note_pending',
          'promissory_note_sent',
          'bank_details_pending',
          'plaid_pending',
          'funds_pending',
          'investor_onboarding_complete'
      )
    ) INTO has_investments;
  END IF;
  
  RETURN has_investments;
END;
$$ LANGUAGE plpgsql;

-- Fix create_investment_from_application function to properly create investments 
-- when subscription agreements are signed
CREATE OR REPLACE FUNCTION create_investment_from_application()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_investment_id uuid;
  v_payment_frequency payment_frequency_enum;
BEGIN
  -- Add debug logging for easier troubleshooting
  RAISE NOTICE 'create_investment_from_application called: OLD status = %, NEW status = %', OLD.status, NEW.status;
  
  -- Create investment when application status changes to 'documents_signed'
  -- This happens when subscription agreement is signed
  IF (NEW.status = 'documents_signed') AND 
     (OLD.status IS DISTINCT FROM 'documents_signed') THEN
  
    -- Convert text payment frequency to enum
    BEGIN
      CASE NEW.payment_frequency
        WHEN 'monthly' THEN v_payment_frequency := 'monthly'::payment_frequency_enum;
        WHEN 'quarterly' THEN v_payment_frequency := 'quarterly'::payment_frequency_enum;
        WHEN 'annual' THEN v_payment_frequency := 'annual'::payment_frequency_enum;
        ELSE v_payment_frequency := 'monthly'::payment_frequency_enum;
      END CASE;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error casting payment frequency: %', SQLERRM;
      v_payment_frequency := 'monthly'::payment_frequency_enum;
    END;
    
    -- Check if an investment already exists for this application
    PERFORM 1 FROM investments WHERE application_id = NEW.id;
    
    -- Only create if no investment exists
    IF NOT FOUND THEN
      BEGIN
        RAISE NOTICE 'Creating new investment for application %', NEW.id;
        
        -- Create investment record with proper status
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
          'pending_approval'::investment_status_enum,
          NEW.term_months,
          (NEW.investment_amount * NEW.annual_percentage / 100) * (NEW.term_months / 12.0),
          now(),
          now()
        )
        RETURNING id INTO v_investment_id;
        
        RAISE NOTICE 'Created investment with ID: %', v_investment_id;
        
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
          u.first_name || ' ' || u.last_name || ' has submitted a subscription agreement for $' || 
            NEW.investment_amount || '. Investment record created and pending approval.',
          'subscription_agreement_signed',
          false
        FROM users u 
        WHERE u.id = NEW.user_id;
        
        -- Log the activity
        INSERT INTO user_activity (
          user_id,
          action_type,
          action_description,
          performed_by
        ) VALUES (
          NEW.user_id,
          'investment_created',
          'Investment created from subscription agreement',
          NEW.user_id
        );
        
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error creating investment: %', SQLERRM;
      END;
    ELSE
      RAISE NOTICE 'Investment already exists for application ID %', NEW.id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Ensure trigger for investment creation exists
DROP TRIGGER IF EXISTS create_investment_trigger ON investment_applications;
CREATE TRIGGER create_investment_trigger
AFTER UPDATE OF status ON investment_applications
FOR EACH ROW
EXECUTE FUNCTION create_investment_from_application();

-- Improve get_user_investments_with_applications to handle all statuses and enum conversions
CREATE OR REPLACE FUNCTION get_user_investments_with_applications(p_user_id uuid)
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

-- Fix admin RPC to get investments with users
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

-- Update the document signature record function to handle type casting properly
CREATE OR REPLACE FUNCTION public.createOrUpdateDocumentSignature(
  p_application_id uuid,
  p_document_type text,
  p_status text DEFAULT 'pending',
  p_send_notification boolean DEFAULT true,
  p_auto_complete boolean DEFAULT true
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_document_id uuid;
  v_user_id uuid;
  v_user_email text;
  v_user_name text;
  v_investment_id uuid;
  v_document_type document_type;
BEGIN
  -- Cast the text input to the document_type enum
  BEGIN
    v_document_type := p_document_type::document_type;
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Invalid document type: %', p_document_type;
  END;
  
  -- Get user details and investment ID
  SELECT 
    ia.user_id,
    u.email,
    u.first_name || ' ' || u.last_name,
    i.id
  INTO
    v_user_id,
    v_user_email,
    v_user_name,
    v_investment_id
  FROM investment_applications ia
  JOIN users u ON ia.user_id = u.id
  LEFT JOIN investments i ON i.application_id = ia.id
  WHERE ia.id = p_application_id;

  -- Insert or update document signature record
  INSERT INTO document_signatures (
    application_id,
    document_type,
    status,
    created_at,
    updated_at
  ) VALUES (
    p_application_id,
    v_document_type,  -- Use the cast enum
    p_status,
    now(),
    now()
  )
  ON CONFLICT (application_id, document_type)
  DO UPDATE SET
    status = p_status,
    updated_at = now()
  RETURNING id INTO v_document_id;

  -- If status is investor_signed and we should send notification
  IF p_status = 'investor_signed' AND p_send_notification THEN
    -- Create notification for admin
    INSERT INTO admin_notifications (
      application_id,
      document_type,
      user_id,
      user_email,
      message,
      notification_type,
      is_read
    ) VALUES (
      p_application_id,
      p_document_type,
      v_user_id,
      v_user_email,
      v_user_name || ' has signed the ' || p_document_type || ' for application ' || p_application_id,
      'document_signed',
      false
    );
  END IF;

  -- Auto-complete status update if requested
  IF p_status = 'investor_signed' AND p_auto_complete THEN
    IF p_document_type = 'subscription_agreement' THEN
      -- Update application status to documents_signed
      UPDATE investment_applications
      SET 
        status = 'documents_signed',
        updated_at = now()
      WHERE id = p_application_id;
    ELSIF p_document_type = 'promissory_note' THEN
      -- Update application status to bank_details_pending
      UPDATE investment_applications
      SET 
        status = 'bank_details_pending',
        updated_at = now()
      WHERE id = p_application_id;
      
      -- Update investment status if it exists
      IF v_investment_id IS NOT NULL THEN
        UPDATE investments
        SET 
          status = 'bank_details_pending'::investment_status_enum,
          updated_at = now()
        WHERE id = v_investment_id;
      END IF;
    END IF;
  END IF;

  RETURN v_document_id;
END;
$$;

-- Grant execute permissions for all functions
GRANT EXECUTE ON FUNCTION createOrUpdateDocumentSignature(uuid, text, text, boolean, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_investments_with_applications(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION user_has_active_investments(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_investments_with_users() TO authenticated;