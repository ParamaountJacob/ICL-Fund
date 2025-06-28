-- =====================================================
-- DATABASE CLEANUP - Remove Investment Workflow Functions
-- =====================================================
-- This script removes all complex investment workflow functions
-- while preserving essential authentication and contact features

-- Drop investment workflow functions
DROP FUNCTION IF EXISTS activate_investment(uuid);
DROP FUNCTION IF EXISTS admin_complete_setup(uuid);
DROP FUNCTION IF EXISTS admin_confirm_funds(uuid);
DROP FUNCTION IF EXISTS admin_create_promissory_note(uuid, uuid);
DROP FUNCTION IF EXISTS admin_sign_subscription_agreement(uuid);
DROP FUNCTION IF EXISTS create_investment_application();

-- Drop admin and notification functions
DROP FUNCTION IF EXISTS get_admin_notifications();
DROP FUNCTION IF EXISTS get_all_users();
DROP FUNCTION IF EXISTS get_user_notifications(uuid);
DROP FUNCTION IF EXISTS mark_notification_read(uuid);
DROP FUNCTION IF EXISTS mark_simple_notification_read(uuid);
DROP FUNCTION IF EXISTS send_admin_notification();

-- Drop document management functions
DROP FUNCTION IF EXISTS get_latest_user_documents(uuid);

-- Drop investment application functions
DROP FUNCTION IF EXISTS get_user_active_application();
DROP FUNCTION IF EXISTS get_user_applications(uuid);
DROP FUNCTION IF EXISTS get_user_applications();
DROP FUNCTION IF EXISTS submit_subscription_agreement(uuid, numeric, numeric, integer);

-- Drop user management functions (keep profile upsert)
DROP FUNCTION IF EXISTS set_user_role(uuid, text);
DROP FUNCTION IF EXISTS update_user_metadata(text, text);
DROP FUNCTION IF EXISTS update_user_verification(uuid, text);

-- Drop Plaid integration functions
DROP FUNCTION IF EXISTS user_connect_plaid(uuid, text);

-- Drop promissory note functions
DROP FUNCTION IF EXISTS user_sign_promissory_note(uuid);

-- =====================================================
-- TABLES TO CONSIDER DROPPING
-- =====================================================
-- You may also want to drop these tables if they exist:

-- Investment workflow tables
-- DROP TABLE IF EXISTS investment_applications CASCADE;
-- DROP TABLE IF EXISTS promissory_notes CASCADE;
-- DROP TABLE IF EXISTS wire_transfers CASCADE;
-- DROP TABLE IF EXISTS subscription_agreements CASCADE;

-- Document management tables
-- DROP TABLE IF EXISTS documents CASCADE;
-- DROP TABLE IF EXISTS document_access CASCADE;

-- Notification tables
-- DROP TABLE IF EXISTS notifications CASCADE;
-- DROP TABLE IF EXISTS admin_notifications CASCADE;

-- Plaid integration tables
-- DROP TABLE IF EXISTS plaid_accounts CASCADE;

-- Admin tables
-- DROP TABLE IF EXISTS user_verifications CASCADE;

-- =====================================================
-- KEEP THESE ESSENTIAL FUNCTIONS
-- =====================================================
-- safe_upsert_user_profile - For user profile management
-- (This function should remain for the Profile page)

-- =====================================================
-- VERIFICATION QUERY
-- =====================================================
-- Run this to see what functions remain:
-- SELECT routine_name, routine_type 
-- FROM information_schema.routines 
-- WHERE routine_schema = 'public' 
-- ORDER BY routine_name;
