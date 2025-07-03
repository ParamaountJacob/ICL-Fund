# PowerShell script to apply verification columns migration
# This script is safe to run multiple times

Write-Host "🚀 Applying verification columns migration..." -ForegroundColor Cyan

# Check if Supabase CLI is available
if (-not (Get-Command "supabase" -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Supabase CLI not found. Please install it first:" -ForegroundColor Red
    Write-Host "npm install -g supabase" -ForegroundColor Yellow
    exit 1
}

# Check if we're in a Supabase project
if (-not (Test-Path "supabase/config.toml")) {
    Write-Host "❌ Not in a Supabase project directory" -ForegroundColor Red
    exit 1
}

try {
    Write-Host "📋 Checking current migration status..." -ForegroundColor Yellow
    supabase migration list

    Write-Host "🔧 Applying verification columns migration..." -ForegroundColor Yellow
    
    # Apply the specific migration
    $migrationResult = supabase db push --include-all
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Verification columns migration applied successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📝 Changes applied:" -ForegroundColor Cyan
        Write-Host "  • Added verification_status column (pending/verified/denied)" -ForegroundColor White
        Write-Host "  • Added verification_requested column (boolean)" -ForegroundColor White
        Write-Host "  • Created indexes for performance" -ForegroundColor White
        Write-Host "  • Set up RLS policies for security" -ForegroundColor White
        Write-Host "  • Granted appropriate permissions" -ForegroundColor White
        Write-Host ""
        Write-Host "🎉 Admin system is now ready to use!" -ForegroundColor Green
    } else {
        Write-Host "❌ Migration failed. Check the output above for details." -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error applying migration: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🔍 You can verify the changes by checking your Supabase dashboard" -ForegroundColor Cyan
Write-Host "or by running: supabase db diff" -ForegroundColor Yellow
