-- =================================================================
-- COMPREHENSIVE DATABASE RESTORATION MIGRATION - FIXED
-- Creates all missing functions and tables needed by the codebase
-- Timestamp: July 2, 2025 - COMPLETE SYSTEM SETUP - NO UNICODE
-- =================================================================

-- =================================================================
-- STEP 1: UPDATE PROFILES TABLE FIRST (BEFORE REFERENCING COLUMNS)
-- =================================================================

-- Add admin-related columns if they don't exist
DO $$
BEGIN
    -- Add role column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'role') THEN
        ALTER TABLE profiles ADD COLUMN role text DEFAULT 'user';
        RAISE NOTICE 'Added role column to profiles table';
    ELSE
        RAISE NOTICE 'Role column already exists in profiles table';
    END IF;
    
    -- Add email column if it doesn't exist (for admin functions)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'email') THEN
        ALTER TABLE profiles ADD COLUMN email text;
        RAISE NOTICE 'Added email column to profiles table';
    ELSE
        RAISE NOTICE 'Email column already exists in profiles table';
    END IF;
END $$;

-- =================================================================
-- STEP 2: CREATE MISSING TABLES FOR SIMPLIFIED WORKFLOW
-- =================================================================

-- Create tables with proper idempotent checks
DO $$
BEGIN
    -- Simplified applications table (core investment workflow)
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'simple_applications') THEN
        CREATE TABLE simple_applications (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
            amount numeric(15,2) NOT NULL,
            annual_percentage numeric(5,2) DEFAULT 5.0,
            term_years integer DEFAULT 5,
            status text DEFAULT 'application_submitted',
            workflow_step text DEFAULT 'subscription_pending',
            subscription_signed boolean DEFAULT false,
            subscription_signed_by_admin boolean DEFAULT false,
            promissory_note_created boolean DEFAULT false,
            promissory_note_signed boolean DEFAULT false,
            funds_received boolean DEFAULT false,
            plaid_account_id text,
            notes text,
            created_at timestamptz DEFAULT now(),
            updated_at timestamptz DEFAULT now()
        );
        RAISE NOTICE 'Created simple_applications table';
    ELSE
        RAISE NOTICE 'Table simple_applications already exists, skipping creation';
    END IF;

    -- Simplified notifications table
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'simple_notifications') THEN
        CREATE TABLE simple_notifications (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
            notification_type text NOT NULL,
            title text NOT NULL,
            message text NOT NULL,
            is_admin boolean DEFAULT false,
            is_read boolean DEFAULT false,
            application_id uuid REFERENCES simple_applications(id) ON DELETE CASCADE,
            created_at timestamptz DEFAULT now()
        );
        RAISE NOTICE 'Created simple_notifications table';
    ELSE
        RAISE NOTICE 'Table simple_notifications already exists, skipping creation';
    END IF;

    -- User activity tracking (for profile modal)
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_activity') THEN
        CREATE TABLE user_activity (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
            action_type text NOT NULL,
            action_description text NOT NULL,
            metadata jsonb DEFAULT '{}',
            created_at timestamptz DEFAULT now()
        );
        RAISE NOTICE 'Created user_activity table';
    ELSE
        RAISE NOTICE 'Table user_activity already exists, skipping creation';
    END IF;

    -- Document signatures table
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'document_signatures') THEN
        CREATE TABLE document_signatures (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
            application_id uuid REFERENCES simple_applications(id) ON DELETE CASCADE,
            document_type text NOT NULL,
            status text DEFAULT 'pending',
            signed_at timestamptz,
            created_at timestamptz DEFAULT now()
        );
        RAISE NOTICE 'Created document_signatures table';
    ELSE
        RAISE NOTICE 'Table document_signatures already exists, skipping creation';
    END IF;

    -- Contact submissions table (for contact form)
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contact_submissions') THEN
        CREATE TABLE contact_submissions (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            name text NOT NULL,
            email text NOT NULL,
            phone text,
            subject text,
            message text NOT NULL,
            created_at timestamptz DEFAULT now()
        );
        RAISE NOTICE 'Created contact_submissions table';
    ELSE
        RAISE NOTICE 'Table contact_submissions already exists, skipping creation';
    END IF;
END $$;

-- =================================================================
-- STEP 3: ENABLE ROW LEVEL SECURITY
-- =================================================================

DO $$
BEGIN
    -- Enable RLS on all tables
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'simple_applications' AND rowsecurity = true) THEN
        ALTER TABLE simple_applications ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Enabled RLS on simple_applications';
    ELSE
        RAISE NOTICE 'RLS already enabled on simple_applications';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'simple_notifications' AND rowsecurity = true) THEN
        ALTER TABLE simple_notifications ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Enabled RLS on simple_notifications';
    ELSE
        RAISE NOTICE 'RLS already enabled on simple_notifications';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_activity' AND rowsecurity = true) THEN
        ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Enabled RLS on user_activity';
    ELSE
        RAISE NOTICE 'RLS already enabled on user_activity';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'document_signatures' AND rowsecurity = true) THEN
        ALTER TABLE document_signatures ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Enabled RLS on document_signatures';
    ELSE
        RAISE NOTICE 'RLS already enabled on document_signatures';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'contact_submissions' AND rowsecurity = true) THEN
        ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Enabled RLS on contact_submissions';
    ELSE
        RAISE NOTICE 'RLS already enabled on contact_submissions';
    END IF;
