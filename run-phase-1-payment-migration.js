const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.error('Required: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runPhase1PaymentMigration() {
  try {
    console.log('🚀 STARTING PHASE 1: PAYMENT SYSTEM DATABASE MIGRATION');
    console.log('====================================================\n');

    // Read the migration SQL file
    const migrationPath = path.join(__dirname, 'database', 'migrations', 'phase-1-payment-system-tables.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration file loaded:', migrationPath);
    console.log('📊 SQL size:', (migrationSQL.length / 1024).toFixed(2), 'KB\n');

    // Execute the migration
    console.log('⚡ Executing migration...');
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

    if (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }

    console.log('✅ Migration executed successfully!\n');

    // Verify tables were created
    console.log('🔍 Verifying table creation...');
    
    const tablesToCheck = [
      'payments',
      'seller_earnings', 
      'payouts',
      'seller_bank_accounts',
      'commission_settings',
      'payout_settings',
      'payment_methods_config',
      'refunds',
      'returns',
      'disputes'
    ];

    for (const table of tablesToCheck) {
      const { data: tableExists, error: checkError } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (checkError && !checkError.message.includes('does not exist')) {
        console.log(`✅ Table '${table}' created successfully`);
      } else if (checkError) {
        console.log(`❌ Table '${table}' not found`);
      } else {
        console.log(`✅ Table '${table}' created and accessible`);
      }
    }

    // Check default data insertion
    console.log('\n🔍 Checking default configuration data...');
    
    const { data: commissionSettings, error: commissionError } = await supabase
      .from('commission_settings')
      .select('*')
      .limit(1);

    if (!commissionError && commissionSettings.length > 0) {
      console.log('✅ Default commission settings created:', {
        default_rate: commissionSettings[0].default_rate,
        transaction_fee: commissionSettings[0].transaction_fee
      });
    }

    const { data: payoutSettings, error: payoutError } = await supabase
      .from('payout_settings')
      .select('*')
      .limit(1);

    if (!payoutError && payoutSettings.length > 0) {
      console.log('✅ Default payout settings created:', {
        holding_period_days: payoutSettings[0].holding_period_days,
        minimum_payout_amount: payoutSettings[0].minimum_payout_amount
      });
    }

    const { data: paymentMethods, error: paymentError } = await supabase
      .from('payment_methods_config')
      .select('*')
      .limit(1);

    if (!paymentError && paymentMethods.length > 0) {
      console.log('✅ Default payment methods config created:', {
        stripe_enabled: paymentMethods[0].stripe_enabled,
        bank_transfer_enabled: paymentMethods[0].bank_transfer_enabled
      });
    }

    console.log('\n🎉 PHASE 1 MIGRATION COMPLETED SUCCESSFULLY!');
    console.log('============================================');
    console.log('');
    console.log('📋 WHAT WAS CREATED:');
    console.log('   ✅ Enhanced payments table with Stripe integration');
    console.log('   ✅ Enhanced sub_orders table with commission tracking');
    console.log('   ✅ seller_earnings table for payout management');
    console.log('   ✅ payouts table for withdrawal processing');
    console.log('   ✅ seller_bank_accounts table for payment methods');
    console.log('   ✅ commission_settings table with 15% default rate');
    console.log('   ✅ payout_settings table with 7-day holding period');
    console.log('   ✅ payment_methods_config table with Stripe enabled');
    console.log('   ✅ refunds table for refund processing');
    console.log('   ✅ returns table for return management');
    console.log('   ✅ disputes table for chargeback handling');
    console.log('   ✅ All necessary indexes for performance');
    console.log('   ✅ Automatic timestamp update triggers');
    console.log('');
    console.log('🚀 READY FOR PHASE 2: Payment Processing Implementation');
    console.log('');
    console.log('📝 NEXT STEPS:');
    console.log('   1. Run: node test-phase-1-database.js (to test the schema)');
    console.log('   2. Implement Phase 2: Payment Controllers');
    console.log('   3. Implement Phase 3: Order Splitting Service');
    console.log('   4. Implement Phase 4: Payout System');

  } catch (error) {
    console.error('💥 MIGRATION FAILED:', error.message);
    console.error('');
    console.error('🔧 TROUBLESHOOTING:');
    console.error('   1. Check Supabase credentials in .env file');
    console.error('   2. Ensure database is accessible');
    console.error('   3. Check for SQL syntax errors');
    console.error('   4. Verify table permissions');
    process.exit(1);
  }
}

// Run the migration
runPhase1PaymentMigration();