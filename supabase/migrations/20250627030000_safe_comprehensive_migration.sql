-- ===============================================
-- SAFE COMPREHENSIVE MIGRATION
-- This migration safely cleans up everything with proper checks
-- It won't fail if functions/tables don't exist
-- ===============================================

-- ===============================================
-- STEP 1: SAFE FUNCTION CLEANUP WITH CHECKS
-- ===============================================

DO $$
DECLARE
  func_exists BOOLEAN;
BEGIN
  RAISE NOTICE 'Starting safe cleanup of existing functions...';

  -- Check and drop old workflow functions safely
  SELECT EXISTS (
    SELECT 1 FROM pg_proc p 
    JOIN pg_namespace n ON p.pronamespace = n.oid 
    WHERE n.nspname = 'public' AND p.proname = 'get_user_investments_with_applications'
  ) INTO func_exists;
  
  IF func_exists THEN
    DROP FUNCTION public.get_user_investments_with_applications(uuid) CASCADE;
    RAISE NOTICE '✓ Dropped get_user_investments_with_applications';
  ELSE
    RAISE NOTICE '✓ get_user_investments_with_applications already removed';
  END IF;

  -- Check and drop other conflicting functions
  SELECT EXISTS (
    SELECT 1 FROM pg_proc p 
    JOIN pg_namespace n ON p.pronamespace = n.oid 
    WHERE n.nspname = 'public' AND p.proname = 'get_admin_investments_with_users'
  ) INTO func_exists;
  
  IF func_exists THEN
    DROP FUNCTION public.get_admin_investments_with_users() CASCADE;
    RAISE NOTICE '✓ Dropped get_admin_investments_with_users';
  END IF;

  -- Drop all other potentially conflicting functions safely
  DROP FUNCTION IF EXISTS public.activate_user_investment(uuid) CASCADE;
  DROP FUNCTION IF EXISTS public.admin_complete_onboarding(uuid) CASCADE;
  DROP FUNCTION IF EXISTS public.admin_confirm_funds(uuid) CASCADE;
  DROP FUNCTION IF EXISTS public.admin_sign_subscription_agreement(uuid) CASCADE;
  DROP FUNCTION IF EXISTS public.create_investment(uuid, numeric, numeric, payment_frequency_enum, date, integer) CASCADE;
  DROP FUNCTION IF EXISTS public.move_investment_to_bank_details_stage(uuid) CASCADE;
  DROP FUNCTION IF EXISTS public.update_onboarding_step(uuid, text, text, jsonb) CASCADE;
  DROP FUNCTION IF EXISTS public.user_complete_plaid_linking(uuid) CASCADE;
  DROP FUNCTION IF EXISTS public.create_investment_on_application_submit() CASCADE;
  DROP FUNCTION IF EXISTS public.create_promissory_note_signature_record(uuid) CASCADE;
  DROP FUNCTION IF EXISTS public.send_system_notification_to_user(uuid, text, text) CASCADE;

  RAISE NOTICE '✓ All old functions safely removed';
END $$;

-- ===============================================
-- STEP 2: CREATE SIMPLE WORKFLOW TABLES SAFELY
-- ===============================================

DO $$
BEGIN
  RAISE NOTICE 'Creating simple workflow tables...';
  
  -- Create workflow step enum if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'workflow_step') THEN
    CREATE TYPE workflow_step AS ENUM (
      'subscription_pending',      -- Step 1: User needs to sign subscription agreement
      'admin_review',             -- Step 1.1: Admin needs to sign subscription agreement  
      'promissory_pending',       -- Step 2: Admin creates promissory note, user signs it
      'funds_pending',            -- Step 2.1: User needs to wire funds
      'admin_confirm',            -- Step 3: Admin confirms promissory note + funds
      'plaid_pending',            -- Step 4: User connects bank via Plaid
      'admin_complete',           -- Step 4.1: Admin completes setup
      'active'                    -- Investment is fully active
    );
    RAISE NOTICE '✓ Created workflow_step enum';
  ELSE
    RAISE NOTICE '✓ workflow_step enum already exists';
  END IF;
END $$;

