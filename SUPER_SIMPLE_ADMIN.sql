-- ================================================================
-- SUPER SIMPLE - Just the essential commands
-- ================================================================

-- Option 1: Update existing record (if it exists)
UPDATE user_profiles 
SET role = 'admin', verification_status = 'verified', updated_at = NOW()
WHERE email = 'innercirclelending@gmail.com';

-- Option 2: Create record if it doesn't exist
INSERT INTO user_profiles (user_id, email, first_name, last_name, role, verification_status, created_at, updated_at)
SELECT 
    au.id, 
    'innercirclelending@gmail.com', 
    'Inner Circle', 
    'Lending', 
    'admin', 
    'verified', 
    NOW(), 
    NOW()
FROM auth.users au
WHERE au.email = 'innercirclelending@gmail.com'
AND NOT EXISTS (SELECT 1 FROM user_profiles WHERE user_id = au.id);

-- Option 3: Check the result
SELECT email, role, verification_status FROM user_profiles WHERE email = 'innercirclelending@gmail.com';
