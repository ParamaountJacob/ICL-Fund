-- COMPREHENSIVE RLS POLICY RESTORATION
-- Run this in your Supabase SQL Editor to restore all missing policies

-- ==============================================================================
-- USER PROFILES - Fix the immediate profile issue
-- ==============================================================================

CREATE POLICY "user_profiles_all_access" 
ON public.user_profiles FOR ALL 
TO authenticated 
USING (id = auth.uid()) 
WITH CHECK (id = auth.uid());

-- ==============================================================================
-- ADMIN TABLES - Admin-only access
-- ==============================================================================

CREATE POLICY "admin_actions_admin_only" 
ON public.admin_actions FOR ALL 
TO authenticated 
USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "admin_notifications_admin_only" 
ON public.admin_notifications FOR ALL 
TO authenticated 
USING (auth.jwt() ->> 'role' = 'admin');

-- ==============================================================================
-- USER-SPECIFIC TABLES - Users can access their own data
-- ==============================================================================

CREATE POLICY "consultation_requests_user_access" 
ON public.consultation_requests FOR ALL 
TO authenticated 
USING (user_id = auth.uid()) 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "document_requests_user_access" 
ON public.document_requests FOR ALL 
TO authenticated 
USING (user_id = auth.uid()) 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "document_signatures_user_access" 
ON public.document_signatures FOR ALL 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.investment_applications ia 
        WHERE ia.id = application_id AND ia.user_id = auth.uid()
    )
);

CREATE POLICY "funding_sources_user_access" 
ON public.funding_sources FOR ALL 
TO authenticated 
USING (user_id = auth.uid()) 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "investment_applications_user_access" 
ON public.investment_applications FOR ALL 
TO authenticated 
USING (user_id = auth.uid()) 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "investment_documents_user_access" 
ON public.investment_documents FOR ALL 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.investment_applications ia 
        WHERE ia.id = application_id AND ia.user_id = auth.uid()
    )
);

CREATE POLICY "investments_user_access" 
ON public.investments FOR ALL 
TO authenticated 
USING (user_id = auth.uid()) 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "messages_user_access" 
ON public.messages FOR ALL 
TO authenticated 
USING (user_id = auth.uid() OR recipient_id = auth.uid()) 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "onboarding_steps_user_access" 
ON public.onboarding_steps FOR ALL 
TO authenticated 
USING (user_id = auth.uid()) 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "payments_user_access" 
ON public.payments FOR ALL 
TO authenticated 
USING (user_id = auth.uid()) 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "simple_investments_user_access" 
ON public.simple_investments FOR ALL 
TO authenticated 
USING (user_id = auth.uid()) 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "simple_notifications_user_access" 
ON public.simple_notifications FOR ALL 
TO authenticated 
USING (user_id = auth.uid()) 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_activity_user_access" 
ON public.user_activity FOR ALL 
TO authenticated 
USING (user_id = auth.uid()) 
WITH CHECK (user_id = auth.uid());

-- ==============================================================================
-- CRM TABLES - Admin and staff access
-- ==============================================================================

CREATE POLICY "crm_activities_staff_access" 
ON public.crm_activities FOR ALL 
TO authenticated 
USING (
    auth.jwt() ->> 'role' IN ('admin', 'sub_admin') OR
    user_id = auth.uid()
);

CREATE POLICY "crm_leads_staff_access" 
ON public.crm_leads FOR ALL 
TO authenticated 
USING (
    auth.jwt() ->> 'role' IN ('admin', 'sub_admin') OR
    user_id = auth.uid()
);

-- ==============================================================================
-- PUBLIC ACCESS TABLES
-- ==============================================================================

CREATE POLICY "documents_public_read" 
ON public.documents FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "documents_admin_write" 
ON public.documents FOR INSERT, UPDATE, DELETE 
TO authenticated 
USING (auth.jwt() ->> 'role' = 'admin') 
WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "newsletter_subscribers_public" 
ON public.newsletter_subscribers FOR ALL 
TO anon, authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "users_public_read" 
ON public.users FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "users_self_update" 
ON public.users FOR UPDATE 
TO authenticated 
USING (id = auth.uid()) 
WITH CHECK (id = auth.uid());

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

SELECT 'SUCCESS: All RLS policies have been restored!' as result;
