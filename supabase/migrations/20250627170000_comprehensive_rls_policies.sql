-- =================================================================
-- COMPREHENSIVE RLS POLICIES & ADMIN SETUP (FULLY IDEMPOTENT)
-- Fixes all tables with missing RLS policies
-- Sets up proper admin user (innercirclelending@gmail.com)
-- 100% SAFE TO RUN MULTIPLE TIMES - CHECKS ALL OBJECTS FIRST
-- Timestamp: June 27, 2025 17:00:00 FIXED VERSION
-- =================================================================

BEGIN;

DO $$
BEGIN
    RAISE NOTICE 'STARTING FULLY IDEMPOTENT RLS POLICY SETUP...';
    RAISE NOTICE 'This migration is 100% safe to run multiple times';
    RAISE NOTICE 'All objects will be checked before creation';
END $$;

-- =================================================================
-- HELPER FUNCTION: SAFE RLS ENABLEMENT
-- =================================================================

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
        RAISE NOTICE 'Enabled RLS for table: ' || table_name;
    ELSE
        RAISE NOTICE 'RLS already enabled for table: ' || table_name;
    END IF;
END;
$$;

-- =================================================================
-- STEP 1: ENSURE REQUIRED ENUMS EXIST
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
        RAISE NOTICE 'Created simple_workflow_step enum';
    ELSE
        RAISE NOTICE 'simple_workflow_step enum already exists - skipping';
    END IF;
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'simple_workflow_step enum already exists - skipping';
END $$;

-- =================================================================
-- STEP 2: ENSURE ALL REQUIRED TABLES EXIST
-- =================================================================

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