END $$;

-- =================================================================
-- STEP 4: CREATE RLS POLICIES
-- =================================================================

-- Simple applications policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'simple_applications_user_access' AND tablename = 'simple_applications') THEN
        CREATE POLICY simple_applications_user_access ON simple_applications
            FOR ALL USING (
                user_id = auth.uid() OR 
                EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
            );
        RAISE NOTICE 'Created simple_applications_user_access policy';
    ELSE
        RAISE NOTICE 'Policy simple_applications_user_access already exists';
    END IF;
END $$;

-- Simple notifications policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'simple_notifications_user_access' AND tablename = 'simple_notifications') THEN
        CREATE POLICY simple_notifications_user_access ON simple_notifications
            FOR ALL USING (
                user_id = auth.uid() OR 
                EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
            );
        RAISE NOTICE 'Created simple_notifications_user_access policy';
    ELSE
        RAISE NOTICE 'Policy simple_notifications_user_access already exists';
    END IF;
END $$;

-- User activity policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'user_activity_access' AND tablename = 'user_activity') THEN
        CREATE POLICY user_activity_access ON user_activity
            FOR ALL USING (
                user_id = auth.uid() OR 
                EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
            );
        RAISE NOTICE 'Created user_activity_access policy';
    ELSE
        RAISE NOTICE 'Policy user_activity_access already exists';
    END IF;
END $$;

-- Document signatures policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'document_signatures_access' AND tablename = 'document_signatures') THEN
        CREATE POLICY document_signatures_access ON document_signatures
            FOR ALL USING (
                user_id = auth.uid() OR 
                EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
            );
        RAISE NOTICE 'Created document_signatures_access policy';
    ELSE
        RAISE NOTICE 'Policy document_signatures_access already exists';
    END IF;
END $$;

-- Contact submissions policies (admin only read, anyone can insert)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'contact_submissions_admin_access' AND tablename = 'contact_submissions') THEN
        CREATE POLICY contact_submissions_admin_access ON contact_submissions
            FOR SELECT USING (
                EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
            );
        RAISE NOTICE 'Created contact_submissions_admin_access policy';
    ELSE
        RAISE NOTICE 'Policy contact_submissions_admin_access already exists';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'contact_submissions_insert' AND tablename = 'contact_submissions') THEN
        CREATE POLICY contact_submissions_insert ON contact_submissions
            FOR INSERT WITH CHECK (true);
        RAISE NOTICE 'Created contact_submissions_insert policy';
    ELSE
        RAISE NOTICE 'Policy contact_submissions_insert already exists';
    END IF;
END $$;

-- =================================================================
-- STEP 5: GRANT PERMISSIONS
-- =================================================================

-- Grant table permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON simple_applications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON simple_notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_activity TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON document_signatures TO authenticated;
GRANT SELECT, INSERT ON contact_submissions TO authenticated;
GRANT SELECT ON contact_submissions TO anon;

-- =================================================================
-- STEP 6: CREATE ESSENTIAL FUNCTIONS
-- =================================================================

-- Admin check function (idempotent)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND (role = 'admin' OR email = 'innercirclelending@gmail.com')
    );
END;
$$;

-- Safe profile upsert function (idempotent)
CREATE OR REPLACE FUNCTION safe_upsert_user_profile(
    user_id uuid,
    user_email text DEFAULT NULL,
    user_first_name text DEFAULT NULL,
    user_last_name text DEFAULT NULL,
    user_phone text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    profile_id uuid;
BEGIN
    INSERT INTO profiles (id, email, first_name, last_name, phone, created_at, updated_at)
    VALUES (
        user_id,
        COALESCE(user_email, ''),
        COALESCE(user_first_name, ''),
        COALESCE(user_last_name, ''),
        COALESCE(user_phone, ''),
        now(),
        now()
    )
    ON CONFLICT (id) 
    DO UPDATE SET
        email = COALESCE(EXCLUDED.email, profiles.email),
        first_name = COALESCE(EXCLUDED.first_name, profiles.first_name),
        last_name = COALESCE(EXCLUDED.last_name, profiles.last_name),
        phone = COALESCE(EXCLUDED.phone, profiles.phone),
        updated_at = now()
    RETURNING id INTO profile_id;

    RETURN profile_id;
END;
$$;

-- User registration trigger function (idempotent)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Create profile for new user
    PERFORM safe_upsert_user_profile(
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'first_name',
        NEW.raw_user_meta_data->>'last_name',
        NEW.raw_user_meta_data->>'phone'
    );
    
    RETURN NEW;
END;
$$;

-- Create trigger for new user registration (idempotent)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
        CREATE TRIGGER on_auth_user_created
            AFTER INSERT ON auth.users
            FOR EACH ROW EXECUTE FUNCTION handle_new_user();
        RAISE NOTICE 'Created user registration trigger';
    ELSE
        RAISE NOTICE 'User registration trigger already exists';
    END IF;
END $$;

-- Grant function permissions
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION safe_upsert_user_profile(uuid, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION handle_new_user() TO authenticated;

-- Final success message
DO $$
BEGIN
    RAISE NOTICE 'COMPREHENSIVE RESTORATION MIGRATION COMPLETED SUCCESSFULLY';
    RAISE NOTICE 'All tables, policies, and functions have been created or verified';
    RAISE NOTICE 'Database is ready for full application functionality';
END $$;
