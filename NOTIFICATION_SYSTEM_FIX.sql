-- ===============================
-- NOTIFICATION SYSTEM FOR VERIFICATION WORKFLOW
-- Created: July 3, 2025
-- ===============================

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    title text NOT NULL,
    message text NOT NULL,
    type text NOT NULL DEFAULT 'info', -- 'info', 'success', 'warning', 'error'
    action_type text, -- 'verification_request', 'verification_approved', 'verification_denied'
    action_data jsonb, -- Store related data like user_id for admin notifications
    is_read boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- RLS Policies for notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can see their own notifications
CREATE POLICY "notifications_user_access" ON notifications
    FOR ALL USING (auth.uid() = user_id);

-- Admins can see all notifications
CREATE POLICY "notifications_admin_access" ON notifications
    FOR ALL USING (auth.email() = 'innercirclelending@gmail.com');

-- Function to create notification for user
DROP FUNCTION IF EXISTS create_notification(uuid, text, text, text, text, jsonb);
CREATE OR REPLACE FUNCTION create_notification(
    p_user_id uuid,
    p_title text,
    p_message text,
    p_type text DEFAULT 'info',
    p_action_type text DEFAULT NULL,
    p_action_data jsonb DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    notification_id uuid;
BEGIN
    INSERT INTO notifications (user_id, title, message, type, action_type, action_data)
    VALUES (p_user_id, p_title, p_message, p_type, p_action_type, p_action_data)
    RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$;

-- Function to create admin notification for verification requests
DROP FUNCTION IF EXISTS create_admin_verification_notification(uuid, text);
CREATE OR REPLACE FUNCTION create_admin_verification_notification(
    p_requesting_user_id uuid,
    p_requesting_user_email text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    admin_user_id uuid;
    notification_id uuid;
BEGIN
    -- Get admin user ID
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = 'innercirclelending@gmail.com' 
    LIMIT 1;
    
    IF admin_user_id IS NOT NULL THEN
        INSERT INTO notifications (
            user_id, 
            title, 
            message, 
            type, 
            action_type, 
            action_data
        )
        VALUES (
            admin_user_id,
            'New Verification Request',
            'User ' || p_requesting_user_email || ' has requested verification.',
            'info',
            'verification_request',
            jsonb_build_object('requesting_user_id', p_requesting_user_id, 'requesting_user_email', p_requesting_user_email)
        )
        RETURNING id INTO notification_id;
    END IF;
    
    RETURN notification_id;
END;
$$;

-- Function to notify user of verification status change
DROP FUNCTION IF EXISTS notify_verification_status_change(uuid, text);
CREATE OR REPLACE FUNCTION notify_verification_status_change(
    p_user_id uuid,
    p_status text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    notification_id uuid;
    title_text text;
    message_text text;
    type_text text;
BEGIN
    IF p_status = 'verified' THEN
        title_text := 'Verification Approved';
        message_text := 'Congratulations! Your account has been verified. You now have access to all platform features.';
        type_text := 'success';
    ELSIF p_status = 'denied' THEN
        title_text := 'Verification Denied';
        message_text := 'Your verification request has been reviewed and unfortunately was not approved. Please contact support for more information.';
        type_text := 'warning';
    ELSE
        RETURN NULL;
    END IF;
    
    INSERT INTO notifications (user_id, title, message, type, action_type)
    VALUES (p_user_id, title_text, message_text, type_text, 'verification_' || p_status)
    RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$;

-- Function to mark notification as read
DROP FUNCTION IF EXISTS mark_notification_read(uuid);
CREATE OR REPLACE FUNCTION mark_notification_read(p_notification_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE notifications 
    SET is_read = true, updated_at = now()
    WHERE id = p_notification_id AND user_id = auth.uid();
    
    RETURN FOUND;
END;
$$;

-- Function to get unread notification count
DROP FUNCTION IF EXISTS get_unread_notification_count();
CREATE OR REPLACE FUNCTION get_unread_notification_count()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    count_result integer;
BEGIN
    SELECT COUNT(*) INTO count_result
    FROM notifications
    WHERE user_id = auth.uid() AND is_read = false;
    
    RETURN count_result;
END;
$$;
