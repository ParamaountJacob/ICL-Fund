-- SIMPLE TABLE DISCOVERY - Run this to see your table structure
-- Look at ALL the results below, not just the last one

-- What tables exist?
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- What columns does user_profiles have?
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'user_profiles'
ORDER BY ordinal_position;

-- What policies exist?
SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public';

-- What's in user_profiles table?
SELECT * FROM public.user_profiles LIMIT 3;
