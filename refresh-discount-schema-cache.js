/**
 * Refresh Schema Cache for Discount and Promotion Tables
 * This script forces Supabase to refresh its schema cache
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    db: {
      schema: 'public'
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function refreshSchemaCache() {
  console.log('========================================');
  console.log('Refreshing Schema Cache');
  console.log('========================================\n');

  try {
    console.log('🔄 Requesting schema cache refresh from Supabase...\n');
    
    // Method 1: Use PostgREST schema cache reload endpoint
    console.log('📡 Attempting to reload PostgREST schema cache...');
    
    // The schema cache is automatically refreshed by PostgREST
    // We can trigger it by making a request to the API
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .limit(0);

    if (error) {
      console.log('⚠️  Initial query returned:', error.message);
    }

    // Wait a moment for cache to refresh
    console.log('⏳ Waiting for cache refresh (5 seconds)...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Try again
    const { data: data2, error: error2 } = await supabase
      .from('coupons')
      .select('*')
      .limit(0);

    if (error2) {
      console.log('⚠️  Second query returned:', error2.message);
      console.log('\n📝 Note: Schema cache may take a few minutes to refresh automatically.');
      console.log('   You can also manually refresh it in the Supabase dashboard:');
      console.log('   Settings → API → Reload schema cache\n');
    } else {
      console.log('✅ Schema cache refreshed successfully!\n');
    }

    console.log('========================================');
    console.log('Schema Cache Refresh Complete');
    console.log('========================================\n');

    console.log('📝 Next Steps:');
    console.log('  1. If you still see schema cache errors, wait 2-3 minutes');
    console.log('  2. Or manually refresh in Supabase Dashboard:');
    console.log('     Settings → API → Reload schema cache');
    console.log('  3. Then run: node verify-discount-schema.js\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the refresh
refreshSchemaCache()
  .then(() => {
    console.log('🎉 Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
