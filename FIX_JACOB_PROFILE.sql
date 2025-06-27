-- FIX JACOB'S PROFILE DATA
-- This will correct the wrong first_name/last_name and fix admin access

-- First, let's update your profile with correct name data
UPDATE user_profiles 
SET 
  first_name = 'Jacob',
  last_name = 'Griswold', 
  is_admin = true,  -- Ensure boolean admin flag is set
  role = 'admin',   -- Ensure role is admin
  updated_at = now()
WHERE user_id = '07e0d58f-d90c-4a9a-8dfc-3739ceb9cc72';

-- Also ensure email is correct if needed
UPDATE user_profiles 
SET 
  email = (SELECT email FROM auth.users WHERE id = '07e0d58f-d90c-4a9a-8dfc-3739ceb9cc72'),
  updated_at = now()
WHERE user_id = '07e0d58f-d90c-4a9a-8dfc-3739ceb9cc72'
  AND email IS NULL;

-- Verify the fix
SELECT 
  id,
  user_id,
  email,
  first_name,
  last_name,
  full_name,
  role,
  is_admin,
  updated_at
FROM user_profiles 
WHERE user_id = '07e0d58f-d90c-4a9a-8dfc-3739ceb9cc72';

RAISE NOTICE '✅ Updated Jacob Griswold profile with correct name and admin privileges!';
