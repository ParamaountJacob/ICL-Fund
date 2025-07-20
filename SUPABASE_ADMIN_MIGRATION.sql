-- ================================================================
-- ADMIN SETUP MIGRATION - Supabase SQL Editor Compatible
-- ================================================================

-- Step 1: Ensure admin user profile exists with correct privileges
DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- Get the user ID for innercirclelending@gmail.com
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = 'innercirclelending@gmail.com';
    
    IF admin_user_id IS NULL THEN
        RAISE EXCEPTION 'User innercirclelending@gmail.com not found in auth.users! Please sign up with this email first.';
    END IF;
    
    -- Ensure user_profiles entry exists with admin privileges
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
END;
$$;

-- Step 2: Create helper function to ensure admin status
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

-- Step 3: Grant execute permission
GRANT EXECUTE ON FUNCTION ensure_admin_status() TO authenticated;

-- Step 4: Run the function to ensure current state
SELECT ensure_admin_status() as admin_setup_complete;

-- Step 5: Final verification - this will show the results
SELECT 
    'VERIFICATION' as status,
    up.user_id,
    up.email,
    up.first_name,
    up.last_name,
    up.role,
    up.is_admin,
    up.verification_status,
    au.email_confirmed_at
FROM user_profiles up
JOIN auth.users au ON up.user_id = au.id
WHERE au.email = 'innercirclelending@gmail.com';

-- Step 6: Show success message
SELECT 
    '🎉 ADMIN SETUP COMPLETE!' as message,
    'innercirclelending@gmail.com should now have admin privileges' as details;
