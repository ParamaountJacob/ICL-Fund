// Type definitions for Inner Circle Lending

// UNIFIED WORKFLOW STATUS SYSTEM
// Replaces both legacy InvestmentStatus and WorkflowStep systems
export type UnifiedWorkflowStatus =
  // Step 1: Subscription Agreement
  | 'subscription_pending'         // User needs to sign subscription
  | 'subscription_admin_review'    // Admin needs to sign subscription

  // Step 2: Promissory Note  
  | 'promissory_note_pending'      // User needs to sign promissory note
  | 'promissory_note_admin_review' // Admin needs to sign promissory note

  // Step 3: Fund Transfer
  | 'funds_pending'                // User needs to send wire transfer
  | 'funds_admin_confirm'          // Admin needs to confirm receipt

  // Step 4: Bank Connection
  | 'plaid_pending'                // User needs to connect bank
  | 'plaid_admin_complete'         // Admin needs to complete setup

  // Final States
  | 'active'                       // Investment is active
  | 'completed'                    // Investment completed
  | 'cancelled';                   // Investment cancelled

// LEGACY TYPE - DEPRECATED (for backward compatibility during migration)
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

// LEGACY TYPE - DEPRECATED (for backward compatibility during migration)  
export type WorkflowStep =
  | 'subscription_pending'
  | 'admin_review'
  | 'promissory_pending'
  | 'funds_pending'
  | 'admin_confirm'
  | 'plaid_pending'
  | 'admin_complete'
  | 'active';

// Payment Frequency Enum
export type PaymentFrequency = 'monthly' | 'quarterly' | 'annual';

// User Role Enum
export type UserRole = 'user' | 'sub_admin' | 'admin';

// Verification Status Enum
export type VerificationStatus = 'pending' | 'verified';

// Document Type
export type DocumentType = 'pitch_deck' | 'ppm' | 'wire_instructions' | 'subscription_agreement' | 'promissory_note';