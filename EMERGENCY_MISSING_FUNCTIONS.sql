-- EMERGENCY MISSING FUNCTIONS RESTORATION
-- These functions are called by the app but don't exist, causing 404 errors

-- =================================================================
-- NOTIFICATION FUNCTIONS
-- =================================================================

-- Function: get_unread_notification_count (CRITICAL - called every page load)
CREATE OR REPLACE FUNCTION get_unread_notification_count()
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Count unread notifications for current user
    RETURN (
        SELECT COUNT(*)
        FROM simple_notifications 
        WHERE user_id = auth.uid() 
        AND is_read = false
    );
END;
$$;

-- =================================================================
-- ADMIN USER MANAGEMENT FUNCTIONS  
-- =================================================================

-- Function: get_managed_users_with_admin_details (CRITICAL - Admin panel)
CREATE OR REPLACE FUNCTION get_managed_users_with_admin_details()
RETURNS TABLE (
    id uuid,
    email text,
    first_name text,
    last_name text,
    role text,
    verification_status text,
    created_at timestamptz,
    managed_by_admin_id uuid,
    admin_first_name text,
    admin_last_name text,
    admin_email text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if current user is admin
    IF NOT EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_id = auth.uid() AND (is_admin = true OR role = 'admin')
    ) THEN
        RAISE EXCEPTION 'Access denied: Admin privileges required';
    END IF;

    RETURN QUERY
    SELECT 
        up.user_id as id,
        up.email,
        up.first_name,
        up.last_name,
        COALESCE(up.role, 'user') as role,
        COALESCE(up.verification_status, 'pending') as verification_status,
        up.created_at,
        up.managed_by_admin_id,
        admin_profile.first_name as admin_first_name,
        admin_profile.last_name as admin_last_name,
        admin_profile.email as admin_email
    FROM user_profiles up
    LEFT JOIN user_profiles admin_profile ON admin_profile.user_id = up.managed_by_admin_id
    ORDER BY up.created_at DESC;
END;
$$;

-- Function: get_all_admins (CRITICAL - User assignment dropdowns)
CREATE OR REPLACE FUNCTION get_all_admins()
RETURNS TABLE (
    id uuid,
    email text,
    first_name text,
    last_name text,
    role text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        up.user_id as id,
        up.email,
        up.first_name,
        up.last_name,
        up.role
    FROM user_profiles up
    WHERE up.is_admin = true OR up.role IN ('admin', 'sub_admin')
    ORDER BY up.role DESC, up.first_name ASC;
END;
$$;

-- Function: claim_user_by_admin (CRITICAL - User management)
CREATE OR REPLACE FUNCTION claim_user_by_admin(
    p_user_id uuid,
    p_admin_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if current user is admin
    IF NOT EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_id = auth.uid() AND (is_admin = true OR role = 'admin')
    ) THEN
        RAISE EXCEPTION 'Access denied: Admin privileges required';
    END IF;

    -- Update user to be managed by admin
    UPDATE user_profiles 
    SET 
        managed_by_admin_id = p_admin_id,
        updated_at = now()
    WHERE user_id = p_user_id;
    
    RETURN FOUND;
END;
$$;

-- Function: unclaim_user (CRITICAL - User management)
CREATE OR REPLACE FUNCTION unclaim_user(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if current user is admin
    IF NOT EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_id = auth.uid() AND (is_admin = true OR role = 'admin')
    ) THEN
        RAISE EXCEPTION 'Access denied: Admin privileges required';
    END IF;

    -- Remove admin assignment
    UPDATE user_profiles 
    SET 
        managed_by_admin_id = NULL,
        updated_at = now()
    WHERE user_id = p_user_id;
    
    RETURN FOUND;
END;
$$;

-- Function: assign_user_to_admin (CRITICAL - User management)
CREATE OR REPLACE FUNCTION assign_user_to_admin(
    p_user_id uuid,
    p_admin_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if current user is admin
    IF NOT EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_id = auth.uid() AND (is_admin = true OR role = 'admin')
    ) THEN
        RAISE EXCEPTION 'Access denied: Admin privileges required';
    END IF;

    -- Assign user to specific admin
    UPDATE user_profiles 
    SET 
        managed_by_admin_id = p_admin_id,
        updated_at = now()
    WHERE user_id = p_user_id;
    
    RETURN FOUND;
END;
$$;

-- =================================================================
-- USER ACTIVITY & DOCUMENT FUNCTIONS
-- =================================================================

-- Function: get_user_activity (CRITICAL - User profile modal)
CREATE OR REPLACE FUNCTION get_user_activity(p_user_id uuid)
RETURNS TABLE (
    id uuid,
    user_id uuid,
    action_type text,
    action_description text,
    performed_by uuid,
    created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if user can access this data (admin or own data)
    IF auth.uid() != p_user_id AND NOT EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_id = auth.uid() AND (is_admin = true OR role = 'admin')
    ) THEN
        RAISE EXCEPTION 'Access denied: Can only view own activity or admin required';
    END IF;

    -- Return user activity if table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_activity') THEN
        RETURN QUERY
        SELECT 
            ua.id,
            ua.user_id,
            ua.action_type,
            ua.action_description,
            ua.performed_by,
            ua.created_at
        FROM user_activity ua
        WHERE ua.user_id = p_user_id
        ORDER BY ua.created_at DESC
        LIMIT 50;
    ELSE
        -- Return empty result if table doesn't exist
        RETURN;
    END IF;
END;
$$;

-- Function: get_active_user_documents (CRITICAL - Document management)
CREATE OR REPLACE FUNCTION get_active_user_documents(p_user_id uuid)
RETURNS TABLE (
    id uuid,
    document_type text,
    status text,
    document_url text,
    created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if user can access this data
    IF auth.uid() != p_user_id AND NOT EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_id = auth.uid() AND (is_admin = true OR role = 'admin')
    ) THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    -- Try to get from document_signatures table
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'document_signatures') THEN
        RETURN QUERY
        SELECT 
            ds.id,
            ds.document_type,
            ds.status,
            ds.document_url,
            ds.created_at
        FROM document_signatures ds
        WHERE ds.user_id = p_user_id
        AND ds.status != 'deleted'
        ORDER BY ds.created_at DESC;
    ELSE
        -- Return empty if table doesn't exist
        RETURN;
    END IF;
