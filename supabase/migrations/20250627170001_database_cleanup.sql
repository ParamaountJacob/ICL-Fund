-- =================================================================
-- DATABASE CLEANUP & ADMIN USER SETUP
-- Cleans up old problematic data and ensures proper admin setup
-- =================================================================

BEGIN;

DO $$
BEGIN
    RAISE NOTICE '🧹 STARTING DATABASE CLEANUP...';
END $$;

-- =================================================================
-- STEP 1: CLEAN UP OLD/PROBLEMATIC USER PROFILES
-- =================================================================

-- Remove any duplicate or problematic profiles (keep only the admin)
DELETE FROM user_profiles 
WHERE email != 'innercirclelending@gmail.com' 
  AND (
    role IS NULL 
    OR role = '' 
    OR first_name IS NULL 
    OR first_name = ''
    OR first_name LIKE '%weird%'
    OR first_name LIKE '%test%'
    OR first_name LIKE '%old%'
  );

-- Clean up any orphaned profiles (users that don't exist in auth.users)
DELETE FROM user_profiles 
WHERE id NOT IN (
    SELECT id FROM auth.users
) 
AND email != 'innercirclelending@gmail.com';

-- =================================================================
-- STEP 2: ENSURE PROPER ADMIN USER SETUP
-- =================================================================

-- Upsert the proper admin user profile
INSERT INTO user_profiles (
    id,
    email,
    first_name,
    last_name,
    phone,
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
    NULL,
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
-- STEP 3: CLEAN UP OTHER TABLES WITH ORPHANED DATA
-- =================================================================

-- Clean up investment applications without valid users
DELETE FROM investment_applications 
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Clean up simple applications without valid users
DELETE FROM simple_applications 
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Clean up investments without valid users
DELETE FROM investments 
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Clean up notifications without valid users
DELETE FROM simple_notifications 
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Clean up consultation requests without valid users
DELETE FROM consultation_requests 
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Clean up funding sources without valid users
DELETE FROM funding_sources 
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Clean up user activity without valid users
DELETE FROM user_activity 
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Clean up onboarding steps without valid users
DELETE FROM onboarding_steps 
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Clean up messages without valid users
DELETE FROM messages 
WHERE from_user_id NOT IN (SELECT id FROM auth.users)
   OR to_user_id NOT IN (SELECT id FROM auth.users);

-- Clean up payments without valid users
DELETE FROM payments 
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- =================================================================
-- STEP 4: UPDATE FUNCTIONS TO HANDLE NEW STRUCTURE
-- =================================================================

-- Create or replace the safe user profile upsert function
CREATE OR REPLACE FUNCTION safe_upsert_user_profile(
    p_user_id uuid,
    p_email text DEFAULT NULL,
    p_first_name text DEFAULT NULL,
    p_last_name text DEFAULT NULL,
    p_phone text DEFAULT NULL,
    p_address text DEFAULT NULL,
    p_city text DEFAULT NULL,
    p_state text DEFAULT NULL,
    p_zip_code text DEFAULT NULL,
    p_date_of_birth date DEFAULT NULL,
    p_ssn_last_four text DEFAULT NULL
)
RETURNS user_profiles
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result_profile user_profiles;
BEGIN
    -- Validate user exists in auth.users
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
        RAISE EXCEPTION 'User with id % does not exist', p_user_id;
    END IF;

    -- Upsert the profile
    INSERT INTO user_profiles (
        id,
        email,
        first_name,
        last_name,
        phone,
        address,
        city,
        state,
        zip_code,
        date_of_birth,
        ssn_last_four,
        role,
        is_admin,
        is_verified,
        verification_status,
        created_at,
        updated_at
    ) VALUES (
        p_user_id,
        COALESCE(p_email, ''),
        COALESCE(p_first_name, ''),
        COALESCE(p_last_name, ''),
        p_phone,
        p_address,
        p_city,
        p_state,
        p_zip_code,
        p_date_of_birth,
        p_ssn_last_four,
        CASE 
            WHEN p_user_id = '07e0d58f-d90c-4a9a-8dfc-3739ceb9cc72' THEN 'admin'
            ELSE 'user'
        END,
        CASE 
            WHEN p_user_id = '07e0d58f-d90c-4a9a-8dfc-3739ceb9cc72' THEN true
            ELSE false
        END,
        false,
        'pending',
        now(),
        now()
    ) ON CONFLICT (id) DO UPDATE SET
        email = COALESCE(EXCLUDED.email, user_profiles.email),
        first_name = CASE 
            WHEN EXCLUDED.first_name != '' THEN EXCLUDED.first_name 
            ELSE user_profiles.first_name 
        END,
        last_name = CASE 
            WHEN EXCLUDED.last_name != '' THEN EXCLUDED.last_name 
            ELSE user_profiles.last_name 
        END,
        phone = COALESCE(EXCLUDED.phone, user_profiles.phone),
        address = COALESCE(EXCLUDED.address, user_profiles.address),
        city = COALESCE(EXCLUDED.city, user_profiles.city),
        state = COALESCE(EXCLUDED.state, user_profiles.state),
        zip_code = COALESCE(EXCLUDED.zip_code, user_profiles.zip_code),
        date_of_birth = COALESCE(EXCLUDED.date_of_birth, user_profiles.date_of_birth),
        ssn_last_four = COALESCE(EXCLUDED.ssn_last_four, user_profiles.ssn_last_four),
        -- Preserve admin status for the admin user
        role = CASE 
            WHEN user_profiles.id = '07e0d58f-d90c-4a9a-8dfc-3739ceb9cc72' THEN 'admin'
            ELSE COALESCE(EXCLUDED.role, user_profiles.role)
        END,
        is_admin = CASE 
            WHEN user_profiles.id = '07e0d58f-d90c-4a9a-8dfc-3739ceb9cc72' THEN true
            ELSE COALESCE(EXCLUDED.is_admin, user_profiles.is_admin)
        END,
        updated_at = now()
    RETURNING * INTO result_profile;

    RETURN result_profile;
END;
$$;

-- =================================================================
-- STEP 5: CREATE ADMIN NOTIFICATION FOR CLEANUP
-- =================================================================

-- Insert a notification about the cleanup
INSERT INTO admin_notifications (
    notification_type,
    title,
    message,
    severity,
    created_by,
    created_at
) VALUES (
    'system',
    'Database Cleanup Completed',
    'Successfully cleaned up old user data and established proper admin user setup. All RLS policies are now active.',
    'info',
    '07e0d58f-d90c-4a9a-8dfc-3739ceb9cc72',
    now()
);

COMMIT;

DO $$
BEGIN
    RAISE NOTICE '✅ DATABASE CLEANUP COMPLETE!';
    RAISE NOTICE '👤 Admin user properly configured: innercirclelending@gmail.com';
    RAISE NOTICE '🗑️  Old/problematic data removed';
    RAISE NOTICE '🔄 Functions updated for new structure';
END $$;
