-- =================================================================
-- COMPREHENSIVE RLS POLICIES & ADMIN SETUP
-- Fixes all tables with missing RLS policies
-- Sets up proper admin user (innercirclelending@gmail.com)
-- Timestamp: June 27, 2025 17:00:00 
-- =================================================================

BEGIN;

DO $$
BEGIN
    RAISE NOTICE '🔐 STARTING COMPREHENSIVE RLS POLICY SETUP...';
END $$;

-- =================================================================
-- STEP 1: SETUP ADMIN USER PROFILE
-- =================================================================

-- First, ensure the admin user has a proper profile
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
    email = EXCLUDED.email,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = 'admin',
    is_admin = true,
    is_verified = true,
    verification_status = 'verified',
    updated_at = now();

-- =================================================================
-- STEP 2: RLS POLICIES FOR ALL TABLES
-- =================================================================

-- ADMIN ACTIONS TABLE
CREATE TABLE IF NOT EXISTS admin_actions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    action_type text NOT NULL,
    target_user_id uuid,
    details jsonb,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;

-- Admin actions policies
DROP POLICY IF EXISTS "admin_actions_admin_access" ON admin_actions;
CREATE POLICY "admin_actions_admin_access" ON admin_actions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND (is_admin = true OR role = 'admin')
        )
    );

-- ADMIN NOTIFICATIONS TABLE
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

ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

-- Admin notifications policies
DROP POLICY IF EXISTS "admin_notifications_admin_access" ON admin_notifications;
CREATE POLICY "admin_notifications_admin_access" ON admin_notifications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND (is_admin = true OR role = 'admin')
        )
    );

-- CONSULTATION REQUESTS TABLE
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

ALTER TABLE consultation_requests ENABLE ROW LEVEL SECURITY;

-- Consultation requests policies
DROP POLICY IF EXISTS "consultation_requests_user_access" ON consultation_requests;
DROP POLICY IF EXISTS "consultation_requests_admin_access" ON consultation_requests;

CREATE POLICY "consultation_requests_user_access" ON consultation_requests
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "consultation_requests_admin_access" ON consultation_requests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND (is_admin = true OR role = 'admin')
        )
    );

-- CRM ACTIVITIES TABLE
CREATE TABLE IF NOT EXISTS crm_activities (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_type text NOT NULL,
    description text,
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE crm_activities ENABLE ROW LEVEL SECURITY;

-- CRM activities policies
DROP POLICY IF EXISTS "crm_activities_admin_access" ON crm_activities;
CREATE POLICY "crm_activities_admin_access" ON crm_activities
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND (is_admin = true OR role = 'admin')
        )
    );

-- CRM LEADS TABLE
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

ALTER TABLE crm_leads ENABLE ROW LEVEL SECURITY;

-- CRM leads policies
DROP POLICY IF EXISTS "crm_leads_admin_access" ON crm_leads;
CREATE POLICY "crm_leads_admin_access" ON crm_leads
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND (is_admin = true OR role = 'admin')
        )
    );

-- DOCUMENT REQUESTS TABLE
CREATE TABLE IF NOT EXISTS document_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    document_type text NOT NULL,
    status text DEFAULT 'pending',
    requested_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    completed_at timestamptz,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE document_requests ENABLE ROW LEVEL SECURITY;

-- Document requests policies
DROP POLICY IF EXISTS "document_requests_user_access" ON document_requests;
DROP POLICY IF EXISTS "document_requests_admin_access" ON document_requests;

CREATE POLICY "document_requests_user_access" ON document_requests
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "document_requests_admin_access" ON document_requests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND (is_admin = true OR role = 'admin')
        )
    );

-- DOCUMENT SIGNATURES TABLE
CREATE TABLE IF NOT EXISTS document_signatures (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id uuid REFERENCES documents(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    signature_data text,
    signed_at timestamptz DEFAULT now(),
    ip_address inet,
    user_agent text
);

ALTER TABLE document_signatures ENABLE ROW LEVEL SECURITY;

-- Document signatures policies
DROP POLICY IF EXISTS "document_signatures_user_access" ON document_signatures;
DROP POLICY IF EXISTS "document_signatures_admin_access" ON document_signatures;

CREATE POLICY "document_signatures_user_access" ON document_signatures
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "document_signatures_admin_access" ON document_signatures
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND (is_admin = true OR role = 'admin')
        )
    );

