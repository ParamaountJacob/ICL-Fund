# 🛡️ APPLY IDEMPOTENT MIGRATIONS
# Run this script to apply the safe, idempotent versions of your migrations

Write-Host "🔐 APPLYING IDEMPOTENT MIGRATIONS..." -ForegroundColor Cyan
Write-Host "⚠️  These migrations are 100% safe to run multiple times" -ForegroundColor Yellow

# Check if we're in the right directory
if (-not (Test-Path "supabase/migrations")) {
    Write-Host "❌ Error: supabase/migrations directory not found" -ForegroundColor Red
    Write-Host "Please run this script from your project root directory" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📋 AVAILABLE IDEMPOTENT MIGRATIONS:" -ForegroundColor Green
Write-Host "1. 20250627050000_bulletproof_complete_migration_IDEMPOTENT.sql"
Write-Host "2. 20250627080000_final_workflow_reset_IDEMPOTENT.sql"
Write-Host "3. 20250627120000_emergency_admin_fix_IDEMPOTENT.sql" 
Write-Host "4. 20250627170000_comprehensive_rls_policies.sql (already idempotent)"

Write-Host ""
Write-Host "🚀 TO APPLY MIGRATIONS:" -ForegroundColor Yellow
Write-Host "1. Copy the SQL content from any of the above files"
Write-Host "2. Go to your Supabase Dashboard → SQL Editor"
Write-Host "3. Paste the SQL and run it"
Write-Host "4. Repeat as needed - they're safe to run multiple times!"

Write-Host ""
Write-Host "💡 RECOMMENDED ORDER:" -ForegroundColor Blue
Write-Host "1. Run the comprehensive RLS policies migration first"
Write-Host "2. Then run any of the other migrations as needed"
Write-Host "3. Test by running the same migration twice - should show 'already exists' messages"

Write-Host ""
Write-Host "📖 For detailed guide, see: IDEMPOTENT_MIGRATION_GUIDE.md" -ForegroundColor Magenta

Write-Host ""
Write-Host "✅ All your future migrations will be idempotent-safe!" -ForegroundColor Green
