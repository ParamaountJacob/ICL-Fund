-- MINIMAL PROFILE FIX - ONLY FIX THE CRITICAL USER_PROFILES TABLE
-- Run this in your Supabase SQL Editor to fix the immediate profile issue

-- ==============================================================================
-- STEP 1: FIX USER PROFILES TABLE ONLY (CRITICAL)
-- ==============================================================================

-- Drop any existing conflicting policies on user_profiles
DROP POLICY IF EXISTS "user_profiles_all_access" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_policy" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;

-- Create the working policy for user_profiles
CREATE POLICY "user_profiles_access" 
ON public.user_profiles FOR ALL 
TO authenticated 
USING (id = auth.uid()) 
WITH CHECK (id = auth.uid());

-- ==============================================================================
-- STEP 2: INSERT YOUR PROFILE DATA
-- ==============================================================================

INSERT INTO public.user_profiles (id, user_id, first_name, last_name, created_at, updated_at)
VALUES ('07e0d58f-d90c-4a9a-8dfc-3739ceb9cc72', '07e0d58f-d90c-4a9a-8dfc-3739ceb9cc72', 'Jacob', 'Griswold', now(), now())
ON CONFLICT (id) DO UPDATE SET
    user_id = EXCLUDED.user_id,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    updated_at = now();

-- ==============================================================================
-- STEP 3: UPDATE DATABASE FUNCTION
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
    INSERT INTO public.user_profiles (
        id, user_id, first_name, last_name, phone, address, ira_accounts,
        investment_goals, risk_tolerance, net_worth, annual_income,
        created_at, updated_at
    )
    VALUES (
        p_user_id, p_user_id, p_first_name, p_last_name, p_phone, p_address, p_ira_accounts,
        p_investment_goals, p_risk_tolerance, p_net_worth, p_annual_income,
        now(), now()
    )
    ON CONFLICT (id) DO UPDATE SET
        user_id = EXCLUDED.user_id,
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
-- STEP 4: GRANT BASIC PERMISSIONS
-- ==============================================================================

GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON public.user_profiles TO authenticated;

-- ==============================================================================
-- STEP 5: VERIFICATION
-- ==============================================================================

-- Check that your profile now exists
SELECT 'Profile check:' as test, id, first_name, last_name 
FROM public.user_profiles 
WHERE id = '07e0d58f-d90c-4a9a-8dfc-3739ceb9cc72';

-- Test the database function
SELECT 'Function test:' as test, public.safe_upsert_user_profile(
    '07e0d58f-d90c-4a9a-8dfc-3739ceb9cc72'::UUID,
    'Jacob',
    'Griswold'
);

-- Check the policy was created
SELECT 'Policy check:' as test, policyname, tablename
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'user_profiles';

SELECT 'SUCCESS: User profile issue should now be fixed!' as result;
SELECT 'NEXT STEP: Refresh your browser to test the profile modal' as next_step;
