-- INVESTMENT SYSTEM MISSING FUNCTIONS
-- These functions are critical for investment management workflows

-- =================================================================
-- INVESTMENT QUERY FUNCTIONS
-- =================================================================

-- Function: get_admin_investments_with_users (CRITICAL - Admin investment management)
CREATE OR REPLACE FUNCTION get_admin_investments_with_users()
RETURNS TABLE (
    id uuid,
    user_id uuid,
    amount numeric,
    status text,
    start_date date,
    annual_percentage numeric,
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

    -- Try to get from investments table, fall back to applications
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'investments') THEN
        RETURN QUERY
        SELECT 
            i.id,
            i.user_id,
            i.amount,
            i.status,
            i.start_date,
            i.annual_percentage,
            up.email as user_email,
            up.first_name as user_first_name,
            up.last_name as user_last_name,
            i.created_at
        FROM investments i
        LEFT JOIN user_profiles up ON up.user_id = i.user_id
        ORDER BY i.created_at DESC;
    ELSE
        -- Fall back to applications table
        RETURN QUERY
        SELECT 
            sa.id,
            sa.user_id,
            sa.amount,
            sa.status,
            CURRENT_DATE as start_date,
            8.0::numeric as annual_percentage,
            up.email as user_email,
            up.first_name as user_first_name,
            up.last_name as user_last_name,
            sa.created_at
        FROM simple_applications sa
        LEFT JOIN user_profiles up ON up.user_id = sa.user_id
        WHERE sa.status IN ('active', 'pending_approval', 'approved')
        ORDER BY sa.created_at DESC;
    END IF;
END;
$$;

