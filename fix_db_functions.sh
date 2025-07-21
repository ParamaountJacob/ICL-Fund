#!/bin/bash

# Simple script to fix missing database functions
# Usage: ./fix_db_functions.sh -u <supabase_url> -k <api_key>

# Parse arguments
while getopts u:k: flag; do
    case "${flag}" in
        u) SUPABASE_URL=${OPTARG};;
        k) API_KEY=${OPTARG};;
    esac
done

# Check if parameters are provided
if [ -z "$SUPABASE_URL" ] || [ -z "$API_KEY" ]; then
    echo "Error: Missing required parameters"
    echo "Usage: ./fix_db_functions.sh -u <supabase_url> -k <api_key>"
    exit 1
fi

echo "Checking and fixing database functions..."

# Read the SQL file
SQL_FILE="./supabase/migrations/20250626172000_emergency_function_fix.sql"

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
  -H "apikey: $API_KEY" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"query\": $(echo "$SQL_CONTENT" | jq -s -R .)}"

# Check the result
if [ $? -eq 0 ]; then
    echo "✓ Fix applied successfully!"
    echo "Functions should now be available. Try refreshing the application."
else
    echo "✗ Error applying fix. Please check your credentials and try again."
fi
