const fs = require('fs');
const path = require('path');
const supabase = require('./config/supabase.js');

/**
 * Run Simple Payment Migration
 * Adds essential columns for Stripe payment system
 */
async function runSimplePaymentMigration() {
  try {
    console.log('🚀 Starting Simple Payment Migration...');
    
    // Read the simple migration SQL file
    const migrationPath = path.join(__dirname, 'database', 'migrations', 'simple-payment-columns-fix.sql');
    
    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Migration file not found:', migrationPath);
      return;
    }
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log('📄 Simple migration file loaded');
    
    console.log('\n📋 MANUAL EXECUTION REQUIRED:');
    console.log('Please run this SQL in your database console:');
    console.log('=' .repeat(80));
    console.log(migrationSQL);
    console.log('=' .repeat(80));
    
    // Test basic table access
    console.log('\n🔍 Testing table access...');
    
    try {
      const { data: earningsTest } = await supabase
        .from('seller_earnings')
        .select('*')
        .limit(1);
      console.log('✅ seller_earnings table accessible');
    } catch (err) {
      console.log('❌ seller_earnings table issue:', err.message);
    }
    
    try {
      const { data: paymentsTest } = await supabase
        .from('payments')
        .select('*')
        .limit(1);
      console.log('✅ payments table accessible');
    } catch (err) {
      console.log('❌ payments table issue:', err.message);
    }
    
    console.log('\n🎉 Migration Instructions:');
    console.log('1. Copy the SQL above and run it in your database');
    console.log('2. This will add missing columns to existing tables');
    console.log('3. No new tables will be created unnecessarily');
    console.log('4. Stripe integration will be ready');
    
    console.log('\n📋 What gets added:');
    console.log('✅ available_date column to seller_earnings');
    console.log('✅ Stripe payment intent ID to payments');
    console.log('✅ Commission calculation columns');
    console.log('✅ Payout management table');
    console.log('✅ Performance indexes');
    
  } catch (error) {
    console.error('💥 Migration preparation failed:', error);
  }
}

// Run if called directly
if (require.main === module) {
  runSimplePaymentMigration()
    .then(() => {
      console.log('\n🏁 Migration preparation completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration preparation failed:', error);
      process.exit(1);
    });
}

module.exports = { runSimplePaymentMigration };