// Simple utility to fix database functions
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function main() {
    console.log('Investment Database Function Fix Utility');
    console.log('=======================================');

    // Get credentials from user or environment
    const apiUrl = process.env.SUPABASE_URL || await promptQuestion('Enter your Supabase URL: ');
    const apiKey = process.env.SUPABASE_KEY || await promptQuestion('Enter your service role API key: ');

    if (!apiUrl || !apiKey) {
        console.error('Error: URL and API key are required');
        process.exit(1);
    }

    // Read the SQL file
    const sqlPath = path.join(__dirname, 'supabase', 'migrations', '20250626172000_emergency_function_fix.sql');

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
            console.error('Please check your credentials and try again.');
        }
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    } finally {
        rl.close();
    }
}

function promptQuestion(question) {
    return new Promise(resolve => {
        rl.question(question, answer => {
            resolve(answer);
        });
    });
}

main();