-- Create simple_applications table if it doesn't exist
CREATE TABLE IF NOT EXISTS simple_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  investment_amount NUMERIC NOT NULL CHECK (investment_amount >= 200000),
  annual_percentage NUMERIC NOT NULL DEFAULT 12,
  payment_frequency TEXT NOT NULL DEFAULT 'monthly',
  term_months INTEGER NOT NULL DEFAULT 24,
  current_step workflow_step NOT NULL DEFAULT 'subscription_pending',
  
  -- Step completion tracking
  subscription_signed_by_user TIMESTAMPTZ,
  subscription_signed_by_admin TIMESTAMPTZ,
  promissory_note_created TIMESTAMPTZ,
  promissory_note_signed TIMESTAMPTZ,
  funds_received TIMESTAMPTZ,
  admin_confirmed TIMESTAMPTZ,
  plaid_connected TIMESTAMPTZ,
  admin_completed TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create simple_investments table if it doesn't exist
CREATE TABLE IF NOT EXISTS simple_investments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES simple_applications(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  annual_percentage NUMERIC NOT NULL,
  payment_frequency TEXT NOT NULL,
  term_months INTEGER NOT NULL,
  status workflow_step NOT NULL,
  activated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create admin_actions table if it doesn't exist
CREATE TABLE IF NOT EXISTS admin_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES simple_applications(id) ON DELETE CASCADE,
  admin_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create simple_notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS simple_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  application_id UUID REFERENCES simple_applications(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  notification_type TEXT NOT NULL,
  current_step workflow_step NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$
BEGIN
  RAISE NOTICE '✓ All simple workflow tables created successfully';
END $$;

-- ===============================================
-- STEP 3: ENABLE RLS SAFELY
-- ===============================================

DO $$
BEGIN
  -- Enable RLS on all tables
  ALTER TABLE simple_applications ENABLE ROW LEVEL SECURITY;
  ALTER TABLE simple_investments ENABLE ROW LEVEL SECURITY;
  ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;
  ALTER TABLE simple_notifications ENABLE ROW LEVEL SECURITY;
  
  RAISE NOTICE '✓ Row Level Security enabled on all tables';
END $$;

-- ===============================================
-- STEP 4: CREATE POLICIES SAFELY
-- ===============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "users_own_applications" ON simple_applications;
DROP POLICY IF EXISTS "admins_see_all_applications" ON simple_applications;
DROP POLICY IF EXISTS "users_own_investments" ON simple_investments;
DROP POLICY IF EXISTS "admins_see_all_investments" ON simple_investments;
DROP POLICY IF EXISTS "admins_see_admin_actions" ON admin_actions;
DROP POLICY IF EXISTS "users_own_notifications" ON simple_notifications;
DROP POLICY IF EXISTS "admins_see_all_notifications" ON simple_notifications;

-- Create policies
CREATE POLICY "users_own_applications" ON simple_applications
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "admins_see_all_applications" ON simple_applications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND (raw_user_meta_data->>'role' = 'admin' OR email LIKE '%@innercirclelending.com')
    )
  );

CREATE POLICY "users_own_investments" ON simple_investments
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "admins_see_all_investments" ON simple_investments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND (raw_user_meta_data->>'role' = 'admin' OR email LIKE '%@innercirclelending.com')
    )
  );

CREATE POLICY "admins_see_admin_actions" ON admin_actions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND (raw_user_meta_data->>'role' = 'admin' OR email LIKE '%@innercirclelending.com')
    )
  );

CREATE POLICY "users_own_notifications" ON simple_notifications
  FOR ALL USING (recipient_id = auth.uid());

CREATE POLICY "admins_see_all_notifications" ON simple_notifications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND (raw_user_meta_data->>'role' = 'admin' OR email LIKE '%@innercirclelending.com')
    )
  );

-- ===============================================
-- STEP 5: CREATE NEW FUNCTIONS SAFELY
-- ===============================================

-- Create application function
CREATE OR REPLACE FUNCTION create_simple_application(
  p_investment_amount NUMERIC,
  p_annual_percentage NUMERIC DEFAULT 12,
  p_payment_frequency TEXT DEFAULT 'monthly',
  p_term_months INTEGER DEFAULT 24
) RETURNS UUID AS $$
DECLARE
  v_application_id UUID;
BEGIN
  INSERT INTO simple_applications (
    user_id,
    investment_amount,
    annual_percentage,
    payment_frequency,
    term_months
  ) VALUES (
    auth.uid(),
    p_investment_amount,
    p_annual_percentage,
    p_payment_frequency,
    p_term_months
  ) RETURNING id INTO v_application_id;
  
  RETURN v_application_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- User workflow functions
