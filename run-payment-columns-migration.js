const fs = require('fs');
const path = require('path');
const supabase = require('./config/supabase.js');

/**
 * Run Payment Columns Migration
 * Adds missing columns to existing payment tables for Stripe integration
 */
async function runPaymentColumnsMigration() {
  try {
    console.log('🚀 Starting Payment Columns Migration...');
    console.log('📋 This will add missing columns to existing tables (no new tables created)');
    
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, 'database', 'migrations', 'add-missing-payment-columns.sql');
    
    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Migration file not found:', migrationPath);
      return;
    }
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log('📄 Migration file loaded successfully');
    
    // Split SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.includes('RAISE NOTICE'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Check current table structure first
    console.log('🔍 Checking current table structure...');
    
    // Check seller_earnings table
    try {
      const { data: earningsData, error: earningsError } = await supabase
        .from('seller_earnings')
        .select('*')
        .limit(1);
        
      if (earningsError) {
        console.log('❌ seller_earnings table not accessible:', earningsError.message);
      } else {
        console.log('✅ seller_earnings table exists');
      }
    } catch (err) {
      console.log('❌ Error checking seller_earnings:', err.message);
    }
    
    // Check payments table
    try {
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .limit(1);
        
      if (paymentsError) {
        console.log('❌ payments table not accessible:', paymentsError.message);
      } else {
        console.log('✅ payments table exists');
      }
    } catch (err) {
      console.log('❌ Error checking payments:', err.message);
    }
    
    console.log('\n⚡ Executing migration statements...');
    
    // Note: Since Supabase client doesn't support raw SQL execution,
    // we'll provide instructions for manual execution
    console.log('📋 MANUAL EXECUTION REQUIRED:');
    console.log('Please run the following SQL file in your database:');
    console.log('File:', migrationPath);
    console.log('\nOr copy and paste this SQL into your database console:');
    console.log('=' .repeat(60));
    console.log(migrationSQL);
    console.log('=' .repeat(60));
    
    // Try to verify some basic functionality
    console.log('\n🔍 Verifying basic table access...');
    
    const tablesToCheck = [
      'seller_earnings',
      'payments', 
      'sub_orders',
      'orders'
    ];
    
    for (const table of tablesToCheck) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
          
        if (error) {
          console.log(`❌ Table '${table}' not accessible:`, error.message);
        } else {
          console.log(`✅ Table '${table}' verified`);
        }
      } catch (err) {
        console.log(`❌ Table '${table}' check failed:`, err.message);
      }
    }
    
    console.log('\n🎉 Migration Instructions Summary:');
    console.log('1. Run the SQL migration file in your database');
    console.log('2. Verify all columns were added successfully');
    console.log('3. Test the payment system functionality');
    console.log('4. Configure Stripe integration');
    
    console.log('\n📋 What this migration adds:');
    console.log('✅ Stripe payment intent ID column');
    console.log('✅ Available date for seller earnings');
    console.log('✅ Commission calculation columns');
    console.log('✅ Payout management tables');
    console.log('✅ Helper functions for calculations');
    console.log('✅ Proper indexes for performance');
    
  } catch (error) {
    console.error('💥 Migration failed with error:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check database connection');
    console.log('2. Verify table permissions');
    console.log('3. Run SQL manually if needed');
  }
}

// Run if called directly
if (require.main === module) {
  runPaymentColumnsMigration()
    .then(() => {
      console.log('\n🏁 Migration process completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration process failed:', error);
      process.exit(1);
    });
}

module.exports = { runPaymentColumnsMigration };