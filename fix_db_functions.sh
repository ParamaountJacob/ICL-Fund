#!/bin/bash

# Simple script to fix missing database functions
# Usage: SUPABASE_URL=xxx SUPABASE_SERVICE_ROLE_KEY=xxx ./fix_db_functions.sh

echo "Investment Database Function Fix Utility"
echo "========================================"

# Check if environment variables are set
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "Error: Required environment variables not set"
    echo "Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables"
    echo "Usage: SUPABASE_URL=https://xxx.supabase.co SUPABASE_SERVICE_ROLE_KEY=xxx ./fix_db_functions.sh"
    exit 1
fi

echo "Checking and fixing database functions..."

# Use the latest emergency fix migration file  
SQL_FILE="./supabase/migrations/20250703000000_clean_emergency_fix.sql"

if [ ! -f "$SQL_FILE" ]; then
    echo "Error: SQL file not found at $SQL_FILE"
    exit 1
fi

# Read file content
SQL_CONTENT=$(cat "$SQL_FILE")

# Run the SQL
echo "Applying emergency function fix..."
curl -X POST \
  "$SUPABASE_URL/rest/v1/rpc/pg_query" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"query\": $(echo "$SQL_CONTENT" | jq -s -R .)}"

# Check the result
if [ $? -eq 0 ]; then
    echo "✓ Fix applied successfully!"
    echo "Functions should now be available. Try refreshing the application."
else
    echo "✗ Error applying fix. Please check your environment variables and try again."
fi
