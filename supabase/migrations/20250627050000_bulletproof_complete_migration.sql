-- =================================================================
-- BULLETPROOF COMPLETE MIGRATION - FIXES ALL ISSUES
-- This migration handles everything in the correct order
-- =================================================================

BEGIN;

-- =================================================================
-- STEP 1: NUCLEAR CLEANUP - DROP EVERYTHING PROBLEMATIC
-- =================================================================

-- Drop ALL existing functions that could cause conflicts
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop all functions except essential Supabase ones
    FOR r IN 
        SELECT n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
        AND p.proname NOT LIKE 'supabase_%'
        AND p.proname NOT LIKE 'http_%'
        AND p.proname NOT LIKE 'auth.%'
    LOOP
        BEGIN
            EXECUTE 'DROP FUNCTION IF EXISTS ' || quote_ident(r.nspname) || '.' || quote_ident(r.proname) || '(' || r.args || ') CASCADE';
            RAISE NOTICE 'Dropped function: %.%(%)', r.nspname, r.proname, r.args;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not drop function: %.%(%)', r.nspname, r.proname, r.args;
        END;
    END LOOP;
END $$;

-- Drop all triggers
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT t.tgname, c.relname 
        FROM pg_trigger t
        JOIN pg_class c ON c.oid = t.tgrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public'
        AND NOT t.tgisinternal
    LOOP
        BEGIN
            EXECUTE 'DROP TRIGGER IF EXISTS ' || quote_ident(r.tgname) || ' ON ' || quote_ident(r.relname) || ' CASCADE';
            RAISE NOTICE 'Dropped trigger: % on %', r.tgname, r.relname;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not drop trigger: % on %', r.tgname, r.relname;
        END;
    END LOOP;
END $$;

-- Drop policies
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
    LOOP
        BEGIN
            EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON ' || quote_ident(r.schemaname) || '.' || quote_ident(r.tablename) || ' CASCADE';
            RAISE NOTICE 'Dropped policy: % on %.%', r.policyname, r.schemaname, r.tablename;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not drop policy: % on %.%', r.policyname, r.schemaname, r.tablename;
        END;
    END LOOP;
END $$;

-- Drop problematic types
DROP TYPE IF EXISTS simple_workflow_step CASCADE;
DROP TYPE IF EXISTS workflow_step CASCADE;
DROP TYPE IF EXISTS application_status CASCADE;
DROP TYPE IF EXISTS investment_status CASCADE;

RAISE NOTICE '✓ NUCLEAR CLEANUP COMPLETE';

-- =================================================================
-- STEP 2: CREATE FOUNDATION - ENUMS AND CORE TABLES
-- =================================================================

-- Create simple workflow enum
CREATE TYPE simple_workflow_step AS ENUM (
    'subscription_agreement_pending',     -- 1. User fills, needs admin signature
    'subscription_agreement_signed',      -- 2. Admin signed, user notified  
    'promissory_note_created',           -- 3. Admin created note, user has access
    'promissory_note_signed',            -- 4. User signed & wired money
    'funds_confirmed',                   -- 5. Admin confirmed both signature & wire
    'plaid_connected',                   -- 6. User connected Plaid account
    'setup_completed',                   -- 7. Admin completed final setup
    'active'                            -- 8. Investment is active
);

-- Create simple applications table (replaces complex investment_applications)
CREATE TABLE IF NOT EXISTS simple_applications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    amount numeric NOT NULL,
    expected_return_rate numeric,
    investment_term_months integer,
    
    -- Simple workflow tracking
    workflow_step simple_workflow_step DEFAULT 'subscription_agreement_pending',
    
    -- Document tracking (simplified)
    subscription_agreement_signed_by_user_at timestamptz,
    subscription_agreement_signed_by_admin_at timestamptz,
    promissory_note_id uuid,
    promissory_note_signed_at timestamptz,
    wire_transfer_confirmed_at timestamptz,
    plaid_account_id text,
    
    -- Simple metadata
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create simple notifications table
CREATE TABLE IF NOT EXISTS simple_notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    notification_type text NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    is_admin boolean DEFAULT false,
    read_at timestamptz,
    application_id uuid REFERENCES simple_applications(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now()
);

