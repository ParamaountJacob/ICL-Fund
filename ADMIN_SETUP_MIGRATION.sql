-- ================================================================
-- ADMIN SETUP MIGRATION - Ensures innercirclelending@gmail.com is admin
-- ================================================================

-- Step 1: Check if user exists in auth.users (this should already exist)
DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- Get the user ID for innercirclelending@gmail.com
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = 'innercirclelending@gmail.com';
    
    IF admin_user_id IS NULL THEN
        RAISE NOTICE '❌ ERROR: User innercirclelending@gmail.com not found in auth.users!';
        RAISE NOTICE '   Please sign up with this email first, then run this migration.';
        RETURN;
    ELSE
        RAISE NOTICE '✅ Found user innercirclelending@gmail.com with ID: %', admin_user_id;
    END IF;
    
    -- Step 2: Ensure user_profiles entry exists with admin privileges
    INSERT INTO user_profiles (
        user_id,
        email,
        first_name,
        last_name,
        role,
        is_admin,
        verification_status,
        created_at,
        updated_at
    ) VALUES (
        admin_user_id,
        'innercirclelending@gmail.com',
        'Inner Circle',
        'Lending',
        'admin',
        true,
        'verified',
        NOW(),
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        email = EXCLUDED.email,
        role = 'admin',
        is_admin = true,
        verification_status = 'verified',
        updated_at = NOW();
    
    RAISE NOTICE '✅ Admin user profile created/updated successfully!';
    
    -- Step 3: Verify the admin setup
    PERFORM 1 FROM user_profiles 
    WHERE user_id = admin_user_id 
    AND role = 'admin' 
    AND is_admin = true;
    
    IF FOUND THEN
        RAISE NOTICE '🎉 ADMIN SETUP COMPLETE!';
        RAISE NOTICE '   Email: innercirclelending@gmail.com';
        RAISE NOTICE '   Role: admin';
        RAISE NOTICE '   Is Admin: true';
        RAISE NOTICE '   Status: verified';
    ELSE
        RAISE NOTICE '❌ ERROR: Admin setup verification failed!';
    END IF;
END;
$$;

-- Step 4: Final verification query
SELECT 
    'FINAL VERIFICATION' as check_type,
    up.user_id,
    up.email,
    up.first_name,
    up.last_name,
    up.role,
    up.is_admin,
    up.verification_status,
    au.email as auth_email,
    au.email_confirmed_at
FROM user_profiles up
JOIN auth.users au ON up.user_id = au.id
WHERE au.email = 'innercirclelending@gmail.com';

-- Step 5: Test the role checking functions
SELECT 
    'FUNCTION TESTS' as test_type,
    (SELECT role FROM user_profiles WHERE email = 'innercirclelending@gmail.com') as profile_role,
    checkUserRole() as check_user_role_result
WHERE EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'innercirclelending@gmail.com' AND id = auth.uid()
);

-- Step 6: Create helper function to always ensure admin status
CREATE OR REPLACE FUNCTION ensure_admin_status()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- Get admin user ID
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = 'innercirclelending@gmail.com';
    
    IF admin_user_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Ensure admin status
    UPDATE user_profiles 
    SET 
        role = 'admin',
        is_admin = true,
        verification_status = 'verified',
        updated_at = NOW()
    WHERE user_id = admin_user_id;
    
    -- If no row was updated, insert it
    IF NOT FOUND THEN
        INSERT INTO user_profiles (
            user_id, email, first_name, last_name, role, is_admin, 
            verification_status, created_at, updated_at
        ) VALUES (
            admin_user_id, 'innercirclelending@gmail.com', 'Inner Circle', 'Lending',
            'admin', true, 'verified', NOW(), NOW()
        );
    END IF;
    
    RETURN TRUE;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION ensure_admin_status() TO authenticated;

-- Run the function once to ensure current state
SELECT ensure_admin_status() as admin_setup_complete;

RAISE NOTICE '';
RAISE NOTICE '🚀 MIGRATION COMPLETE!';
RAISE NOTICE '';
RAISE NOTICE 'What this migration did:';
RAISE NOTICE '1. ✅ Verified innercirclelending@gmail.com exists in auth.users';
RAISE NOTICE '2. ✅ Created/updated user_profiles entry with admin role';
RAISE NOTICE '3. ✅ Set is_admin = true and role = admin';
RAISE NOTICE '4. ✅ Set verification_status = verified';
RAISE NOTICE '5. ✅ Created ensure_admin_status() helper function';
RAISE NOTICE '';
RAISE NOTICE 'Your app should now recognize innercirclelending@gmail.com as admin!';
RAISE NOTICE '';
