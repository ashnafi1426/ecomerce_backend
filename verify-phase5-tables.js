/**
 * VERIFY PHASE 5 TABLES
 * 
 * Checks if Phase 5 tables were created successfully in the database.
 */

const supabase = require('./config/supabase');

async function verifyPhase5Tables() {
  console.log('🔍 Verifying Phase 5 Database Tables...\n');
  
  const tables = [
    'seller_documents',
    'seller_earnings',
    'product_approvals',
    'seller_performance',
    'manager_actions',
    'notifications',
    'payout_requests'
  ];
  
  let allTablesExist = true;
  
  for (const table of tables) {
    try {
      // Try to query the table
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
        allTablesExist = false;
      } else {
        console.log(`✅ ${table}: Table exists (${count || 0} rows)`);
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err.message}`);
      allTablesExist = false;
    }
  }
  
  console.log('\n📊 Checking updated columns in existing tables...\n');
  
  // Check users table for seller verification fields
  const { data: userData } = await supabase
    .from('users')
    .select('id, role, seller_verification_status, seller_verified_at')
    .eq('role', 'seller')
    .limit(1);
  
  if (userData && userData.length > 0) {
    console.log('✅ users table: seller_verification_status column exists');
  } else {
    console.log('⚠️  users table: No sellers found or column missing');
  }
  
  // Check products table for approval fields
  const { data: productData } = await supabase
    .from('products')
    .select('id, approval_status, approved_at')
    .limit(1);
  
  if (productData) {
    console.log('✅ products table: approval_status column exists');
  } else {
    console.log('⚠️  products table: approval columns might be missing');
  }
  
  console.log('\n' + (allTablesExist ? '✅ All Phase 5 tables verified!' : '⚠️  Some tables need attention'));
  console.log('\n💡 Note: If tables show as missing, you may need to:');
  console.log('   1. Enable them in Supabase Dashboard > API Settings');
  console.log('   2. Grant permissions via RLS policies');
  console.log('   3. Refresh the PostgREST schema cache\n');
}

verifyPhase5Tables()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
