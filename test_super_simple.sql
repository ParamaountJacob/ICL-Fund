BEGIN;

DO $$
BEGIN
    RAISE NOTICE 'Starting migration';
END $$;

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
        RAISE NOTICE 'Enabled RLS for table';
    ELSE
        RAISE NOTICE 'RLS already enabled for table';
    END IF;
END;
$$;

CREATE TABLE IF NOT EXISTS user_profiles (
    id uuid PRIMARY KEY,
    email text,
    role text DEFAULT 'user',
    is_admin boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

SELECT enable_rls_if_not_enabled('user_profiles');

DROP POLICY IF EXISTS "user_profiles_user_access" ON user_profiles;
CREATE POLICY "user_profiles_user_access" ON user_profiles FOR ALL USING (id = auth.uid());

COMMIT;

DO $$
BEGIN
    RAISE NOTICE 'Migration complete';
END $$;
