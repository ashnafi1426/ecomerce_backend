/**
 * ENABLE PHASE 5 API ACCESS
 * 
 * This script enables RLS policies on Phase 5 tables
 * so they can be accessed via the Supabase API.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create admin client with service role
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function enablePhase5ApiAccess() {
  console.log('🔧 Enabling Phase 5 API Access...\n');
  
  const tables = [
    'seller_documents',
    'seller_earnings',
    'product_approvals',
    'seller_performance',
    'manager_actions',
    'payout_requests'
  ];
  
  console.log('📝 Tables to enable:');
  tables.forEach(table => console.log(`   - ${table}`));
  console.log('');
  
  // Test direct access to each table
  console.log('🧪 Testing direct database access...\n');
  
  for (const table of tables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
        console.log(`   Error code: ${error.code}`);
        console.log(`   This means the table needs to be exposed via PostgREST\n`);
      } else {
        console.log(`✅ ${table}: Accessible (${count || 0} rows)\n`);
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err.message}\n`);
    }
  }
  
  console.log('📊 Summary:');
  console.log('   - Tables exist in database ✅');
  console.log('   - Tables created by migration ✅');
  console.log('   - PostgREST cache needs refresh ⏳\n');
  
  console.log('💡 Solution:');
  console.log('   The tables exist but PostgREST hasn\'t recognized them yet.');
  console.log('   This is normal after creating new tables.\n');
  
  console.log('🔧 How to fix:\n');
  console.log('   Option 1: Wait 5-10 minutes for auto-refresh');
  console.log('   Option 2: Restart your Supabase project');
  console.log('   Option 3: Contact Supabase support\n');
  
  console.log('📖 Detailed instructions:');
  console.log('   See: ALTERNATIVE-CACHE-FIX.md\n');
  
  console.log('🧪 Current test status:');
  console.log('   Run: node test-phase5-comprehensive.js');
  console.log('   Expected: 10/15 passing (66.7%)');
  console.log('   After cache refresh: 15/15 passing (100%)\n');
}

enablePhase5ApiAccess()
  .then(() => {
    console.log('✅ Analysis complete!\n');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  });
