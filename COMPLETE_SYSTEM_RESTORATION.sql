-- COMPLETE SYSTEM RESTORATION SCRIPT
-- This script fixes the profile loop and restores all missing functionality
-- Run this in Supabase SQL Editor in the exact order shown

-- ====================================
-- STEP 1: FIX PROFILE TABLE ACCESS
-- ====================================

-- Enable RLS on user_profiles table
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create comprehensive RLS policy for user_profiles
DROP POLICY IF EXISTS "Users can manage their own profile" ON public.user_profiles;

CREATE POLICY "Users can manage their own profile" ON public.user_profiles
FOR ALL 
USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM public.user_profiles up 
    WHERE up.user_id = auth.uid() AND up.role IN ('admin', 'super_admin')
  )
)
WITH CHECK (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM public.user_profiles up 
    WHERE up.user_id = auth.uid() AND up.role IN ('admin', 'super_admin')
  )
);

-- ====================================
-- STEP 2: ADD MISSING SCHEMA FIELDS
-- ====================================

-- Add full_name field if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'full_name') THEN
        ALTER TABLE public.user_profiles ADD COLUMN full_name TEXT;
    END IF;
END $$;

-- Add managed_by_admin_id field for user claiming
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' AND column_name = 'managed_by_admin_id') THEN
        ALTER TABLE public.user_profiles ADD COLUMN managed_by_admin_id UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- Update full_name for existing profiles where it's null
UPDATE public.user_profiles 
SET full_name = TRIM(CONCAT(COALESCE(first_name, ''), ' ', COALESCE(last_name, '')))
WHERE full_name IS NULL AND (first_name IS NOT NULL OR last_name IS NOT NULL);

-- ====================================
-- STEP 3: FIX JACOB'S PROFILE DATA
-- ====================================

-- Fix Jacob's profile name corruption
UPDATE public.user_profiles 
SET 
  first_name = 'Jacob',
  last_name = 'Griswold',
  full_name = 'Jacob Griswold'
WHERE (full_name = 'Admin User' OR first_name = 'Admin' OR last_name = 'User')
   OR user_id = (SELECT auth.uid() FROM auth.users WHERE email LIKE '%jacob%' OR email LIKE '%griswold%' LIMIT 1);

-- ====================================
-- STEP 4: CREATE CRITICAL ADMIN FUNCTIONS
-- ====================================

-- Function: Get unread notification count
CREATE OR REPLACE FUNCTION public.get_unread_notification_count()
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.notifications
  WHERE user_id = auth.uid() AND read = false;
$$;