-- All other tables...
CREATE TABLE IF NOT EXISTS admin_actions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    action_type text NOT NULL,
    target_user_id uuid,
    details jsonb,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admin_notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_type text NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    severity text DEFAULT 'info',
    is_read boolean DEFAULT false,
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS consultation_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    preferred_date date NOT NULL,
    preferred_time time NOT NULL,
    consultation_type text DEFAULT 'general',
    status text DEFAULT 'pending',
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS crm_activities (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_type text NOT NULL,
    description text,
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS crm_leads (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text UNIQUE NOT NULL,
    first_name text,
    last_name text,
    phone text,
    source text,
    status text DEFAULT 'new',
    notes text,
    assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS documents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    document_type text NOT NULL,
    title text NOT NULL,
    content text,
    file_url text,
    status text DEFAULT 'draft',
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS document_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    document_type text NOT NULL,
    status text DEFAULT 'pending',
    requested_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    completed_at timestamptz,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS document_signatures (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id uuid REFERENCES documents(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    signature_data text,
    signed_at timestamptz DEFAULT now(),
    ip_address inet,
    user_agent text
);

CREATE TABLE IF NOT EXISTS funding_sources (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    source_type text NOT NULL,
    account_name text,
    account_number_last_four text,
    routing_number text,
    plaid_account_id text,
    is_verified boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS investments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    amount numeric NOT NULL,
    status text DEFAULT 'active',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS investment_applications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    amount numeric NOT NULL,
    status text DEFAULT 'pending',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS investment_documents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    investment_id uuid REFERENCES investments(id) ON DELETE CASCADE,
    document_type text NOT NULL,
    file_url text,
    status text DEFAULT 'pending',
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    from_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    to_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    subject text,
    content text NOT NULL,
    is_read boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text UNIQUE NOT NULL,
    first_name text,
    last_name text,
    subscribed_at timestamptz DEFAULT now(),
    unsubscribed_at timestamptz,
    is_active boolean DEFAULT true
);

CREATE TABLE IF NOT EXISTS onboarding_steps (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    step_name text NOT NULL,
    status text DEFAULT 'pending',
    completed_at timestamptz,
    data jsonb,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    investment_id uuid REFERENCES investments(id) ON DELETE CASCADE,
    amount numeric NOT NULL,
    payment_type text NOT NULL,
    status text DEFAULT 'pending',
    transaction_id text,
    processed_at timestamptz,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS simple_investments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id uuid REFERENCES simple_applications(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    amount numeric NOT NULL,
    status text DEFAULT 'active',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_activity (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_type text NOT NULL,
    description text,
    metadata jsonb,
    created_at timestamptz DEFAULT now()
);

-- =================================================================
-- STEP 3: SETUP ADMIN USER PROFILE
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
-- STEP 4: ENABLE RLS ON ALL TABLES (SAFELY)
-- =================================================================

SELECT enable_rls_if_not_enabled('admin_actions');
SELECT enable_rls_if_not_enabled('admin_notifications');
SELECT enable_rls_if_not_enabled('consultation_requests');
SELECT enable_rls_if_not_enabled('crm_activities');
SELECT enable_rls_if_not_enabled('crm_leads');
SELECT enable_rls_if_not_enabled('document_requests');
SELECT enable_rls_if_not_enabled('document_signatures');
SELECT enable_rls_if_not_enabled('documents');
SELECT enable_rls_if_not_enabled('funding_sources');
SELECT enable_rls_if_not_enabled('investment_applications');
SELECT enable_rls_if_not_enabled('investment_documents');
SELECT enable_rls_if_not_enabled('investments');
SELECT enable_rls_if_not_enabled('messages');
SELECT enable_rls_if_not_enabled('newsletter_subscribers');
SELECT enable_rls_if_not_enabled('onboarding_steps');
SELECT enable_rls_if_not_enabled('payments');
SELECT enable_rls_if_not_enabled('simple_applications');
SELECT enable_rls_if_not_enabled('simple_investments');
SELECT enable_rls_if_not_enabled('simple_notifications');
SELECT enable_rls_if_not_enabled('user_activity');
SELECT enable_rls_if_not_enabled('user_profiles');

-- =================================================================
-- STEP 5: CREATE ALL RLS POLICIES (IDEMPOTENT)
-- =================================================================

-- All policies with DROP IF EXISTS first...
DROP POLICY IF EXISTS "admin_actions_admin_access" ON admin_actions;
CREATE POLICY "admin_actions_admin_access" ON admin_actions FOR ALL USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')));

DROP POLICY IF EXISTS "admin_notifications_admin_access" ON admin_notifications;
CREATE POLICY "admin_notifications_admin_access" ON admin_notifications FOR ALL USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')));

DROP POLICY IF EXISTS "consultation_requests_user_access" ON consultation_requests;
DROP POLICY IF EXISTS "consultation_requests_admin_access" ON consultation_requests;
CREATE POLICY "consultation_requests_user_access" ON consultation_requests FOR ALL USING (user_id = auth.uid());
CREATE POLICY "consultation_requests_admin_access" ON consultation_requests FOR ALL USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')));

DROP POLICY IF EXISTS "crm_activities_admin_access" ON crm_activities;
CREATE POLICY "crm_activities_admin_access" ON crm_activities FOR ALL USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')));

DROP POLICY IF EXISTS "crm_leads_admin_access" ON crm_leads;
CREATE POLICY "crm_leads_admin_access" ON crm_leads FOR ALL USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')));

DROP POLICY IF EXISTS "document_requests_user_access" ON document_requests;
DROP POLICY IF EXISTS "document_requests_admin_access" ON document_requests;
CREATE POLICY "document_requests_user_access" ON document_requests FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "document_requests_admin_access" ON document_requests FOR ALL USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')));

DROP POLICY IF EXISTS "document_signatures_user_access" ON document_signatures;
DROP POLICY IF EXISTS "document_signatures_admin_access" ON document_signatures;
CREATE POLICY "document_signatures_user_access" ON document_signatures FOR ALL USING (user_id = auth.uid());
CREATE POLICY "document_signatures_admin_access" ON document_signatures FOR ALL USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')));

DROP POLICY IF EXISTS "documents_user_access" ON documents;
DROP POLICY IF EXISTS "documents_admin_access" ON documents;
CREATE POLICY "documents_user_access" ON documents FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "documents_admin_access" ON documents FOR ALL USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')));

DROP POLICY IF EXISTS "funding_sources_user_access" ON funding_sources;
DROP POLICY IF EXISTS "funding_sources_admin_access" ON funding_sources;
CREATE POLICY "funding_sources_user_access" ON funding_sources FOR ALL USING (user_id = auth.uid());
CREATE POLICY "funding_sources_admin_access" ON funding_sources FOR ALL USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')));

DROP POLICY IF EXISTS "investment_applications_user_access" ON investment_applications;
DROP POLICY IF EXISTS "investment_applications_admin_access" ON investment_applications;
CREATE POLICY "investment_applications_user_access" ON investment_applications FOR ALL USING (user_id = auth.uid());
CREATE POLICY "investment_applications_admin_access" ON investment_applications FOR ALL USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')));

DROP POLICY IF EXISTS "investment_documents_user_access" ON investment_documents;
DROP POLICY IF EXISTS "investment_documents_admin_access" ON investment_documents;
CREATE POLICY "investment_documents_user_access" ON investment_documents FOR SELECT USING (EXISTS (SELECT 1 FROM investments i WHERE i.id = investment_documents.investment_id AND i.user_id = auth.uid()));
CREATE POLICY "investment_documents_admin_access" ON investment_documents FOR ALL USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')));

DROP POLICY IF EXISTS "investments_user_access" ON investments;
DROP POLICY IF EXISTS "investments_admin_access" ON investments;
CREATE POLICY "investments_user_access" ON investments FOR ALL USING (user_id = auth.uid());
CREATE POLICY "investments_admin_access" ON investments FOR ALL USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')));

DROP POLICY IF EXISTS "messages_user_access" ON messages;
DROP POLICY IF EXISTS "messages_admin_access" ON messages;
CREATE POLICY "messages_user_access" ON messages FOR ALL USING (from_user_id = auth.uid() OR to_user_id = auth.uid());
CREATE POLICY "messages_admin_access" ON messages FOR ALL USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')));

DROP POLICY IF EXISTS "newsletter_subscribers_admin_access" ON newsletter_subscribers;
CREATE POLICY "newsletter_subscribers_admin_access" ON newsletter_subscribers FOR ALL USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')));

DROP POLICY IF EXISTS "onboarding_steps_user_access" ON onboarding_steps;
DROP POLICY IF EXISTS "onboarding_steps_admin_access" ON onboarding_steps;
CREATE POLICY "onboarding_steps_user_access" ON onboarding_steps FOR ALL USING (user_id = auth.uid());
CREATE POLICY "onboarding_steps_admin_access" ON onboarding_steps FOR ALL USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')));

DROP POLICY IF EXISTS "payments_user_access" ON payments;
DROP POLICY IF EXISTS "payments_admin_access" ON payments;
CREATE POLICY "payments_user_access" ON payments FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "payments_admin_access" ON payments FOR ALL USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')));

DROP POLICY IF EXISTS "user_applications_policy" ON simple_applications;
DROP POLICY IF EXISTS "simple_applications_user_access" ON simple_applications;
DROP POLICY IF EXISTS "simple_applications_admin_access" ON simple_applications;
CREATE POLICY "simple_applications_user_access" ON simple_applications FOR ALL USING (user_id = auth.uid());
CREATE POLICY "simple_applications_admin_access" ON simple_applications FOR ALL USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')));

DROP POLICY IF EXISTS "simple_investments_user_access" ON simple_investments;
DROP POLICY IF EXISTS "simple_investments_admin_access" ON simple_investments;
CREATE POLICY "simple_investments_user_access" ON simple_investments FOR ALL USING (user_id = auth.uid());
CREATE POLICY "simple_investments_admin_access" ON simple_investments FOR ALL USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')));

DROP POLICY IF EXISTS "simple_notifications_user_access" ON simple_notifications;
DROP POLICY IF EXISTS "simple_notifications_admin_access" ON simple_notifications;
CREATE POLICY "simple_notifications_user_access" ON simple_notifications FOR ALL USING (user_id = auth.uid());
CREATE POLICY "simple_notifications_admin_access" ON simple_notifications FOR ALL USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')));

DROP POLICY IF EXISTS "user_activity_user_access" ON user_activity;
DROP POLICY IF EXISTS "user_activity_admin_access" ON user_activity;
CREATE POLICY "user_activity_user_access" ON user_activity FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "user_activity_admin_access" ON user_activity FOR ALL USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')));

DROP POLICY IF EXISTS "user_profiles_access" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_user_access" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_admin_access" ON user_profiles;
CREATE POLICY "user_profiles_user_access" ON user_profiles FOR ALL USING (id = auth.uid());
CREATE POLICY "user_profiles_admin_access" ON user_profiles FOR ALL USING (EXISTS (SELECT 1 FROM user_profiles up WHERE up.id = auth.uid() AND (up.is_admin = true OR up.role = 'admin')));

-- =================================================================
-- STEP 6: CREATE HELPER FUNCTIONS
-- =================================================================

CREATE OR REPLACE FUNCTION is_admin(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (SELECT 1 FROM user_profiles WHERE id = user_id AND (is_admin = true OR role = 'admin'));
$$;

CREATE OR REPLACE FUNCTION get_user_role(user_id uuid DEFAULT auth.uid())
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT COALESCE(role, 'user') FROM user_profiles WHERE id = user_id;
$$;

-- =================================================================
-- STEP 7: GRANT PERMISSIONS
-- =================================================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

DROP FUNCTION IF EXISTS enable_rls_if_not_enabled(text);

COMMIT;

DO $$
BEGIN
    RAISE NOTICE 'FULLY IDEMPOTENT RLS POLICIES SETUP COMPLETE!';
    RAISE NOTICE 'Admin user: innercirclelending@gmail.com';
    RAISE NOTICE 'All tables now have proper Row Level Security policies';
    RAISE NOTICE 'Migration can be run safely multiple times';
END $$;
