-- Quick check of your profile data structure
SELECT 
  id,
  user_id,
  email,
  first_name,
  last_name,
  full_name,
  role,
  is_admin,
  created_at
FROM user_profiles 
WHERE user_id = '07e0d58f-d90c-4a9a-8dfc-3739ceb9cc72'
   OR email LIKE '%innercircle%'
   OR email LIKE '%jacob%'
   OR email LIKE '%griswold%'
ORDER BY created_at DESC;
