-- ================================================================
-- QUICK ADMIN FIX - Simple one-liner to set admin status
-- ================================================================

-- If you just want a quick fix, run this single command:

-- Option 1: Update existing user_profiles entry
UPDATE user_profiles 
SET 
    role = 'admin',
    is_admin = true,
    verification_status = 'verified',
    updated_at = NOW()
WHERE email = 'innercirclelending@gmail.com';

-- Option 2: If the above returns 0 rows, create the entry
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
)
SELECT 
    au.id,
    'innercirclelending@gmail.com',
    'Inner Circle',
    'Lending',
    'admin',
    true,
    'verified',
    NOW(),
    NOW()
FROM auth.users au
WHERE au.email = 'innercirclelending@gmail.com'
AND NOT EXISTS (
    SELECT 1 FROM user_profiles up 
    WHERE up.user_id = au.id
);

-- Verification: Check if it worked
SELECT 
    email,
    role,
    is_admin,
    verification_status
FROM user_profiles 
WHERE email = 'innercirclelending@gmail.com';
