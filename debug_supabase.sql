-- SUPABASE USER CREATION DEBUG QUERIES
-- Run these in your Supabase SQL Editor to diagnose the issue

-- 1. Check if auth.users table is accessible
SELECT COUNT(*) as user_count FROM auth.users;

-- 2. Check user_profiles table structure and RLS
SELECT schemaname, tablename, tableowner
FROM pg_tables 
WHERE tablename = 'user_profiles';

-- 2b. Check RLS status specifically
SELECT c.relname as table_name, c.relrowsecurity as rls_enabled
FROM pg_class c
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE c.relname = 'user_profiles' AND n.nspname = 'public';

-- 3. Check for triggers on user_profiles that might be failing
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'user_profiles';

-- 4. Check RLS policies on user_profiles
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'user_profiles';

-- 5. Try to manually insert a test user profile (this will show the exact error)
-- FIRST get your user ID: 
-- SELECT id FROM auth.users LIMIT 1;

-- Then try (replace 'your-user-id' with actual ID):
-- INSERT INTO user_profiles (user_id, first_name, last_name) 
-- VALUES ('your-user-id', 'Test', 'User');

-- 6. Check database size and limits
SELECT 
    pg_size_pretty(pg_database_size(current_database())) as database_size,
    pg_size_pretty(pg_total_relation_size('user_profiles')) as user_profiles_size;

-- 7. Check for any custom functions that might be failing during user creation
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%user%';
