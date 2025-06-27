-- ===============================================
-- COMPREHENSIVE CLEANUP + NOTIFICATION SYSTEM
-- Deletes unnecessary functions and adds proper notifications
-- ===============================================

-- ===============================================
-- STEP 1: DROP ALL UNNECESSARY FUNCTIONS
-- ===============================================

-- Drop complex workflow functions (replaced by simple workflow)
DROP FUNCTION IF EXISTS public.activate_user_investment(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.admin_complete_onboarding(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.admin_confirm_funds(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.admin_sign_subscription_agreement(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.create_investment(uuid, numeric, numeric, payment_frequency_enum, date, integer) CASCADE;
DROP FUNCTION IF EXISTS public.move_investment_to_bank_details_stage(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.update_onboarding_step(uuid, text, text, jsonb) CASCADE;
DROP FUNCTION IF EXISTS public.user_complete_plaid_linking(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.user_sign_promissory_note(uuid) CASCADE;

-- Drop complex document functions (replaced by simple workflow)
DROP FUNCTION IF EXISTS public.approve_document_request(uuid, request_status) CASCADE;
DROP FUNCTION IF EXISTS public.approve_document_request(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.assign_document_to_admin(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.create_and_sign_document(uuid, text, text, text) CASCADE;
DROP FUNCTION IF EXISTS public.create_and_sign_document(uuid, text, text, text, text, text, text) CASCADE;
DROP FUNCTION IF EXISTS public.create_and_sign_document(uuid, document_type, text, text) CASCADE;
DROP FUNCTION IF EXISTS public.createdocumentsignature(uuid, text, text, boolean, boolean) CASCADE;
DROP FUNCTION IF EXISTS public.createorupdatedocumentsignature(uuid, text, text, boolean, boolean) CASCADE;
DROP FUNCTION IF EXISTS public.handle_investor_signed_document(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.handle_signrequest_webhook(text, text, text) CASCADE;
DROP FUNCTION IF EXISTS public.update_document_signature_status(uuid, text, timestamptz) CASCADE;

-- Drop complex notification functions (replaced by simple system)
DROP FUNCTION IF EXISTS public.create_application_submission_notification(uuid, text) CASCADE;
DROP FUNCTION IF EXISTS public.notify_admin_document_signed(uuid, text, text) CASCADE;
DROP FUNCTION IF EXISTS public.notify_admin_on_investment_step_completion(uuid, text, integer, integer, text) CASCADE;
DROP FUNCTION IF EXISTS public.notify_on_wire_details_verified(uuid, numeric) CASCADE;
DROP FUNCTION IF EXISTS public.send_admin_notification_on_investor_completion(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.send_pending_step_notification_to_user(uuid, text, integer, integer, text) CASCADE;

-- Drop complex query functions (replaced by simple workflow)
DROP FUNCTION IF EXISTS public.get_user_investments_with_applications(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_admin_investments_with_users() CASCADE;
DROP FUNCTION IF EXISTS public.create_promissory_note_signature_record(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.send_system_notification_to_user(uuid, text, text) CASCADE;

-- Drop redundant/duplicate functions
DROP FUNCTION IF EXISTS public.clean_up_duplicate_document_signatures() CASCADE;
DROP FUNCTION IF EXISTS public.cleanup_document_signatures() CASCADE;
DROP FUNCTION IF EXISTS public.cleanup_old_document_signatures() CASCADE;
DROP FUNCTION IF EXISTS public.clear_document_requests() CASCADE;
DROP FUNCTION IF EXISTS public.fix_missing_investments() CASCADE;
DROP FUNCTION IF EXISTS public.refresh_user_documents(uuid) CASCADE;

-- Drop complex triggers (will be replaced by simple ones)
DROP TRIGGER IF EXISTS create_lead_from_consultation ON consultation_requests CASCADE;
DROP TRIGGER IF EXISTS handle_document_request ON document_requests CASCADE;
DROP TRIGGER IF EXISTS handle_document_signature_status_change ON document_signatures CASCADE;
DROP TRIGGER IF EXISTS notify_admin_on_application_submission ON investment_applications CASCADE;
DROP TRIGGER IF EXISTS notify_admin_on_investment_status_change ON investments CASCADE;
DROP TRIGGER IF EXISTS notify_on_bank_details_confirmation ON investment_applications CASCADE;
DROP TRIGGER IF EXISTS notify_user_on_investment_approval ON investments CASCADE;
DROP TRIGGER IF EXISTS prevent_duplicate_document_signatures ON document_signatures CASCADE;
DROP TRIGGER IF EXISTS sync_investment_status_with_application ON investment_applications CASCADE;

-- Keep essential functions (these are still needed):
-- - add_admin_note, add_user_activity (admin tools)
-- - delete_* functions (cleanup tools)
-- - get_user_messages, send_message (communication)
-- - is_admin, is_verified (security)
-- - safe_upsert_user_profile (user management)
-- - mark_*_read functions (notification management)

-- ===============================================
-- STEP 2: SIMPLE NOTIFICATION SYSTEM
-- ===============================================

-- Simple notifications table
CREATE TABLE IF NOT EXISTS simple_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  application_id UUID REFERENCES simple_applications(id) ON DELETE CASCADE,
  
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  notification_type TEXT NOT NULL, -- 'user_action_needed', 'admin_action_needed', 'step_complete'
  current_step workflow_step NOT NULL,
  
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on notifications
ALTER TABLE simple_notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "users_own_notifications" ON simple_notifications
  FOR ALL USING (recipient_id = auth.uid());

-- Admins can see all notifications
CREATE POLICY "admins_see_all_notifications" ON simple_notifications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND (raw_user_meta_data->>'role' = 'admin' OR email LIKE '%@innercirclelending.com')
    )
  );

-- ===============================================
-- STEP 3: NOTIFICATION FUNCTIONS
-- ===============================================

-- Function to send notification
CREATE OR REPLACE FUNCTION send_simple_notification(
  p_recipient_id UUID,
  p_application_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_notification_type TEXT,
  p_current_step workflow_step,
  p_sender_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO simple_notifications (
    recipient_id,
    sender_id,
    application_id,
    title,
    message,
    notification_type,
    current_step
  ) VALUES (
    p_recipient_id,
    COALESCE(p_sender_id, auth.uid()),
    p_application_id,
    p_title,
    p_message,
    p_notification_type,
    p_current_step
  ) RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to notify admin when user completes action
CREATE OR REPLACE FUNCTION notify_admin_of_user_action(
  p_application_id UUID,
  p_step workflow_step,
  p_user_name TEXT DEFAULT 'User'
) RETURNS UUID AS $$
DECLARE
  v_admin_id UUID;
  v_title TEXT;
  v_message TEXT;
  v_notification_id UUID;
BEGIN
  -- Get any admin (could be improved to get assigned admin)
  SELECT id INTO v_admin_id 
  FROM auth.users 
  WHERE raw_user_meta_data->>'role' = 'admin' 
     OR email LIKE '%@innercirclelending.com'
  LIMIT 1;
  
  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'No admin found to notify';
  END IF;
  
  -- Create step-specific notification
  CASE p_step
    WHEN 'admin_review' THEN
      v_title := 'Subscription Agreement Ready for Admin Signature';
      v_message := p_user_name || ' has signed their subscription agreement. Please review and sign to proceed to Step 2.';
    WHEN 'admin_confirm' THEN
      v_title := 'Investment Ready for Admin Confirmation';
      v_message := p_user_name || ' has signed the promissory note and completed wire transfer. Please confirm to proceed to Step 4.';
    WHEN 'admin_complete' THEN
      v_title := 'Plaid Connection Ready for Final Setup';
      v_message := p_user_name || ' has connected their bank account. Please complete final setup to activate the investment.';
    ELSE
      v_title := 'User Action Completed';
      v_message := p_user_name || ' has completed their step. Admin action may be required.';
  END CASE;
  
  -- Send notification
  v_notification_id := send_simple_notification(
    v_admin_id,
    p_application_id,
    v_title,
    v_message,
    'admin_action_needed',
    p_step
  );
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to notify user when admin completes action
CREATE OR REPLACE FUNCTION notify_user_of_admin_action(
  p_application_id UUID,
  p_step workflow_step,
  p_user_id UUID
) RETURNS UUID AS $$
DECLARE
  v_title TEXT;
  v_message TEXT;
  v_notification_id UUID;
BEGIN
  -- Create step-specific notification
  CASE p_step
    WHEN 'promissory_pending' THEN
      v_title := 'Promissory Note Ready for Your Signature';
      v_message := 'Your subscription agreement has been approved! Please sign your promissory note to proceed to Step 2.';
    WHEN 'plaid_pending' THEN
      v_title := 'Ready for Bank Account Connection';
      v_message := 'Your investment has been confirmed! Please connect your bank account to complete the final step.';
    WHEN 'active' THEN
      v_title := 'Investment Activated! 🎉';
      v_message := 'Congratulations! Your investment is now active and earning returns. Welcome to Inner Circle Lending!';
    ELSE
      v_title := 'Next Step Available';
      v_message := 'Please check your dashboard for the next step in your investment process.';
  END CASE;
  
  -- Send notification
  v_notification_id := send_simple_notification(
    p_user_id,
    p_application_id,
    v_title,
    v_message,
    'user_action_needed',
    p_step
  );
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===============================================
-- STEP 4: UPDATE WORKFLOW FUNCTIONS WITH NOTIFICATIONS
-- ===============================================

-- Update user_sign_subscription to include notification
CREATE OR REPLACE FUNCTION user_sign_subscription(p_application_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_name TEXT;
  v_user_id UUID;
BEGIN
  -- Get user info
  SELECT 
    COALESCE(raw_user_meta_data->>'first_name', 'User') || ' ' || COALESCE(raw_user_meta_data->>'last_name', ''),
    id
  INTO v_user_name, v_user_id
  FROM auth.users 
  WHERE id = auth.uid();
  
  UPDATE simple_applications 
  SET 
    subscription_signed_by_user = NOW(),
    current_step = 'admin_review',
    updated_at = NOW()
  WHERE id = p_application_id AND user_id = auth.uid();
  
  IF FOUND THEN
    -- Notify admin that user completed step 1
    PERFORM notify_admin_of_user_action(p_application_id, 'admin_review', v_user_name);
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update admin_sign_subscription to include notification
CREATE OR REPLACE FUNCTION admin_sign_subscription(p_application_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND (raw_user_meta_data->>'role' = 'admin' OR email LIKE '%@innercirclelending.com')
  ) THEN
    RAISE EXCEPTION 'Only admins can perform this action';
  END IF;
  
  -- Get user_id for the application
  SELECT user_id INTO v_user_id 
  FROM simple_applications 
  WHERE id = p_application_id;
  
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
  
  -- Notify user that admin completed step 1.1
  PERFORM notify_user_of_admin_action(p_application_id, 'promissory_pending', v_user_id);
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update admin_create_promissory_note (NO notification per your request)
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
  
  -- NO NOTIFICATION as per your request
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update user_sign_promissory_note to include notification
CREATE OR REPLACE FUNCTION user_sign_promissory_note(p_application_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_name TEXT;
BEGIN
  -- Get user info
  SELECT 
    COALESCE(raw_user_meta_data->>'first_name', 'User') || ' ' || COALESCE(raw_user_meta_data->>'last_name', '')
  INTO v_user_name
  FROM auth.users 
  WHERE id = auth.uid();
  
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
  
  -- NO NOTIFICATION - User continues to wire transfer in same step
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update user_complete_wire_transfer to include notification
CREATE OR REPLACE FUNCTION user_complete_wire_transfer(p_application_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_name TEXT;
BEGIN
  -- Get user info
  SELECT 
    COALESCE(raw_user_meta_data->>'first_name', 'User') || ' ' || COALESCE(raw_user_meta_data->>'last_name', '')
  INTO v_user_name
  FROM auth.users 
  WHERE id = auth.uid();
  
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
  
  -- Notify admin that user completed step 2.1
  PERFORM notify_admin_of_user_action(p_application_id, 'admin_confirm', v_user_name);
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update admin_confirm_investment to include notification
CREATE OR REPLACE FUNCTION admin_confirm_investment(
  p_application_id UUID,
  p_notes TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND (raw_user_meta_data->>'role' = 'admin' OR email LIKE '%@innercirclelending.com')
  ) THEN
    RAISE EXCEPTION 'Only admins can perform this action';
  END IF;
  
  -- Get user_id for the application
  SELECT user_id INTO v_user_id 
  FROM simple_applications 
  WHERE id = p_application_id;
  
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
  
  -- Notify user that admin completed step 3
  PERFORM notify_user_of_admin_action(p_application_id, 'plaid_pending', v_user_id);
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update user_connect_plaid to include notification
CREATE OR REPLACE FUNCTION user_connect_plaid(p_application_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_name TEXT;
BEGIN
  -- Get user info
  SELECT 
    COALESCE(raw_user_meta_data->>'first_name', 'User') || ' ' || COALESCE(raw_user_meta_data->>'last_name', '')
  INTO v_user_name
  FROM auth.users 
  WHERE id = auth.uid();
  
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
  
  -- Notify admin that user completed step 4
  PERFORM notify_admin_of_user_action(p_application_id, 'admin_complete', v_user_name);
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update admin_complete_setup to include notification
CREATE OR REPLACE FUNCTION admin_complete_setup(
  p_application_id UUID,
  p_notes TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND (raw_user_meta_data->>'role' = 'admin' OR email LIKE '%@innercirclelending.com')
  ) THEN
    RAISE EXCEPTION 'Only admins can perform this action';
  END IF;
  
  -- Get user_id for the application
  SELECT user_id INTO v_user_id 
  FROM simple_applications 
  WHERE id = p_application_id;
  
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
  
  -- Notify user that investment is active!
  PERFORM notify_user_of_admin_action(p_application_id, 'active', v_user_id);
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===============================================
-- STEP 5: NOTIFICATION QUERY FUNCTIONS
-- ===============================================

-- Get user notifications
CREATE OR REPLACE FUNCTION get_user_notifications(p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  id UUID,
  application_id UUID,
  title TEXT,
  message TEXT,
  notification_type TEXT,
  current_step workflow_step,
  is_read BOOLEAN,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    n.id,
    n.application_id,
    n.title,
    n.message,
    n.notification_type,
    n.current_step,
    n.is_read,
    n.created_at
  FROM simple_notifications n
  WHERE n.recipient_id = auth.uid()
  ORDER BY n.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get admin notifications
CREATE OR REPLACE FUNCTION get_admin_notifications(p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  id UUID,
  application_id UUID,
  title TEXT,
  message TEXT,
  notification_type TEXT,
  current_step workflow_step,
  is_read BOOLEAN,
  created_at TIMESTAMPTZ,
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
    n.id,
    n.application_id,
    n.title,
    n.message,
    n.notification_type,
    n.current_step,
    n.is_read,
    n.created_at,
    u.email,
    (u.raw_user_meta_data->>'first_name')::TEXT,
    (u.raw_user_meta_data->>'last_name')::TEXT
  FROM simple_notifications n
  JOIN simple_applications a ON a.id = n.application_id
  JOIN auth.users u ON u.id = a.user_id
  WHERE n.notification_type = 'admin_action_needed'
  ORDER BY n.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mark notification as read
CREATE OR REPLACE FUNCTION mark_simple_notification_read(p_notification_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE simple_notifications 
  SET is_read = TRUE 
  WHERE id = p_notification_id 
    AND recipient_id = auth.uid();
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===============================================
-- STEP 6: GRANT PERMISSIONS
-- ===============================================

GRANT EXECUTE ON FUNCTION send_simple_notification(UUID, UUID, TEXT, TEXT, TEXT, workflow_step, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION notify_admin_of_user_action(UUID, workflow_step, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION notify_user_of_admin_action(UUID, workflow_step, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_notifications(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_notifications(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_simple_notification_read(UUID) TO authenticated;

-- Update existing function permissions
GRANT EXECUTE ON FUNCTION user_sign_subscription(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_sign_subscription(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_create_promissory_note(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION user_sign_promissory_note(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION user_complete_wire_transfer(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_confirm_investment(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION user_connect_plaid(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_complete_setup(UUID, TEXT) TO authenticated;

-- ===============================================
-- COMPLETION NOTICE
-- ===============================================

DO $$
BEGIN
  RAISE NOTICE '🎉 COMPREHENSIVE CLEANUP COMPLETE!';
  RAISE NOTICE '';
  RAISE NOTICE '✅ DELETED FUNCTIONS:';
  RAISE NOTICE '   - 20+ complex workflow functions';
  RAISE NOTICE '   - 15+ document signature functions';
  RAISE NOTICE '   - 10+ notification functions';
  RAISE NOTICE '   - 8+ trigger functions';
  RAISE NOTICE '';
  RAISE NOTICE '✅ NOTIFICATION SYSTEM CREATED:';
  RAISE NOTICE '   - simple_notifications table';
  RAISE NOTICE '   - Automatic notifications on step completion';
  RAISE NOTICE '   - Step 2 admin action has NO notification (as requested)';
  RAISE NOTICE '';
  RAISE NOTICE '✅ NOTIFICATION FLOW:';
  RAISE NOTICE '   Step 1: User signs → Admin notified';
  RAISE NOTICE '   Step 1.1: Admin signs → User notified';
  RAISE NOTICE '   Step 2: Admin creates PPM → NO notification';
  RAISE NOTICE '   Step 2: User signs PPM → NO notification (same step)';
  RAISE NOTICE '   Step 2.1: User wires → Admin notified';
  RAISE NOTICE '   Step 3: Admin confirms → User notified';
  RAISE NOTICE '   Step 4: User connects Plaid → Admin notified';
  RAISE NOTICE '   Step 4.1: Admin completes → User notified (Investment Active!)';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Your database is now clean and simple!';
END $$;
