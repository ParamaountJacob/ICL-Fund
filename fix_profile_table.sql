-- Emergency fix for user_profiles RLS policy
-- Run this in your Supabase SQL editor

-- First, check if the table exists and its current state
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
ORDER BY ordinal_position;

-- Drop all existing policies
DROP POLICY IF EXISTS user_profiles_policy ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;

-- Disable RLS temporarily to check the issue
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create comprehensive RLS policies that allow all operations for the user's own profile
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can insert own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY "Users can delete own profile" ON public.user_profiles
    FOR DELETE USING (id = auth.uid());

-- Grant necessary permissions
GRANT ALL ON public.user_profiles TO authenticated;
GRANT ALL ON public.user_profiles TO anon;

-- Test the policies by trying to insert a record
INSERT INTO public.user_profiles (id, first_name, last_name, created_at, updated_at)
VALUES (auth.uid(), 'Test', 'User', now(), now())
ON CONFLICT (id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    updated_at = now();

-- Check if the insert worked
SELECT id, first_name, last_name FROM public.user_profiles WHERE id = auth.uid();
