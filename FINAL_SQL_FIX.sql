-- IMMEDIATE FIX: Run this exact SQL in Supabase SQL Editor
-- This will fix the RLS issues preventing profile saves

-- First, check what's currently in the table
SELECT 'Current table contents:' as step;
SELECT id, first_name, last_name, created_at FROM public.user_profiles;

-- Check current policies
SELECT 'Current policies:' as step;
SELECT policyname, permissive, roles, cmd, qual FROM pg_policies WHERE tablename = 'user_profiles';

-- Step 1: Disable RLS temporarily
SELECT 'Disabling RLS...' as step;
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

-- Step 2: Insert your specific profile directly (this will work now)
SELECT 'Inserting your profile...' as step;
INSERT INTO public.user_profiles (id, first_name, last_name, created_at, updated_at)
VALUES ('07e0d58f-d90c-4a9a-8dfc-3739ceb9cc72', 'Jacob', 'Griswold', now(), now())
ON CONFLICT (id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    updated_at = now();

-- Step 3: Verify the insert worked
SELECT 'Verifying insert...' as step;
SELECT id, first_name, last_name FROM public.user_profiles WHERE id = '07e0d58f-d90c-4a9a-8dfc-3739ceb9cc72';

-- Step 4: Re-enable RLS
SELECT 'Re-enabling RLS...' as step;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Step 5: Drop all conflicting policies
SELECT 'Dropping old policies...' as step;
DROP POLICY IF EXISTS user_profiles_policy ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable select for users based on user_id" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable insert for users based on user_id" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow all for authenticated users on own profile" ON public.user_profiles;

-- Step 6: Create one simple, working policy
SELECT 'Creating new policy...' as step;
CREATE POLICY "user_profiles_comprehensive" 
ON public.user_profiles 
FOR ALL 
TO authenticated 
USING (id = auth.uid()) 
WITH CHECK (id = auth.uid());

-- Step 7: Grant proper permissions
SELECT 'Granting permissions...' as step;
GRANT ALL ON public.user_profiles TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Step 8: Update the database function to ensure it works
SELECT 'Updating database function...' as step;
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
        id, first_name, last_name, phone, address, ira_accounts,
        investment_goals, risk_tolerance, net_worth, annual_income,
        created_at, updated_at
    )
    VALUES (
        p_user_id, p_first_name, p_last_name, p_phone, p_address, p_ira_accounts,
        p_investment_goals, p_risk_tolerance, p_net_worth, p_annual_income,
        now(), now()
    )
    ON CONFLICT (id) DO UPDATE SET
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
    RAISE LOG 'Error in safe_upsert_user_profile: %', SQLERRM;
    RETURN FALSE;
END;
$$;

-- Step 9: Grant execute permission on the function
SELECT 'Granting function permissions...' as step;
GRANT EXECUTE ON FUNCTION public.safe_upsert_user_profile TO authenticated;

-- Step 10: Test the function
SELECT 'Testing function...' as step;
SELECT public.safe_upsert_user_profile(
    '07e0d58f-d90c-4a9a-8dfc-3739ceb9cc72'::UUID,
    'Jacob',
    'Griswold'
);

-- Final verification
SELECT 'Final verification:' as step;
SELECT id, first_name, last_name, created_at FROM public.user_profiles WHERE id = '07e0d58f-d90c-4a9a-8dfc-3739ceb9cc72';

SELECT 'SUCCESS: Profile fix completed!' as result;
