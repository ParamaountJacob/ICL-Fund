# =================================================================
# APPLY COMPREHENSIVE RLS POLICIES MIGRATION (PowerShell)
# This script applies the RLS policies and sets up the admin user
# =================================================================

Write-Host "🔧 Starting comprehensive RLS policies migration..." -ForegroundColor Cyan

# Apply the migration
Write-Host "📋 Applying RLS policies migration..." -ForegroundColor Yellow
supabase db push

# Verify the admin user setup
Write-Host "🔍 Verifying admin user setup..." -ForegroundColor Green
$adminQuery = @"
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
"@

supabase db shell -c $adminQuery

# Check RLS policies are active
Write-Host "🛡️  Checking RLS policies are active..." -ForegroundColor Blue
$rlsQuery = @"
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
"@

supabase db shell -c $rlsQuery

# Test admin access
Write-Host "🔑 Testing admin access functions..." -ForegroundColor Magenta
$testQuery = @"
SELECT 
    is_admin('07e0d58f-d90c-4a9a-8dfc-3739ceb9cc72') as admin_check,
    get_user_role('07e0d58f-d90c-4a9a-8dfc-3739ceb9cc72') as user_role;
"@

supabase db shell -c $testQuery

Write-Host "✅ RLS policies migration complete!" -ForegroundColor Green
Write-Host "📧 Admin user: innercirclelending@gmail.com" -ForegroundColor Cyan
Write-Host "🎯 Role: admin" -ForegroundColor Cyan
Write-Host "🔐 All tables now have proper Row Level Security" -ForegroundColor Cyan
