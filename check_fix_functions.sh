#!/bin/bash

# Check and Fix Supabase Functions
# This script checks if required functions exist in the Supabase database
# and applies emergency fixes if they don't.

# Usage: ./check_fix_functions.sh -k "your_service_key" -u "https://your-project-ref.supabase.co"

# Process command line arguments
while getopts "k:u:" opt; do
  case $opt in
    k) API_KEY="$OPTARG" ;;
    u) API_URL="$OPTARG" ;;
    \?) echo "Invalid option -$OPTARG" >&2
        echo "Usage: ./check_fix_functions.sh -k API_KEY -u API_URL" >&2
        exit 1 ;;
    :) echo "Option -$OPTARG requires an argument." >&2
       exit 1 ;;
  esac
done

# Check if required args are provided
if [ -z "$API_KEY" ] || [ -z "$API_URL" ]; then
    echo "Error: API key and URL are required"
    echo "Usage: ./check_fix_functions.sh -k API_KEY -u API_URL"
    exit 1
fi

# Function to check if a function exists
check_function() {
    local function_name=$1
    echo "Checking if function '$function_name' exists..."
    
    local query="SELECT COUNT(*) FROM pg_proc 
                JOIN pg_namespace ON pg_namespace.oid = pg_proc.pronamespace
                WHERE pg_namespace.nspname = 'public'
                AND proname = '$function_name';"
    
    local response
    response=$(curl -s -X POST "$API_URL/rest/v1/rpc/pg_query" \
                  -H "apikey: $API_KEY" \
                  -H "Authorization: Bearer $API_KEY" \
                  -H "Content-Type: application/json" \
                  -H "Prefer: return=representation" \
                  -d "{\"query\": \"$query\"}")
    
    # Check for errors in response
    if [[ $response == *"error"* ]]; then
        echo "❌ Error checking function: $response"
        return 1
    fi
    
    # Extract count from response
    local count=$(echo "$response" | grep -o '"count":[0-9]*' | cut -d ':' -f2)
    
    if [[ $count -gt 0 ]]; then
        echo "✅ Function '$function_name' exists"
        return 0
    else
        echo "❌ Function '$function_name' does not exist"
        return 1
    fi
}

# Function to apply SQL fixes
apply_sql_fix() {
    local sql_content=$1
    local fix_name=$2
    
    echo "Applying fix: $fix_name..."
    
    local response
    response=$(curl -s -X POST "$API_URL/rest/v1/rpc/pg_query" \
                  -H "apikey: $API_KEY" \
                  -H "Authorization: Bearer $API_KEY" \
                  -H "Content-Type: application/json" \
                  -H "Prefer: return=representation" \
                  -d "{\"query\": \"$sql_content\"}")
    
    if [[ $response == *"error"* ]]; then
        echo "❌ Error applying fix: $response"
        return 1
    else
        echo "✅ Successfully applied fix: $fix_name"
        return 0
    fi
}

# Main script execution
echo "Starting database function check..."

# Check required functions
check_function "get_user_investments_with_applications"
user_investments_exists=$?

check_function "get_admin_investments_with_users" 
admin_investments_exists=$?

check_function "update_onboarding_step"
update_step_exists=$?

# If any function is missing, apply the emergency fix
if [[ $user_investments_exists -ne 0 || $admin_investments_exists -ne 0 || $update_step_exists -ne 0 ]]; then
    echo "Missing functions detected! Applying emergency fix..."
    
    # Read the emergency SQL fix from file
    sql_path="./supabase/migrations/20250626172000_emergency_function_fix.sql"
    if [[ -f "$sql_path" ]]; then
        sql_content=$(<"$sql_path")
        apply_sql_fix "$sql_content" "Emergency Function Fix"
        fix_success=$?
        
        if [[ $fix_success -eq 0 ]]; then
            echo "✅ Emergency fixes applied successfully! The application should now work."
        else
            echo "❌ Failed to apply emergency fixes. Please apply the SQL manually."
            echo "Manual SQL file: $sql_path"
        fi
    else
        echo "❌ Emergency SQL file not found at: $sql_path"
        echo "Please check EMERGENCY_FUNCTION_FIX.md for manual SQL instructions."
    fi
else
    echo "✅ All required functions exist! No fixes needed."
fi

echo "Function check complete."
