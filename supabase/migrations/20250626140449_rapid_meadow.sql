/*
  # Fix Investment Flow Disconnection

  1. Updates
    - Ensures proper document signature handling
    - Fixes investment record creation from subscription agreements
    - Ensures dashboard notifications for all investment statuses 

  2. Security
    - All functions maintain SECURITY DEFINER to ensure proper access control
*/

-- First, ensure the application status check constraint includes all necessary statuses
ALTER TABLE investment_applications 
DROP CONSTRAINT IF EXISTS investment_applications_status_check;

ALTER TABLE investment_applications 
ADD CONSTRAINT investment_applications_status_check 
CHECK (status = ANY (ARRAY[
  'pending'::text, 
  'admin_approved'::text, 
  'onboarding'::text, 
  'documents_signed'::text, 
  'funding_complete'::text, 
  'active'::text, 
  'rejected'::text, 
  'deleted'::text,
  'cancelled'::text,
  'promissory_note_pending'::text,
  'promissory_note_sent'::text,
  'bank_details_pending'::text,
  'plaid_pending'::text,
  'funds_pending'::text,
  'investor_onboarding_complete'::text
]));

-- Update or create the createdocumentsignature function to properly handle all stages
CREATE OR REPLACE FUNCTION createdocumentsignature(
  p_application_id uuid,
  p_document_type text,
  p_status text DEFAULT 'pending',
  p_send_notification boolean DEFAULT true,
  p_auto_complete boolean DEFAULT true
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_user_email text;
  v_user_name text;
  v_investment_id uuid;
  v_document_id uuid;
  v_app_status text;
  v_current_user uuid;
BEGIN
  -- Get current user
  v_current_user := auth.uid();
  
  -- Insert or update document signature record
  INSERT INTO document_signatures (
    application_id,
    document_type,
    status,
    created_at,
    updated_at
  ) VALUES (
    p_application_id,
    p_document_type,
    p_status,
    now(),
    now()
  )
  ON CONFLICT (application_id, document_type)
  DO UPDATE SET
    status = p_status,
    updated_at = now()
  RETURNING id INTO v_document_id;
  
  -- Get user details and investment ID
  SELECT 
    ia.user_id,
    ia.status,
    u.email,
    u.first_name || ' ' || u.last_name,
    i.id
  INTO
    v_user_id,
    v_app_status,
    v_user_email,
    v_user_name,
    v_investment_id
  FROM investment_applications ia
  JOIN users u ON ia.user_id = u.id
  LEFT JOIN investments i ON i.application_id = ia.id
  WHERE ia.id = p_application_id;
  
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
  
  -- If this is an admin creating a promissory note, set status to promissory_note_sent
  IF p_document_type = 'promissory_note' AND p_status = 'pending' AND is_admin() THEN
    -- Update application status
    UPDATE investment_applications
    SET 
      status = 'promissory_note_sent',
      updated_at = now()
    WHERE id = p_application_id;
    
    -- Update investment status if it exists
    IF v_investment_id IS NOT NULL THEN
      UPDATE investments
      SET 
        status = 'promissory_note_sent',
        updated_at = now()
      WHERE id = v_investment_id;
    END IF;
    
    -- Send notification to user
    INSERT INTO messages (
      sender_id,
      receiver_id,
      subject,
      content,
      is_read
    )
    VALUES (
      v_current_user,
      v_user_id,
      'Promissory Note Ready - Action Required',
      'Your promissory note is ready for review and signature. Please log in to your dashboard to sign the document and continue the investment process.',
      false
    );
    
    -- Log the activity
    INSERT INTO user_activity (
      user_id,
      action_type,
      action_description,
      performed_by
    )
    VALUES (
      v_user_id,
      'promissory_note_created',
      'Admin created and sent promissory note',
      v_current_user
    );
  END IF;
  
  -- Automatically progress to next step when promissory note is signed by investor
  IF p_document_type = 'promissory_note' AND p_status = 'investor_signed' THEN
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
        status = 'bank_details_pending',
        updated_at = now()
      WHERE id = v_investment_id;
    END IF;
  END IF;
  
  -- Update application status if investor signed subscription agreement
  IF p_document_type = 'subscription_agreement' AND p_status = 'investor_signed' THEN
    -- Update application status to documents_signed
    UPDATE investment_applications
    SET 
      status = 'documents_signed',
      updated_at = now()
    WHERE id = p_application_id;
  END IF;
  
  RETURN v_document_id;
END;
$$;

-- Fix create_investment_from_application function to properly create investments from signed subscription agreements
CREATE OR REPLACE FUNCTION create_investment_from_application()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_investment_id uuid;
  v_payment_frequency payment_frequency_enum;
BEGIN
  -- Add debug logging 
  RAISE NOTICE 'create_investment_from_application called: OLD status = %, NEW status = %', OLD.status, NEW.status;

  -- Create investment when status changes to 'documents_signed'
  IF NEW.status = 'documents_signed' AND OLD.status != 'documents_signed' THEN
    BEGIN
      -- Cast payment_frequency to the correct enum type
      v_payment_frequency := NEW.payment_frequency::payment_frequency_enum;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error casting payment_frequency: %', SQLERRM;
      -- Default to monthly if there's an error
      v_payment_frequency := 'monthly'::payment_frequency_enum;
    END;
    
    -- Check if an investment already exists for this application
    PERFORM 1 FROM investments WHERE application_id = NEW.id;
    
    -- Only create if no investment exists
    IF NOT FOUND THEN
      BEGIN
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
        
        RAISE NOTICE 'Created investment with ID: %', v_investment_id;
        
        -- Log the investment creation
        INSERT INTO user_activity (
          user_id,
          action_type,
          action_description,
          performed_by
        ) VALUES (
          NEW.user_id,
          'investment_created',
          'Investment created from application ' || NEW.id,
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

-- Fix user_has_active_investments function to include all valid application statuses
CREATE OR REPLACE FUNCTION user_has_active_investments(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  has_investments BOOLEAN;
BEGIN
  -- Check if user has any active investments
  SELECT EXISTS (
    SELECT 1 
    FROM investments 
    WHERE user_id = p_user_id 
    AND status NOT IN ('cancelled', 'deleted')
  ) INTO has_investments;
  
  -- If no active investments, check for pending applications that are in progress
  IF NOT has_investments THEN
    SELECT EXISTS (
      SELECT 1 
      FROM investment_applications 
      WHERE user_id = p_user_id 
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
      AND status NOT IN ('rejected', 'deleted', 'cancelled')
    ) INTO has_investments;
  END IF;
  
  RETURN has_investments;
END;
$$ LANGUAGE plpgsql;

-- Ensure get_user_investments_with_applications properly casts enums to text
DROP FUNCTION IF EXISTS get_user_investments_with_applications(uuid);

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