# QUICK FIX GUIDE - UNICODE RAISE ERROR

## 🚨 **The Problem:**
PostgreSQL is rejecting Unicode characters (✅ ⚡) in RAISE statements, causing the error:
```
ERROR: 42601: too few parameters specified for RAISE
```

## ⚡ **IMMEDIATE SOLUTION:**

### Option 1: Use Emergency Sync Function (Recommended)
1. **Go to your Supabase Dashboard**
2. **Open SQL Editor**
3. **Copy and paste this code:**

```sql
-- EMERGENCY USER SYNC FUNCTION - NO UNICODE CHARACTERS
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
```

4. **Click RUN**
5. **Go to your Profile page → Admin tab**
6. **Click "Sync Users from Auth" button**
7. **Your 5 users should appear!**

### Option 2: If profiles table doesn't exist
Run this first in SQL Editor:
```sql
-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email text,
    first_name text,
    last_name text,
    phone text,
    net_worth text,
    annual_income text,
    investment_goals text,
    verification_status text DEFAULT 'pending',
    verification_requested boolean DEFAULT false,
    role text DEFAULT 'user',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create basic policy
CREATE POLICY "Users can view own profile" ON profiles
    FOR ALL USING (auth.uid() = id);

-- Admin policy
CREATE POLICY "Admins can view all profiles" ON profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email = 'innercirclelending@gmail.com'
        )
    );
```

Then run the sync function from Option 1.

## 🎯 **What This Fixes:**
- ✅ Removes Unicode characters causing RAISE errors
- ✅ Creates working sync function
- ✅ Allows admin panel to show users
- ✅ No more "no users found" error

## 🚀 **After Running:**
Your admin panel will show all 5 users from Supabase Auth!
