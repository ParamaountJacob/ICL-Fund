# WORKFLOW STATUS UNIFICATION FIX

## PROBLEM IDENTIFIED
The codebase has TWO conflicting workflow status systems:

### System 1: Legacy InvestmentStatus (in types/index.d.ts)
```typescript
export type InvestmentStatus = 
  | 'pending'                      // User signs subscription
  | 'pending_approval'             // Admin creates promissory note  
  | 'promissory_note_pending'      // User signs promissory note
  | 'funds_pending'                // User sends wire transfer
  | 'plaid_pending'                // User connects bank
  | 'investor_onboarding_complete' // Admin reviews bank connection
  | 'active'                       // Investment active
  | 'completed' | 'cancelled' | 'bank_details_pending';
```

### System 2: Simple Workflow (in lib/simple-workflow.ts)
```typescript
export type WorkflowStep =
  | 'subscription_pending'         // User signs subscription  
  | 'admin_review'                 // Admin signs subscription
  | 'promissory_pending'           // User signs promissory note
  | 'funds_pending'                // User sends wire transfer  
  | 'admin_confirm'                // Admin confirms funds
  | 'plaid_pending'                // User connects bank
  | 'admin_complete'               // Admin completes setup
  | 'active';                      // Investment active
```

## COMPONENTS AFFECTED

### Using Legacy InvestmentStatus:
- `InvestmentDetailsModal.tsx` (976 lines) - Main investment management
- `InvestmentDetailsModalNew.tsx` - Secondary investment modal  
- `Dashboard.tsx` - Admin dashboard
- `lib/supabase.ts` - Database functions

### Using Simple Workflow:
- `SimpleWorkflowDashboard.tsx` (249 lines) - New workflow dashboard
- `lib/simple-workflow.ts` (469 lines) - Workflow logic

## SOLUTION: UNIFIED STATUS SYSTEM

### Step 1: Create Unified Type System
Replace both conflicting systems with a single unified type that includes both user and admin steps:

```typescript
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
```

### Step 2: Migration Functions
Create functions to map old statuses to new unified system:

```typescript
export const mapLegacyToUnified = (status: InvestmentStatus): UnifiedWorkflowStatus => {
  const mapping: Record<InvestmentStatus, UnifiedWorkflowStatus> = {
    'pending': 'subscription_pending',
    'pending_approval': 'subscription_admin_review', 
    'promissory_note_pending': 'promissory_note_pending',
    'bank_details_pending': 'promissory_note_admin_review',
    'funds_pending': 'funds_pending', 
    'plaid_pending': 'plaid_pending',
    'investor_onboarding_complete': 'plaid_admin_complete',
    'active': 'active',
    'completed': 'completed',
    'cancelled': 'cancelled'
  };
  return mapping[status] || 'subscription_pending';
};
```

### Step 3: Update Components Gradually
1. Update type definitions in `types/index.d.ts`
2. Add migration functions to `lib/supabase.ts`
3. Update `InvestmentDetailsModal.tsx` to use unified system
4. Update `SimpleWorkflowDashboard.tsx` to use unified system
5. Create database migration to update existing records

## IMMEDIATE EXECUTION PLAN

1. **Create unified type system** ✅ (This document)
2. **Update types/index.d.ts** - Add unified types  
3. **Update lib/supabase.ts** - Add migration functions
4. **Update InvestmentDetailsModal.tsx** - Replace legacy status logic
5. **Update SimpleWorkflowDashboard.tsx** - Use unified types
6. **Create database migration** - Update existing status values
7. **Remove duplicate code** - Clean up conflicting systems

## FILES TO MODIFY

1. `src/types/index.d.ts` - Add UnifiedWorkflowStatus type
2. `src/lib/supabase.ts` - Add migration and unified functions  
3. `src/components/InvestmentDetailsModal.tsx` - Replace status logic
4. `src/components/SimpleWorkflowDashboard.tsx` - Use unified types
5. `src/lib/simple-workflow.ts` - Update to use unified types

## DATABASE CHANGES NEEDED

1. Update `investments` table status column values
2. Update `simple_applications` table workflow_step values  
3. Ensure both tables use the same unified status values

## VALIDATION TESTS

After implementation:
1. Test user workflow progression
2. Test admin workflow progression  
3. Verify status transitions work correctly
4. Check that both dashboards show same information
5. Ensure database consistency

---

**PRIORITY: CRITICAL** - This fix resolves the core workflow chaos affecting user experience.
