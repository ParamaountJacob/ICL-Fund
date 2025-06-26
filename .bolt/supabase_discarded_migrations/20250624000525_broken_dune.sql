/*
  # Add Investor Onboarding Statuses

  1. New Status Values
    - Add new enum values to investment_applications status:
      - `promissory_note_pending`: Investor needs to sign promissory note
      - `bank_details_pending`: Investor needs to review bank transfer details
      - `plaid_pending`: Investor needs to complete Plaid integration
      - `investor_onboarding_complete`: Investor has completed all onboarding steps

  2. Security
    - No changes to existing RLS policies needed
    - Functions will have appropriate permissions
*/

-- Add new status values to the investment_applications status enum
ALTER TYPE investment_applications_status_type ADD VALUE IF NOT EXISTS 'promissory_note_pending';
ALTER TYPE investment_applications_status_type ADD VALUE IF NOT EXISTS 'bank_details_pending';
ALTER TYPE investment_applications_status_type ADD VALUE IF NOT EXISTS 'plaid_pending';
ALTER TYPE investment_applications_status_type ADD VALUE IF NOT EXISTS 'investor_onboarding_complete';

-- Update the check constraint to include new status values
ALTER TABLE investment_applications DROP CONSTRAINT IF EXISTS investment_applications_status_check;
ALTER TABLE investment_applications ADD CONSTRAINT investment_applications_status_check 
CHECK (status = ANY (ARRAY[
  'pending'::text, 
  'admin_approved'::text, 
  'onboarding'::text, 
  'documents_signed'::text, 
  'funding_complete'::text, 
  'active'::text, 
  'rejected'::text,
  'promissory_note_pending'::text,
  'bank_details_pending'::text,
  'plaid_pending'::text,
  'investor_onboarding_complete'::text
]));