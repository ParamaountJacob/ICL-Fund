-- EMERGENCY DIAGNOSTIC - Run this first to see what's wrong
-- Copy and paste this into Supabase SQL Editor

-- 1. Check if simple_applications table exists
SELECT 
    'simple_applications table exists: ' || 
    CASE WHEN EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'simple_applications'
    ) THEN 'YES' ELSE 'NO' END as table_status;

-- 2. If it exists, show its columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'simple_applications'
ORDER BY ordinal_position;

-- 3. Check what the get_user_applications function actually looks like
SELECT routine_name, routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public' 
AND routine_name = 'get_user_applications'
LIMIT 1;

-- 4. Check if you're set as admin
SELECT id, email, first_name, last_name, role, verification_status
FROM user_profiles 
WHERE email = 'innercirclelending@gmail.com';

-- 5. Check if old investment_applications table still exists
SELECT 
    'old investment_applications table exists: ' || 
    CASE WHEN EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'investment_applications'
    ) THEN 'YES' ELSE 'NO' END as old_table_status;
