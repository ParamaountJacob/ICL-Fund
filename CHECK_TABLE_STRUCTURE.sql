-- ================================================================
-- CHECK TABLE STRUCTURE FIRST
-- ================================================================

-- Check what columns exist in user_profiles table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if there are any existing profiles
SELECT * FROM user_profiles LIMIT 5;

-- Check specifically for innercirclelending@gmail.com
SELECT * FROM user_profiles WHERE email = 'innercirclelending@gmail.com';