CREATE OR REPLACE FUNCTION user_sign_subscription(p_application_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE simple_applications 
  SET 
    subscription_signed_by_user = NOW(),
    current_step = 'admin_review',
    updated_at = NOW()
  WHERE id = p_application_id AND user_id = auth.uid();
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin workflow functions
CREATE OR REPLACE FUNCTION admin_sign_subscription(p_application_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND (raw_user_meta_data->>'role' = 'admin' OR email LIKE '%@innercirclelending.com')
  ) THEN
    RAISE EXCEPTION 'Only admins can perform this action';
  END IF;
  
  UPDATE simple_applications 
  SET 
    subscription_signed_by_admin = NOW(),
    current_step = 'promissory_pending',
    updated_at = NOW()
  WHERE id = p_application_id;
  
  -- Create investment record
  INSERT INTO simple_investments (
    application_id,
    user_id,
    amount,
    annual_percentage,
    payment_frequency,
    term_months,
    status
  ) 
  SELECT 
    id,
    user_id,
    investment_amount,
    annual_percentage,
    payment_frequency,
    term_months,
    'promissory_pending'
  FROM simple_applications 
  WHERE id = p_application_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Query functions
CREATE OR REPLACE FUNCTION get_user_applications()
RETURNS SETOF simple_applications AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM simple_applications 
  WHERE user_id = auth.uid()
  ORDER BY updated_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_admin_applications()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  investment_amount NUMERIC,
  annual_percentage NUMERIC,
  payment_frequency TEXT,
  term_months INTEGER,
  current_step workflow_step,
  subscription_signed_by_user TIMESTAMPTZ,
  subscription_signed_by_admin TIMESTAMPTZ,
  promissory_note_created TIMESTAMPTZ,
  promissory_note_signed TIMESTAMPTZ,
  funds_received TIMESTAMPTZ,
  admin_confirmed TIMESTAMPTZ,
  plaid_connected TIMESTAMPTZ,
  admin_completed TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  user_email TEXT,
  user_first_name TEXT,
  user_last_name TEXT
) AS $$
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND (raw_user_meta_data->>'role' = 'admin' OR email LIKE '%@innercirclelending.com')
  ) THEN
    RAISE EXCEPTION 'Only admins can access this function';
  END IF;
  
  RETURN QUERY
  SELECT 
    a.id,
    a.user_id,
    a.investment_amount,
    a.annual_percentage,
    a.payment_frequency,
    a.term_months,
    a.current_step,
    a.subscription_signed_by_user,
    a.subscription_signed_by_admin,
    a.promissory_note_created,
    a.promissory_note_signed,
    a.funds_received,
    a.admin_confirmed,
    a.plaid_connected,
    a.admin_completed,
    a.created_at,
    a.updated_at,
    u.email,
    (u.raw_user_meta_data->>'first_name')::TEXT,
    (u.raw_user_meta_data->>'last_name')::TEXT
  FROM simple_applications a
  JOIN auth.users u ON u.id = a.user_id
  ORDER BY a.updated_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===============================================
-- STEP 6: GRANT PERMISSIONS SAFELY
-- ===============================================

DO $$
BEGIN
  -- Grant permissions on functions
  GRANT EXECUTE ON FUNCTION create_simple_application(NUMERIC, NUMERIC, TEXT, INTEGER) TO authenticated;
  GRANT EXECUTE ON FUNCTION user_sign_subscription(UUID) TO authenticated;
  GRANT EXECUTE ON FUNCTION admin_sign_subscription(UUID) TO authenticated;
  GRANT EXECUTE ON FUNCTION get_user_applications() TO authenticated;
  GRANT EXECUTE ON FUNCTION get_admin_applications() TO authenticated;
  
  RAISE NOTICE '✓ All permissions granted successfully';
END $$;

-- ===============================================
-- FINAL SUCCESS MESSAGE
-- ===============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🎉 SAFE MIGRATION COMPLETED SUCCESSFULLY!';
  RAISE NOTICE '';
  RAISE NOTICE '✅ WHAT WAS DONE:';
  RAISE NOTICE '   - Safely removed all conflicting functions';
  RAISE NOTICE '   - Created simple workflow tables';
  RAISE NOTICE '   - Set up Row Level Security';
  RAISE NOTICE '   - Created new workflow functions';
  RAISE NOTICE '   - Granted proper permissions';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 YOUR SYSTEM IS NOW READY!';
  RAISE NOTICE '   - Use the new SimpleWorkflowDashboard component';
  RAISE NOTICE '   - Call simple workflow functions from TypeScript';
  RAISE NOTICE '   - No more migration conflicts!';
  RAISE NOTICE '';
END $$;
