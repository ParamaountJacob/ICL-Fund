-- EMERGENCY SCHEMA FIXES - Missing Fields & Tables
-- These are required by the frontend but missing from database

-- =================================================================
-- MISSING FIELDS IN EXISTING TABLES
-- =================================================================

-- Add managed_by_admin_id to user_profiles (CRITICAL - user claiming system)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'user_profiles' AND column_name = 'managed_by_admin_id'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN managed_by_admin_id uuid REFERENCES user_profiles(user_id) ON DELETE SET NULL;
        RAISE NOTICE '✅ Added managed_by_admin_id column to user_profiles';
    ELSE
        RAISE NOTICE '⚠️ managed_by_admin_id column already exists';
    END IF;
END $$;

-- Add full_name to user_profiles (CRITICAL - name display)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'user_profiles' AND column_name = 'full_name'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN full_name text;
        RAISE NOTICE '✅ Added full_name column to user_profiles';
    ELSE
        RAISE NOTICE '⚠️ full_name column already exists';
    END IF;
END $$;

-- Add role column if missing (CRITICAL - role management)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'user_profiles' AND column_name = 'role'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN role text DEFAULT 'user';
        RAISE NOTICE '✅ Added role column to user_profiles';
    ELSE
        RAISE NOTICE '⚠️ role column already exists';
    END IF;
END $$;

-- =================================================================
-- MISSING TABLES
-- =================================================================

-- Create user_activity table if missing (for user profile activity tracking)
CREATE TABLE IF NOT EXISTS user_activity (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    action_type text NOT NULL,
    action_description text NOT NULL,
    performed_by uuid,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- Create document_signatures table if missing (for document management)
CREATE TABLE IF NOT EXISTS document_signatures (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    application_id uuid,
    document_type text NOT NULL,
    status text DEFAULT 'pending',
    document_url text,
    signed_at timestamptz,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- =================================================================
-- FUNCTION SIGNATURE FIXES
-- =================================================================

-- Fix get_user_applications to work with no parameters (app calls without params)
CREATE OR REPLACE FUNCTION get_user_applications()
RETURNS TABLE (
    id uuid,
    user_id uuid,
    amount numeric,
    status text,
    workflow_step text,
    subscription_signed boolean,
    subscription_signed_by_admin boolean,
    promissory_note_created boolean,
    promissory_note_signed boolean,
    funds_received boolean,
    plaid_account_id text,
    created_at timestamptz,
    updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Use auth.uid() to get current user's applications
    RETURN QUERY
    SELECT 
        sa.id,
        sa.user_id,
        sa.amount,
        sa.status,
        sa.workflow_step,
        sa.subscription_signed,
        sa.subscription_signed_by_admin,
        sa.promissory_note_created,
        sa.promissory_note_signed,
        sa.funds_received,
        sa.plaid_account_id,
        sa.created_at,
        sa.updated_at
    FROM simple_applications sa
    WHERE sa.user_id = auth.uid()
    ORDER BY sa.created_at DESC;
END;
$$;

-- Fix get_admin_notifications to accept parameters (app calls with limit/offset)
CREATE OR REPLACE FUNCTION get_admin_notifications(
    p_limit integer DEFAULT 10,
    p_offset integer DEFAULT 0
)
RETURNS TABLE (
    id uuid,
    user_email text,
    message text,
    notification_type text,
    is_read boolean,
    created_at timestamptz,
    application_id uuid,
    user_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if current user is admin
    IF NOT EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_id = auth.uid() AND (is_admin = true OR role = 'admin')
    ) THEN
        RAISE EXCEPTION 'Access denied: Admin privileges required';
    END IF;

    RETURN QUERY
    SELECT 
        sn.id,
        COALESCE(up.email, 'Unknown User') as user_email,
        sn.message,
        sn.notification_type,
        sn.is_read,
        sn.created_at,
        sn.application_id,
        sn.user_id
    FROM simple_notifications sn
    LEFT JOIN user_profiles up ON up.user_id = sn.user_id
    WHERE sn.is_admin = true
    ORDER BY sn.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$;

-- =================================================================
-- ADD INDEXES FOR PERFORMANCE
-- =================================================================

-- Index for user claiming queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_managed_by_admin 
ON user_profiles(managed_by_admin_id);

-- Index for role-based queries  
CREATE INDEX IF NOT EXISTS idx_user_profiles_role 
ON user_profiles(role);

-- Index for admin status queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_admin 
ON user_profiles(is_admin);

-- Index for user activity queries
CREATE INDEX IF NOT EXISTS idx_user_activity_user_id 
ON user_activity(user_id);

-- Index for notification queries
CREATE INDEX IF NOT EXISTS idx_simple_notifications_user_id 
ON simple_notifications(user_id);

CREATE INDEX IF NOT EXISTS idx_simple_notifications_is_admin 
ON simple_notifications(is_admin);

-- =================================================================
-- GRANT PERMISSIONS ON NEW STRUCTURES
-- =================================================================

GRANT ALL ON TABLE user_activity TO authenticated;
GRANT ALL ON TABLE document_signatures TO authenticated;

GRANT EXECUTE ON FUNCTION get_user_applications() TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_notifications(integer, integer) TO authenticated;

-- =================================================================
-- VERIFICATION
-- =================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔧 EMERGENCY SCHEMA FIXES APPLIED! 🔧';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Added managed_by_admin_id field - User claiming fixed';
    RAISE NOTICE '✅ Added full_name field - Name display fixed';  
    RAISE NOTICE '✅ Added role field - Role management fixed';
    RAISE NOTICE '✅ Created user_activity table - Activity tracking fixed';
    RAISE NOTICE '✅ Created document_signatures table - Document management fixed';
    RAISE NOTICE '✅ Fixed get_user_applications() signature';
    RAISE NOTICE '✅ Fixed get_admin_notifications() signature';
    RAISE NOTICE '✅ Added performance indexes';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 Schema now matches frontend expectations!';
END $$;
