// Type definitions for Inner Circle Lending

// Investment Status Enum (to match the database)
export type InvestmentStatus = 
  | 'pending' 
  | 'pending_approval'
  | 'pending_activation'
  | 'plaid_pending'
  | 'investor_onboarding_complete'
  | 'active'
  | 'completed'
  | 'cancelled'
  | 'promissory_note_pending'
  | 'funds_pending'
  | 'bank_details_pending';

// Payment Frequency Enum
export type PaymentFrequency = 'monthly' | 'quarterly' | 'annual';

// User Role Enum
export type UserRole = 'user' | 'sub_admin' | 'admin';

// Verification Status Enum
export type VerificationStatus = 'pending' | 'verified';

// Document Type
export type DocumentType = 'pitch_deck' | 'ppm' | 'wire_instructions' | 'subscription_agreement' | 'promissory_note';