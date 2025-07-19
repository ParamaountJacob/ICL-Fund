# Fix Admin Role for innercirclelending@gmail.com
# Run this command to update the admin role in the database

$query = @"
-- Update or insert the admin profile
INSERT INTO user_profiles (
    user_id, 
    email, 
    first_name, 
    last_name, 
    role, 
    is_admin,
    created_at,
    updated_at
)
SELECT 
    au.id,
    'innercirclelending@gmail.com',
    'Inner Circle',
    'Lending',
    'admin',
    true,
    now(),
    now()
FROM auth.users au 
WHERE au.email = 'innercirclelending@gmail.com'
ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    is_admin = EXCLUDED.is_admin,
    updated_at = now();

-- Verify the fix
SELECT user_id, email, first_name, last_name, role, is_admin FROM user_profiles WHERE email = 'innercirclelending@gmail.com';
"@

Write-Host "Running admin role fix..." -ForegroundColor Yellow
supabase db shell -c $query
Write-Host "✅ Admin role fix complete!" -ForegroundColor Green
