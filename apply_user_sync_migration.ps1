#!/usr/bin/env pwsh
# PowerShell script to apply the user sync function migration

Write-Host "🔄 Applying User Sync Function Migration..." -ForegroundColor Cyan

# Check if Supabase CLI is installed
$supabaseVersion = supabase --version 2>$null
if (-not $supabaseVersion) {
    Write-Host "❌ Supabase CLI not found. Please install it first:" -ForegroundColor Red
    Write-Host "npm install -g supabase" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Supabase CLI found: $supabaseVersion" -ForegroundColor Green

try {
    # Apply the user sync function migration
    Write-Host "📁 Applying migration: 20250702100000_add_user_sync_function.sql" -ForegroundColor Blue
    
    supabase db push
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ User sync function migration applied successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "🚀 Next steps:" -ForegroundColor Cyan
        Write-Host "1. Go to your admin panel in the app" -ForegroundColor White
        Write-Host "2. Click 'Sync Users from Auth' button" -ForegroundColor White
        Write-Host "3. This will sync your 5 users from Auth to the Profiles table" -ForegroundColor White
        Write-Host ""
    } else {
        Write-Host "❌ Migration failed. Check the error above." -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error applying migration: $_" -ForegroundColor Red
    exit 1
}