-- Function: get_all_investments_with_applications (CRITICAL - Admin overview)
CREATE OR REPLACE FUNCTION get_all_investments_with_applications()
RETURNS TABLE (
    id uuid,
    user_id uuid,
    amount numeric,
    status text,
    application_status text,
    workflow_step text,
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

    -- Return applications with user details
    RETURN QUERY
    SELECT 
        sa.id,
        sa.user_id,
        sa.amount,
        sa.status,
        sa.status as application_status,
        sa.workflow_step,
        up.email as user_email,
        up.first_name as user_first_name,
        up.last_name as user_last_name,
        sa.created_at
    FROM simple_applications sa
    LEFT JOIN user_profiles up ON up.user_id = sa.user_id
    ORDER BY sa.created_at DESC;
END;
$$;

-- Function: get_investment_application_by_id (CRITICAL - Application details)
CREATE OR REPLACE FUNCTION get_investment_application_by_id(p_application_id uuid)
RETURNS TABLE (
    id uuid,
    user_id uuid,
    amount numeric,
    status text,
    workflow_step text,
    subscription_signed boolean,
    subscription_signed_by_admin boolean,
    promissory_note_created boolean,
    promissory_note_signed boolean,
    funds_received boolean,
    plaid_account_id text,
    notes text,
    created_at timestamptz,
    updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if current user can access (admin or owner)
    IF NOT EXISTS (
        SELECT 1 FROM simple_applications sa
        WHERE sa.id = p_application_id 
        AND (sa.user_id = auth.uid() OR EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND (is_admin = true OR role = 'admin')
        ))
    ) THEN
        RAISE EXCEPTION 'Access denied: Can only view own applications or admin required';
    END IF;

    RETURN QUERY
    SELECT 
        sa.id,
        sa.user_id,
        sa.amount,
        sa.status,
        sa.workflow_step,
        sa.subscription_signed,
        sa.subscription_signed_by_admin,
        sa.promissory_note_created,
        sa.promissory_note_signed,
        sa.funds_received,
        sa.plaid_account_id,
        sa.notes,
        sa.created_at,
        sa.updated_at
    FROM simple_applications sa
    WHERE sa.id = p_application_id;
END;
$$;

-- =================================================================
-- INVESTMENT WORKFLOW FUNCTIONS
-- =================================================================

-- Function: move_investment_to_bank_details_stage (CRITICAL - Workflow progression)
CREATE OR REPLACE FUNCTION move_investment_to_bank_details_stage(p_application_id uuid)
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

    -- Update application to bank details stage
    UPDATE simple_applications 
    SET 
        workflow_step = 'bank_details',
        status = 'bank_details_pending',
        updated_at = now()
    WHERE id = p_application_id;
    
    RETURN FOUND;
END;
$$;

-- Function: update_onboarding_step (CRITICAL - Step progression)
CREATE OR REPLACE FUNCTION update_onboarding_step(
    p_application_id uuid,
    p_step text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if current user can access (admin or owner)
    IF NOT EXISTS (
        SELECT 1 FROM simple_applications sa
        WHERE sa.id = p_application_id 
        AND (sa.user_id = auth.uid() OR EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND (is_admin = true OR role = 'admin')
        ))
    ) THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    -- Update workflow step
    UPDATE simple_applications 
    SET 
        workflow_step = p_step,
        updated_at = now()
    WHERE id = p_application_id;
    
    RETURN FOUND;
END;
$$;

-- Function: activate_user_investment (CRITICAL - Investment activation)
CREATE OR REPLACE FUNCTION activate_user_investment(p_application_id uuid)
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

    -- Activate the investment
    UPDATE simple_applications 
    SET 
        status = 'active',
        workflow_step = 'completed',
        updated_at = now()
    WHERE id = p_application_id;
    
    RETURN FOUND;
END;
$$;

-- Function: create_investment_from_application (CRITICAL - Investment creation)
CREATE OR REPLACE FUNCTION create_investment_from_application(
    p_application_id uuid,
    p_annual_rate numeric DEFAULT 8.0
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_investment_id uuid;
    v_application simple_applications%ROWTYPE;
BEGIN
    -- Check if current user is admin
    IF NOT EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_id = auth.uid() AND (is_admin = true OR role = 'admin')
    ) THEN
        RAISE EXCEPTION 'Access denied: Admin privileges required';
    END IF;

    -- Get application details
    SELECT * INTO v_application
    FROM simple_applications 
    WHERE id = p_application_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Application not found';
    END IF;

    -- Create investments table if it doesn't exist
    CREATE TABLE IF NOT EXISTS investments (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL,
        application_id uuid,
        amount numeric NOT NULL,
        annual_percentage numeric DEFAULT 8.0,
        status text DEFAULT 'active',
        start_date date DEFAULT CURRENT_DATE,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
    );

    -- Create investment record
    INSERT INTO investments (
        user_id,
        application_id,
        amount,
        annual_percentage,
        status,
        start_date
    ) VALUES (
        v_application.user_id,
        p_application_id,
        v_application.amount,
        p_annual_rate,
        'active',
        CURRENT_DATE
    ) RETURNING id INTO v_investment_id;

    -- Update application status
    UPDATE simple_applications 
    SET 
        status = 'active',
        workflow_step = 'completed',
        updated_at = now()
    WHERE id = p_application_id;

    RETURN v_investment_id;
END;
$$;

-- Function: user_has_active_investments (CRITICAL - User status checking)
CREATE OR REPLACE FUNCTION user_has_active_investments(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count integer;
BEGIN
    -- Check for active investments in investments table
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'investments') THEN
        SELECT COUNT(*) INTO v_count
        FROM investments 
        WHERE user_id = p_user_id AND status = 'active';
        
        IF v_count > 0 THEN
            RETURN true;
        END IF;
    END IF;

    -- Check for active applications as fallback
    SELECT COUNT(*) INTO v_count
    FROM simple_applications 
    WHERE user_id = p_user_id 
    AND status IN ('active', 'approved', 'pending_approval');
    
    RETURN v_count > 0;
END;
$$;

-- =================================================================
-- GRANT PERMISSIONS
-- =================================================================

GRANT EXECUTE ON FUNCTION get_admin_investments_with_users() TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_investments_with_applications() TO authenticated;
GRANT EXECUTE ON FUNCTION get_investment_application_by_id(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION move_investment_to_bank_details_stage(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION update_onboarding_step(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION activate_user_investment(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION create_investment_from_application(uuid, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION user_has_active_investments(uuid) TO authenticated;

-- Grant permissions on investments table if created
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'investments') THEN
        GRANT ALL ON TABLE investments TO authenticated;
    END IF;
END $$;

-- =================================================================
-- VERIFICATION
-- =================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '💰 INVESTMENT SYSTEM FUNCTIONS CREATED! 💰';
    RAISE NOTICE '';
    RAISE NOTICE '✅ get_admin_investments_with_users() - Admin investment overview';
    RAISE NOTICE '✅ get_all_investments_with_applications() - Full admin view';
    RAISE NOTICE '✅ get_investment_application_by_id() - Application details';
    RAISE NOTICE '✅ move_investment_to_bank_details_stage() - Workflow progression';
    RAISE NOTICE '✅ update_onboarding_step() - Step management';
    RAISE NOTICE '✅ activate_user_investment() - Investment activation';
    RAISE NOTICE '✅ create_investment_from_application() - Investment creation';
    RAISE NOTICE '✅ user_has_active_investments() - Status checking';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 Investment management should now work!';
END $$;
