#!/usr/bin/env pwsh

# =================================================================
# IDEMPOTENT MIGRATION RUNNER
# Applies all migrations safely - can be run multiple times
# =================================================================

Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "IDEMPOTENT SUPABASE MIGRATION RUNNER" -ForegroundColor Cyan
Write-Host "Safe to run multiple times - will skip already applied changes" -ForegroundColor Cyan
Write-Host "==================================================================" -ForegroundColor Cyan

# Check if we're in the correct directory
if (-not (Test-Path "supabase")) {
    Write-Host "❌ Error: supabase directory not found. Please run from project root." -ForegroundColor Red
    exit 1
}

# Check if Supabase CLI is installed
try {
    $supabaseVersion = supabase --version
    Write-Host "✅ Found Supabase CLI: $supabaseVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: Supabase CLI not found. Please install it first." -ForegroundColor Red
    Write-Host "Install with: npm install -g supabase" -ForegroundColor Yellow
    exit 1
}

# Check if supabase is linked
try {
    $linkStatus = supabase status 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Error: Supabase project not linked. Please run 'supabase login' and 'supabase link' first." -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Supabase project is linked" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: Unable to check Supabase status. Please ensure you're logged in." -ForegroundColor Red
    exit 1
}

# Migration files in order
$migrations = @(
    "20250629150000_comprehensive_restoration.sql",
    "20250702000000_add_verification_columns.sql", 
    "20250702100000_add_user_sync_function.sql"
)

Write-Host "`n📁 Checking migration files..." -ForegroundColor Yellow

# Check all migration files exist
foreach ($migration in $migrations) {
    $filePath = "supabase/migrations/$migration"
    if (-not (Test-Path $filePath)) {
        Write-Host "❌ Error: Migration file not found: $filePath" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Found: $migration" -ForegroundColor Green
}

Write-Host "`n🚀 Starting migration process..." -ForegroundColor Yellow
Write-Host "Note: These migrations are idempotent - they will skip changes that already exist." -ForegroundColor Cyan

# Apply migrations
try {
    Write-Host "`n📊 Running database migrations..." -ForegroundColor Yellow
    $result = supabase db push
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ All migrations applied successfully!" -ForegroundColor Green
        
        Write-Host "`n🔄 Testing sync function..." -ForegroundColor Yellow
        
        # Test the sync function
        Write-Host "You can now:" -ForegroundColor Cyan
        Write-Host "1. 🌐 Go to your Profile page admin panel" -ForegroundColor White
        Write-Host "2. 🔄 Click 'Sync Users from Auth' button" -ForegroundColor White
        Write-Host "3. 👥 See your users appear in the admin interface" -ForegroundColor White
        
        Write-Host "`n✨ Migration completed successfully!" -ForegroundColor Green
        Write-Host "The database is now ready for full functionality." -ForegroundColor Cyan
        
    } else {
        Write-Host "❌ Migration failed. Check the error message above." -ForegroundColor Red
        exit 1
    }
    
} catch {
    Write-Host "❌ Error during migration: $_" -ForegroundColor Red
    exit 1
}

Write-Host "`n==================================================================" -ForegroundColor Cyan
Write-Host "MIGRATION COMPLETE" -ForegroundColor Cyan
Write-Host "==================================================================" -ForegroundColor Cyan
