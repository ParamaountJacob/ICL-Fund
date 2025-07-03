#!/usr/bin/env pwsh

# =================================================================
# QUICK UNICODE-FREE MIGRATION RUNNER
# Applies fixed migrations without Unicode characters
# =================================================================

Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "APPLYING UNICODE-FREE MIGRATIONS" -ForegroundColor Cyan
Write-Host "This fixes the 'too few parameters for RAISE' error" -ForegroundColor Cyan
Write-Host "==================================================================" -ForegroundColor Cyan

# Check if we're in the correct directory
if (-not (Test-Path "supabase")) {
    Write-Host "❌ Error: supabase directory not found. Please run from project root." -ForegroundColor Red
    exit 1
}

Write-Host "🚀 Running fixed migrations..." -ForegroundColor Yellow

try {
    # Apply the fixed migrations
    $result = supabase db push
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ SUCCESS: All migrations applied without Unicode errors!" -ForegroundColor Green
        
        Write-Host "`n🔄 Next steps:" -ForegroundColor Yellow
        Write-Host "1. Go to your Profile page admin panel" -ForegroundColor White
        Write-Host "2. Click 'Sync Users from Auth' button" -ForegroundColor White
        Write-Host "3. Your 5 users should now appear!" -ForegroundColor White
        
        Write-Host "`n✨ Database is ready!" -ForegroundColor Green
        
    } else {
        Write-Host "❌ Migration failed. Check the error message above." -ForegroundColor Red
        exit 1
    }
    
} catch {
    Write-Host "❌ Error during migration: $_" -ForegroundColor Red
    exit 1
}

Write-Host "`n==================================================================" -ForegroundColor Cyan
Write-Host "UNICODE ISSUE FIXED - MIGRATION COMPLETE" -ForegroundColor Cyan
Write-Host "==================================================================" -ForegroundColor Cyan
