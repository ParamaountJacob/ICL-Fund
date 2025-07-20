#!/bin/bash

# ================================================================
# ADMIN SETUP SCRIPT - Applies admin migration via Supabase CLI
# ================================================================

echo "🚀 Setting up admin privileges for innercirclelending@gmail.com..."
echo ""

# Check if Supabase CLI is available
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "   npm install -g supabase"
    exit 1
fi

# Apply the admin setup migration
echo "📋 Applying admin setup migration..."
supabase db push --local --include-schemas public

# Or apply directly via SQL
echo "💾 Running admin setup SQL..."
supabase db shell -c "$(cat ADMIN_SETUP_MIGRATION.sql)"

echo ""
echo "✅ Admin setup complete!"
echo ""
echo "Next steps:"
echo "1. Refresh your browser"
echo "2. Check console logs for 'Successfully loaded profile/role: { roleData: 'admin', ... }'"
echo "3. DataRoom should now auto-authenticate you as admin"
echo ""