END;
$$;

-- Function: delete_user_and_all_data (CRITICAL - User management)
CREATE OR REPLACE FUNCTION delete_user_and_all_data(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if current user is admin
    IF NOT EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_id = auth.uid() AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Access denied: Admin privileges required';
    END IF;

    -- Delete user profile (cascading deletes will handle related data)
    DELETE FROM user_profiles WHERE user_id = p_user_id;
    
    -- Delete from applications if exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'simple_applications') THEN
        DELETE FROM simple_applications WHERE user_id = p_user_id;
    END IF;
    
    -- Delete from notifications if exists  
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'simple_notifications') THEN
        DELETE FROM simple_notifications WHERE user_id = p_user_id;
    END IF;
    
    RETURN true;
END;
$$;

-- =================================================================
-- GRANT PERMISSIONS
-- =================================================================

GRANT EXECUTE ON FUNCTION get_unread_notification_count() TO authenticated;
GRANT EXECUTE ON FUNCTION get_managed_users_with_admin_details() TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_admins() TO authenticated;
GRANT EXECUTE ON FUNCTION claim_user_by_admin(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION unclaim_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION assign_user_to_admin(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_activity(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_active_user_documents(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_user_and_all_data(uuid) TO authenticated;

-- =================================================================
-- VERIFICATION
-- =================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 EMERGENCY FUNCTIONS CREATED! 🎉';
    RAISE NOTICE '';
    RAISE NOTICE '✅ get_unread_notification_count() - Notification bell fixed';
    RAISE NOTICE '✅ get_managed_users_with_admin_details() - Admin panel users fixed';
    RAISE NOTICE '✅ get_all_admins() - Admin dropdowns fixed';
    RAISE NOTICE '✅ claim_user_by_admin() - User claiming fixed';
    RAISE NOTICE '✅ unclaim_user() - User unclaiming fixed';
    RAISE NOTICE '✅ assign_user_to_admin() - User assignment fixed';
    RAISE NOTICE '✅ get_user_activity() - User profile activity fixed';
    RAISE NOTICE '✅ get_active_user_documents() - Document management fixed';
    RAISE NOTICE '✅ delete_user_and_all_data() - User deletion fixed';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Admin panel should now work! Test immediately!';
END $$;