-- DOCUMENTS TABLE
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

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Documents policies
DROP POLICY IF EXISTS "documents_user_access" ON documents;
DROP POLICY IF EXISTS "documents_admin_access" ON documents;

CREATE POLICY "documents_user_access" ON documents
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "documents_admin_access" ON documents
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND (is_admin = true OR role = 'admin')
        )
    );

-- FUNDING SOURCES TABLE
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

ALTER TABLE funding_sources ENABLE ROW LEVEL SECURITY;

-- Funding sources policies
DROP POLICY IF EXISTS "funding_sources_user_access" ON funding_sources;
DROP POLICY IF EXISTS "funding_sources_admin_access" ON funding_sources;

CREATE POLICY "funding_sources_user_access" ON funding_sources
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "funding_sources_admin_access" ON funding_sources
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND (is_admin = true OR role = 'admin')
        )
    );

-- INVESTMENT APPLICATIONS TABLE
ALTER TABLE investment_applications ENABLE ROW LEVEL SECURITY;

-- Investment applications policies
DROP POLICY IF EXISTS "investment_applications_user_access" ON investment_applications;
DROP POLICY IF EXISTS "investment_applications_admin_access" ON investment_applications;

CREATE POLICY "investment_applications_user_access" ON investment_applications
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "investment_applications_admin_access" ON investment_applications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND (is_admin = true OR role = 'admin')
        )
    );

-- INVESTMENT DOCUMENTS TABLE
CREATE TABLE IF NOT EXISTS investment_documents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    investment_id uuid REFERENCES investments(id) ON DELETE CASCADE,
    document_type text NOT NULL,
    file_url text,
    status text DEFAULT 'pending',
    created_at timestamptz DEFAULT now()
);

ALTER TABLE investment_documents ENABLE ROW LEVEL SECURITY;

-- Investment documents policies
DROP POLICY IF EXISTS "investment_documents_user_access" ON investment_documents;
DROP POLICY IF EXISTS "investment_documents_admin_access" ON investment_documents;

CREATE POLICY "investment_documents_user_access" ON investment_documents
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM investments i 
            WHERE i.id = investment_documents.investment_id 
            AND i.user_id = auth.uid()
        )
    );

CREATE POLICY "investment_documents_admin_access" ON investment_documents
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND (is_admin = true OR role = 'admin')
        )
    );

-- INVESTMENTS TABLE
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;

-- Investments policies
DROP POLICY IF EXISTS "investments_user_access" ON investments;
DROP POLICY IF EXISTS "investments_admin_access" ON investments;

CREATE POLICY "investments_user_access" ON investments
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "investments_admin_access" ON investments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND (is_admin = true OR role = 'admin')
        )
    );

-- MESSAGES TABLE
CREATE TABLE IF NOT EXISTS messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    from_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    to_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    subject text,
    content text NOT NULL,
    is_read boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Messages policies
DROP POLICY IF EXISTS "messages_user_access" ON messages;
DROP POLICY IF EXISTS "messages_admin_access" ON messages;

CREATE POLICY "messages_user_access" ON messages
    FOR ALL USING (
        from_user_id = auth.uid() OR to_user_id = auth.uid()
    );

CREATE POLICY "messages_admin_access" ON messages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND (is_admin = true OR role = 'admin')
        )
    );

-- NEWSLETTER SUBSCRIBERS TABLE
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text UNIQUE NOT NULL,
    first_name text,
    last_name text,
    subscribed_at timestamptz DEFAULT now(),
    unsubscribed_at timestamptz,
    is_active boolean DEFAULT true
);

ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Newsletter subscribers policies (admin only)
DROP POLICY IF EXISTS "newsletter_subscribers_admin_access" ON newsletter_subscribers;
CREATE POLICY "newsletter_subscribers_admin_access" ON newsletter_subscribers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND (is_admin = true OR role = 'admin')
        )
    );

-- ONBOARDING STEPS TABLE
CREATE TABLE IF NOT EXISTS onboarding_steps (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    step_name text NOT NULL,
    status text DEFAULT 'pending',
    completed_at timestamptz,
    data jsonb,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE onboarding_steps ENABLE ROW LEVEL SECURITY;

-- Onboarding steps policies
DROP POLICY IF EXISTS "onboarding_steps_user_access" ON onboarding_steps;
DROP POLICY IF EXISTS "onboarding_steps_admin_access" ON onboarding_steps;

CREATE POLICY "onboarding_steps_user_access" ON onboarding_steps
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "onboarding_steps_admin_access" ON onboarding_steps
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND (is_admin = true OR role = 'admin')
        )
    );

