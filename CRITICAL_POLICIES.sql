-- CRITICAL POLICIES RESTORATION - Most Important Tables Only
-- Run this after FINAL_PROFILE_FIX.sql

-- Fix simple_applications (this had a policy before)
CREATE POLICY "user_applications_policy" 
ON public.simple_applications FOR ALL 
TO authenticated 
USING (user_id = auth.uid()) 
WITH CHECK (user_id = auth.uid());

-- Fix simple_notifications (this had a policy before) 
CREATE POLICY "user_notifications_policy" 
ON public.simple_notifications FOR ALL 
TO authenticated 
USING (user_id = auth.uid()) 
WITH CHECK (user_id = auth.uid());

-- Basic permissions for these tables
GRANT ALL ON public.simple_applications TO authenticated;
GRANT ALL ON public.simple_notifications TO authenticated;

-- Verify policies were created
SELECT 'Policies created:' as status, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('simple_applications', 'simple_notifications');

SELECT 'CRITICAL POLICIES RESTORED!' as result;
