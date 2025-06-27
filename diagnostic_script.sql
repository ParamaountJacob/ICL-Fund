-- DIAGNOSTIC SCRIPT - Run this in Supabase SQL Editor to debug the issue
-- This will show us exactly what's in your database

-- Check if simple_applications table exists
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'simple_applications'
) AS simple_applications_exists;

-- Check table structure if it exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'simple_applications'
ORDER BY ordinal_position;

-- Check if old investment_applications table still exists
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'investment_applications'
) AS old_investment_applications_exists;

-- List all functions containing 'user_applications'
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%user_applications%';

-- Test the function directly
SELECT * FROM get_user_applications() LIMIT 1;
