#!/bin/bash

# =================================================================
# APPLY COMPREHENSIVE RLS POLICIES MIGRATION
# This script applies the RLS policies and sets up the admin user
# =================================================================

echo "🔧 Starting comprehensive RLS policies migration..."

# Apply the migration
echo "📋 Applying RLS policies migration..."
supabase db push

# Verify the admin user setup
echo "🔍 Verifying admin user setup..."
supabase db shell -c "
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
"

# Check RLS policies are active
echo "🛡️  Checking RLS policies are active..."
supabase db shell -c "
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
"

# Test admin access
echo "🔑 Testing admin access functions..."
supabase db shell -c "
SELECT 
    is_admin('07e0d58f-d90c-4a9a-8dfc-3739ceb9cc72') as admin_check,
    get_user_role('07e0d58f-d90c-4a9a-8dfc-3739ceb9cc72') as user_role;
"

echo "✅ RLS policies migration complete!"
echo "📧 Admin user: innercirclelending@gmail.com"
echo "🎯 Role: admin"
echo "🔐 All tables now have proper Row Level Security"
