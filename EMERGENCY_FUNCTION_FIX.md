# Emergency Fix for Missing Functions

If you're seeing the error:

```
Supabase API error, 400, Failed to run sql query: ERROR: 42883: function public.get_user_investments_with_applications(uuid) does not exist
```

Here are the steps to resolve it:

## Option 1: Apply Emergency Migration

1. Apply only the emergency function migration:
   ```
   20250626172000_emergency_function_fix.sql
   ```

This migration creates simplified versions of the missing functions that will work immediately.

## Option 2: Use Frontend Fallback

The latest code update includes fallback logic in the frontend that will automatically use direct queries if the RPC functions aren't available.

## Option 3: Manual SQL Fix

If you have direct access to the SQL editor in Supabase, you can run:

```sql
-- Create emergency user investments function
CREATE OR REPLACE FUNCTION public.get_user_investments_with_applications(p_user_id uuid)
RETURNS TABLE (
  id uuid, user_id uuid, application_id uuid, amount numeric, 
  annual_percentage numeric, payment_frequency text, term_months integer, 
  start_date date, status text, total_expected_return numeric, 
  created_at timestamptz, updated_at timestamptz, application_status text, 
  investment_amount numeric, user_email text, user_first_name text, 
  user_last_name text
) AS $$
BEGIN
  RETURN QUERY
  SELECT i.id, i.user_id, i.application_id, i.amount, i.annual_percentage, 
         i.payment_frequency::text, i.term_months, i.start_date, i.status::text, 
         i.total_expected_return, i.created_at, i.updated_at,
         a.status as application_status, a.investment_amount,
         u.email as user_email, 
         (u.raw_user_meta_data->>'first_name')::text as user_first_name,
         (u.raw_user_meta_data->>'last_name')::text as user_last_name
  FROM investments i
  LEFT JOIN investment_applications a ON i.application_id = a.id
  LEFT JOIN auth.users u ON i.user_id = u.id
  WHERE i.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create admin investments function
CREATE OR REPLACE FUNCTION public.get_admin_investments_with_users()
RETURNS TABLE (
  id uuid, user_id uuid, application_id uuid, amount numeric, 
  annual_percentage numeric, payment_frequency text, term_months integer, 
  start_date date, status text, total_expected_return numeric, 
  created_at timestamptz, updated_at timestamptz, application_status text, 
  investment_amount numeric, user_email text, user_first_name text, 
  user_last_name text
) AS $$
BEGIN
  RETURN QUERY
  SELECT i.id, i.user_id, i.application_id, i.amount, i.annual_percentage, 
         i.payment_frequency::text, i.term_months, i.start_date, i.status::text, 
         i.total_expected_return, i.created_at, i.updated_at,
         a.status as application_status, a.investment_amount,
         u.email as user_email, 
         (u.raw_user_meta_data->>'first_name')::text as user_first_name,
         (u.raw_user_meta_data->>'last_name')::text as user_last_name
  FROM investments i
  LEFT JOIN investment_applications a ON i.application_id = a.id
  LEFT JOIN auth.users u ON i.user_id = u.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_user_investments_with_applications(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_investments_with_users() TO authenticated;
```

## Long-Term Fix

Once the immediate issue is resolved, apply all the migrations in the order specified in `MIGRATION_ORDER.md` to ensure all functions and triggers are properly created for long-term stability.
