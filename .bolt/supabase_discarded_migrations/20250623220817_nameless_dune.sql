/*
  # Fix Ambiguous ID in Admin Notifications Query

  1. Changes
     - Fix the ambiguous column reference "id" in the get_admin_notifications function
     - Ensure all column references are properly qualified with table aliases
     - Add proper table aliases to all queries in the function
*/

-- Drop and recreate the get_admin_notifications function with fixed column references
CREATE OR REPLACE FUNCTION public.get_admin_notifications(
  p_limit integer DEFAULT 10,
  p_offset integer DEFAULT 0
)
RETURNS SETOF public.admin_notifications
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT an.*
  FROM admin_notifications an
  ORDER BY an.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_admin_notifications(integer, integer) TO authenticated;

-- Fix the get_unread_notification_count function if it exists
CREATE OR REPLACE FUNCTION public.get_unread_notification_count()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM admin_notifications an
  WHERE an.is_read = false;
  
  RETURN v_count;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_unread_notification_count() TO authenticated;

-- Fix the mark_notification_read function if it exists
CREATE OR REPLACE FUNCTION public.mark_notification_read(
  p_notification_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE admin_notifications
  SET is_read = true
  WHERE id = p_notification_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.mark_notification_read(uuid) TO authenticated;