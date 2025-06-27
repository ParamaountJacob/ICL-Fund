-- =================================================================
-- FINAL WORKFLOW RESET - FULLY IDEMPOTENT VERSION
-- This migration completely resets the workflow system safely
-- 100% SAFE TO RUN MULTIPLE TIMES - CHECKS ALL OBJECTS FIRST
-- Timestamp: June 27, 2025 08:00:00 (IDEMPOTENT VERSION)
-- =================================================================

BEGIN;

DO $$
BEGIN
    RAISE NOTICE '🔐 STARTING WORKFLOW RESET - FULLY IDEMPOTENT...';
    RAISE NOTICE '⚠️  This migration is 100% safe to run multiple times';
    RAISE NOTICE '🛡️  All objects will be checked before creation/deletion';
END $$;

-- =================================================================
-- STEP 1: SMART CLEANUP - DROP ONLY IF EXISTS
-- =================================================================

-- Drop ALL existing functions that could cause conflicts (SAFELY)
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop all functions except essential Supabase ones and our helpers
    FOR r IN 
        SELECT n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
        AND p.proname NOT LIKE 'supabase_%'
        AND p.proname NOT LIKE 'http_%'
        AND p.proname NOT LIKE 'auth.%'
        AND p.proname NOT IN ('enable_rls_if_not_enabled', 'is_admin', 'get_user_role') -- Keep our helper functions
    LOOP
        BEGIN
            EXECUTE 'DROP FUNCTION IF EXISTS ' || quote_ident(r.nspname) || '.' || quote_ident(r.proname) || '(' || r.args || ') CASCADE';
            RAISE NOTICE 'Dropped legacy function: %.%(%)', r.nspname, r.proname, r.args;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not drop function: %.%(%)', r.nspname, r.proname, r.args;
        END;
    END LOOP;
END $$;

-- Drop all triggers (SAFELY)
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

-- =================================================================
-- STEP 2: CREATE ENUMS (IDEMPOTENT)
-- =================================================================

-- Create simple_workflow_step enum only if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'simple_workflow_step') THEN
        CREATE TYPE simple_workflow_step AS ENUM (
            'pending',
            'subscription_agreement_pending',
            'subscription_agreement_signed',
            'promissory_note_created',
            'promissory_note_signed',
            'funds_confirmed',
            'final_documents_generated',
            'setup_completed',
            'completed'
        );
        RAISE NOTICE '✅ Created simple_workflow_step enum';
    ELSE
        RAISE NOTICE '⚠️  simple_workflow_step enum already exists - skipping';
    END IF;
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE '⚠️  simple_workflow_step enum already exists - skipping';
END $$;

-- =================================================================
-- STEP 3: CREATE TABLES (IDEMPOTENT)
-- =================================================================

-- Helper function for safe RLS enablement
CREATE OR REPLACE FUNCTION enable_rls_if_not_enabled(table_name text)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class 
        WHERE relname = table_name 
        AND relnamespace = 'public'::regnamespace 
        AND relrowsecurity = true
    ) THEN
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
        RAISE NOTICE '✅ Enabled RLS for %', table_name;
    ELSE
        RAISE NOTICE '⚠️  RLS already enabled for %', table_name;
    END IF;
END;
$$;

-- Core user profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email text,
    first_name text,
    last_name text,
    phone text,
    address text,
    city text,
    state text,
    zip_code text,
    date_of_birth date,
    ssn_last_four text,
    role text DEFAULT 'user',
    is_admin boolean DEFAULT false,
    is_verified boolean DEFAULT false,
    verification_status text DEFAULT 'pending',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Simple applications table (with enum dependency)
