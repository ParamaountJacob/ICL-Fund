-- =================================================================
-- USER SYNC FUNCTION MIGRATION - IDEMPOTENT
-- Adds function to sync users from auth.users to profiles table
-- Timestamp: July 2, 2025 - USER SYNC FUNCTION
-- =================================================================

-- Check if function already exists and skip if so
DO $function_check$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'sync_auth_users_to_profiles' 
        AND pg_get_function_identity_arguments(oid) = ''
    ) THEN
        RAISE NOTICE 'Function sync_auth_users_to_profiles already exists, skipping creation';
        RETURN;
    END IF;

    -- Function to sync users from auth.users to profiles table
    CREATE OR REPLACE FUNCTION sync_auth_users_to_profiles()
    RETURNS TABLE (
        synced_count integer,
        message text
    )
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    DECLARE
        sync_count integer := 0;
        user_record RECORD;
    BEGIN
        -- Check if profiles table exists first
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'profiles'
        ) THEN
            RETURN QUERY SELECT 0, 'Profiles table does not exist. Run main migration first.';
            RETURN;
        END IF;

        -- Sync all users from auth.users to profiles
        FOR user_record IN 
            SELECT 
                au.id,
                au.email,
                au.raw_user_meta_data,
                au.created_at
            FROM auth.users au
        LOOP
            -- Insert or update user in profiles table
            INSERT INTO profiles (
                id,
                email,
                first_name,
                last_name,
                phone,
                created_at,
                updated_at
            ) VALUES (
                user_record.id,
                user_record.email,
                COALESCE(user_record.raw_user_meta_data->>'first_name', ''),
                COALESCE(user_record.raw_user_meta_data->>'last_name', ''),
                COALESCE(user_record.raw_user_meta_data->>'phone', ''),
                user_record.created_at,
                now()
            )
            ON CONFLICT (id) 
            DO UPDATE SET
                email = EXCLUDED.email,
                first_name = COALESCE(user_record.raw_user_meta_data->>'first_name', profiles.first_name),
                last_name = COALESCE(user_record.raw_user_meta_data->>'last_name', profiles.last_name),
                phone = COALESCE(user_record.raw_user_meta_data->>'phone', profiles.phone),
                updated_at = now();
            
            sync_count := sync_count + 1;
        END LOOP;

        RETURN QUERY SELECT sync_count, format('Successfully synced %s users from auth to profiles', sync_count);
    END;
    $$;

    -- Grant permissions
    GRANT EXECUTE ON FUNCTION sync_auth_users_to_profiles() TO authenticated;
    GRANT EXECUTE ON FUNCTION sync_auth_users_to_profiles() TO anon;

    RAISE NOTICE 'Function sync_auth_users_to_profiles created successfully';
END
$function_check$;
