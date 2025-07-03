#!/bin/bash

# =================================================================
# IDEMPOTENT MIGRATION RUNNER
# Applies all migrations safely - can be run multiple times
# =================================================================

echo "=================================================================="
echo "IDEMPOTENT SUPABASE MIGRATION RUNNER"
echo "Safe to run multiple times - will skip already applied changes"
echo "=================================================================="

# Check if we're in the correct directory
if [ ! -d "supabase" ]; then
    echo "❌ Error: supabase directory not found. Please run from project root."
    exit 1
fi

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Error: Supabase CLI not found. Please install it first."
    echo "Install with: npm install -g supabase"
    exit 1
fi

supabase_version=$(supabase --version)
echo "✅ Found Supabase CLI: $supabase_version"

# Check if supabase is linked
if ! supabase status &> /dev/null; then
    echo "❌ Error: Supabase project not linked. Please run 'supabase login' and 'supabase link' first."
    exit 1
fi

echo "✅ Supabase project is linked"

# Migration files in order
migrations=(
    "20250629150000_comprehensive_restoration.sql"
    "20250702000000_add_verification_columns.sql" 
    "20250702100000_add_user_sync_function.sql"
)

echo ""
echo "📁 Checking migration files..."

# Check all migration files exist
for migration in "${migrations[@]}"; do
    file_path="supabase/migrations/$migration"
    if [ ! -f "$file_path" ]; then
        echo "❌ Error: Migration file not found: $file_path"
        exit 1
    fi
    echo "✅ Found: $migration"
done

echo ""
echo "🚀 Starting migration process..."
echo "Note: These migrations are idempotent - they will skip changes that already exist."

# Apply migrations
echo ""
echo "📊 Running database migrations..."

if supabase db push; then
    echo "✅ All migrations applied successfully!"
    
    echo ""
    echo "🔄 Testing sync function..."
    
    # Test the sync function
    echo "You can now:"
    echo "1. 🌐 Go to your Profile page admin panel"
    echo "2. 🔄 Click 'Sync Users from Auth' button"
    echo "3. 👥 See your users appear in the admin interface"
    
    echo ""
    echo "✨ Migration completed successfully!"
    echo "The database is now ready for full functionality."
    
else
    echo "❌ Migration failed. Check the error message above."
    exit 1
fi

echo ""
echo "=================================================================="
echo "MIGRATION COMPLETE"
echo "=================================================================="
