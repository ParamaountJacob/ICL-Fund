-- Fix investment creation triggers
-- This migration fixes issues with investments not appearing in the dashboard

-- Drop existing trigger first
DROP TRIGGER IF EXISTS create_investment_on_application_submit_trigger ON investment_applications;

-- Drop the function before recreating
DROP FUNCTION IF EXISTS create_investment_on_application_submit() CASCADE;

-- Recreate the trigger function
CREATE FUNCTION create_investment_on_application_submit()
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
  
  -- Skip trigger if required fields are NULL
  IF NEW.investment_amount IS NULL OR NEW.annual_percentage IS NULL THEN
    RAISE NOTICE 'Not creating investment for application % due to NULL values', NEW.id;
    RETURN NEW;
  END IF;

  -- Create investment record immediately with COALESCE for safety
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
    COALESCE(NEW.investment_amount, 0),  -- Use 0 if NULL
    COALESCE(NEW.annual_percentage, 0),  -- Use 0 if NULL
    v_payment_frequency,
    CURRENT_DATE,
    'pending'::investment_status_enum,
    COALESCE(NEW.term_months, 12),  -- Default to 12 months if NULL
    COALESCE((NEW.investment_amount * NEW.annual_percentage / 100) * (NEW.term_months / 12.0), 0),  -- Use 0 if calculation is NULL
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
DO $$ 
BEGIN
  EXECUTE 'GRANT SELECT ON investments TO authenticated';
  EXECUTE 'GRANT SELECT ON investment_applications TO authenticated';
  -- No need to grant execute here since it will be done in the query migration
END $$;

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
    
    -- Skip applications with NULL investment_amount or annual_percentage
    IF app.investment_amount IS NULL OR app.annual_percentage IS NULL THEN
      RAISE NOTICE 'Skipping application % due to NULL values', app.id;
      CONTINUE;
    END IF;

    -- Create missing investment records for existing applications with default values for NULLs
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
      COALESCE(app.investment_amount, 0),  -- Use 0 if NULL
      COALESCE(app.annual_percentage, 0),  -- Use 0 if NULL
      v_payment_frequency,
      CURRENT_DATE,
      CASE 
        WHEN app.status = 'active' THEN 'active'::investment_status_enum
        WHEN app.status = 'pending' THEN 'pending'::investment_status_enum
        ELSE 'pending'::investment_status_enum
      END,
      COALESCE(app.term_months, 12),  -- Default to 12 months if NULL
      COALESCE((app.investment_amount * app.annual_percentage / 100) * (app.term_months / 12.0), 0),  -- Use 0 if calculation is NULL
      COALESCE(app.created_at, NOW()),
      NOW()
    );
  END LOOP;
END;
$$;
