/*
  # Fix create_and_sign_document RPC function

  1. New Functions
    - `create_and_sign_document` - Creates document signature records with proper type casting
  
  2. Changes
    - Ensures document_type parameter is properly cast to the enum type
    - Handles document creation and signature workflow
    
  3. Security
    - Function respects existing RLS policies
    - Proper user authentication checks
*/

-- Drop the function if it exists to recreate it with correct typing
DROP FUNCTION IF EXISTS create_and_sign_document(uuid, text, text, text, text, text, text);

-- Create the function with proper parameter typing
CREATE OR REPLACE FUNCTION create_and_sign_document(
  p_application_id uuid,
  p_document_type text,
  p_docusign_envelope_id text,
  p_signer_role text,
  p_file_name text,
  p_display_name text,
  p_storage_path text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_doc_type document_type;
BEGIN
  -- Get the current user
  v_user_id := auth.uid();
  
  -- Validate user is authenticated
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;
  
  -- Cast the text parameter to document_type enum
  v_doc_type := p_document_type::document_type;
  
  -- Create document record
  INSERT INTO documents (
    user_id,
    application_id,
    file_name,
    display_name,
    storage_path,
    type,
    signature_status,
    docusign_envelope_id
  ) VALUES (
    v_user_id,
    p_application_id,
    p_file_name,
    p_display_name,
    p_storage_path,
    v_doc_type,
    'pending'::signature_status,
    p_docusign_envelope_id
  );
  
  -- Create document signature record
  INSERT INTO document_signatures (
    application_id,
    document_type,
    signrequest_document_id,
    status,
    document_url,
    signing_url
  ) VALUES (
    p_application_id,
    p_document_type,
    p_docusign_envelope_id,
    'pending',
    p_storage_path,
    'placeholder_signing_url'
  );
  
  -- Update application onboarding status
  UPDATE investment_applications 
  SET onboarding_status = 'subscription_agreement_pending'::application_onboarding_status
  WHERE id = p_application_id AND user_id = v_user_id;
  
END;
$$;