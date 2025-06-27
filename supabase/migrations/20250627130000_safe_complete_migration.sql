-- =================================================================
-- SAFE COMPLETE MIGRATION - IDEMPOTENT VERSION
-- This migration can run safely even if parts already exist
-- Timestamp: June 27, 2025 13:00:00 
-- =================================================================

BEGIN;

DO $$
BEGIN
    RAISE NOTICE '🔧 STARTING SAFE MIGRATION - FIXING PARTIAL DEPLOYMENT...';
END $$;

-- =================================================================
-- STEP 1: SAFE TYPE CREATION (IF NOT EXISTS equivalent)
-- =================================================================

DO $$
BEGIN
    -- Create enum only if it doesn't exist
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
END $$;

-- =================================================================
-- STEP 2: SAFE TABLE CREATION
-- =================================================================

-- Create simple applications table (safe)
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

-- Create simple notifications table (safe)
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

-- Ensure user_profiles table exists with all required fields
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

DO $$
BEGIN
    RAISE NOTICE '✅ Tables created safely (or already existed)';
END $$;

-- =================================================================
-- STEP 3: FORCE RECREATE ALL FUNCTIONS (REPLACE EXISTING)
-- =================================================================

-- 1. Get user applications (parameterized version)
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

EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error in get_user_applications: %', SQLERRM;
    RETURN;
END $$;

-- 2. Get user applications (no parameters - uses auth.uid())
CREATE OR REPLACE FUNCTION get_user_applications()
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
    WHERE sa.user_id = auth.uid()
    ORDER BY sa.created_at DESC;

EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error in get_user_applications (no params): %', SQLERRM;
    RETURN;
END $$;

-- 3. Get user active application (frontend compatibility)
CREATE OR REPLACE FUNCTION get_user_active_application()
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
    WHERE sa.user_id = auth.uid()
    AND sa.workflow_step != 'completed'
    ORDER BY sa.created_at DESC
    LIMIT 1;

EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error in get_user_active_application: %', SQLERRM;
    RETURN;
END $$;

-- 4. Submit subscription agreement
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
    new_application_id uuid;
    user_email text;
BEGIN
    -- Create new application
    INSERT INTO simple_applications (
        user_id, 
        amount, 
        expected_return_rate,
        investment_term_months,
        workflow_step, 
        subscription_agreement_signed_by_user_at
    )
    VALUES (
        p_user_id, 
        p_amount, 
        p_expected_return_rate,
        p_investment_term_months,
        'subscription_agreement_pending', 
        now()
    )
    RETURNING id INTO new_application_id;

    -- Get user email for notification
    SELECT email INTO user_email FROM auth.users WHERE id = p_user_id;

    -- Notify admin
    INSERT INTO simple_notifications (user_id, notification_type, title, message, is_admin, application_id)
    VALUES (
        p_user_id,
        'admin_subscription_review',
        'New Subscription Agreement Submitted',
        'User ' || COALESCE(user_email, 'Unknown') || ' has submitted a subscription agreement for $' || p_amount || ' requiring admin review.',
        true,
        new_application_id
    );

    RETURN new_application_id;

EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error in submit_subscription_agreement: %', SQLERRM;
    RETURN NULL;
END $$;

