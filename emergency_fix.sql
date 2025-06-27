-- EMERGENCY FIX: Temporarily disable RLS to allow profile creation
-- Run this in your Supabase SQL Editor

-- Disable RLS temporarily
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

-- Test insert to make sure it works
INSERT INTO public.user_profiles (id, first_name, last_name, created_at, updated_at)
VALUES (auth.uid(), 'Test', 'User', now(), now())
ON CONFLICT (id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    updated_at = now();

-- Check if it worked
SELECT id, first_name, last_name FROM public.user_profiles WHERE id = auth.uid();

-- Re-enable RLS with proper policies
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS user_profiles_policy ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.user_profiles;

-- Create new comprehensive policies
CREATE POLICY "Allow all for authenticated users on own profile" 
ON public.user_profiles FOR ALL 
TO authenticated 
USING (id = auth.uid()) 
WITH CHECK (id = auth.uid());

-- Grant permissions
GRANT ALL ON public.user_profiles TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
