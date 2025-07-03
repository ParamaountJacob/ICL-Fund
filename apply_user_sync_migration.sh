#!/bin/bash
# Bash script to apply the user sync function migration

echo "🔄 Applying User Sync Function Migration..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "npm install -g supabase"
    exit 1
fi

SUPABASE_VERSION=$(supabase --version)
echo "✅ Supabase CLI found: $SUPABASE_VERSION"

# Apply the user sync function migration
echo "📁 Applying migration: 20250702100000_add_user_sync_function.sql"

if supabase db push; then
    echo "✅ User sync function migration applied successfully!"
    echo ""
    echo "🚀 Next steps:"
    echo "1. Go to your admin panel in the app"
    echo "2. Click 'Sync Users from Auth' button"
    echo "3. This will sync your 5 users from Auth to the Profiles table"
    echo ""
else
    echo "❌ Migration failed. Check the error above."
    exit 1
fi
