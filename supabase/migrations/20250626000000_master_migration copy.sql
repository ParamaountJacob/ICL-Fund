-- Restore and improve critical functions
CREATE OR REPLACE FUNCTION public.activate_user_investment(investment_id uuid)
RETURNS void AS $$
BEGIN
    UPDATE investments
    SET status = 'active',
        activated_at = NOW()
    WHERE id = investment_id;

    -- Trigger admin notification
    PERFORM public.send_admin_notification(
        'Investment Activated',
        format('Investment %s has been activated', investment_id)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.create_investment(
    user_id uuid,
    principal_amount numeric,
    interest_rate numeric,
    payment_freq payment_frequency_enum,
    start_date date,
    term_months integer
)
RETURNS uuid AS $$
DECLARE
    new_investment_id uuid;
BEGIN
    INSERT INTO investments (
        user_id,
        principal_amount,
        interest_rate,
        payment_frequency,
        start_date,
        term_months,
        status
    ) VALUES (
        user_id,
        principal_amount,
        interest_rate,
        payment_freq,
        start_date,
        term_months,
        'pending'
    )
    RETURNING id INTO new_investment_id;

    RETURN new_investment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the function first to allow parameter name changes
DROP FUNCTION IF EXISTS public.update_onboarding_step(uuid, text, text, jsonb);

-- Create the function with renamed parameter
CREATE FUNCTION public.update_onboarding_step(
    application_id uuid,
    step_name text,
    p_status text,  -- Renamed parameter to avoid ambiguity
    metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void AS $$
BEGIN
    UPDATE investment_applications
    SET 
        current_step = step_name,
        step_status = p_status,  -- Use the renamed parameter
        step_metadata = metadata,
        updated_at = NOW()
    WHERE id = application_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
