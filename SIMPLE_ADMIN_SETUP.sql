-- ================================================================
-- SIMPLE ADMIN SETUP - Works with existing table structure
-- ================================================================

-- Step 1: Just update the role column (remove is_admin reference)
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
    
    -- Create or update user profile with admin role (no is_admin column)
    INSERT INTO user_profiles (
        user_id,
        email,
        first_name,
        last_name,
        role,
        verification_status,
        created_at,
        updated_at
    ) VALUES (
        admin_user_id,
        'innercirclelending@gmail.com',
        'Inner Circle',
        'Lending',
        'admin',
        'verified',
        NOW(),
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        email = EXCLUDED.email,
        role = 'admin',
        verification_status = 'verified',
        updated_at = NOW();
END;
$$;

-- Step 2: Verify the setup
SELECT 
    'VERIFICATION' as status,
    up.user_id,
    up.email,
    up.first_name,
    up.last_name,
    up.role,
    up.verification_status,
    au.email_confirmed_at
FROM user_profiles up
JOIN auth.users au ON up.user_id = au.id
WHERE au.email = 'innercirclelending@gmail.com';

-- Step 3: Show success message
SELECT 
    '✅ ADMIN SETUP COMPLETE!' as message,
    'Role should now be set to admin' as details;
