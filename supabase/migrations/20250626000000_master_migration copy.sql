--
-- FINAL CLEANUP SCRIPT (v4)
--
-- This script removes the last remaining obsolete functions related to the
-- old onboarding flow. After this, the system will be fully aligned with the
-- new, streamlined process.
--
DO $$
BEGIN
    RAISE NOTICE 'Starting final cleanup of obsolete functions...';

    -- Dropping old, specific functions by name and arguments
    DROP FUNCTION IF EXISTS public.activate_user_investment(uuid) CASCADE;
    RAISE NOTICE 'Dropped function: activate_user_investment(uuid)';

    DROP FUNCTION IF EXISTS public.admin_create_promissory_note(uuid) CASCADE;
    RAISE NOTICE 'Dropped function: admin_create_promissory_note(uuid)';

    DROP FUNCTION IF EXISTS public.create_investment(uuid, numeric, numeric, payment_frequency_enum, date, integer) CASCADE;
    RAISE NOTICE 'Dropped function: create_investment(...)';

    DROP FUNCTION IF EXISTS public.create_investment_application(numeric, numeric, text, integer) CASCADE;
    RAISE NOTICE 'Dropped function: create_investment_application(...)';

    DROP FUNCTION IF EXISTS public.update_onboarding_step(uuid, text, text, jsonb) CASCADE;
    RAISE NOTICE 'Dropped function: update_onboarding_step(...)';

    RAISE NOTICE 'Final cleanup complete. Your system is now fully streamlined.';
END $$;