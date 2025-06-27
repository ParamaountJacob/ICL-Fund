-- =================================================================
-- MANUAL APPLICATION SCRIPT FOR SUPABASE DASHBOARD (IDEMPOTENT)
-- Copy and paste the migrations into your Supabase SQL Editor one by one
-- THESE MIGRATIONS ARE 100% SAFE TO RUN MULTIPLE TIMES
-- =================================================================

-- STEP 1: Apply comprehensive RLS policies (IDEMPOTENT VERSION)
-- Copy the entire content of: 20250627170000_comprehensive_rls_policies_idempotent.sql
-- Paste into Supabase SQL Editor and run
-- ✅ Safe to run multiple times - will skip existing objects

-- STEP 2: Apply database cleanup (IDEMPOTENT VERSION)
-- Copy the entire content of: 20250627170001_database_cleanup_idempotent.sql
-- Paste into Supabase SQL Editor and run
-- ✅ Safe to run multiple times - will only clean up problematic data

-- STEP 3: Verify admin user setup
SELECT 
    up.id,
    up.email,
    up.first_name,
    up.last_name,
    up.role,
    up.is_admin,
    up.is_verified,
    up.verification_status
FROM user_profiles up 
WHERE up.email = 'innercirclelending@gmail.com';

-- STEP 4: Check RLS policies are active
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = t.tablename) as policy_count
FROM pg_tables t 
WHERE schemaname = 'public' 
AND tablename IN (
    'admin_actions', 'admin_notifications', 'consultation_requests',
    'crm_activities', 'crm_leads', 'document_requests', 'document_signatures',
    'documents', 'funding_sources', 'investment_applications', 'investment_documents',
    'investments', 'messages', 'newsletter_subscribers', 'onboarding_steps',
    'payments', 'simple_applications', 'simple_investments', 'simple_notifications',
    'user_activity', 'user_profiles'
)
ORDER BY tablename;

-- STEP 5: Test admin access functions
SELECT 
    is_admin('07e0d58f-d90c-4a9a-8dfc-3739ceb9cc72') as admin_check,
    get_user_role('07e0d58f-d90c-4a9a-8dfc-3739ceb9cc72') as user_role;

-- =================================================================
-- EXPECTED RESULTS:
-- =================================================================
-- Admin user should show:
-- - email: innercirclelending@gmail.com  
-- - first_name: Inner Circle
-- - last_name: Lending
-- - role: admin
-- - is_admin: true
-- - is_verified: true
-- - verification_status: verified

-- All tables should show:
-- - rowsecurity: true
-- - policy_count: 2 or more (user and admin policies)

-- Admin functions should show:
-- - admin_check: true
-- - user_role: admin
-- =================================================================
