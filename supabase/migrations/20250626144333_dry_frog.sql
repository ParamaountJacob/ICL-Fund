/*
  # Fix Document Signing Workflow

  1. Changes
    - Create the correct version of create_and_sign_document function with all expected parameters
    - Fix the createdocumentsignature function to ensure proper document workflow
    - Add missing columns to documents table if they don't exist
    - Ensure all application statuses are properly supported

  2. Security
    - All functions maintain existing security models
    - No changes to RLS policies
*/

-- Add all potentially missing columns to documents table
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS display_name text,
ADD COLUMN IF NOT EXISTS file_name text,
ADD COLUMN IF NOT EXISTS storage_path text,
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS application_id uuid REFERENCES investment_applications(id),
ADD COLUMN IF NOT EXISTS type document_type,
ADD COLUMN IF NOT EXISTS docusign_envelope_id text;

-- Create the correct create_and_sign_document function with ALL expected parameters
DROP FUNCTION IF EXISTS public.create_and_sign_document;
CREATE OR REPLACE FUNCTION public.create_and_sign_document(
    p_application_id uuid,
    p_document_type text,
    p_docusign_envelope_id text,
    p_file_name text,
    p_signer_role text,
    p_display_name text DEFAULT NULL,
    p_storage_path text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_document_id uuid;
    v_user_id uuid;
BEGIN
    -- Get the user ID from the application
    SELECT user_id INTO v_user_id 
    FROM investment_applications 
    WHERE id = p_application_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Application with ID % not found', p_application_id;
    END IF;

    -- Create the document record
    INSERT INTO documents (
        application_id,
        user_id,
        type,
        docusign_envelope_id,
        file_name,
        display_name,
        storage_path,
        created_at,
        updated_at
    )
    VALUES (
        p_application_id,
        v_user_id,
        p_document_type,
        p_docusign_envelope_id,
        p_file_name,
        COALESCE(p_display_name, p_file_name),
        COALESCE(p_storage_path, 'documents/' || p_document_type || '/' || p_file_name),
        now(),
        now()
    )
    RETURNING id INTO v_document_id;

    -- Update application status based on document type
    IF p_document_type = 'subscription_agreement' THEN
        UPDATE investment_applications
        SET status = 'documents_signed'
        WHERE id = p_application_id;
    ELSIF p_document_type = 'promissory_note' THEN
        UPDATE investment_applications
        SET status = 'promissory_note_sent'
        WHERE id = p_application_id;
    END IF;

    RETURN v_document_id;
END;
$$;

-- Create a more robust createDocumentSignature function that can be used as an alternative
DROP FUNCTION IF EXISTS createdocumentsignature;
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
    IF p_document_type = 'promissory_note' AND p_status = 'pending' AND is_admin() AND p_auto_complete THEN
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
    END IF;

    -- Update application status if investor signed a document
    IF p_status = 'investor_signed' THEN
        IF p_document_type = 'subscription_agreement' THEN
            -- Update application status to documents_signed
            UPDATE investment_applications
            SET status = 'documents_signed', updated_at = now()
            WHERE id = p_application_id;
        ELSIF p_document_type = 'promissory_note' THEN
            -- Update application status to bank_details_pending
            UPDATE investment_applications
            SET status = 'bank_details_pending', updated_at = now()
            WHERE id = p_application_id;
            
            -- Update investment status if it exists
            IF v_investment_id IS NOT NULL THEN
                UPDATE investments
                SET status = 'bank_details_pending', updated_at = now()
                WHERE id = v_investment_id;
            END IF;
        END IF;
    END IF;

    RETURN v_document_id;
END;
$$;

-- Ensure we have the proper function to update application status
CREATE OR REPLACE FUNCTION update_application_onboarding_status(
    p_application_id uuid,
    p_new_status text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id uuid;
    v_investment_id uuid;
BEGIN
    -- Check if user is authorized
    SELECT user_id INTO v_user_id FROM investment_applications WHERE id = p_application_id;
    
    -- Authorization check
    IF auth.uid() != v_user_id AND NOT is_admin() THEN
        RAISE EXCEPTION 'Not authorized to update this application';
    END IF;
    
    -- Validate status
    IF NOT (p_new_status = ANY (ARRAY[
        'pending', 
        'admin_approved', 
        'onboarding', 
        'documents_signed', 
        'funding_complete', 
        'active', 
        'rejected', 
        'deleted',
        'cancelled',
        'promissory_note_pending',
        'promissory_note_sent',
        'bank_details_pending',
        'plaid_pending',
        'funds_pending',
        'investor_onboarding_complete'
    ]::text[])) THEN
        RAISE EXCEPTION 'Invalid status value: %', p_new_status;
    END IF;
    
    -- Update application status
    UPDATE investment_applications
    SET status = p_new_status, updated_at = now()
    WHERE id = p_application_id;
    
    -- If there's an associated investment, update its status too
    SELECT id INTO v_investment_id FROM investments WHERE application_id = p_application_id;
    
    IF v_investment_id IS NOT NULL THEN
        UPDATE investments
        SET status = 
            CASE
                -- Map application statuses to investment statuses
                WHEN p_new_status = 'documents_signed' THEN 'pending_approval'
                WHEN p_new_status = 'promissory_note_pending' THEN 'promissory_note_pending'
                WHEN p_new_status = 'bank_details_pending' THEN 'bank_details_pending'
                WHEN p_new_status = 'plaid_pending' THEN 'plaid_pending'
                WHEN p_new_status = 'funds_pending' THEN 'funds_pending'
                WHEN p_new_status = 'investor_onboarding_complete' THEN 'investor_onboarding_complete'
                WHEN p_new_status = 'active' THEN 'active'
                ELSE status
            END,
            updated_at = now()
        WHERE id = v_investment_id;
    END IF;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_and_sign_document TO authenticated;
GRANT EXECUTE ON FUNCTION createdocumentsignature TO authenticated;
GRANT EXECUTE ON FUNCTION update_application_onboarding_status TO authenticated;