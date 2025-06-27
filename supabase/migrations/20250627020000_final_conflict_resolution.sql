-- ===============================================
-- FINAL CLEANUP - ENSURE NO FUNCTION CONFLICTS
-- This migration ensures all old functions are properly dropped
-- and no conflicts exist with the new simple workflow
-- ===============================================

-- Drop all variations of the old function (with and without schema prefix)
DROP FUNCTION IF EXISTS get_user_investments_with_applications(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_investments_with_applications(uuid) CASCADE;
DROP FUNCTION IF EXISTS get_admin_investments_with_users() CASCADE;
DROP FUNCTION IF EXISTS public.get_admin_investments_with_users() CASCADE;

-- Drop any old workflow functions that might still exist
DROP FUNCTION IF EXISTS create_investment_on_application_submit() CASCADE;
DROP FUNCTION IF EXISTS update_onboarding_step(uuid, text, text, jsonb) CASCADE;
DROP FUNCTION IF EXISTS create_promissory_note_signature_record(uuid) CASCADE;
DROP FUNCTION IF EXISTS send_system_notification_to_user(uuid, text, text) CASCADE;

-- Ensure our new functions exist and work properly
DO $$
BEGIN
  -- Test that our new functions exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p 
    JOIN pg_namespace n ON p.pronamespace = n.oid 
    WHERE n.nspname = 'public' AND p.proname = 'get_user_applications'
  ) THEN
    RAISE EXCEPTION 'get_user_applications function not found - run the clean simple workflow migration first';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p 
    JOIN pg_namespace n ON p.pronamespace = n.oid 
    WHERE n.nspname = 'public' AND p.proname = 'get_admin_applications'
  ) THEN
    RAISE EXCEPTION 'get_admin_applications function not found - run the clean simple workflow migration first';
  END IF;

  RAISE NOTICE '✅ CONFLICT RESOLUTION COMPLETE!';
  RAISE NOTICE 'All old conflicting functions have been removed.';
  RAISE NOTICE 'New simple workflow functions are ready to use.';
END $$;
