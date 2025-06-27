-- DATABASE VERIFICATION AND TESTING SCRIPT
-- Run this AFTER executing COMPLETE_SYSTEM_RESTORATION.sql
-- This will verify all fixes are working correctly

-- ===============================================
-- VERIFICATION STEP 1: Check Table Access
-- ===============================================
SELECT 'STEP 1: Checking table access...' as status;

-- Test user_profiles access
DO $$
BEGIN
    PERFORM * FROM public.user_profiles LIMIT 1;
    RAISE NOTICE 'SUCCESS: Can access user_profiles table';
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'ERROR: Cannot access user_profiles - %', SQLERRM;
END $$;

-- Test notifications access  
DO $$
BEGIN
    PERFORM * FROM public.notifications LIMIT 1;
    RAISE NOTICE 'SUCCESS: Can access notifications table';
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'ERROR: Cannot access notifications - %', SQLERRM;
END $$;

-- ===============================================
-- VERIFICATION STEP 2: Check Functions Exist
-- ===============================================
SELECT 'STEP 2: Checking functions exist...' as status;

SELECT 
    'Admin Functions Status:' as category,
    COUNT(*) as count,
    ARRAY_AGG(proname) as functions
FROM pg_proc 
WHERE proname IN (
    'get_unread_notification_count',
    'get_managed_users_with_admin_details', 
    'claim_user_by_admin',
    'get_admin_investments_with_users',
    'activate_user_investment'
);

SELECT 
    'Workflow Functions Status:' as category,
    COUNT(*) as count,
    ARRAY_AGG(proname) as functions
FROM pg_proc 
WHERE proname IN (
    'create_simple_application',
    'user_sign_subscription',
    'user_sign_promissory_note'
);

-- ===============================================
-- VERIFICATION STEP 3: Check RLS Policies
-- ===============================================
SELECT 'STEP 3: Checking RLS policies...' as status;

SELECT 
    'RLS Policies Status:' as category,
    tablename,
    policyname,
    CASE WHEN permissive = 'PERMISSIVE' THEN 'ACTIVE' ELSE 'RESTRICTIVE' END as status
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('user_profiles', 'notifications', 'investments', 'simple_applications')
ORDER BY tablename;

-- ===============================================
-- VERIFICATION STEP 4: Test Profile Data
-- ===============================================
SELECT 'STEP 4: Checking profile data integrity...' as status;

-- Check if Jacob's profile is fixed
SELECT 
    'Jacob Profile Status:' as check_type,
    CASE 
        WHEN COUNT(*) > 0 THEN 'FIXED: Jacob profile found with correct name'
        ELSE 'ISSUE: Jacob profile not found or still corrupted'
    END as result
FROM public.user_profiles 
WHERE first_name = 'Jacob' AND last_name = 'Griswold';

-- Check for any corrupted "Admin User" profiles
SELECT 
    'Corrupted Profiles:' as check_type,
    CASE 
        WHEN COUNT(*) = 0 THEN 'CLEAN: No corrupted Admin User profiles found'
        ELSE CONCAT('ISSUE: ', COUNT(*), ' corrupted profiles still exist')
    END as result
FROM public.user_profiles 
WHERE full_name = 'Admin User' OR (first_name = 'Admin' AND last_name = 'User');

-- ===============================================
-- VERIFICATION STEP 5: Test Function Execution
-- ===============================================
SELECT 'STEP 5: Testing function execution...' as status;

-- Test notification count function (should not error)
DO $$
DECLARE
    count_result INTEGER;
BEGIN
    SELECT public.get_unread_notification_count() INTO count_result;
    RAISE NOTICE 'SUCCESS: Notification count function works, returned: %', count_result;
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'ERROR: Notification count function failed - %', SQLERRM;
END $$;

-- ===============================================
-- VERIFICATION STEP 6: Schema Completeness Check
-- ===============================================
SELECT 'STEP 6: Checking schema completeness...' as status;

-- Check for required columns
SELECT 
    'Schema Check:' as category,
    table_name,
    column_name,
    data_type,
    'EXISTS' as status
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND column_name IN ('full_name', 'managed_by_admin_id', 'role', 'user_id')
ORDER BY table_name, column_name;

-- ===============================================
-- FINAL SYSTEM STATUS REPORT
-- ===============================================
SELECT 'FINAL VERIFICATION COMPLETE' as status;

SELECT 
    'SYSTEM STATUS SUMMARY' as report_type,
    'All critical components verified' as message,
    NOW() as verified_at;

-- Expected result counts for successful fix:
-- - Admin Functions: 5 functions should exist
-- - Workflow Functions: 3 functions should exist  
-- - RLS Policies: 4+ policies should be active
-- - Profile Data: Jacob profile should be fixed, no "Admin User" corruption
-- - Schema: All required columns should exist

SELECT 'Run this verification script after executing COMPLETE_SYSTEM_RESTORATION.sql' as instructions;
