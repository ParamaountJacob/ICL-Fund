-- ===============================================
-- CLEAN SIMPLE WORKFLOW MIGRATION
-- Replaces the overly complex workflow with simple steps
-- ===============================================

-- Drop all existing complex functions and triggers
DROP FUNCTION IF EXISTS public.create_investment_on_application_submit() CASCADE;
DROP FUNCTION IF EXISTS public.update_onboarding_step(uuid, text, text, jsonb) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_investments_with_applications(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_admin_investments_with_users() CASCADE;
DROP FUNCTION IF EXISTS public.create_promissory_note_signature_record(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.send_system_notification_to_user(uuid, text, text) CASCADE;

-- Clean up overly complex status enums
DROP TYPE IF EXISTS application_onboarding_status CASCADE;
DROP TYPE IF EXISTS investment_status CASCADE;
DROP TYPE IF EXISTS signature_status CASCADE;

-- Create simple, clear status types
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

-- Simplified applications table
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
  
  -- Simple metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Simplified investments table
CREATE TABLE IF NOT EXISTS simple_investments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES simple_applications(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  annual_percentage NUMERIC NOT NULL,
  payment_frequency TEXT NOT NULL,
  term_months INTEGER NOT NULL,
  status workflow_step NOT NULL DEFAULT 'subscription_pending',
  activated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Simple admin actions log
CREATE TABLE IF NOT EXISTS admin_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES simple_applications(id) ON DELETE CASCADE,
  admin_user_id UUID REFERENCES auth.users(id),
  action_type TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE simple_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE simple_investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;

-- Simple RLS policies
CREATE POLICY "users_own_applications" ON simple_applications
  FOR ALL USING (auth.uid() = user_id);
  
CREATE POLICY "users_own_investments" ON simple_investments
  FOR ALL USING (auth.uid() = user_id);

-- Admins can see everything (simplified admin check)
CREATE POLICY "admins_see_all_applications" ON simple_applications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND (raw_user_meta_data->>'role' = 'admin' OR email LIKE '%@innercirclelending.com')
    )
  );

CREATE POLICY "admins_see_all_investments" ON simple_investments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND (raw_user_meta_data->>'role' = 'admin' OR email LIKE '%@innercirclelending.com')
    )
  );

CREATE POLICY "admins_manage_actions" ON admin_actions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND (raw_user_meta_data->>'role' = 'admin' OR email LIKE '%@innercirclelending.com')
    )
  );

-- ===============================================
-- SIMPLE WORKFLOW FUNCTIONS
-- ===============================================

-- Function 1: Create application (Step 1)
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
    term_months,
    current_step
  ) VALUES (
    auth.uid(),
    p_investment_amount,
    p_annual_percentage,
    p_payment_frequency,
    p_term_months,
    'subscription_pending'
  ) RETURNING id INTO v_application_id;
  
  RETURN v_application_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function 2: User signs subscription agreement (Step 1)
