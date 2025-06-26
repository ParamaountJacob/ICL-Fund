-- Fix investment creation triggers
-- This migration fixes issues with investments not appearing in the dashboard

-- Drop existing trigger first
DROP TRIGGER IF EXISTS create_investment_on_application_submit_trigger ON investment_applications;

-- Recreate the trigger function
CREATE OR REPLACE FUNCTION create_investment_on_application_submit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_payment_frequency payment_frequency_enum;
  v_investment_id uuid;
BEGIN
  -- Convert payment frequency string to enum
  CASE NEW.payment_frequency
    WHEN 'monthly' THEN v_payment_frequency := 'monthly'::payment_frequency_enum;
    WHEN 'quarterly' THEN v_payment_frequency := 'quarterly'::payment_frequency_enum;
    WHEN 'annual' THEN v_payment_frequency := 'annual'::payment_frequency_enum;
    ELSE v_payment_frequency := 'monthly'::payment_frequency_enum;
  END CASE;
  
  -- Create investment record immediately
  INSERT INTO investments (
    user_id,
    application_id,
    amount,
    annual_percentage,
    payment_frequency,
    start_date,
    status,
    term_months,
    total_expected_return,
    created_at,
    updated_at
  ) VALUES (
    NEW.user_id,
    NEW.id,
    NEW.investment_amount,
    NEW.annual_percentage,
    v_payment_frequency,
    CURRENT_DATE,
    'pending'::investment_status_enum,
    NEW.term_months,
    (NEW.investment_amount * NEW.annual_percentage / 100) * (NEW.term_months / 12.0),
    now(),
    now()
  )
  RETURNING id INTO v_investment_id;
  
  -- Log the success with notification
  PERFORM public.send_admin_notification(
    'New Investment Created',
    format('New investment %s created for application %s', v_investment_id, NEW.id)
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger on application insert
CREATE TRIGGER create_investment_on_application_submit_trigger
AFTER INSERT ON investment_applications
FOR EACH ROW
EXECUTE FUNCTION create_investment_on_application_submit();

-- Ensure proper permissions for authenticated users
GRANT SELECT ON investments TO authenticated;
GRANT SELECT ON investment_applications TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_investments_with_applications(uuid) TO authenticated;

-- Also run a fix to ensure existing applications have corresponding investments
DO $$
DECLARE
  app RECORD;
  v_payment_frequency payment_frequency_enum;
BEGIN
  FOR app IN 
    SELECT * FROM investment_applications a
    WHERE NOT EXISTS (
      SELECT 1 FROM investments i 
      WHERE i.application_id = a.id
    )
    AND a.status NOT IN ('rejected', 'deleted', 'cancelled')
  LOOP
    -- Convert payment frequency string to enum
    CASE app.payment_frequency
      WHEN 'monthly' THEN v_payment_frequency := 'monthly'::payment_frequency_enum;
      WHEN 'quarterly' THEN v_payment_frequency := 'quarterly'::payment_frequency_enum;
      WHEN 'annual' THEN v_payment_frequency := 'annual'::payment_frequency_enum;
      ELSE v_payment_frequency := 'monthly'::payment_frequency_enum;
    END CASE;
    
    -- Create missing investment records for existing applications
    INSERT INTO investments (
      user_id,
      application_id,
      amount,
      annual_percentage,
      payment_frequency,
      start_date,
      status,
      term_months,
      total_expected_return,
      created_at,
      updated_at
    ) VALUES (
      app.user_id,
      app.id,
      app.investment_amount,
      app.annual_percentage,
      v_payment_frequency,
      CURRENT_DATE,
      CASE 
        WHEN app.status = 'active' THEN 'active'::investment_status_enum
        WHEN app.status = 'pending' THEN 'pending'::investment_status_enum
        ELSE 'pending'::investment_status_enum
      END,
      app.term_months,
      (app.investment_amount * app.annual_percentage / 100) * (app.term_months / 12.0),
      app.created_at,
      NOW()
    );
  END LOOP;
END;
$$;
