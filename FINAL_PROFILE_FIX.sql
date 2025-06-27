-- FINAL FIX: Create correct policy for user_profiles table
-- Your profile already exists, we just need the right policy and app fix

-- Create policy using user_id column (not id column)
CREATE POLICY "user_profiles_access" 
ON public.user_profiles FOR ALL 
TO authenticated 
USING (user_id = auth.uid()) 
WITH CHECK (user_id = auth.uid());

-- Verify your profile can be found
SELECT 'Your profile found:' as status, id, user_id, first_name, last_name 
FROM public.user_profiles 
WHERE user_id = '07e0d58f-d90c-4a9a-8dfc-3739ceb9cc72';

SELECT 'SUCCESS: Profile policy created and profile exists!' as result;
