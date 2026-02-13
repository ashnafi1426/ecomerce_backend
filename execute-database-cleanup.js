const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.kiro/specs/fastshop-ecommerce-platform/ecomerce_backend/.env' });

/**
 * EXECUTE DATABASE CLEANUP
 * ========================
 * 
 * This script directly cleans the test commission data from the database
 */

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupTestCommissionData() {
  try {
    console.log('🧹 Starting database cleanup...');

    // 1. Check current data
    console.log('\n📊 Current commission data:');
    const { data: currentEarnings, error: currentError } = await supabase
      .from('seller_earnings')
      .select('*');

    if (currentError) {
      console.error('❌ Error fetching current data:', currentError);
      return false;
    }

    console.log(`   Found ${currentEarnings?.length || 0} earnings records`);
    
    if (currentEarnings && currentEarnings.length > 0) {
      const totalCommission = currentEarnings.reduce((sum, earning) => sum + (earning.commission_amount || 0), 0) / 100;
      const totalRevenue = currentEarnings.reduce((sum, earning) => sum + (earning.gross_amount || 0), 0) / 100;
      console.log(`   Total Commission: $${totalCommission}`);
      console.log(`   Total Revenue: $${totalRevenue}`);
    }

    // 2. Delete test earnings data
    console.log('\n🗑️ Removing test earnings data...');
    const { error: deleteError } = await supabase
      .from('seller_earnings')
      .delete()
      .eq('seller_id', '08659266-babb-4323-b750-b1977c825e24');

    if (deleteError) {
      console.error('❌ Error deleting test earnings:', deleteError);
      return false;
    }

    console.log('✅ Test earnings data removed');

    // 3. Also remove any high-value test transactions
    console.log('\n🗑️ Removing high-value test transactions...');
    const { error: deleteHighValueError } = await supabase
      .from('seller_earnings')
      .delete()
      .gt('gross_amount', 10000000); // Remove transactions > $100,000

    if (deleteHighValueError) {
      console.error('❌ Error deleting high-value transactions:', deleteHighValueError);
      return false;
    }

    console.log('✅ High-value test transactions removed');

    // 4. Verify cleanup
    console.log('\n✅ Verifying cleanup...');
    const { data: remainingEarnings, error: verifyError } = await supabase
      .from('seller_earnings')
      .select('*');

    if (verifyError) {
      console.error('❌ Error verifying cleanup:', verifyError);
      return false;
    }

    console.log(`   Remaining earnings records: ${remainingEarnings?.length || 0}`);
    
    if (remainingEarnings && remainingEarnings.length > 0) {
      const remainingCommission = remainingEarnings.reduce((sum, earning) => sum + (earning.commission_amount || 0), 0) / 100;
      const remainingRevenue = remainingEarnings.reduce((sum, earning) => sum + (earning.gross_amount || 0), 0) / 100;
      console.log(`   Remaining Commission: $${remainingCommission}`);
      console.log(`   Remaining Revenue: $${remainingRevenue}`);
    } else {
      console.log('   ✅ All test data successfully removed');
      console.log('   📊 Commission analytics will now show $0 values');
    }

    return true;
  } catch (error) {
    console.error('❌ Database cleanup failed:', error);
    return false;
  }
}

async function runDatabaseCleanup() {
  console.log('🚀 Starting Database Cleanup for Commission Data...\n');

  const success = await cleanupTestCommissionData();

  if (success) {
    console.log('\n🏁 Database Cleanup Complete!');
    console.log('\n📋 RESULTS:');
    console.log('✅ Test commission data removed');
    console.log('✅ High-value test transactions removed');
    console.log('✅ Database is now in clean production state');
    
    console.log('\n🎯 NEXT STEPS:');
    console.log('1. Refresh the admin commission settings page');
    console.log('2. You should now see $0 values in all statistics');
    console.log('3. Real commission data will appear as customers make purchases');
  } else {
    console.log('\n❌ Database cleanup failed');
    console.log('Please check the error messages above and try again');
  }
}

// Run the cleanup
runDatabaseCleanup().catch(console.error);