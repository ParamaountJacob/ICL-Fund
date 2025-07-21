// Simple utility to fix database functions
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

async function main() {
    console.log('Investment Database Function Fix Utility');
    console.log('=======================================');

    // Only use environment variables for security
    const apiUrl = process.env.SUPABASE_URL;
    const apiKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!apiUrl || !apiKey) {
        console.error('Error: Required environment variables not set');
        console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables');
        console.error('Example: SUPABASE_URL=https://xxx.supabase.co SUPABASE_SERVICE_ROLE_KEY=xxx node fix_db_functions.js');
        process.exit(1);
    }

    // Use the latest emergency fix migration file
    const sqlPath = path.join(__dirname, 'supabase', 'migrations', '20250703000000_clean_emergency_fix.sql');

    try {
        console.log(`Reading SQL file from ${sqlPath}...`);
        const sqlContent = fs.readFileSync(sqlPath, 'utf8');

        console.log('Applying fix to database...');
        const result = await fetch(`${apiUrl}/rest/v1/rpc/pg_query`, {
            method: 'POST',
            headers: {
                'apikey': apiKey,
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query: sqlContent })
        });

        const data = await result.json();

        if (result.ok) {
            console.log('✅ Fix applied successfully!');
            console.log('Database functions should now be available.');
            console.log('Try refreshing your application.');
        } else {
            console.error('❌ Error applying fix:', data?.message || data);
            console.error('Please check your environment variables and try again.');
        }
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

// Remove the promptQuestion function since we no longer accept interactive input
main();
