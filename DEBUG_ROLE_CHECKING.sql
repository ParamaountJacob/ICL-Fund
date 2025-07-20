-- Debug script to understand role checking issues
-- Run this in Supabase SQL Editor

-- 1. Check if innercirclelending@gmail.com exists in auth.users
SELECT 
    'AUTH USERS CHECK' as check_type,
    id,
    email,
    created_at
FROM auth.users 
WHERE email = 'innercirclelending@gmail.com';

-- 2. Check if there's a corresponding user_profiles entry
SELECT 
    'USER PROFILES CHECK' as check_type,
    user_id,
    email,
    first_name,
    last_name,
    role,
    is_admin,
    created_at
FROM user_profiles 
WHERE email = 'innercirclelending@gmail.com';

-- 3. Check all user_profiles entries to see what exists
SELECT 
    'ALL USER PROFILES' as check_type,
    user_id,
    email,
    role,
    is_admin
FROM user_profiles 
ORDER BY created_at DESC
LIMIT 10;

-- 4. If no user_profiles entry exists, let's create one
-- This INSERT will only run if the user doesn't already exist
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
    au.email,
    'Inner Circle',
    'Lending',
    'admin',
    true,
    now(),
    now()
FROM auth.users au
WHERE au.email = 'innercirclelending@gmail.com'
AND NOT EXISTS (
    SELECT 1 FROM user_profiles up 
    WHERE up.user_id = au.id
);

-- 5. Final verification - check the role after insert
SELECT 
    'FINAL VERIFICATION' as check_type,
    up.user_id,
    up.email,
    up.role,
    up.is_admin,
    au.email as auth_email
FROM user_profiles up
JOIN auth.users au ON up.user_id = au.id
WHERE au.email = 'innercirclelending@gmail.com';