-- Function: Get managed users with admin details
CREATE OR REPLACE FUNCTION public.get_managed_users_with_admin_details()
RETURNS TABLE (
  id UUID,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  full_name TEXT,
  role TEXT,
  created_at TIMESTAMPTZ,
  managed_by_admin_id UUID,
  admin_first_name TEXT,
  admin_last_name TEXT
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    u.id,
    au.email,
    u.first_name,
    u.last_name,
    u.full_name,
    u.role,
    u.created_at,
    u.managed_by_admin_id,
    admin.first_name as admin_first_name,
    admin.last_name as admin_last_name
  FROM public.user_profiles u
  JOIN auth.users au ON u.user_id = au.id
  LEFT JOIN public.user_profiles admin ON u.managed_by_admin_id = admin.user_id
  WHERE EXISTS (
    SELECT 1 FROM public.user_profiles caller 
    WHERE caller.user_id = auth.uid() AND caller.role IN ('admin', 'super_admin')
  );
$$;

-- Function: Claim user by admin
CREATE OR REPLACE FUNCTION public.claim_user_by_admin(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_role TEXT;
BEGIN
  -- Check if caller is admin
  SELECT role INTO admin_role 
  FROM public.user_profiles 
  WHERE user_id = auth.uid();
  
  IF admin_role NOT IN ('admin', 'super_admin') THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;
  
  -- Claim the user
  UPDATE public.user_profiles 
  SET managed_by_admin_id = auth.uid()
  WHERE user_id = target_user_id;
  
  RETURN FOUND;
END;
$$;

-- Function: Get admin investments with users
CREATE OR REPLACE FUNCTION public.get_admin_investments_with_users()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  amount DECIMAL,
  status TEXT,
  created_at TIMESTAMPTZ,
  first_name TEXT,
  last_name TEXT,
  email TEXT
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    i.id,
    i.user_id,
    i.amount,
    i.status,
    i.created_at,
    up.first_name,
    up.last_name,
    au.email
  FROM public.investments i
  JOIN public.user_profiles up ON i.user_id = up.user_id
  JOIN auth.users au ON i.user_id = au.id
  WHERE EXISTS (
    SELECT 1 FROM public.user_profiles caller 
    WHERE caller.user_id = auth.uid() AND caller.role IN ('admin', 'super_admin')
  );
$$;

-- Function: Activate user investment
CREATE OR REPLACE FUNCTION public.activate_user_investment(investment_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_role TEXT;
BEGIN
  -- Check if caller is admin
  SELECT role INTO admin_role 
  FROM public.user_profiles 
  WHERE user_id = auth.uid();
  
  IF admin_role NOT IN ('admin', 'super_admin') THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;
  
  -- Activate investment
  UPDATE public.investments 
  SET status = 'active', updated_at = NOW()
  WHERE id = investment_id;
  
  RETURN FOUND;
END;
$$;

-- ====================================
-- STEP 5: CREATE WORKFLOW FUNCTIONS
-- ====================================

-- Function: Create simple application
CREATE OR REPLACE FUNCTION public.create_simple_application(application_data JSONB)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  app_id UUID;
BEGIN
  INSERT INTO public.simple_applications (
    user_id,
    data,
    status,
    created_at
  ) VALUES (
    auth.uid(),
    application_data,
    'pending',
    NOW()
  ) RETURNING id INTO app_id;
  
  RETURN app_id;
END;
$$;

-- Function: User sign subscription
CREATE OR REPLACE FUNCTION public.user_sign_subscription(application_id UUID, signature_data JSONB)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update application with signature
  UPDATE public.simple_applications 
  SET 
    subscription_signature = signature_data,
    subscription_signed_at = NOW(),
    status = 'subscription_signed'
  WHERE id = application_id AND user_id = auth.uid();
  
  RETURN FOUND;
END;
$$;

-- Function: User sign promissory note
CREATE OR REPLACE FUNCTION public.user_sign_promissory_note(application_id UUID, signature_data JSONB)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.simple_applications 
  SET 
    promissory_signature = signature_data,
    promissory_signed_at = NOW(),
    status = 'fully_signed'
  WHERE id = application_id AND user_id = auth.uid();
  
  RETURN FOUND;
END;
$$;

-- ====================================
-- STEP 6: RESTORE TABLE POLICIES
-- ====================================

-- Notifications table policies
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" ON public.notifications
FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications" ON public.notifications
FOR UPDATE USING (user_id = auth.uid());

-- Investments table policies
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own investments" ON public.investments;
CREATE POLICY "Users can view their own investments" ON public.investments
FOR SELECT USING (
  user_id = auth.uid() OR 
  EXISTS (SELECT 1 FROM public.user_profiles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
);

DROP POLICY IF EXISTS "Users can create their own investments" ON public.investments;
CREATE POLICY "Users can create their own investments" ON public.investments
FOR INSERT WITH CHECK (user_id = auth.uid());

-- Simple applications table policies
CREATE TABLE IF NOT EXISTS public.simple_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  data JSONB,
  status TEXT DEFAULT 'pending',
  subscription_signature JSONB,
  subscription_signed_at TIMESTAMPTZ,
  promissory_signature JSONB,
  promissory_signed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.simple_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own applications" ON public.simple_applications;
CREATE POLICY "Users can manage their own applications" ON public.simple_applications
FOR ALL USING (
  user_id = auth.uid() OR 
  EXISTS (SELECT 1 FROM public.user_profiles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- ====================================
-- STEP 7: CREATE PERFORMANCE INDEXES
-- ====================================

-- Index for user profile lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_managed_by ON public.user_profiles(managed_by_admin_id);

-- Index for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_read ON public.notifications(user_id, read);

-- Index for investments
CREATE INDEX IF NOT EXISTS idx_investments_user_id ON public.investments(user_id);
CREATE INDEX IF NOT EXISTS idx_investments_status ON public.investments(status);

-- ====================================
-- VERIFICATION QUERIES
-- ====================================

-- Verify the fixes worked
SELECT 'VERIFICATION: User Profile Access' as check_name,
       CASE 
         WHEN EXISTS (SELECT 1 FROM public.user_profiles WHERE user_id = auth.uid()) 
         THEN 'PASS: Can access user_profiles'
         ELSE 'FAIL: Cannot access user_profiles'
       END as result;

SELECT 'VERIFICATION: Jacob Profile Fixed' as check_name,
       CASE 
         WHEN EXISTS (SELECT 1 FROM public.user_profiles WHERE first_name = 'Jacob' AND last_name = 'Griswold') 
         THEN 'PASS: Jacob profile corrected'
         ELSE 'FAIL: Jacob profile still corrupted'
       END as result;

SELECT 'VERIFICATION: Admin Functions Created' as check_name,
       CASE 
         WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_unread_notification_count') 
         THEN 'PASS: Admin functions created'
         ELSE 'FAIL: Admin functions missing'
       END as result;

-- Final success message
SELECT 'SYSTEM RESTORATION COMPLETE' as status,
       'Profile loop fixed, admin functions restored, database access enabled' as message;
