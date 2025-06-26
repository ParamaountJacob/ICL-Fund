/*
  # Fix Admin Notification Email NULL Constraint

  1. Changes
    - Update notify_admin_on_investment_status_change function to handle NULL user emails
    - Update update_onboarding_step function to properly fetch user email
    - Add COALESCE to prevent NULL values in user_email column

  2. Security
    - Maintains existing security model with no changes to RLS policies
*/

-- Create or replace the function that creates notifications to handle NULL emails properly
CREATE OR REPLACE FUNCTION notify_admin_on_investment_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_email text;
  v_user_name text;
BEGIN
  -- Get user details with proper NULL handling
  SELECT 
    COALESCE(u.email, 'unknown@email.com'),
    COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '')
  INTO
    v_user_email,
    v_user_name
  FROM users u
  WHERE u.id = NEW.user_id;
  
  -- Only notify if status changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Create admin notification with NULL-safe email
    INSERT INTO admin_notifications (
      application_id,
      user_id,
      user_email,  -- This will never be NULL now
      message,
      notification_type,
      is_read
    ) VALUES (
      NEW.id,
      NEW.user_id,
      COALESCE(v_user_email, 'unknown@email.com'),  -- Double protection against NULL
      COALESCE(v_user_name, 'User') || ' investment application status updated to ' || NEW.status,
      'investment_status_changed',
      false
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Fix the update_onboarding_step function to properly handle user email
CREATE OR REPLACE FUNCTION update_onboarding_step(
    application_id uuid,
    step_name text,
    p_status text,
    metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_user_email text;
  v_old_status text;
  v_current_user uuid;
BEGIN
  -- Get the current user
  v_current_user := auth.uid();
  
  -- Get application details including user ID
  SELECT 
    a.user_id, 
    a.status
  INTO 
    v_user_id, 
    v_old_status
  FROM 
    investment_applications a
  WHERE 
    a.id = application_id;
    
  -- Get user email with NULL handling
  SELECT COALESCE(email, 'unknown@email.com') 
  INTO v_user_email 
  FROM users 
  WHERE id = v_user_id;
  
  -- Update application status
  UPDATE investment_applications
  SET 
    status = p_status,
    updated_at = NOW()
  WHERE id = application_id;
  
  -- Create notification if status changed
  IF p_status IS DISTINCT FROM v_old_status THEN
    -- Insert notification with NULL-safe email
    INSERT INTO admin_notifications (
      application_id,
      user_id,
      user_email,  -- This will never be NULL now
      message,
      notification_type,
      is_read
    ) VALUES (
      application_id,
      v_user_id,
      COALESCE(v_user_email, 'unknown@email.com'),  -- Double protection against NULL
      'Investment application status updated to: ' || p_status,
      'status_update',
      false
    );
    
    -- Log activity
    INSERT INTO user_activity (
      user_id,
      action_type,
      action_description,
      performed_by
    ) VALUES (
      v_user_id,
      'status_update',
      'Investment application status updated to: ' || p_status,
      COALESCE(v_current_user, v_user_id)  -- Use current user or application user
    );
  END IF;
END;
$$;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION update_onboarding_step(uuid, text, text, jsonb) TO authenticated;