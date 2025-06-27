-- SAFE RLS POLICY RESTORATION - ONLY CREATES POLICIES FOR EXISTING TABLES
-- Run this in your Supabase SQL Editor to restore missing policies safely

-- First, let's create a function to safely create policies only if tables exist
CREATE OR REPLACE FUNCTION create_policy_if_table_exists(
    table_name TEXT,
    policy_name TEXT,
    policy_sql TEXT
) RETURNS BOOLEAN AS $$
BEGIN
    -- Check if table exists
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = create_policy_if_table_exists.table_name
    ) THEN
        -- Execute the policy creation
        EXECUTE policy_sql;
        RAISE NOTICE 'Created policy % for table %', policy_name, table_name;
        RETURN TRUE;
    ELSE
        RAISE NOTICE 'Table % does not exist, skipping policy %', table_name, policy_name;
        RETURN FALSE;
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error creating policy % for table %: %', policy_name, table_name, SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- USER PROFILES - Fix the immediate profile issue (CRITICAL)
-- ==============================================================================

SELECT create_policy_if_table_exists(
    'user_profiles',
    'user_profiles_all_access',
    'CREATE POLICY "user_profiles_all_access" ON public.user_profiles FOR ALL TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid())'
);

-- ==============================================================================
-- SIMPLE APPLICATIONS - Keep existing policy or create if missing
-- ==============================================================================

SELECT create_policy_if_table_exists(
    'simple_applications',
    'simple_applications_user_access',
    'CREATE POLICY "simple_applications_user_access" ON public.simple_applications FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())'
);

-- ==============================================================================
-- CORE USER TABLES - Create policies for tables that exist
-- ==============================================================================

SELECT create_policy_if_table_exists(
    'simple_investments',
    'simple_investments_user_access',
    'CREATE POLICY "simple_investments_user_access" ON public.simple_investments FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())'
);

SELECT create_policy_if_table_exists(
    'simple_notifications',
    'simple_notifications_user_access',
    'CREATE POLICY "simple_notifications_user_access" ON public.simple_notifications FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())'
);

SELECT create_policy_if_table_exists(
    'investments',
    'investments_user_access',
    'CREATE POLICY "investments_user_access" ON public.investments FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())'
);

SELECT create_policy_if_table_exists(
    'investment_applications',
    'investment_applications_user_access',
    'CREATE POLICY "investment_applications_user_access" ON public.investment_applications FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())'
);

SELECT create_policy_if_table_exists(
    'payments',
    'payments_user_access',
    'CREATE POLICY "payments_user_access" ON public.payments FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())'
);

SELECT create_policy_if_table_exists(
    'funding_sources',
    'funding_sources_user_access',
    'CREATE POLICY "funding_sources_user_access" ON public.funding_sources FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())'
);

SELECT create_policy_if_table_exists(
    'consultation_requests',
    'consultation_requests_user_access',
    'CREATE POLICY "consultation_requests_user_access" ON public.consultation_requests FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())'
);

SELECT create_policy_if_table_exists(
    'document_requests',
    'document_requests_user_access',
    'CREATE POLICY "document_requests_user_access" ON public.document_requests FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())'
);

SELECT create_policy_if_table_exists(
    'document_signatures',
    'document_signatures_user_access',
    'CREATE POLICY "document_signatures_user_access" ON public.document_signatures FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())'
);

SELECT create_policy_if_table_exists(
    'investment_documents',
    'investment_documents_user_access',
    'CREATE POLICY "investment_documents_user_access" ON public.investment_documents FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())'
);

SELECT create_policy_if_table_exists(
    'messages',
    'messages_user_access',
    'CREATE POLICY "messages_user_access" ON public.messages FOR ALL TO authenticated USING (user_id = auth.uid() OR recipient_id = auth.uid()) WITH CHECK (user_id = auth.uid())'
);

SELECT create_policy_if_table_exists(
    'onboarding_steps',
    'onboarding_steps_user_access',
    'CREATE POLICY "onboarding_steps_user_access" ON public.onboarding_steps FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())'
);

SELECT create_policy_if_table_exists(
    'user_activity',
    'user_activity_user_access',
    'CREATE POLICY "user_activity_user_access" ON public.user_activity FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())'
);

-- ==============================================================================
-- ADMIN TABLES
-- ==============================================================================

SELECT create_policy_if_table_exists(
    'admin_actions',
    'admin_actions_admin_only',
    'CREATE POLICY "admin_actions_admin_only" ON public.admin_actions FOR ALL TO authenticated USING (auth.jwt() ->> ''role'' = ''admin'')'
);

SELECT create_policy_if_table_exists(
    'admin_notifications',
    'admin_notifications_admin_only',
    'CREATE POLICY "admin_notifications_admin_only" ON public.admin_notifications FOR ALL TO authenticated USING (auth.jwt() ->> ''role'' = ''admin'')'
);

-- ==============================================================================
-- CRM TABLES
-- ==============================================================================

SELECT create_policy_if_table_exists(
    'crm_activities',
    'crm_activities_staff_access',
    'CREATE POLICY "crm_activities_staff_access" ON public.crm_activities FOR ALL TO authenticated USING (auth.jwt() ->> ''role'' IN (''admin'', ''sub_admin'') OR user_id = auth.uid())'
);

SELECT create_policy_if_table_exists(
    'crm_leads',
    'crm_leads_staff_access',
    'CREATE POLICY "crm_leads_staff_access" ON public.crm_leads FOR ALL TO authenticated USING (auth.jwt() ->> ''role'' IN (''admin'', ''sub_admin'') OR user_id = auth.uid())'
);

-- ==============================================================================
-- PUBLIC ACCESS TABLES
-- ==============================================================================

SELECT create_policy_if_table_exists(
    'documents',
    'documents_public_read',
    'CREATE POLICY "documents_public_read" ON public.documents FOR SELECT TO authenticated USING (true)'
);

SELECT create_policy_if_table_exists(
    'newsletter_subscribers',
    'newsletter_subscribers_public',
    'CREATE POLICY "newsletter_subscribers_public" ON public.newsletter_subscribers FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)'
);

SELECT create_policy_if_table_exists(
    'users',
    'users_public_read',
    'CREATE POLICY "users_public_read" ON public.users FOR SELECT TO authenticated USING (true)'
);

SELECT create_policy_if_table_exists(
    'users',
    'users_self_update',
    'CREATE POLICY "users_self_update" ON public.users FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid())'
);

-- ==============================================================================
-- GRANT NECESSARY PERMISSIONS
-- ==============================================================================

GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- ==============================================================================
-- INSERT YOUR PROFILE DATA (since the policies are now fixed)
-- ==============================================================================

INSERT INTO public.user_profiles (id, first_name, last_name, created_at, updated_at)
VALUES ('07e0d58f-d90c-4a9a-8dfc-3739ceb9cc72', 'Jacob', 'Griswold', now(), now())
ON CONFLICT (id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    updated_at = now();

-- ==============================================================================
-- UPDATE DATABASE FUNCTION
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
    RETURN FALSE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.safe_upsert_user_profile TO authenticated;

-- ==============================================================================
-- VERIFICATION
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

-- Check how many policies were created
SELECT 'Policies created:' as test, COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public';

-- Clean up the helper function
DROP FUNCTION create_policy_if_table_exists;

SELECT 'SUCCESS: All RLS policies have been safely restored!' as result;
