#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Checks and fixes missing Supabase functions
.DESCRIPTION
    This script checks if required functions exist in the Supabase database
    and applies emergency fixes if they don't.
.EXAMPLE
    .\check_fix_functions.ps1 -ApiKey "your_service_key" -ApiUrl "https://your-project-ref.supabase.co"
#>

param(
    [Parameter(Mandatory = $true)]
    [string]$ApiKey, 
    
    [Parameter(Mandatory = $true)]
    [string]$ApiUrl
)

# Function to check if a function exists
function Test-SupabaseFunction {
    param (
        [string]$FunctionName,
        [string]$ApiUrl,
        [string]$ApiKey
    )
    
    Write-Host "Checking if function '$FunctionName' exists..." -ForegroundColor Yellow
    
    $headers = @{
        "apikey" = $ApiKey
        "Authorization" = "Bearer $ApiKey"
        "Content-Type" = "application/json"
        "Prefer" = "return=representation"
    }
    
    $query = @"
    SELECT COUNT(*) FROM pg_proc 
    JOIN pg_namespace ON pg_namespace.oid = pg_proc.pronamespace
    WHERE pg_namespace.nspname = 'public'
    AND proname = '$FunctionName';
"@
    
    try {
        $response = Invoke-RestMethod -Uri "$ApiUrl/rest/v1/rpc/pg_query" -Method POST -Headers $headers -Body (@{
            query = $query
        } | ConvertTo-Json)
        
        if ($response.Count -gt 0 -and $response[0].count -gt 0) {
            Write-Host "✅ Function '$FunctionName' exists" -ForegroundColor Green
            return $true
        } else {
            Write-Host "❌ Function '$FunctionName' does not exist" -ForegroundColor Red
            return $false
        }
    }
    catch {
        Write-Host "❌ Error checking function: $_" -ForegroundColor Red
        return $false
    }
}

# Function to apply SQL fixes
function Apply-SqlFix {
    param (
        [string]$SqlContent,
        [string]$ApiUrl,
        [string]$ApiKey,
        [string]$FixName
    )
    
    Write-Host "Applying fix: $FixName..." -ForegroundColor Yellow
    
    $headers = @{
        "apikey" = $ApiKey
        "Authorization" = "Bearer $ApiKey"
        "Content-Type" = "application/json"
        "Prefer" = "return=representation"
    }
    
    try {
        $response = Invoke-RestMethod -Uri "$ApiUrl/rest/v1/rpc/pg_query" -Method POST -Headers $headers -Body (@{
            query = $SqlContent
        } | ConvertTo-Json)
        
        Write-Host "✅ Successfully applied fix: $FixName" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "❌ Error applying fix: $_" -ForegroundColor Red
        return $false
    }
}

# Main script execution
Write-Host "Starting database function check..." -ForegroundColor Cyan

# Check required functions
$getUserInvestmentsFn = Test-SupabaseFunction -FunctionName "get_user_investments_with_applications" -ApiUrl $ApiUrl -ApiKey $ApiKey
$getAdminInvestmentsFn = Test-SupabaseFunction -FunctionName "get_admin_investments_with_users" -ApiUrl $ApiUrl -ApiKey $ApiKey
$updateOnboardingStepFn = Test-SupabaseFunction -FunctionName "update_onboarding_step" -ApiUrl $ApiUrl -ApiKey $ApiKey

# If any function is missing, apply the emergency fix
if (-not ($getUserInvestmentsFn -and $getAdminInvestmentsFn -and $updateOnboardingStepFn)) {
    Write-Host "Missing functions detected! Applying emergency fix..." -ForegroundColor Red
    
    # Read the emergency SQL fix from file
    $sqlPath = Join-Path $PSScriptRoot "supabase/migrations/20250626172000_emergency_function_fix.sql"
    if (Test-Path $sqlPath) {
        $sqlContent = Get-Content -Path $sqlPath -Raw
        $success = Apply-SqlFix -SqlContent $sqlContent -ApiUrl $ApiUrl -ApiKey $ApiKey -FixName "Emergency Function Fix"
        
        if ($success) {
            Write-Host "✅ Emergency fixes applied successfully! The application should now work." -ForegroundColor Green
        } else {
            Write-Host "❌ Failed to apply emergency fixes. Please apply the SQL manually." -ForegroundColor Red
            Write-Host "Manual SQL file: $sqlPath" -ForegroundColor Yellow
        }
    } else {
        Write-Host "❌ Emergency SQL file not found at: $sqlPath" -ForegroundColor Red
        Write-Host "Please check EMERGENCY_FUNCTION_FIX.md for manual SQL instructions." -ForegroundColor Yellow
    }
} else {
    Write-Host "✅ All required functions exist! No fixes needed." -ForegroundColor Green
}

Write-Host "Function check complete." -ForegroundColor Cyan