-- PAYMENTS TABLE
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

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Payments policies
DROP POLICY IF EXISTS "payments_user_access" ON payments;
DROP POLICY IF EXISTS "payments_admin_access" ON payments;

CREATE POLICY "payments_user_access" ON payments
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "payments_admin_access" ON payments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND (is_admin = true OR role = 'admin')
        )
    );

-- SIMPLE APPLICATIONS TABLE
ALTER TABLE simple_applications ENABLE ROW LEVEL SECURITY;

-- Simple applications policies
DROP POLICY IF EXISTS "user_applications_policy" ON simple_applications;
DROP POLICY IF EXISTS "simple_applications_user_access" ON simple_applications;
DROP POLICY IF EXISTS "simple_applications_admin_access" ON simple_applications;

CREATE POLICY "simple_applications_user_access" ON simple_applications
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "simple_applications_admin_access" ON simple_applications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND (is_admin = true OR role = 'admin')
        )
    );

-- SIMPLE INVESTMENTS TABLE
CREATE TABLE IF NOT EXISTS simple_investments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id uuid REFERENCES simple_applications(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    amount numeric NOT NULL,
    status text DEFAULT 'active',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE simple_investments ENABLE ROW LEVEL SECURITY;

-- Simple investments policies
DROP POLICY IF EXISTS "simple_investments_user_access" ON simple_investments;
DROP POLICY IF EXISTS "simple_investments_admin_access" ON simple_investments;

CREATE POLICY "simple_investments_user_access" ON simple_investments
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "simple_investments_admin_access" ON simple_investments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND (is_admin = true OR role = 'admin')
        )
    );

-- SIMPLE NOTIFICATIONS TABLE
ALTER TABLE simple_notifications ENABLE ROW LEVEL SECURITY;

-- Simple notifications policies
DROP POLICY IF EXISTS "simple_notifications_user_access" ON simple_notifications;
DROP POLICY IF EXISTS "simple_notifications_admin_access" ON simple_notifications;

CREATE POLICY "simple_notifications_user_access" ON simple_notifications
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "simple_notifications_admin_access" ON simple_notifications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND (is_admin = true OR role = 'admin')
        )
    );

-- USER ACTIVITY TABLE
CREATE TABLE IF NOT EXISTS user_activity (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_type text NOT NULL,
    description text,
    metadata jsonb,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;

-- User activity policies
DROP POLICY IF EXISTS "user_activity_user_access" ON user_activity;
DROP POLICY IF EXISTS "user_activity_admin_access" ON user_activity;

CREATE POLICY "user_activity_user_access" ON user_activity
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "user_activity_admin_access" ON user_activity
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND (is_admin = true OR role = 'admin')
        )
    );

-- USER PROFILES TABLE
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- User profiles policies
DROP POLICY IF EXISTS "user_profiles_access" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_user_access" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_admin_access" ON user_profiles;

CREATE POLICY "user_profiles_user_access" ON user_profiles
    FOR ALL USING (id = auth.uid());

CREATE POLICY "user_profiles_admin_access" ON user_profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id = auth.uid() 
            AND (up.is_admin = true OR up.role = 'admin')
        )
    );

-- USERS TABLE (auth.users - read only access)
-- Note: We can't modify auth.users RLS directly, but we can create views if needed

-- =================================================================
-- STEP 3: CREATE HELPER FUNCTIONS FOR ADMIN CHECKS
-- =================================================================

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = user_id 
        AND (is_admin = true OR role = 'admin')
    );
$$;

-- Function to get user role
CREATE OR REPLACE FUNCTION get_user_role(user_id uuid DEFAULT auth.uid())
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT COALESCE(role, 'user') 
    FROM user_profiles 
    WHERE id = user_id;
$$;

-- =================================================================
-- STEP 4: GRANT PERMISSIONS
-- =================================================================

-- Grant access to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant access to service role (for admin functions)
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

COMMIT;

DO $$
BEGIN
    RAISE NOTICE '✅ COMPREHENSIVE RLS POLICIES SETUP COMPLETE!';
    RAISE NOTICE '🔑 Admin user (innercirclelending@gmail.com) configured with proper permissions';
    RAISE NOTICE '🛡️  All tables now have proper Row Level Security policies';
END $$;