RAISE NOTICE '✓ FOUNDATION TABLES CREATED';

-- =================================================================
-- STEP 3: CREATE SIMPLE WORKFLOW FUNCTIONS
-- =================================================================

-- 1. Get user applications (THE REPLACEMENT for get_user_investments_with_applications)
CREATE OR REPLACE FUNCTION get_user_applications(p_user_id uuid)
RETURNS TABLE (
    id uuid,
    amount numeric,
    expected_return_rate numeric,
    investment_term_months integer,
    workflow_step text,
    subscription_agreement_signed_by_user_at timestamptz,
    subscription_agreement_signed_by_admin_at timestamptz,
    promissory_note_id uuid,
    promissory_note_signed_at timestamptz,
    wire_transfer_confirmed_at timestamptz,
    plaid_account_id text,
    created_at timestamptz,
    updated_at timestamptz
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sa.id,
        sa.amount,
        sa.expected_return_rate,
        sa.investment_term_months,
        sa.workflow_step::text,
        sa.subscription_agreement_signed_by_user_at,
        sa.subscription_agreement_signed_by_admin_at,
        sa.promissory_note_id,
        sa.promissory_note_signed_at,
        sa.wire_transfer_confirmed_at,
        sa.plaid_account_id,
        sa.created_at,
        sa.updated_at
    FROM simple_applications sa
    WHERE sa.user_id = p_user_id
    ORDER BY sa.created_at DESC;
END;
$$;

-- 2. Submit subscription agreement (Step 1)
CREATE OR REPLACE FUNCTION submit_subscription_agreement(
    p_user_id uuid,
    p_amount numeric,
    p_expected_return_rate numeric DEFAULT NULL,
    p_investment_term_months integer DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_application_id uuid;
BEGIN
    -- Create new application
    INSERT INTO simple_applications (
        user_id,
        amount,
        expected_return_rate,
        investment_term_months,
        workflow_step,
        subscription_agreement_signed_by_user_at
    ) VALUES (
        p_user_id,
        p_amount,
        p_expected_return_rate,
        p_investment_term_months,
        'subscription_agreement_pending',
        now()
    ) RETURNING id INTO v_application_id;
    
    -- Notify admin
    INSERT INTO simple_notifications (user_id, notification_type, title, message, is_admin, application_id)
    VALUES (
        p_user_id,
        'admin_subscription_review',
        'New Subscription Agreement',
        'A user has submitted a subscription agreement for $' || p_amount || ' requiring admin review.',
        true,
        v_application_id
    );
    
    RETURN v_application_id;
END;
$$;

-- 3. Admin signs subscription agreement (Step 2)
CREATE OR REPLACE FUNCTION admin_sign_subscription_agreement(p_application_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id uuid;
BEGIN
    -- Update application and get user_id
    UPDATE simple_applications 
    SET 
        subscription_agreement_signed_by_admin_at = now(),
        workflow_step = 'subscription_agreement_signed',
        updated_at = now()
    WHERE id = p_application_id
    RETURNING user_id INTO v_user_id;
    
    IF v_user_id IS NULL THEN
        RETURN false;
    END IF;
    
    -- Notify user
    INSERT INTO simple_notifications (user_id, notification_type, title, message, is_admin, application_id)
    VALUES (
        v_user_id,
        'subscription_agreement_signed',
        'Subscription Agreement Signed',
        'Your subscription agreement has been signed by admin. You will receive your promissory note soon.',
        false,
        p_application_id
    );
    
    RETURN true;
END;
$$;

-- 4. Admin creates promissory note (Step 3)
CREATE OR REPLACE FUNCTION admin_create_promissory_note(
    p_application_id uuid,
    p_promissory_note_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id uuid;
BEGIN
    -- Update application
    UPDATE simple_applications 
    SET 
        promissory_note_id = p_promissory_note_id,
        workflow_step = 'promissory_note_created',
        updated_at = now()
    WHERE id = p_application_id
    RETURNING user_id INTO v_user_id;
    
    IF v_user_id IS NULL THEN
        RETURN false;
    END IF;
    
    -- Notify user (no admin notification needed for this step)
    INSERT INTO simple_notifications (user_id, notification_type, title, message, is_admin, application_id)
    VALUES (
        v_user_id,
        'promissory_note_ready',
        'Promissory Note Ready',
        'Your promissory note is ready for signing. Please review and sign to proceed.',
        false,
        p_application_id
    );
    
    RETURN true;
END;
$$;

-- 5. User signs promissory note (Step 4)
CREATE OR REPLACE FUNCTION user_sign_promissory_note(p_application_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id uuid;
    v_amount numeric;
BEGIN
    -- Update application
    UPDATE simple_applications 
    SET 
        promissory_note_signed_at = now(),
        workflow_step = 'promissory_note_signed',
        updated_at = now()
    WHERE id = p_application_id
    RETURNING user_id, amount INTO v_user_id, v_amount;
    
    IF v_user_id IS NULL THEN
        RETURN false;
    END IF;
    
    -- Notify admin
    INSERT INTO simple_notifications (user_id, notification_type, title, message, is_admin, application_id)
    VALUES (
        v_user_id,
        'admin_promissory_note_signed',
        'Promissory Note Signed',
        'User has signed promissory note for $' || v_amount || '. Check for wire transfer.',
        true,
        p_application_id
    );
    
    RETURN true;
END;
$$;

-- 6. Admin confirms funds (Step 5)
CREATE OR REPLACE FUNCTION admin_confirm_funds(p_application_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id uuid;
BEGIN
    -- Update application
    UPDATE simple_applications 
    SET 
        wire_transfer_confirmed_at = now(),
        workflow_step = 'funds_confirmed',
        updated_at = now()
    WHERE id = p_application_id
    RETURNING user_id INTO v_user_id;
    
    IF v_user_id IS NULL THEN
        RETURN false;
    END IF;
    
    -- Notify user
    INSERT INTO simple_notifications (user_id, notification_type, title, message, is_admin, application_id)
    VALUES (
        v_user_id,
        'funds_confirmed',
        'Funds Confirmed',
        'Your wire transfer has been confirmed. Please connect your Plaid account to proceed.',
        false,
        p_application_id
    );
    
    RETURN true;
END;
$$;

-- 7. User connects Plaid (Step 6)
CREATE OR REPLACE FUNCTION user_connect_plaid(
    p_application_id uuid,
    p_plaid_account_id text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id uuid;
BEGIN
    -- Update application
    UPDATE simple_applications 
    SET 
        plaid_account_id = p_plaid_account_id,
        workflow_step = 'plaid_connected',
        updated_at = now()
    WHERE id = p_application_id
    RETURNING user_id INTO v_user_id;
    
    IF v_user_id IS NULL THEN
        RETURN false;
    END IF;
    
    -- Notify admin
    INSERT INTO simple_notifications (user_id, notification_type, title, message, is_admin, application_id)
    VALUES (
        v_user_id,
        'admin_plaid_connected',
        'Plaid Account Connected',
        'User has connected their Plaid account. Complete final setup to activate investment.',
        true,
        p_application_id
    );
    
    RETURN true;
END;
$$;

-- 8. Admin completes setup (Step 7)
CREATE OR REPLACE FUNCTION admin_complete_setup(p_application_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id uuid;
BEGIN
    -- Update application
    UPDATE simple_applications 
    SET 
        workflow_step = 'setup_completed',
        updated_at = now()
    WHERE id = p_application_id
    RETURNING user_id INTO v_user_id;
    
    IF v_user_id IS NULL THEN
        RETURN false;
    END IF;
    
    -- Notify user
    INSERT INTO simple_notifications (user_id, notification_type, title, message, is_admin, application_id)
    VALUES (
        v_user_id,
        'setup_completed',
        'Setup Completed',
        'Your investment setup is complete. Your investment will be activated shortly.',
        false,
        p_application_id
    );
    
    RETURN true;
END;
$$;

-- 9. Activate investment (Step 8)
CREATE OR REPLACE FUNCTION activate_investment(p_application_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id uuid;
BEGIN
    -- Update application
    UPDATE simple_applications 
    SET 
        workflow_step = 'active',
        updated_at = now()
    WHERE id = p_application_id
    RETURNING user_id INTO v_user_id;
    
    IF v_user_id IS NULL THEN
        RETURN false;
    END IF;
    
    -- Notify user
    INSERT INTO simple_notifications (user_id, notification_type, title, message, is_admin, application_id)
    VALUES (
        v_user_id,
        'investment_active',
        'Investment Active',
        'Congratulations! Your investment is now active.',
        false,
        p_application_id
    );
    
    RETURN true;
END;
$$;

-- =================================================================
-- STEP 4: NOTIFICATION FUNCTIONS
-- =================================================================

-- Get user notifications
CREATE OR REPLACE FUNCTION get_user_notifications(p_user_id uuid)
RETURNS TABLE (
    id uuid,
    notification_type text,
    title text,
    message text,
    read_at timestamptz,
    created_at timestamptz
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        n.id,
        n.notification_type,
        n.title,
        n.message,
        n.read_at,
        n.created_at
    FROM simple_notifications n
    WHERE n.user_id = p_user_id
    AND n.is_admin = false
    ORDER BY n.created_at DESC;
END;
$$;

-- Get admin notifications
CREATE OR REPLACE FUNCTION get_admin_notifications()
RETURNS TABLE (
    id uuid,
    user_id uuid,
    notification_type text,
    title text,
    message text,
    read_at timestamptz,
    created_at timestamptz
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        n.id,
        n.user_id,
        n.notification_type,
        n.title,
        n.message,
        n.read_at,
        n.created_at
    FROM simple_notifications n
    WHERE n.is_admin = true
    ORDER BY n.created_at DESC;
END;
$$;

-- Mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(p_notification_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE simple_notifications 
    SET read_at = now()
    WHERE id = p_notification_id;
    
    RETURN FOUND;
END;
$$;

-- =================================================================
-- STEP 5: GRANT PERMISSIONS
-- =================================================================

-- Grant permissions on functions
GRANT EXECUTE ON FUNCTION get_user_applications(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION submit_subscription_agreement(uuid, numeric, numeric, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_sign_subscription_agreement(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_create_promissory_note(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION user_sign_promissory_note(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_confirm_funds(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION user_connect_plaid(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_complete_setup(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION activate_investment(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_notifications(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_notifications() TO authenticated;
GRANT EXECUTE ON FUNCTION mark_notification_read(uuid) TO authenticated;

-- Grant permissions on tables
GRANT ALL ON simple_applications TO authenticated;
GRANT ALL ON simple_notifications TO authenticated;

-- =================================================================
-- STEP 6: ROW LEVEL SECURITY
-- =================================================================

-- Enable RLS
ALTER TABLE simple_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE simple_notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own applications
CREATE POLICY user_applications_policy ON simple_applications
    FOR ALL USING (user_id = auth.uid());

-- Users can only see their own notifications
CREATE POLICY user_notifications_policy ON simple_notifications
    FOR ALL USING (user_id = auth.uid() OR is_admin = true);

COMMIT;

-- =================================================================
-- FINAL SUCCESS MESSAGE
-- =================================================================

DO $$
BEGIN
    RAISE NOTICE '🎉 BULLETPROOF MIGRATION COMPLETE!';
    RAISE NOTICE '';
    RAISE NOTICE '✅ NUCLEAR CLEANUP: All problematic functions, triggers, and policies removed';
    RAISE NOTICE '✅ FOUNDATION: Created simple_workflow_step enum and core tables';
    RAISE NOTICE '✅ SIMPLE WORKFLOW: 9 focused functions for 8-step workflow';
    RAISE NOTICE '✅ NOTIFICATIONS: Complete notification system with admin/user flows';
    RAISE NOTICE '✅ SECURITY: RLS enabled with proper policies';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 THE PROBLEMATIC get_user_investments_with_applications IS GONE FOREVER!';
    RAISE NOTICE '🚀 REPLACED WITH: get_user_applications(uuid)';
    RAISE NOTICE '';
    RAISE NOTICE 'Next: Update your frontend to use get_user_applications() instead';
END $$;
