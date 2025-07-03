#!/usr/bin/env pwsh
# PowerShell script to debug user sync issues

Write-Host "🔍 Debugging User Sync Issues..." -ForegroundColor Cyan

Write-Host ""
Write-Host "📋 Diagnostic Steps:" -ForegroundColor Yellow
Write-Host "1. Check if profiles table exists"
Write-Host "2. Check if verification columns exist"
Write-Host "3. Try to sync users from auth to profiles"
Write-Host ""

Write-Host "🚀 You can run these SQL queries in Supabase Dashboard > SQL Editor:" -ForegroundColor Green
Write-Host ""

Write-Host "-- 1. Check if profiles table exists and has data:" -ForegroundColor Blue
Write-Host "SELECT COUNT(*) as profile_count FROM profiles;" -ForegroundColor White
Write-Host ""

Write-Host "-- 2. Check verification columns:" -ForegroundColor Blue
Write-Host "SELECT column_name FROM information_schema.columns WHERE table_name = 'profiles' AND column_name IN ('verification_status', 'verification_requested');" -ForegroundColor White
Write-Host ""

Write-Host "-- 3. Check auth.users count:" -ForegroundColor Blue
Write-Host "SELECT COUNT(*) as auth_user_count FROM auth.users;" -ForegroundColor White
Write-Host ""

Write-Host "-- 4. Sync users from auth to profiles:" -ForegroundColor Blue
Write-Host "SELECT * FROM sync_auth_users_to_profiles();" -ForegroundColor White
Write-Host ""

Write-Host "-- 5. Check profiles after sync:" -ForegroundColor Blue
Write-Host "SELECT id, email, first_name, last_name, created_at FROM profiles ORDER BY created_at DESC;" -ForegroundColor White
Write-Host ""

Write-Host "💡 Pro tip: If you see 5 users in auth.users but 0 in profiles, run the sync function!" -ForegroundColor Yellow
