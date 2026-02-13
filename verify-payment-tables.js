/**
 * VERIFY PAYMENT TABLES
 * 
 * Quick script to verify all payment system tables exist with status columns
 */

const supabase = require('./config/supabase');

async function verifyPaymentTables() {
  console.log('🔍 VERIFYING PAYMENT SYSTEM TABLES\n');
  console.log('='.repeat(60));
  
  const tables = [
    { name: 'orders', statusColumn: 'status' },
    { name: 'sub_orders', statusColumn: 'status' },
    { name: 'seller_earnings', statusColumn: 'status' },
    { name: 'payouts', statusColumn: 'status' },
    { name: 'seller_bank_accounts', statusColumn: null },
    { name: 'commission_settings', statusColumn: null }
  ];
  
  let allGood = true;
  
  for (const table of tables) {
    console.log(`\n📋 Checking ${table.name}...`);
    
    try {
      // Check if table exists by querying it
      const { data, error } = await supabase
        .from(table.name)
        .select('*')
        .limit(1);
      
      if (error && error.message.includes('relation') && error.message.includes('does not exist')) {
        console.log(`❌ Table ${table.name} does NOT exist`);
        allGood = false;
        continue;
      }
      
      console.log(`✅ Table ${table.name} exists`);
      
      // Check status column if applicable
      if (table.statusColumn) {
        const { data: statusData, error: statusError } = await supabase
          .from(table.name)
          .select(table.statusColumn)
          .limit(1);
        
        if (statusError && statusError.message.includes('column') && statusError.message.includes('does not exist')) {
          console.log(`❌ Column ${table.statusColumn} does NOT exist in ${table.name}`);
          allGood = false;
        } else {
          console.log(`✅ Column ${table.statusColumn} exists in ${table.name}`);
          
          // Show sample data if available
          if (data && data.length > 0 && data[0][table.statusColumn]) {
            console.log(`   Sample value: ${data[0][table.statusColumn]}`);
          }
        }
      }
      
      // Show row count
      if (data) {
        const { count } = await supabase
          .from(table.name)
          .select('*', { count: 'exact', head: true });
        
        console.log(`   Rows: ${count || 0}`);
      }
      
    } catch (err) {
      console.log(`❌ Error checking ${table.name}:`, err.message);
      allGood = false;
    }
  }
  
  console.log('\n' + '='.repeat(60));
  
  if (allGood) {
    console.log('✅ ALL PAYMENT TABLES VERIFIED SUCCESSFULLY!');
    console.log('\n📝 Next steps:');
    console.log('1. Test seller payment APIs');
    console.log('2. Implement seller payment dashboard');
    console.log('3. Implement admin payout management');
  } else {
    console.log('❌ SOME TABLES ARE MISSING');
    console.log('\n💡 SOLUTION:');
    console.log('1. Open Supabase Dashboard → SQL Editor');
    console.log('2. Run the migration file:');
    console.log('   database/migrations/complete-payment-system-fix.sql');
    console.log('3. Run this script again to verify');
  }
  
  console.log('='.repeat(60));
  
  return allGood;
}

// Run verification
verifyPaymentTables()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('\n❌ Verification failed:', error.message);
    process.exit(1);
  });
