# COMPLETE DATABASE CLEANUP INSTRUCTIONS

## STEP 1: DELETE ALL EXISTING MIGRATION FILES

**Delete ALL files in `supabase/migrations/` folder EXCEPT:**
- Keep ONLY: `20250628150000_master_clean_migration.sql`
- Delete everything else (all other `.sql` files)

## STEP 2: RESET MIGRATION HISTORY (OPTIONAL BUT RECOMMENDED)

Run this command to reset your migration history:
```bash
supabase db reset
```

This will:
- Drop your entire local database
- Run only the master migration
- Give you a completely clean slate

## STEP 3: VERIFY THE CLEANUP

After running the migration, your database should have ONLY:

### ✅ Tables that remain:
- `profiles` - Basic user profile data
- `contact_submissions` - Contact form tracking
- `auth.users` - Supabase auth table (built-in)

### ✅ Functions that remain:
- `safe_upsert_user_profile()` - For profile updates
- `handle_new_user()` - Creates profile on signup

### ❌ Everything else DELETED:
- All investment workflow tables
- All admin tables  
- All notification tables
- All document tables
- All complex functions
- All edge cases and legacy code

## STEP 4: EDGE FUNCTIONS CLEANUP

You'll still need to manually delete the edge functions:
```bash
supabase functions delete approve-document
supabase functions delete check-document-status
supabase functions delete exchange-plaid-token
supabase functions delete check-api-keys
supabase functions delete send-admin-notification
supabase functions delete delete-investment
supabase functions delete delete-consultation
supabase functions delete delete-user
supabase functions delete log-error
```

Keep only:
- `send-email`
- `send-contact-email`

## SAFETY FEATURES

The master migration is designed to be:
- **100% Idempotent** - Safe to run multiple times
- **Error-resistant** - Uses IF EXISTS/IF NOT EXISTS everywhere
- **Non-destructive on essential data** - Preserves user auth and basic profiles
- **Minimal footprint** - Only creates what you actually need

## WHAT YOU'LL HAVE AFTER CLEANUP

1. **Authentication** ✅ - Full Supabase auth working
2. **User Profiles** ✅ - Basic profile management
3. **Contact Form** ✅ - Email sending capability
4. **Calendly Integration** ✅ - Already working in frontend
5. **Clean Database** ✅ - No legacy/unused tables or functions

## VERIFICATION QUERIES

After migration, run these to verify cleanup:
```sql
-- Should show only essential tables
SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- Should show only essential functions  
SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public';
```

You should see minimal results with just the essential components.
