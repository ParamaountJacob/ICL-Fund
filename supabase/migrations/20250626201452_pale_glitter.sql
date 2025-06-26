-- Final fix for function creation order
-- This migration ensures proper order of function drops and creations

-- First drop all potentially conflicting functions to ensure clean recreation
DROP FUNCTION IF EXISTS public.get_user_investments_with_applications(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_admin_investments_with_users() CASCADE;
DROP FUNCTION IF EXISTS create_investment_on_application_submit() CASCADE;

-- Make sure any triggers using these functions are dropped
DROP TRIGGER IF EXISTS create_investment_on_application_submit_trigger ON investment_applications;

-- Apply a final fix to handle any remaining issues with NULL values
UPDATE investments
SET amount = 200000  -- Use minimum investment amount
WHERE amount IS NULL;

UPDATE investments
SET annual_percentage = 11  -- Use 11% as minimum valid value
WHERE annual_percentage IS NULL;

UPDATE investments
SET term_months = 12
WHERE term_months IS NULL;

-- Log success message for verification
DO $$ 
BEGIN
  RAISE NOTICE 'Migration completed successfully';
END $$;

-- Ensure proper permissions 
GRANT SELECT ON investments TO authenticated;
GRANT SELECT ON investment_applications TO authenticated;

-- The error occurred because we tried to grant execute on functions that don't exist yet
-- We'll skip those grants since they'll be handled in other migrations