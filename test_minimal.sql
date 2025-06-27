-- MINIMAL TEST - Just the RLS function to test
BEGIN;

CREATE OR REPLACE FUNCTION enable_rls_if_not_enabled(table_name text)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class 
        WHERE relname = table_name 
        AND relnamespace = 'public'::regnamespace 
        AND relrowsecurity = true
    ) THEN
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
        RAISE NOTICE 'Enabled RLS for table: ' || table_name;
    ELSE
        RAISE NOTICE 'RLS already enabled for table: ' || table_name;
    END IF;
END;
$$;

-- Test the function
DO $$
BEGIN
    RAISE NOTICE 'Testing function...';
END $$;

COMMIT;
