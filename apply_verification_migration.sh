#!/bin/bash

# Bash script to apply verification columns migration
# This script is safe to run multiple times

echo "🚀 Applying verification columns migration..."

# Check if Supabase CLI is available
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "npm install -g supabase"
    exit 1
fi

# Check if we're in a Supabase project
if [ ! -f "supabase/config.toml" ]; then
    echo "❌ Not in a Supabase project directory"
    exit 1
fi

echo "📋 Checking current migration status..."
supabase migration list

echo "🔧 Applying verification columns migration..."

# Apply the migration
if supabase db push --include-all; then
    echo "✅ Verification columns migration applied successfully!"
    echo ""
    echo "📝 Changes applied:"
    echo "  • Added verification_status column (pending/verified/denied)"
    echo "  • Added verification_requested column (boolean)"
    echo "  • Created indexes for performance"
    echo "  • Set up RLS policies for security"
    echo "  • Granted appropriate permissions"
    echo ""
    echo "🎉 Admin system is now ready to use!"
else
    echo "❌ Migration failed. Check the output above for details."
    exit 1
fi

echo ""
echo "🔍 You can verify the changes by checking your Supabase dashboard"
echo "or by running: supabase db diff"
