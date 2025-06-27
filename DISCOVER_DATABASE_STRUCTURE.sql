-- DISCOVER YOUR ACTUAL TABLE STRUCTURE
-- Run this first to see what tables and columns actually exist

-- ==============================================================================
-- STEP 1: DISCOVER WHAT TABLES EXIST
-- ==============================================================================

SELECT 'EXISTING TABLES:' as info;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- ==============================================================================
-- STEP 2: DISCOVER COLUMNS IN USER_PROFILES TABLE
-- ==============================================================================

SELECT 'USER_PROFILES COLUMNS:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'user_profiles'
ORDER BY ordinal_position;

-- ==============================================================================
-- STEP 3: CHECK WHAT POLICIES CURRENTLY EXIST
-- ==============================================================================

SELECT 'CURRENT POLICIES:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ==============================================================================
-- STEP 4: CHECK RLS STATUS FOR ALL TABLES
-- ==============================================================================

SELECT 'RLS STATUS:' as info;
SELECT 
    t.table_name,
    CASE 
        WHEN c.relrowsecurity THEN 'ENABLED'
        ELSE 'DISABLED'
    END as rls_status,
    COUNT(p.policyname) as policy_count
FROM information_schema.tables t
LEFT JOIN pg_class c ON c.relname = t.table_name
LEFT JOIN pg_policies p ON p.tablename = t.table_name AND p.schemaname = 'public'
WHERE t.table_schema = 'public' 
AND t.table_type = 'BASE TABLE'
GROUP BY t.table_name, c.relrowsecurity
ORDER BY t.table_name;

-- ==============================================================================
-- STEP 5: CHECK WHAT'S IN YOUR USER_PROFILES TABLE
-- ==============================================================================

SELECT 'CURRENT USER_PROFILES DATA:' as info;
SELECT * FROM public.user_profiles LIMIT 5;

SELECT 'DONE: Now we know your actual table structure!' as result;
