# Admin Setup for innercirclelending@gmail.com

## Problem
The `innercirclelending@gmail.com` account works in the Profile page (hardcoded email check) but not in DataRoom (database role check) because the database entry is missing or incorrect.

## Solutions

### Option 1: Quick Fix (Recommended)
Run this in your **Supabase SQL Editor**:

```sql
-- Update existing user_profiles entry to admin
UPDATE user_profiles 
SET role = 'admin', is_admin = true, verification_status = 'verified'
WHERE email = 'innercirclelending@gmail.com';

-- If no rows updated, create the entry
INSERT INTO user_profiles (user_id, email, first_name, last_name, role, is_admin, verification_status, created_at, updated_at)
SELECT au.id, 'innercirclelending@gmail.com', 'Inner Circle', 'Lending', 'admin', true, 'verified', NOW(), NOW()
FROM auth.users au
WHERE au.email = 'innercirclelending@gmail.com'
AND NOT EXISTS (SELECT 1 FROM user_profiles WHERE user_id = au.id);

-- Verify it worked
SELECT email, role, is_admin FROM user_profiles WHERE email = 'innercirclelending@gmail.com';
```

### Option 2: Full Migration
Run the complete migration file: `ADMIN_SETUP_MIGRATION.sql`

### Option 3: Command Line
```bash
chmod +x setup_admin.sh
./setup_admin.sh
```

## What This Fixes

- ✅ Ensures `user_profiles` table has entry for your email
- ✅ Sets `role = 'admin'` in database
- ✅ Sets `is_admin = true` flag
- ✅ Sets `verification_status = 'verified'`
- ✅ Makes both email check AND database role check work

## Expected Results

After running the migration:

1. **AuthContext logs should show:**
   ```
   checkUserRole() result: admin
   Successfully loaded profile/role: { roleData: 'admin', ... }
   ```

2. **DataRoom should show:**
   ```
   DataRoom: Is admin? true
   DataRoom: Auto-authenticating admin user
   ```

3. **Both Profile and DataRoom will work** with admin privileges

## Files Created

- `ADMIN_SETUP_MIGRATION.sql` - Complete migration with verification
- `QUICK_ADMIN_FIX.sql` - Simple SQL commands
- `setup_admin.sh` - Automated script for CLI users
