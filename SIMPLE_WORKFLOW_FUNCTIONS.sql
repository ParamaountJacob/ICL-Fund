-- SIMPLE WORKFLOW MISSING FUNCTIONS
-- These functions are critical for the simple workflow dashboard

-- =================================================================
-- APPLICATION CREATION & MANAGEMENT
-- =================================================================

-- Function: create_simple_application (CRITICAL - Step 1 of workflow)
CREATE OR REPLACE FUNCTION create_simple_application(
    p_investment_amount numeric,
    p_annual_percentage numeric DEFAULT 12,
    p_payment_frequency text DEFAULT 'monthly',
    p_term_months integer DEFAULT 24
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_application_id uuid;
BEGIN
    -- Create new application
    INSERT INTO simple_applications (
        user_id,
        amount,
        annual_percentage,
        payment_frequency,
        term_months,
        status,
        workflow_step,
        subscription_signed,
        subscription_signed_by_admin,
        promissory_note_created,
        promissory_note_signed,
        funds_received
    ) VALUES (
        auth.uid(),
        p_investment_amount,
        p_annual_percentage,
        p_payment_frequency,
        p_term_months,
        'subscription_pending',
        'subscription_pending',
        false,
        false,
        false,
        false,
        false
    ) RETURNING id INTO v_application_id;

    -- Create notification for admins
    INSERT INTO simple_notifications (
        user_id,
        notification_type,
        title,
        message,
        is_admin,
        application_id
    ) VALUES (
        auth.uid(),
        'new_application',
        'New Investment Application',
        'A new investment application has been submitted for $' || p_investment_amount,
        true,
        v_application_id
    );

    RETURN v_application_id;
END;
$$;

-- Function: get_admin_applications (CRITICAL - Admin workflow view)
CREATE OR REPLACE FUNCTION get_admin_applications()
RETURNS TABLE (
    id uuid,
    user_id uuid,
    amount numeric,
    status text,
    current_step text,
    subscription_signed boolean,
    subscription_signed_by_admin boolean,
    promissory_note_created boolean,
    promissory_note_signed boolean,
    funds_received boolean,
    user_email text,
    user_first_name text,
    user_last_name text,
    created_at timestamptz
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
        sa.id,
        sa.user_id,
        sa.amount,
        sa.status,
        sa.workflow_step as current_step,
        sa.subscription_signed,
        sa.subscription_signed_by_admin,
        sa.promissory_note_created,
        sa.promissory_note_signed,
        sa.funds_received,
        up.email as user_email,
        up.first_name as user_first_name,
        up.last_name as user_last_name,
        sa.created_at
    FROM simple_applications sa
    LEFT JOIN user_profiles up ON up.user_id = sa.user_id
    ORDER BY sa.created_at DESC;
END;
$$;

-- =================================================================
-- USER WORKFLOW STEP FUNCTIONS
-- =================================================================

-- Function: user_sign_subscription (CRITICAL - Step 1 user action)
CREATE OR REPLACE FUNCTION user_sign_subscription(p_application_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id uuid;
BEGIN
    -- Verify user owns this application
    SELECT user_id INTO v_user_id
    FROM simple_applications 
    WHERE id = p_application_id AND user_id = auth.uid();
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Application not found or access denied';
    END IF;

    -- Update application
    UPDATE simple_applications 
    SET 
        subscription_signed = true,
        workflow_step = 'admin_signature_pending',
        status = 'admin_signature_pending',
        updated_at = now()
    WHERE id = p_application_id;

    -- Notify admin
    INSERT INTO simple_notifications (
        user_id,
        notification_type,
        title,
        message,
        is_admin,
        application_id
    ) VALUES (
        v_user_id,
        'user_signed_subscription',
        'Subscription Agreement Signed',
        'User has signed the subscription agreement. Admin signature required.',
        true,
        p_application_id
    );

    RETURN true;
END;
$$;

-- Function: user_sign_promissory_note (CRITICAL - Step 3 user action)
CREATE OR REPLACE FUNCTION user_sign_promissory_note(p_application_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id uuid;
BEGIN
    -- Verify user owns this application
    SELECT user_id INTO v_user_id
    FROM simple_applications 
    WHERE id = p_application_id AND user_id = auth.uid();
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Application not found or access denied';
    END IF;

    -- Update application
    UPDATE simple_applications 
    SET 
        promissory_note_signed = true,
        workflow_step = 'wire_transfer_pending',
        status = 'wire_transfer_pending',
        updated_at = now()
    WHERE id = p_application_id;

    -- Notify admin
    INSERT INTO simple_notifications (
        user_id,
        notification_type,
        title,
        message,
        is_admin,
        application_id
    ) VALUES (
        v_user_id,
        'user_signed_promissory_note',
        'Promissory Note Signed',
        'User has signed the promissory note. Wire transfer instructions sent.',
        true,
        p_application_id
    );

    RETURN true;
END;
$$;

-- Function: user_complete_wire_transfer (CRITICAL - Step 4 user action)
CREATE OR REPLACE FUNCTION user_complete_wire_transfer(
    p_application_id uuid,
    p_transaction_details text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id uuid;
BEGIN
    -- Verify user owns this application
    SELECT user_id INTO v_user_id
    FROM simple_applications 
    WHERE id = p_application_id AND user_id = auth.uid();
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Application not found or access denied';
    END IF;

    -- Update application
    UPDATE simple_applications 
    SET 
        funds_received = true,
        workflow_step = 'plaid_connection_pending',
        status = 'plaid_connection_pending',
        notes = COALESCE(notes, '') || ' Wire transfer details: ' || COALESCE(p_transaction_details, 'User reported transfer completed'),
        updated_at = now()
    WHERE id = p_application_id;

    -- Notify admin
    INSERT INTO simple_notifications (
        user_id,
        notification_type,
        title,
        message,
        is_admin,
        application_id
    ) VALUES (
        v_user_id,
        'user_completed_wire_transfer',
        'Wire Transfer Completed',
        'User has completed wire transfer. Please verify funds and approve next step.',
        true,
        p_application_id
    );

    RETURN true;
END;
$$;

-- Function: user_connect_plaid (CRITICAL - Step 5 user action)
CREATE OR REPLACE FUNCTION user_connect_plaid(
    p_application_id uuid,
    p_plaid_account_id text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id uuid;
BEGIN
    -- Verify user owns this application
    SELECT user_id INTO v_user_id
    FROM simple_applications 
    WHERE id = p_application_id AND user_id = auth.uid();
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Application not found or access denied';
    END IF;

    -- Update application
    UPDATE simple_applications 
    SET 
        plaid_account_id = p_plaid_account_id,
        workflow_step = 'admin_final_setup',
        status = 'admin_final_setup',
        updated_at = now()
    WHERE id = p_application_id;

    -- Notify admin
    INSERT INTO simple_notifications (
        user_id,
        notification_type,
        title,
        message,
        is_admin,
        application_id
    ) VALUES (
        v_user_id,
        'user_connected_plaid',
        'Plaid Account Connected',
        'User has connected their Plaid account. Complete final setup to activate investment.',
        true,
        p_application_id
    );

    RETURN true;
END;
$$;

-- =================================================================
-- ADMIN WORKFLOW STEP FUNCTIONS
-- =================================================================

-- Function: admin_sign_subscription (CRITICAL - Step 2 admin action)
CREATE OR REPLACE FUNCTION admin_sign_subscription(
    p_application_id uuid,
    p_notes text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id uuid;
BEGIN
    -- Check if current user is admin
    IF NOT EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_id = auth.uid() AND (is_admin = true OR role = 'admin')
    ) THEN
        RAISE EXCEPTION 'Access denied: Admin privileges required';
    END IF;

    -- Get application user_id
    SELECT user_id INTO v_user_id
    FROM simple_applications 
    WHERE id = p_application_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Application not found';
    END IF;

    -- Update application
    UPDATE simple_applications 
    SET 
        subscription_signed_by_admin = true,
        workflow_step = 'promissory_note_pending',
        status = 'promissory_note_pending',
        notes = COALESCE(notes, '') || ' Admin notes: ' || COALESCE(p_notes, 'Admin approved subscription'),
        updated_at = now()
    WHERE id = p_application_id;

    -- Notify user
    INSERT INTO simple_notifications (
        user_id,
        notification_type,
        title,
        message,
        is_admin,
        application_id
    ) VALUES (
        v_user_id,
        'admin_signed_subscription',
        'Subscription Agreement Approved',
        'Admin has signed your subscription agreement. Promissory note is ready for your signature.',
        false,
        p_application_id
    );

    RETURN true;
END;
$$;

-- Function: admin_create_promissory_note (CRITICAL - Step 2.5 admin action)
CREATE OR REPLACE FUNCTION admin_create_promissory_note(
    p_application_id uuid,
    p_note_details text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id uuid;
BEGIN
    -- Check if current user is admin
    IF NOT EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_id = auth.uid() AND (is_admin = true OR role = 'admin')
    ) THEN
        RAISE EXCEPTION 'Access denied: Admin privileges required';
    END IF;

    -- Get application user_id
    SELECT user_id INTO v_user_id
    FROM simple_applications 
    WHERE id = p_application_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Application not found';
    END IF;

    -- Update application
    UPDATE simple_applications 
    SET 
        promissory_note_created = true,
        workflow_step = 'promissory_note_pending',
        status = 'promissory_note_pending',
        updated_at = now()
    WHERE id = p_application_id;

    -- Notify user
    INSERT INTO simple_notifications (
        user_id,
        notification_type,
        title,
        message,
        is_admin,
        application_id
    ) VALUES (
        v_user_id,
        'promissory_note_ready',
        'Promissory Note Ready',
        'Your promissory note has been created and is ready for signature.',
        false,
        p_application_id
    );

    RETURN true;
END;
$$;

-- Function: admin_confirm_investment (CRITICAL - Step 6 admin action)
CREATE OR REPLACE FUNCTION admin_confirm_investment(
    p_application_id uuid,
    p_notes text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id uuid;
BEGIN
    -- Check if current user is admin
    IF NOT EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_id = auth.uid() AND (is_admin = true OR role = 'admin')
    ) THEN
        RAISE EXCEPTION 'Access denied: Admin privileges required';
    END IF;

    -- Get application user_id
    SELECT user_id INTO v_user_id
    FROM simple_applications 
    WHERE id = p_application_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Application not found';
    END IF;

    -- Update application
    UPDATE simple_applications 
    SET 
        workflow_step = 'completed',
        status = 'active',
        notes = COALESCE(notes, '') || ' Admin final approval: ' || COALESCE(p_notes, 'Investment activated'),
        updated_at = now()
    WHERE id = p_application_id;

    -- Notify user
    INSERT INTO simple_notifications (
        user_id,
        notification_type,
        title,
        message,
        is_admin,
        application_id
    ) VALUES (
        v_user_id,
        'investment_activated',
        'Investment Activated!',
        'Congratulations! Your investment has been activated and is now earning returns.',
        false,
        p_application_id
    );

    RETURN true;
END;
$$;

-- =================================================================
-- GRANT PERMISSIONS
-- =================================================================

GRANT EXECUTE ON FUNCTION create_simple_application(numeric, numeric, text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_applications() TO authenticated;
GRANT EXECUTE ON FUNCTION user_sign_subscription(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION user_sign_promissory_note(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION user_complete_wire_transfer(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION user_connect_plaid(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_sign_subscription(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_create_promissory_note(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_confirm_investment(uuid, text) TO authenticated;

-- =================================================================
-- VERIFICATION
-- =================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔄 SIMPLE WORKFLOW FUNCTIONS CREATED! 🔄';
    RAISE NOTICE '';
    RAISE NOTICE '✅ create_simple_application() - Application creation';
    RAISE NOTICE '✅ get_admin_applications() - Admin workflow view';
    RAISE NOTICE '✅ user_sign_subscription() - User step 1';
    RAISE NOTICE '✅ user_sign_promissory_note() - User step 3';
    RAISE NOTICE '✅ user_complete_wire_transfer() - User step 4';
    RAISE NOTICE '✅ user_connect_plaid() - User step 5';
    RAISE NOTICE '✅ admin_sign_subscription() - Admin step 2';
    RAISE NOTICE '✅ admin_create_promissory_note() - Admin step 2.5';
    RAISE NOTICE '✅ admin_confirm_investment() - Admin step 6';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 Simple workflow dashboard should now work!';
END $$;