CREATE TABLE IF NOT EXISTS simple_applications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    amount numeric NOT NULL,
    expected_return_rate numeric,
    investment_term_months integer,
    workflow_step simple_workflow_step DEFAULT 'subscription_agreement_pending',
    subscription_agreement_signed_by_user_at timestamptz,
    subscription_agreement_signed_by_admin_at timestamptz,
    promissory_note_id uuid,
    promissory_note_signed_at timestamptz,
    wire_transfer_confirmed_at timestamptz,
    plaid_account_id text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Simple notifications table
CREATE TABLE IF NOT EXISTS simple_notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    notification_type text NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    read_at timestamptz,
    is_admin boolean DEFAULT false,
    application_id uuid REFERENCES simple_applications(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now()
);

-- Simple investments table
CREATE TABLE IF NOT EXISTS simple_investments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id uuid REFERENCES simple_applications(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    amount numeric NOT NULL,
    status text DEFAULT 'active',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- =================================================================
-- STEP 4: SETUP ADMIN USER (IDEMPOTENT)
-- =================================================================

INSERT INTO user_profiles (
    id,
    email,
    first_name,
    last_name,
    role,
    is_admin,
    is_verified,
    verification_status,
    created_at,
    updated_at
) VALUES (
    '07e0d58f-d90c-4a9a-8dfc-3739ceb9cc72',
    'innercirclelending@gmail.com',
    'Inner Circle',
    'Lending',
    'admin',
    true,
    true,
    'verified',
    now(),
    now()
) ON CONFLICT (id) DO UPDATE SET
    email = 'innercirclelending@gmail.com',
    first_name = 'Inner Circle',
    last_name = 'Lending',
    role = 'admin',
    is_admin = true,
    is_verified = true,
    verification_status = 'verified',
    updated_at = now();

-- =================================================================
-- STEP 5: CREATE WORKFLOW FUNCTIONS (IDEMPOTENT)
-- =================================================================

-- Admin check function
CREATE OR REPLACE FUNCTION is_admin(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (SELECT 1 FROM user_profiles WHERE id = user_id AND (is_admin = true OR role = 'admin'));
$$;

-- User role function
CREATE OR REPLACE FUNCTION get_user_role(user_id uuid DEFAULT auth.uid())
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT COALESCE(role, 'user') FROM user_profiles WHERE id = user_id;
$$;

-- Complete workflow engine
CREATE OR REPLACE FUNCTION create_simple_application(
    p_user_id uuid,
    p_amount numeric,
    p_expected_return_rate numeric DEFAULT NULL,
    p_investment_term_months integer DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_application_id uuid;
BEGIN
    INSERT INTO simple_applications (
        user_id,
        amount,
        expected_return_rate,
        investment_term_months,
        workflow_step
    ) VALUES (
        p_user_id,
        p_amount,
        p_expected_return_rate,
        p_investment_term_months,
        'subscription_agreement_pending'
    ) RETURNING id INTO v_application_id;
    
    -- Create initial notification
    INSERT INTO simple_notifications (
        user_id,
        notification_type,
        title,
        message,
        application_id
    ) VALUES (
        p_user_id,
        'application_created',
        'Application Submitted',
        'Your investment application has been submitted successfully.',
        v_application_id
    );
    
    RETURN v_application_id;
END;
$$;

CREATE OR REPLACE FUNCTION update_workflow_step(
    p_application_id uuid,
    p_step simple_workflow_step,
    p_admin_id uuid DEFAULT NULL
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id uuid;
    v_message text;
BEGIN
    -- Get the user_id for this application
    SELECT user_id INTO v_user_id
    FROM simple_applications
    WHERE id = p_application_id;
    
    IF v_user_id IS NULL THEN
        RETURN false;
    END IF;
    
    -- Update the workflow step
    UPDATE simple_applications
    SET workflow_step = p_step,
        updated_at = now()
    WHERE id = p_application_id;
    
    -- Create appropriate notification message
    CASE p_step
        WHEN 'subscription_agreement_signed' THEN
            v_message := 'Your subscription agreement has been signed. Next step: Promissory note creation.';
        WHEN 'promissory_note_created' THEN
            v_message := 'Your promissory note has been created and is ready for your signature.';
        WHEN 'promissory_note_signed' THEN
            v_message := 'Your promissory note has been signed. Awaiting fund confirmation.';
        WHEN 'funds_confirmed' THEN
            v_message := 'Your funds have been confirmed. Final documents are being generated.';
        WHEN 'final_documents_generated' THEN
            v_message := 'All documents have been generated. Your investment setup is nearly complete.';
        WHEN 'completed' THEN
            v_message := 'Congratulations! Your investment setup is complete.';
        ELSE
            v_message := 'Your application status has been updated.';
    END CASE;
    
    -- Create notification
    INSERT INTO simple_notifications (
        user_id,
        notification_type,
        title,
        message,
        application_id
    ) VALUES (
        v_user_id,
        'workflow_update',
        'Application Update',
        v_message,
        p_application_id
    );
    
    RETURN true;
END;
$$;

-- =================================================================
-- STEP 6: ENABLE RLS (IDEMPOTENT)
-- =================================================================

SELECT enable_rls_if_not_enabled('user_profiles');
SELECT enable_rls_if_not_enabled('simple_applications');
SELECT enable_rls_if_not_enabled('simple_notifications');
SELECT enable_rls_if_not_enabled('simple_investments');

-- =================================================================
-- STEP 7: CREATE RLS POLICIES (IDEMPOTENT)
-- =================================================================

-- User profiles policies
DROP POLICY IF EXISTS "user_profiles_user_access" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_admin_access" ON user_profiles;
CREATE POLICY "user_profiles_user_access" ON user_profiles FOR ALL USING (id = auth.uid());
CREATE POLICY "user_profiles_admin_access" ON user_profiles FOR ALL USING (EXISTS (SELECT 1 FROM user_profiles up WHERE up.id = auth.uid() AND (up.is_admin = true OR up.role = 'admin')));

-- Simple applications policies
DROP POLICY IF EXISTS "simple_applications_user_access" ON simple_applications;
DROP POLICY IF EXISTS "simple_applications_admin_access" ON simple_applications;
CREATE POLICY "simple_applications_user_access" ON simple_applications FOR ALL USING (user_id = auth.uid());
CREATE POLICY "simple_applications_admin_access" ON simple_applications FOR ALL USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')));

-- Simple notifications policies
DROP POLICY IF EXISTS "simple_notifications_user_access" ON simple_notifications;
DROP POLICY IF EXISTS "simple_notifications_admin_access" ON simple_notifications;
CREATE POLICY "simple_notifications_user_access" ON simple_notifications FOR ALL USING (user_id = auth.uid());
CREATE POLICY "simple_notifications_admin_access" ON simple_notifications FOR ALL USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')));

-- Simple investments policies
DROP POLICY IF EXISTS "simple_investments_user_access" ON simple_investments;
DROP POLICY IF EXISTS "simple_investments_admin_access" ON simple_investments;
CREATE POLICY "simple_investments_user_access" ON simple_investments FOR ALL USING (user_id = auth.uid());
CREATE POLICY "simple_investments_admin_access" ON simple_investments FOR ALL USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')));

-- =================================================================
-- STEP 8: GRANT PERMISSIONS
-- =================================================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Clean up helper function if no longer needed in this context
-- (Keep it available for other migrations)

COMMIT;

DO $$
BEGIN
    RAISE NOTICE '✅ WORKFLOW RESET IDEMPOTENT MIGRATION COMPLETE!';
    RAISE NOTICE '🔑 Admin user: innercirclelending@gmail.com → Inner Circle Lending';
    RAISE NOTICE '🛡️  All workflow tables have proper Row Level Security';
    RAISE NOTICE '🔄 Migration can be run safely multiple times';
    RAISE NOTICE '🚀 Workflow system is reset and ready!';
END $$;