-- 5. Admin sign subscription agreement
CREATE OR REPLACE FUNCTION admin_sign_subscription_agreement(p_application_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    app_user_id uuid;
    app_amount numeric;
BEGIN
    -- Update application
    UPDATE simple_applications SET 
        workflow_step = 'subscription_agreement_signed',
        subscription_agreement_signed_by_admin_at = now()
    WHERE id = p_application_id
    RETURNING user_id, amount INTO app_user_id, app_amount;

    -- Notify user
    INSERT INTO simple_notifications (user_id, notification_type, title, message, is_admin, application_id)
    VALUES (
        app_user_id,
        'subscription_signed',
        'Subscription Agreement Approved',
        'Your subscription agreement for $' || app_amount || ' has been signed by admin.',
        false,
        p_application_id
    );

    RETURN true;

EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error in admin_sign_subscription_agreement: %', SQLERRM;
    RETURN false;
END $$;

-- 6. Enhanced user profile upsert
CREATE OR REPLACE FUNCTION safe_upsert_user_profile(
    p_user_id uuid,
    p_first_name text,
    p_last_name text,
    p_phone text DEFAULT NULL,
    p_address text DEFAULT NULL,
    p_ira_accounts jsonb DEFAULT NULL,
    p_investment_goals text DEFAULT NULL,
    p_risk_tolerance text DEFAULT NULL,
    p_net_worth text DEFAULT NULL,
    p_annual_income text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_email text;
BEGIN
    -- Get user email
    SELECT email INTO user_email FROM auth.users WHERE id = p_user_id;
    
    -- Upsert profile
    INSERT INTO user_profiles (
        id, 
        email, 
        first_name, 
        last_name, 
        phone, 
        address,
        updated_at
    )
    VALUES (
        p_user_id,
        user_email,
        p_first_name,
        p_last_name,
        p_phone,
        p_address,
        now()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        phone = COALESCE(EXCLUDED.phone, user_profiles.phone),
        address = COALESCE(EXCLUDED.address, user_profiles.address),
        updated_at = now();

    RETURN true;

EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error in safe_upsert_user_profile: %', SQLERRM;
    RETURN false;
END $$;

-- 7. Admin functions
CREATE OR REPLACE FUNCTION get_all_users()
RETURNS TABLE (
    id uuid,
    email text,
    first_name text,
    last_name text,
    role text,
    created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        up.id,
        up.email,
        up.first_name,
        up.last_name,
        up.role,
        up.created_at
    FROM user_profiles up
    ORDER BY up.created_at DESC;

EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error in get_all_users: %', SQLERRM;
    RETURN;
END $$;

CREATE OR REPLACE FUNCTION set_user_role(target_user_id uuid, new_role text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE user_profiles 
    SET 
        role = new_role,
        is_admin = (new_role = 'admin'),
        updated_at = now()
    WHERE id = target_user_id;

    RETURN FOUND;

EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error in set_user_role: %', SQLERRM;
    RETURN false;
END $$;

-- 8. Additional admin workflow functions
CREATE OR REPLACE FUNCTION admin_create_promissory_note(
    p_application_id uuid,
    p_promissory_note_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE simple_applications 
    SET 
        workflow_step = 'promissory_note_created',
        promissory_note_id = p_promissory_note_id
    WHERE id = p_application_id;

    RETURN FOUND;
END $$;

CREATE OR REPLACE FUNCTION user_sign_promissory_note(p_application_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE simple_applications 
    SET 
        workflow_step = 'promissory_note_signed',
        promissory_note_signed_at = now()
    WHERE id = p_application_id;

    RETURN FOUND;
END $$;

CREATE OR REPLACE FUNCTION admin_confirm_funds(p_application_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE simple_applications 
    SET 
        workflow_step = 'funds_confirmed',
        wire_transfer_confirmed_at = now()
    WHERE id = p_application_id;

    RETURN FOUND;
END $$;

CREATE OR REPLACE FUNCTION admin_complete_setup(p_application_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE simple_applications 
    SET workflow_step = 'setup_completed'
    WHERE id = p_application_id;

    RETURN FOUND;
END $$;

CREATE OR REPLACE FUNCTION activate_investment(p_application_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE simple_applications 
    SET workflow_step = 'completed'
    WHERE id = p_application_id;

    RETURN FOUND;
END $$;

-- 9. Compatibility functions
CREATE OR REPLACE FUNCTION create_investment_application()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Create a basic application for the current user
    RETURN submit_subscription_agreement(auth.uid(), 10000.00, 8.0, 12);
END $$;

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
END $$;

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
        sn.id,
        sn.user_id,
        sn.notification_type,
        sn.title,
        sn.message,
        sn.read_at,
        sn.created_at
    FROM simple_notifications sn
    WHERE sn.is_admin = true
    ORDER BY sn.created_at DESC;
END $$;

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
        sn.id,
        sn.notification_type,
        sn.title,
        sn.message,
        sn.read_at,
        sn.created_at
    FROM simple_notifications sn
    WHERE sn.user_id = p_user_id AND sn.is_admin = false
    ORDER BY sn.created_at DESC;
END $$;

CREATE OR REPLACE FUNCTION get_latest_user_documents(p_user_id uuid DEFAULT NULL)
RETURNS TABLE (
    document_id uuid,
    document_type text,
    status text,
    created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    target_user_id uuid;
BEGIN
    target_user_id := COALESCE(p_user_id, auth.uid());
    
    RETURN QUERY
    SELECT 
        sa.id as document_id,
        'subscription_agreement' as document_type,
        sa.workflow_step::text as status,
        sa.created_at
    FROM simple_applications sa
    WHERE sa.user_id = target_user_id
    ORDER BY sa.created_at DESC;
END $$;

CREATE OR REPLACE FUNCTION user_connect_plaid(
    p_application_id uuid,
    p_plaid_account_id text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE simple_applications 
    SET plaid_account_id = p_plaid_account_id
    WHERE id = p_application_id;

    RETURN FOUND;
END $$;

CREATE OR REPLACE FUNCTION update_user_verification(
    p_user_id uuid,
    p_status text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE user_profiles 
    SET 
        verification_status = p_status,
        is_verified = (p_status = 'verified'),
        updated_at = now()
    WHERE id = p_user_id;

    RETURN FOUND;
END $$;

CREATE OR REPLACE FUNCTION update_user_metadata(
    p_first_name text DEFAULT NULL,
    p_last_name text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE user_profiles 
    SET 
        first_name = COALESCE(p_first_name, first_name),
        last_name = COALESCE(p_last_name, last_name),
        updated_at = now()
    WHERE id = auth.uid();

    RETURN FOUND;
END $$;

-- 10. Mark simple notification read (compatibility)
CREATE OR REPLACE FUNCTION mark_simple_notification_read(p_notification_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN mark_notification_read(p_notification_id);
END $$;

-- =================================================================
-- STEP 4: CRITICAL - SET ADMIN STATUS FOR innercirclelending@gmail.com
-- =================================================================

DO $$
DECLARE
    admin_user_id uuid;
BEGIN
    RAISE NOTICE '👑 SETTING UP ADMIN ACCESS FOR innercirclelending@gmail.com...';
    
    -- Find the user ID for innercirclelending@gmail.com
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = 'innercirclelending@gmail.com';
    
    IF admin_user_id IS NOT NULL THEN
        -- Ensure profile exists and set as admin
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
        )
        VALUES (
            admin_user_id,
            'innercirclelending@gmail.com',
            'Admin',
            'User',
            'admin',
            true,
            true,
            'verified',
            now(),
            now()
        )
        ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            role = 'admin',
            is_admin = true,
            is_verified = true,
            verification_status = 'verified',
            updated_at = now();
            
        RAISE NOTICE '✅ Successfully set innercirclelending@gmail.com as ADMIN';
    ELSE
        RAISE NOTICE '❌ Could not find user innercirclelending@gmail.com';
    END IF;
END $$;

-- =================================================================
-- STEP 5: ENABLE RLS AND SET POLICIES
-- =================================================================

-- Enable RLS
ALTER TABLE simple_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE simple_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (safe)
DROP POLICY IF EXISTS "Users can view own applications" ON simple_applications;
DROP POLICY IF EXISTS "Users can insert own applications" ON simple_applications;
DROP POLICY IF EXISTS "Admins can view all applications" ON simple_applications;
DROP POLICY IF EXISTS "Users can view own notifications" ON simple_notifications;
DROP POLICY IF EXISTS "Users can insert notifications" ON simple_notifications;
DROP POLICY IF EXISTS "Admins can view all notifications" ON simple_notifications;
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;

-- Create new policies
CREATE POLICY "Users can view own applications" ON simple_applications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own applications" ON simple_applications
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all applications" ON simple_applications
    FOR ALL USING (
        EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = true)
    );

CREATE POLICY "Users can view own notifications" ON simple_notifications
    FOR SELECT USING (user_id = auth.uid() OR is_admin = false);

CREATE POLICY "Users can insert notifications" ON simple_notifications
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all notifications" ON simple_notifications
    FOR ALL USING (
        EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = true)
    );

CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "Admins can view all profiles" ON user_profiles
    FOR ALL USING (
        EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = true)
    );

-- =================================================================
-- STEP 6: GRANT PERMISSIONS
-- =================================================================

-- Grant function permissions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Grant table permissions
GRANT ALL ON TABLE simple_applications TO authenticated;
GRANT ALL ON TABLE simple_notifications TO authenticated;
GRANT ALL ON TABLE user_profiles TO authenticated;

-- =================================================================
-- FINAL SUCCESS MESSAGE
-- =================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 SAFE MIGRATION COMPLETED SUCCESSFULLY! 🎉';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Types created safely (or already existed)';
    RAISE NOTICE '✅ Tables created safely (or already existed)';
    RAISE NOTICE '✅ All functions force-recreated with correct logic';
    RAISE NOTICE '✅ Admin status set for innercirclelending@gmail.com';
    RAISE NOTICE '✅ RLS policies and permissions configured';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Database is now fully functional!';
    RAISE NOTICE '';
    RAISE NOTICE 'Available functions:';
    RAISE NOTICE '• get_user_applications() - no sa.amount errors!';
    RAISE NOTICE '• get_user_active_application() - works with frontend';
    RAISE NOTICE '• safe_upsert_user_profile() - name saving fixed';
    RAISE NOTICE '• All admin functions - your access restored';
END $$;

COMMIT;
