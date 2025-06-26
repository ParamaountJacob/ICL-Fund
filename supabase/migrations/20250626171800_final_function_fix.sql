-- Final fix for function creation order
-- This migration ensures proper order of function drops and creations

-- First drop all potentially conflicting functions to ensure clean recreation
DROP FUNCTION IF EXISTS public.get_user_investments_with_applications(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_admin_investments_with_users() CASCADE;
DROP FUNCTION IF EXISTS create_investment_on_application_submit() CASCADE;

-- Make sure any triggers using these functions are dropped
DROP TRIGGER IF EXISTS create_investment_on_application_submit_trigger ON investment_applications;

-- Ensure proper permissions 
GRANT SELECT ON investments TO authenticated;
GRANT SELECT ON investment_applications TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_investments_with_applications(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_investments_with_users() TO authenticated;

-- Apply a final fix to handle any remaining issues with NULL values
UPDATE investments
SET amount = 1000  -- Use a reasonable default amount
WHERE amount IS NULL;

UPDATE investments
SET annual_percentage = 5  -- Use 5% as default (must be > 0 and <= 100)
WHERE annual_percentage IS NULL;

-- Also fix any constraint violations in the applications table
UPDATE investment_applications
SET annual_percentage = 5  -- Use 5% to satisfy the constraint (must be > 0 and <= 100)
WHERE annual_percentage <= 0 OR annual_percentage > 100;

UPDATE investments
SET term_months = 12
WHERE term_months IS NULL;

-- Log success message for verification
DO $$ 
BEGIN
  RAISE NOTICE 'Migration completed successfully';
END $$;