CREATE OR REPLACE FUNCTION user_sign_subscription(p_application_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE simple_applications 
  SET 
    subscription_signed_by_user = NOW(),
    current_step = 'admin_review',
    updated_at = NOW()
  WHERE id = p_application_id AND user_id = auth.uid();
  
  IF FOUND THEN
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function 3: Admin signs subscription agreement (Step 1.1)
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
  
  -- Log admin action
  INSERT INTO admin_actions (application_id, admin_user_id, action_type, notes)
  VALUES (p_application_id, auth.uid(), 'signed_subscription', 'Admin signed subscription agreement');
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function 4: Admin creates and sends promissory note (Step 2)
CREATE OR REPLACE FUNCTION admin_create_promissory_note(
  p_application_id UUID,
  p_notes TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
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
    promissory_note_created = NOW(),
    updated_at = NOW()
  WHERE id = p_application_id;
  
  UPDATE simple_investments 
  SET 
    status = 'promissory_pending',
    updated_at = NOW()
  WHERE application_id = p_application_id;
  
  -- Log admin action
  INSERT INTO admin_actions (application_id, admin_user_id, action_type, notes)
  VALUES (p_application_id, auth.uid(), 'created_promissory_note', COALESCE(p_notes, 'Created promissory note'));
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function 5: User signs promissory note (Step 2)
CREATE OR REPLACE FUNCTION user_sign_promissory_note(p_application_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE simple_applications 
  SET 
    promissory_note_signed = NOW(),
    current_step = 'funds_pending',
    updated_at = NOW()
  WHERE id = p_application_id AND user_id = auth.uid();
  
  UPDATE simple_investments 
  SET 
    status = 'funds_pending',
    updated_at = NOW()
  WHERE application_id = p_application_id AND user_id = auth.uid();
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function 6: User completes wire transfer (Step 2.1)
CREATE OR REPLACE FUNCTION user_complete_wire_transfer(p_application_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE simple_applications 
  SET 
    funds_received = NOW(),
    current_step = 'admin_confirm',
    updated_at = NOW()
  WHERE id = p_application_id AND user_id = auth.uid();
  
  UPDATE simple_investments 
  SET 
    status = 'admin_confirm',
    updated_at = NOW()
  WHERE application_id = p_application_id AND user_id = auth.uid();
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function 7: Admin confirms everything (Step 3)
CREATE OR REPLACE FUNCTION admin_confirm_investment(
  p_application_id UUID,
  p_notes TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
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
    admin_confirmed = NOW(),
    current_step = 'plaid_pending',
    updated_at = NOW()
  WHERE id = p_application_id;
  
  UPDATE simple_investments 
  SET 
    status = 'plaid_pending',
    updated_at = NOW()
  WHERE application_id = p_application_id;
  
  -- Log admin action
  INSERT INTO admin_actions (application_id, admin_user_id, action_type, notes)
  VALUES (p_application_id, auth.uid(), 'confirmed_investment', COALESCE(p_notes, 'Confirmed promissory note and funds'));
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function 8: User connects Plaid (Step 4)
CREATE OR REPLACE FUNCTION user_connect_plaid(p_application_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE simple_applications 
  SET 
    plaid_connected = NOW(),
    current_step = 'admin_complete',
    updated_at = NOW()
  WHERE id = p_application_id AND user_id = auth.uid();
  
  UPDATE simple_investments 
  SET 
    status = 'admin_complete',
    updated_at = NOW()
  WHERE application_id = p_application_id AND user_id = auth.uid();
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function 9: Admin completes setup (Step 4.1)
CREATE OR REPLACE FUNCTION admin_complete_setup(
  p_application_id UUID,
  p_notes TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
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
    admin_completed = NOW(),
    current_step = 'active',
    updated_at = NOW()
  WHERE id = p_application_id;
  
  UPDATE simple_investments 
  SET 
    status = 'active',
    activated_at = NOW(),
    updated_at = NOW()
  WHERE application_id = p_application_id;
  
  -- Log admin action
  INSERT INTO admin_actions (application_id, admin_user_id, action_type, notes)
  VALUES (p_application_id, auth.uid(), 'completed_setup', COALESCE(p_notes, 'Completed investment setup'));
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===============================================
-- SIMPLE QUERY FUNCTIONS
-- ===============================================

-- Get user's applications
CREATE OR REPLACE FUNCTION get_user_applications()
RETURNS TABLE (
  id UUID,
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
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
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
    a.updated_at
  FROM simple_applications a
  WHERE a.user_id = auth.uid()
  ORDER BY a.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get admin view of all applications
CREATE OR REPLACE FUNCTION get_admin_applications()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  user_email TEXT,
  user_first_name TEXT,
  user_last_name TEXT,
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
  updated_at TIMESTAMPTZ
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
    u.email,
    (u.raw_user_meta_data->>'first_name')::TEXT,
    (u.raw_user_meta_data->>'last_name')::TEXT,
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
    a.updated_at
  FROM simple_applications a
  JOIN auth.users u ON u.id = a.user_id
  ORDER BY a.updated_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION create_simple_application(NUMERIC, NUMERIC, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION user_sign_subscription(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_sign_subscription(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_create_promissory_note(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION user_sign_promissory_note(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION user_complete_wire_transfer(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_confirm_investment(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION user_connect_plaid(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_complete_setup(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_applications() TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_applications() TO authenticated;

-- Create notification for completion
DO $$
BEGIN
  RAISE NOTICE 'Clean Simple Workflow Migration Complete!';
  RAISE NOTICE 'New tables: simple_applications, simple_investments, admin_actions';
  RAISE NOTICE 'Simple workflow steps: subscription_pending → admin_review → promissory_pending → funds_pending → admin_confirm → plaid_pending → admin_complete → active';
  RAISE NOTICE 'Functions ready for frontend integration';
END $$;
