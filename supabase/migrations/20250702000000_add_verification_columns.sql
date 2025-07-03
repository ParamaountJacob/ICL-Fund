-- Migration: Add verification columns to profiles table
-- This migration is idempotent and safe to run multiple times

-- Add verification_status column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'verification_status'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.profiles 
        ADD COLUMN verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'denied'));
        
        COMMENT ON COLUMN public.profiles.verification_status IS 'User verification status: pending, verified, or denied';
    END IF;
END $$;

-- Add verification_requested column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'verification_requested'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.profiles 
        ADD COLUMN verification_requested BOOLEAN DEFAULT false;
        
        COMMENT ON COLUMN public.profiles.verification_requested IS 'Whether user has requested verification';
    END IF;
END $$;

-- Update existing records to have default values (safe to run multiple times)
UPDATE public.profiles 
SET verification_status = 'pending' 
WHERE verification_status IS NULL;

UPDATE public.profiles 
SET verification_requested = false 
WHERE verification_requested IS NULL;

-- Create index for verification queries if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'profiles' 
        AND indexname = 'idx_profiles_verification_status'
        AND schemaname = 'public'
    ) THEN
        CREATE INDEX idx_profiles_verification_status ON public.profiles(verification_status);
    END IF;
END $$;

-- Create index for verification requests if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'profiles' 
        AND indexname = 'idx_profiles_verification_requested'
        AND schemaname = 'public'
    ) THEN
        CREATE INDEX idx_profiles_verification_requested ON public.profiles(verification_requested) WHERE verification_requested = true;
    END IF;
END $$;

-- Grant necessary permissions (safe to run multiple times)
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;

-- Create or replace RLS policies for verification columns
DROP POLICY IF EXISTS "Users can view own verification status" ON public.profiles;
CREATE POLICY "Users can view own verification status" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can request verification" ON public.profiles;
CREATE POLICY "Users can request verification" ON public.profiles
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Admin policy for managing all user verifications
DROP POLICY IF EXISTS "Admins can manage all verifications" ON public.profiles;
CREATE POLICY "Admins can manage all verifications" ON public.profiles
    FOR ALL USING (
        auth.jwt() ->> 'email' = 'innercirclelending@gmail.com'
    );

-- Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Log successful migration
DO $$
BEGIN
    RAISE NOTICE 'Verification columns migration completed successfully';
END $$;
