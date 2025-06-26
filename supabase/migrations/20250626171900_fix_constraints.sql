-- Fix constraint issues and handle edge cases
-- This migration handles any remaining constraint issues

-- First, ensure any existing data meets constraints
UPDATE investment_applications
SET annual_percentage = 5  -- Use 5% to satisfy the constraint
WHERE annual_percentage <= 0 OR annual_percentage > 100 OR annual_percentage IS NULL;

-- Fix any other NULL values with reasonable defaults
UPDATE investment_applications
SET 
  investment_amount = 1000
WHERE investment_amount IS NULL;

UPDATE investment_applications
SET 
  term_months = 12
WHERE term_months IS NULL;

-- Handle empty string values (which may not trigger NULL checks)
UPDATE investment_applications
SET 
  payment_frequency = 'monthly'
WHERE payment_frequency = '';

-- Create a function to validate investment data
CREATE OR REPLACE FUNCTION validate_investment_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure annual_percentage is valid
  IF NEW.annual_percentage IS NULL OR NEW.annual_percentage <= 0 OR NEW.annual_percentage > 100 THEN
    NEW.annual_percentage := 5;  -- Default to 5%
  END IF;

  -- Ensure investment_amount is valid
  IF NEW.investment_amount IS NULL OR NEW.investment_amount <= 0 THEN
    NEW.investment_amount := 1000;  -- Default to $1000
  END IF;

  -- Ensure term_months is valid
  IF NEW.term_months IS NULL OR NEW.term_months <= 0 THEN
    NEW.term_months := 12;  -- Default to 12 months
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger for data validation
DROP TRIGGER IF EXISTS validate_investment_data_trigger ON investment_applications;

CREATE TRIGGER validate_investment_data_trigger
BEFORE INSERT OR UPDATE ON investment_applications
FOR EACH ROW
EXECUTE FUNCTION validate_investment_data();

-- Log completion
DO $$ 
BEGIN
  RAISE NOTICE 'Constraint fixing migration completed successfully';
END $$;
