-- COMPREHENSIVE FIX FOR JACOB'S PROFILE AND ADMIN ACCESS
-- This addresses all the issues discovered

-- Step 1: First run the database scripts we created earlier
-- EXECUTE FINAL_PROFILE_FIX.sql and CRITICAL_POLICIES.sql first

-- Step 2: Fix Jacob's profile with correct name data
DO $$
BEGIN
    RAISE NOTICE '🔧 FIXING JACOB GRISWOLD PROFILE DATA...';
    
    -- Update your profile with correct information
    UPDATE user_profiles 
    SET 
      first_name = 'Jacob',
      last_name = 'Griswold',
      -- Keep full_name as is (it's already correct)
      email = (SELECT email FROM auth.users WHERE id = user_id),
      is_admin = true,    -- Boolean admin flag
      role = 'admin',     -- Text role field
      updated_at = now()
    WHERE user_id = '07e0d58f-d90c-4a9a-8dfc-3739ceb9cc72';
    
    -- Verify the update
    IF FOUND THEN
        RAISE NOTICE '✅ SUCCESS: Updated Jacob Griswold profile!';
        RAISE NOTICE 'Name changed from "Admin User" to "Jacob Griswold"';
        RAISE NOTICE 'Admin status: is_admin=true, role=admin';
    ELSE
        RAISE NOTICE '❌ ERROR: Could not find profile to update';
    END IF;
    
    -- Show current profile data
    PERFORM (
        SELECT 
            RAISE_NOTICE(
                'Current profile: first_name=%s, last_name=%s, full_name=%s, role=%s, is_admin=%s', 
                first_name, last_name, full_name, role, is_admin
            )
        FROM user_profiles 
        WHERE user_id = '07e0d58f-d90c-4a9a-8dfc-3739ceb9cc72'
    );
    
END $$;

-- Step 3: Ensure admin functions work
SELECT set_user_role('07e0d58f-d90c-4a9a-8dfc-3739ceb9cc72', 'admin');

-- Final verification
SELECT 
  'Profile Data:' as info,
  first_name, 
  last_name, 
  full_name,
  role,
  is_admin,
  email
FROM user_profiles 
WHERE user_id = '07e0d58f-d90c-4a9a-8dfc-3739ceb9cc72';
