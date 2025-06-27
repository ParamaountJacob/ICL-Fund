-- TARGETED FIX - Your profile exists, we just need to create the policy so your app can read it
-- Run this in your Supabase SQL Editor

-- ==============================================================================
-- STEP 1: CREATE THE USER_PROFILES POLICY
-- ==============================================================================

-- Drop any existing conflicting policies
DROP POLICY IF EXISTS "user_profiles_access" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_all_access" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_policy" ON public.user_profiles;

-- Create the policy that allows users to access their own profile
CREATE POLICY "user_profiles_access" 
ON public.user_profiles FOR ALL 
TO authenticated 
USING (user_id = auth.uid()) 
WITH CHECK (user_id = auth.uid());

-- ==============================================================================
-- STEP 2: GRANT BASIC PERMISSIONS
-- ==============================================================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.user_profiles TO authenticated;

-- ==============================================================================
-- STEP 3: UPDATE DATABASE FUNCTION TO USE CORRECT COLUMNS
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.safe_upsert_user_profile(
    p_user_id UUID,
    p_first_name TEXT DEFAULT NULL,
    p_last_name TEXT DEFAULT NULL,
    p_phone TEXT DEFAULT NULL,
    p_address TEXT DEFAULT NULL,
    p_ira_accounts TEXT DEFAULT NULL,
    p_investment_goals TEXT DEFAULT NULL,
    p_risk_tolerance TEXT DEFAULT NULL,
    p_net_worth NUMERIC DEFAULT NULL,
    p_annual_income NUMERIC DEFAULT NULL
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Update existing profile or insert new one
    INSERT INTO public.user_profiles (
        id, user_id, first_name, last_name, phone, address, ira_accounts,
        investment_goals, risk_tolerance, net_worth, annual_income,
        created_at, updated_at
    )
    VALUES (
        gen_random_uuid(), p_user_id, p_first_name, p_last_name, p_phone, p_address, p_ira_accounts,
        p_investment_goals, p_risk_tolerance, p_net_worth, p_annual_income,
        now(), now()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        first_name = COALESCE(EXCLUDED.first_name, user_profiles.first_name),
        last_name = COALESCE(EXCLUDED.last_name, user_profiles.last_name),
        phone = COALESCE(EXCLUDED.phone, user_profiles.phone),
        address = COALESCE(EXCLUDED.address, user_profiles.address),
        ira_accounts = COALESCE(EXCLUDED.ira_accounts, user_profiles.ira_accounts),
        investment_goals = COALESCE(EXCLUDED.investment_goals, user_profiles.investment_goals),
        risk_tolerance = COALESCE(EXCLUDED.risk_tolerance, user_profiles.risk_tolerance),
        net_worth = COALESCE(EXCLUDED.net_worth, user_profiles.net_worth),
        annual_income = COALESCE(EXCLUDED.annual_income, user_profiles.annual_income),
        updated_at = now();
    
    RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.safe_upsert_user_profile TO authenticated;

-- ==============================================================================
-- STEP 4: VERIFICATION
-- ==============================================================================

-- Check that your profile can now be read
SELECT 'Profile test:' as test, id, user_id, first_name, last_name 
FROM public.user_profiles 
WHERE user_id = '07e0d58f-d90c-4a9a-8dfc-3739ceb9cc72';

-- Test the database function
SELECT 'Function test:' as test, public.safe_upsert_user_profile(
    '07e0d58f-d90c-4a9a-8dfc-3739ceb9cc72'::UUID,
    'Jacob',
    'Griswold'
);

-- Check the policy was created
SELECT 'Policy test:' as test, policyname 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'user_profiles';

SELECT 'SUCCESS: Profile should now be accessible to your app!' as result;
