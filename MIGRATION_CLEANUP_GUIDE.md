# Migration Files Analysis
# Check your supabase/migrations/ folder and delete any migrations that created:

## DELETE these migration types:
1. Investment applications table creation
2. Promissory notes table creation  
3. Wire transfers table creation
4. Subscription agreements table creation
5. Documents and document_access tables
6. Notifications tables
7. Admin-specific tables
8. Plaid integration tables
9. User verification tables
10. Any RLS policies for above tables
11. Any triggers for above tables
12. Any functions from the DATABASE_CLEANUP.sql list

## KEEP these migration types:
1. Initial auth.users setup
2. Profiles table creation (basic user profile data)
3. RLS policies for profiles table
4. Basic authentication setup
5. Any contact form related setup

## To find migration files to delete:
# Look in supabase/migrations/ folder
# Examine each .sql file to see what it creates
# Delete files that create investment workflow infrastructure

## Example migration names that should likely be deleted:
- *_create_investment_applications.sql
- *_create_promissory_notes.sql
- *_create_documents.sql
- *_create_notifications.sql
- *_create_admin_functions.sql
- *_create_plaid_integration.sql
- *_add_investment_workflow.sql

## Example migration names to KEEP:
- *_create_profiles.sql
- *_setup_auth.sql
- *_profiles_rls.sql
- *_basic_user_setup.sql
