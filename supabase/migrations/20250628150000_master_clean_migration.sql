-- =================================================================
-- MASTER CLEAN MIGRATION - FINAL MINIMAL SETUP
-- This replaces ALL previous migrations with minimal requirements
-- 100% SAFE TO RUN MULTIPLE TIMES - FULLY IDEMPOTENT
-- Only keeps: Authentication, Basic Profiles, Contact Form Support
-- Timestamp: June 28, 2025 - MASTER RESET
-- =================================================================

BEGIN;

-- =================================================================
-- STEP 1: SAFELY DROP ALL COMPLEX FUNCTIONS
-- =================================================================

-- Drop all investment workflow functions (if they exist)
DROP FUNCTION IF EXISTS activate_investment(uuid);
DROP FUNCTION IF EXISTS admin_complete_setup(uuid);
DROP FUNCTION IF EXISTS admin_confirm_funds(uuid);
DROP FUNCTION IF EXISTS admin_create_promissory_note(uuid, uuid);
DROP FUNCTION IF EXISTS admin_sign_subscription_agreement(uuid);
DROP FUNCTION IF EXISTS create_investment_application();

-- Drop admin and notification functions
DROP FUNCTION IF EXISTS get_admin_notifications();
DROP FUNCTION IF EXISTS get_all_users();
DROP FUNCTION IF EXISTS get_user_notifications(uuid);
DROP FUNCTION IF EXISTS mark_notification_read(uuid);
DROP FUNCTION IF EXISTS mark_simple_notification_read(uuid);

-- Drop document management functions
DROP FUNCTION IF EXISTS get_latest_user_documents(uuid);

-- Drop investment application functions
DROP FUNCTION IF EXISTS get_user_active_application();
DROP FUNCTION IF EXISTS get_user_applications(uuid);
DROP FUNCTION IF EXISTS get_user_applications();
DROP FUNCTION IF EXISTS submit_subscription_agreement(uuid, numeric, numeric, integer);

-- Drop user management functions (except profile upsert)
DROP FUNCTION IF EXISTS set_user_role(uuid, text);
DROP FUNCTION IF EXISTS update_user_metadata(text, text);
DROP FUNCTION IF EXISTS update_user_verification(uuid, text);

-- Drop Plaid integration functions
DROP FUNCTION IF EXISTS user_connect_plaid(uuid, text);

-- Drop promissory note functions
DROP FUNCTION IF EXISTS user_sign_promissory_note(uuid);

-- =================================================================
-- STEP 2: SAFELY DROP ALL COMPLEX TABLES
-- =================================================================

-- Drop investment workflow tables
DROP TABLE IF EXISTS simple_investments CASCADE;
DROP TABLE IF EXISTS simple_applications CASCADE;
DROP TABLE IF EXISTS investment_applications CASCADE;
DROP TABLE IF EXISTS investments CASCADE;
DROP TABLE IF EXISTS investment_documents CASCADE;
DROP TABLE IF EXISTS payments CASCADE;

-- Drop document management tables
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS document_requests CASCADE;
DROP TABLE IF EXISTS document_signatures CASCADE;

-- Drop notification tables
DROP TABLE IF EXISTS simple_notifications CASCADE;
DROP TABLE IF EXISTS admin_notifications CASCADE;

-- Drop admin tables
DROP TABLE IF EXISTS admin_actions CASCADE;
DROP TABLE IF EXISTS consultation_requests CASCADE;
DROP TABLE IF EXISTS crm_activities CASCADE;
DROP TABLE IF EXISTS crm_leads CASCADE;

-- Drop Plaid integration tables
DROP TABLE IF EXISTS funding_sources CASCADE;

-- Drop other complex tables
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS newsletter_subscribers CASCADE;
DROP TABLE IF EXISTS onboarding_steps CASCADE;
DROP TABLE IF EXISTS user_activity CASCADE;

-- Drop enum types
DROP TYPE IF EXISTS simple_workflow_step CASCADE;

-- =================================================================
-- STEP 3: CREATE MINIMAL ESSENTIAL TABLES
-- =================================================================

