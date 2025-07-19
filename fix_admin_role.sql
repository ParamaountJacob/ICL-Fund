-- Fix Admin Role for innercirclelending@gmail.com
-- Run this in Supabase SQL Editor

-- First, check if the user exists in auth.users
SELECT 'Checking auth user:' as step;
SELECT id, email FROM auth.users WHERE email = 'innercirclelending@gmail.com';

-- Check current profile
SELECT 'Current profile:' as step;
SELECT user_id, email, first_name, last_name, role, is_admin FROM user_profiles WHERE email = 'innercirclelending@gmail.com';

-- Update or insert the admin profile
INSERT INTO user_profiles (
    user_id, 
    email, 
    first_name, 
    last_name, 
    role, 
    is_admin,
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
    now(),
    now()
FROM auth.users au 
WHERE au.email = 'innercirclelending@gmail.com'
ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    is_admin = EXCLUDED.is_admin,
    updated_at = now();

-- Verify the fix
SELECT 'Verification:' as step;
SELECT user_id, email, first_name, last_name, role, is_admin FROM user_profiles WHERE email = 'innercirclelending@gmail.com';

SELECT 'SUCCESS: Admin role should now be properly set!' as result;
