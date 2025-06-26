/*
  # Fix Document Flow Issues

  1. Changes
    - Add proper type casting to document handling functions
    - Fix inconsistencies in document signature workflow
    - Add missing document signature handling

  2. Security
    - All functions maintain existing security models
    - No changes to RLS policies
*/

-- Create a consistent document signature creation function with proper type handling
CREATE OR REPLACE FUNCTION public.createdocumentsignature(
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
  v_document_id uuid;
  v_user_id uuid;
  v_user_email text;
  v_user_name text;
  v_investment_id uuid;
BEGIN
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
  -- Cast the document_type to the proper enum type
  INSERT INTO document_signatures (
    application_id,
    document_type,
    status,
    created_at,
    updated_at
  ) VALUES (
    p_application_id,
    p_document_type::document_type, -- Cast text to enum
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

  -- Automatically update application status based on document signing
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

-- Fix create_and_sign_document to handle type conversion properly
CREATE OR REPLACE FUNCTION public.create_and_sign_document(
  p_application_id uuid,
  p_document_type text,
  p_signer_role text,
  p_docusign_envelope_id text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_document_id uuid;
  v_signature_status signature_status;
  v_user_id uuid;
BEGIN
  SELECT user_id INTO v_user_id FROM public.investment_applications WHERE id = p_application_id;

  IF p_signer_role = 'investor' THEN
    v_signature_status := 'investor_signed';
  ELSIF p_signer_role = 'admin' THEN
    v_signature_status := 'admin_signed';
  ELSE
    RAISE EXCEPTION 'Invalid signer role: %', p_signer_role;
  END IF;

  -- Use CAST to explicitly convert the document type
  INSERT INTO public.documents (
    application_id, 
    user_id, 
    type, 
    docusign_envelope_id, 
    signature_status
  )
  VALUES (
    p_application_id, 
    v_user_id, 
    CAST(p_document_type AS document_type), -- Explicit cast to enum type
    p_docusign_envelope_id, 
    v_signature_status
  )
  RETURNING id INTO v_document_id;

  IF p_document_type = 'subscription_agreement' THEN
    UPDATE public.investment_applications
    SET onboarding_status = 'subscription_agreement_signed'
    WHERE id = p_application_id;
  ELSIF p_document_type = 'promissory_note' THEN
    UPDATE public.investment_applications
    SET onboarding_status = 'promissory_note_pending'
    WHERE id = p_application_id;
  END IF;
END;
$$;

-- Ensure the investment status enum has all necessary values
DO $$
BEGIN
  -- Check if 'bank_details_pending' value exists in investment_status_enum
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'bank_details_pending' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'investment_status_enum')
  ) THEN
    -- If the ALTER TYPE ADD VALUE syntax fails due to transaction rules,
    -- you may need to create a new type and migrate data
    BEGIN
      ALTER TYPE investment_status_enum ADD VALUE IF NOT EXISTS 'bank_details_pending';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not add value to enum: %', SQLERRM;
    END;
  END IF;
END
$$;

-- Ensure proper application status constraint
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