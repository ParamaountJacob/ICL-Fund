-- =================================================================
-- IMMEDIATE FIX - RUN THIS DIRECTLY IN SUPABASE SQL EDITOR
-- =================================================================
-- This will create the essential sync function without migration files
-- Copy and paste this entire code block into Supabase Dashboard > SQL Editor

-- Step 1: COMPLETELY DISABLE ALL PROBLEMATIC TRIGGERS AND FUNCTIONS
DROP TRIGGER IF EXISTS profiles_activity_trigger ON profiles;
DROP TRIGGER IF EXISTS simple_applications_activity_trigger ON simple_applications;
DROP FUNCTION IF EXISTS log_user_activity() CASCADE;

-- Step 2: Create user_activity table if it doesn't exist (needed for new trigger)
CREATE TABLE IF NOT EXISTS user_activity (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    action_type text NOT NULL,
    action_description text,
    metadata jsonb,
    created_at timestamptz DEFAULT now()
);

-- Step 3: Create FIXED trigger function that handles both 'id' and 'user_id' fields
CREATE OR REPLACE FUNCTION log_user_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Handle different table schemas properly
    INSERT INTO user_activity (user_id, action_type, action_description, metadata)
    VALUES (
        CASE 
            WHEN TG_TABLE_NAME = 'profiles' THEN COALESCE(NEW.id, OLD.id)
            ELSE COALESCE(NEW.user_id, OLD.user_id)
        END,
        TG_OP,
        CASE 
            WHEN TG_TABLE_NAME = 'simple_applications' THEN
                CASE TG_OP
                    WHEN 'INSERT' THEN 'Created new investment application'
                    WHEN 'UPDATE' THEN 'Updated investment application'
                    WHEN 'DELETE' THEN 'Deleted investment application'
                END
            WHEN TG_TABLE_NAME = 'profiles' THEN
                CASE TG_OP
                    WHEN 'INSERT' THEN 'Created profile'
                    WHEN 'UPDATE' THEN 'Updated profile information'
                END
            ELSE 'Unknown action'
        END,
        jsonb_build_object('table', TG_TABLE_NAME, 'operation', TG_OP)
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Step 4: Create sync function (fixed version)
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
        
        -- Create basic policies (drop first to avoid conflicts)
        DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
        DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
        DROP POLICY IF EXISTS "Admin can view all profiles" ON profiles;
        
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

-- Step 5: Grant permissions
GRANT EXECUTE ON FUNCTION sync_auth_users_to_profiles() TO authenticated;
GRANT EXECUTE ON FUNCTION sync_auth_users_to_profiles() TO anon;

-- Step 6: Test the function immediately (this will sync users without trigger errors)
SELECT * FROM sync_auth_users_to_profiles();
