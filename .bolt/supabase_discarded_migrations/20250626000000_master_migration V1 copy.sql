--
-- MASTER MIGRATION FILE (v6 - The Final Version)
--
-- This script provides the definitive, correct schema and functions. It:
-- 1. Adds ALL necessary columns to the 'documents' table.
-- 2. Defines the 'create_and_sign_document' function with the correct parameters
--    to match the front-end API call.
--
-- After running this, the database will be fully aligned with the front-end code.
--

BEGIN;

--
-- Step 1: Add all missing columns to the documents table to prevent future errors.
--
ALTER TABLE public.documents
    ADD COLUMN IF NOT EXISTS display_name TEXT,
    ADD COLUMN IF NOT EXISTS file_name TEXT,
    ADD COLUMN IF NOT EXISTS storage_path TEXT,
    ADD COLUMN IF NOT EXISTS docusign_envelope_id TEXT,
    ADD COLUMN IF NOT EXISTS application_id UUID REFERENCES public.investment_applications(id);

--
-- Step 2: Drop the old, incorrect version of the function.
--
DROP FUNCTION IF EXISTS public.create_and_sign_document(p_application_id UUID, p_document_type public.document_type, p_signer_role TEXT, p_docusign_envelope_id TEXT);

--
-- Step 3: Create the new, correct version of the function with all parameters.
--
CREATE OR REPLACE FUNCTION public.create_and_sign_document(
    p_application_id UUID,
    p_document_type public.document_type,
    p_signer_role TEXT,
    p_docusign_envelope_id TEXT,
    p_display_name TEXT,
    p_file_name TEXT,
    p_storage_path TEXT
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    v_signature_status public.signature_status;
    v_user_id UUID;
BEGIN
    -- Get the user_id from the related application
    SELECT user_id INTO v_user_id FROM public.investment_applications WHERE id = p_application_id;

    -- Determine the signature status based on the signer's role
    IF p_signer_role = 'investor' THEN
        v_signature_status := 'investor_signed';
    ELSIF p_signer_role = 'admin' THEN
        v_signature_status := 'admin_signed';
    ELSE
        RAISE EXCEPTION 'Invalid signer role provided: %', p_signer_role;
    END IF;

    -- Insert the new document record with all the provided details
    INSERT INTO public.documents (
        application_id,
        user_id,
        type,
        signature_status,
        docusign_envelope_id,
        display_name,
        file_name,
        storage_path
    )
    VALUES (
        p_application_id,
        v_user_id,
        p_document_type,
        v_signature_status,
        p_docusign_envelope_id,
        p_display_name,
        p_file_name,
        p_storage_path
    );

    -- Update the application's onboarding status based on the document type
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

COMMIT;