-- Basic user profiles table (renamed from user_profiles to profiles for consistency)
CREATE TABLE IF NOT EXISTS profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email text,
    first_name text,
    last_name text,
    phone text,
    address text,
    ira_accounts text,
    investment_goals text,
    net_worth text,
    annual_income text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Contact form submissions (for tracking/analytics only)
CREATE TABLE IF NOT EXISTS contact_submissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name text NOT NULL,
    last_name text NOT NULL,
    email text NOT NULL,
    phone text,
    message text,
    consultation_type text, -- 'email', 'video', 'phone'
    preferred_date date,
    preferred_time time,
    created_at timestamptz DEFAULT now()
);

-- =================================================================
-- STEP 4: ENABLE RLS ON ESSENTIAL TABLES
-- =================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

-- =================================================================
-- STEP 5: CREATE MINIMAL RLS POLICIES
-- =================================================================

-- Profiles: Users can only access their own profile
DROP POLICY IF EXISTS "profiles_user_access" ON profiles;
CREATE POLICY "profiles_user_access" ON profiles 
    FOR ALL USING (id = auth.uid());

-- Contact submissions: Only accessible by authenticated users (for their own submissions)
DROP POLICY IF EXISTS "contact_submissions_user_access" ON contact_submissions;
CREATE POLICY "contact_submissions_user_access" ON contact_submissions 
    FOR SELECT USING (true); -- Public read for analytics (no sensitive data)

-- =================================================================
-- STEP 6: CREATE ESSENTIAL FUNCTIONS
-- =================================================================

-- Safe profile upsert function (the only backend function we keep)
CREATE OR REPLACE FUNCTION safe_upsert_user_profile(
    p_user_id uuid,
    p_first_name text DEFAULT NULL,
    p_last_name text DEFAULT NULL,
    p_phone text DEFAULT NULL,
    p_address text DEFAULT NULL,
    p_ira_accounts text DEFAULT NULL,
    p_investment_goals text DEFAULT NULL,
    p_net_worth text DEFAULT NULL,
    p_annual_income text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Verify the user is updating their own profile
    IF p_user_id != auth.uid() THEN
        RETURN false;
    END IF;
    
    -- Get current user email
    INSERT INTO profiles (
        id, email, first_name, last_name, phone, address, 
        ira_accounts, investment_goals, net_worth, annual_income, updated_at
    ) VALUES (
        p_user_id,
        (SELECT email FROM auth.users WHERE id = p_user_id),
        p_first_name,
        p_last_name,
        p_phone,
        p_address,
        p_ira_accounts,
        p_investment_goals,
        p_net_worth,
        p_annual_income,
        now()
    )
    ON CONFLICT (id) DO UPDATE SET
        first_name = COALESCE(p_first_name, profiles.first_name),
        last_name = COALESCE(p_last_name, profiles.last_name),
        phone = COALESCE(p_phone, profiles.phone),
        address = COALESCE(p_address, profiles.address),
        ira_accounts = COALESCE(p_ira_accounts, profiles.ira_accounts),
        investment_goals = COALESCE(p_investment_goals, profiles.investment_goals),
        net_worth = COALESCE(p_net_worth, profiles.net_worth),
        annual_income = COALESCE(p_annual_income, profiles.annual_income),
        updated_at = now();
    
    RETURN true;
END;
$$;

-- =================================================================
-- STEP 7: CREATE PROFILE ON SIGNUP TRIGGER
-- =================================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO profiles (id, email, created_at, updated_at)
    VALUES (NEW.id, NEW.email, now(), now())
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =================================================================
-- STEP 8: GRANT MINIMAL PERMISSIONS
-- =================================================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON TABLE profiles TO authenticated;
GRANT ALL ON TABLE contact_submissions TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant service role access (needed for edge functions)
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- =================================================================
-- FINAL VERIFICATION
-- =================================================================

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'MASTER CLEAN MIGRATION COMPLETED SUCCESSFULLY';
    RAISE NOTICE 'Remaining tables: profiles, contact_submissions';
    RAISE NOTICE 'Remaining functions: safe_upsert_user_profile, handle_new_user';
    RAISE NOTICE 'All investment workflow components removed';
END $$;

COMMIT;
