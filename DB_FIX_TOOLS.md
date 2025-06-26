# Database Function Check & Fix Tools

This directory contains scripts to check and fix missing database functions that may be causing errors in the investment system.

## Option 1: PowerShell Script (Windows)

**Usage:**
```powershell
.\check_fix_functions.ps1 -ApiKey "your_service_key" -ApiUrl "https://your-project-ref.supabase.co"
```

**Prerequisites:**
- PowerShell 5.1 or higher
- Supabase service key with admin privileges
- Supabase project URL

## Option 2: Bash Script (Linux/Mac)

**Usage:**
```bash
# Make script executable first
chmod +x ./check_fix_functions.sh

# Run the script
./check_fix_functions.sh -k "your_service_key" -u "https://your-project-ref.supabase.co"
```

**Prerequisites:**
- Bash shell
- curl command-line tool
- Supabase service key with admin privileges
- Supabase project URL

## What These Scripts Do

1. Check if the required functions exist in your Supabase database:
   - `get_user_investments_with_applications`
   - `get_admin_investments_with_users`
   - `update_onboarding_step`

2. If any function is missing, apply the emergency fix from:
   - `supabase/migrations/20250626172000_emergency_function_fix.sql`

3. Provide feedback on what was fixed and if the fix was successful

## Manual Alternative

If you prefer not to use the scripts, you can manually apply the emergency fix by:

1. Opening the SQL Editor in your Supabase dashboard
2. Copy-pasting the contents of `supabase/migrations/20250626172000_emergency_function_fix.sql`
3. Running the SQL

See `EMERGENCY_FUNCTION_FIX.md` for detailed manual instructions.

## Finding Your Supabase Details

1. **API URL**: This is your Supabase project URL, e.g., `https://abcdefghijklm.supabase.co`
   - Find this in your Supabase dashboard under Project Settings > API

2. **API Key**: Use the service_role key (not the anon key) for administrative operations
   - Find this in your Supabase dashboard under Project Settings > API > Project API keys
   - Look for "service_role key" (Warning: Keep this secret!)
