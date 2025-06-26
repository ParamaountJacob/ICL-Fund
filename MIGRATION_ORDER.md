# Migration Order for Investment Fixes

To fix the investment display issues, please apply the migrations in the following order:

1. **20250626171900_fix_constraints.sql** (Apply this FIRST)
   - Fixes issues with the annual_percentage constraint
   - Updates existing data to meet constraints
   - Creates validation triggers to prevent future issues

2. **20250626171800_final_function_fix.sql** 
   - Cleans up any existing functions before recreating them
   - Grants necessary permissions
   - Fixes remaining NULL value issues

3. **20250626171500_fix_investment_triggers.sql**
   - Fixes the trigger that creates investments from applications
   - Handles NULL values with realistic defaults (1000 for amount, 5% for interest)
   - Adds data validation

4. **20250626171700_fix_null_investments.sql**
   - Updates existing records with NULL values
   - Sets default values that satisfy constraints
   - Ensures data integrity

5. **20250626171600_improve_investment_queries.sql**
   - Enhances the query functions
   - Shows both investments and applications
   - Adds better data retrieval for admin and user views

## Troubleshooting

If you encounter any errors:

1. **ERROR 42P13: cannot change return type of existing function**
   - This means the function already exists with a different return type
   - Solution: Apply 20250626171800_final_function_fix.sql first to drop all functions
   
2. **ERROR 23502: null value violates not-null constraint**
   - There are NULL values in required fields
   - Solution: Apply 20250626171700_fix_null_investments.sql to set default values

3. **No investments showing in dashboard**
   - Check browser console for any errors
   - Verify the trigger is creating investment records
   - Ensure permissions are properly granted

## Verification

To verify the fixes:

1. Create a new investment application
2. Check the database using SQL:
   ```sql
   SELECT * FROM investment_applications ORDER BY created_at DESC LIMIT 5;
   SELECT * FROM investments ORDER BY created_at DESC LIMIT 5;
   ```
3. Verify the new application has a corresponding investment record
4. Check your dashboard to see if the investment appears
