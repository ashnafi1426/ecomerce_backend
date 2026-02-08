/**
 * REFRESH SUPABASE SCHEMA CACHE
 * 
 * This script refreshes the PostgREST schema cache in Supabase
 * to recognize newly added columns and tables.
 */

require('dotenv').config();
const https = require('https');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function refreshSchemaCache() {
  console.log('🔄 Refreshing Supabase Schema Cache...\n');

  try {
    // Extract project reference from URL
    const projectRef = SUPABASE_URL.replace('https://', '').split('.')[0];
    
    // PostgREST schema cache reload endpoint
    const url = `${SUPABASE_URL}/rest/v1/`;
    const urlObj = new URL(url);

    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname,
      method: 'GET',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Prefer': 'schema-reload'
      }
    };

    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          if (res.statusCode === 200 || res.statusCode === 204) {
            console.log('✅ Schema cache refreshed successfully!');
            console.log('\n💡 The following should now be recognized:');
            console.log('   - seller_verification_status column in users table');
            console.log('   - seller_verified_at column in users table');
            console.log('   - seller_verified_by column in users table');
            console.log('   - approval_status column in products table');
            console.log('   - All Phase 5 tables and relationships');
            console.log('\n🚀 You can now run the tests again!');
            resolve(true);
          } else {
            console.log('⚠️  Schema cache refresh returned status:', res.statusCode);
            console.log('   Response:', body);
            console.log('\n💡 Alternative method: Restart your Supabase project');
            console.log('   1. Go to Supabase Dashboard');
            console.log('   2. Project Settings > General');
            console.log('   3. Click "Pause project" then "Resume project"');
            resolve(false);
          }
        });
      });

      req.on('error', (error) => {
        console.error('❌ Error refreshing schema cache:', error.message);
        console.log('\n💡 Manual refresh required:');
        console.log('   1. Go to Supabase Dashboard');
        console.log('   2. Project Settings > API');
        console.log('   3. Click "Reload schema cache"');
        console.log('   OR restart your project');
        reject(error);
      });

      req.end();
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Please manually refresh the schema cache:');
    console.log('   1. Go to Supabase Dashboard');
    console.log('   2. Project Settings > API');
    console.log('   3. Click "Reload schema cache"');
    process.exit(1);
  }
}

// Run the script
refreshSchemaCache()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
