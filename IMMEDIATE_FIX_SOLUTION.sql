-- =================================================================
-- IMMEDIATE FIX - RUN THIS DIRECTLY IN SUPABASE SQL EDITOR
-- =================================================================
-- This will create the essential sync function without migration files
-- Copy and paste this entire code block into Supabase Dashboard > SQL Editor

-- Step 1: Create sync function (fixed version)
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
        RETURN QUERY SELECT 0, 'Profiles table does not exist. Creating it now...';
        
        -- Create profiles table if it doesn't exist
        CREATE TABLE IF NOT EXISTS profiles (
            id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
            email text,
            first_name text,
            last_name text,
            phone text,
            address text,
            ira_accounts text,
            investment_goals text,
            net_worth text,
            annual_income text,
            verification_status text DEFAULT 'pending',
            verification_requested boolean DEFAULT false,
            role text DEFAULT 'user',
            created_at timestamptz DEFAULT now(),
            updated_at timestamptz DEFAULT now()
        );
        
        -- Enable RLS
        ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
        
        -- Create basic policies
        CREATE POLICY "Users can view own profile" ON profiles
            FOR SELECT USING (auth.uid() = id);
            
        CREATE POLICY "Users can update own profile" ON profiles
            FOR UPDATE USING (auth.uid() = id);
            
        CREATE POLICY "Admin can view all profiles" ON profiles
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM profiles 
                    WHERE id = auth.uid() 
                    AND email = 'innercirclelending@gmail.com'
                )
            );
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

-- Test the function immediately
SELECT * FROM sync_auth_users_to_profiles();
