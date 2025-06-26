-- Fix for investments with NULL values
-- This migration updates the existing investments with default values for NULL fields

-- First, update any existing applications with NULL values in critical fields
UPDATE investment_applications
SET 
  investment_amount = 0,
  annual_percentage = 0,
  term_months = 12,
  payment_frequency = 'monthly'
WHERE 
  investment_amount IS NULL OR 
  annual_percentage IS NULL OR 
  term_months IS NULL OR
  payment_frequency IS NULL;

-- Then update investments table
UPDATE investments
SET 
  amount = 0
WHERE amount IS NULL;

UPDATE investments
SET 
  annual_percentage = 0
WHERE annual_percentage IS NULL;

UPDATE investments
SET 
  term_months = 12
WHERE term_months IS NULL;

UPDATE investments
SET 
  payment_frequency = 'monthly'::payment_frequency_enum
WHERE payment_frequency IS NULL;

UPDATE investments
SET 
  total_expected_return = 0
WHERE total_expected_return IS NULL;

-- And finally, fix investment status if NULL
UPDATE investments
SET 
  status = 'pending'::investment_status_enum
WHERE status IS NULL;
