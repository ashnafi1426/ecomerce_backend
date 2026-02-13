const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkPaymentTables() {
  try {
    console.log('🔍 CHECKING PAYMENT SYSTEM TABLES');
    console.log('==================================\n');

    // List of payment system tables to check
    const paymentTables = [
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

    const existingTables = [];
    const missingTables = [];

    for (const table of paymentTables) {
      try {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        
        if (error && error.message.includes('does not exist')) {
          console.log(`   ❌ Table '${table}' does not exist`);
          missingTables.push(table);
        } else if (error) {
          console.log(`   ⚠️  Table '${table}' exists but has error:`, error.message);
          existingTables.push(table);
        } else {
          console.log(`   ✅ Table '${table}' exists and accessible`);
          existingTables.push(table);
        }
      } catch (err) {
        console.log(`   ❌ Error checking table '${table}':`, err.message);
        missingTables.push(table);
      }
    }

    console.log('\n📊 SUMMARY:');
    console.log(`   ✅ Existing tables: ${existingTables.length}/${paymentTables.length}`);
    console.log(`   ❌ Missing tables: ${missingTables.length}/${paymentTables.length}`);

    if (existingTables.length > 0) {
      console.log('\n✅ EXISTING TABLES:');
      existingTables.forEach(table => console.log(`   - ${table}`));
    }

    if (missingTables.length > 0) {
      console.log('\n❌ MISSING TABLES:');
      missingTables.forEach(table => console.log(`   - ${table}`));
      console.log('\n🔧 RECOMMENDATION: Run the Phase 1 migration to create missing tables');
    }

    // Check sub_orders table for payment columns
    console.log('\n🔍 CHECKING SUB_ORDERS PAYMENT COLUMNS:');
    try {
      const { data: subOrdersData, error: subOrdersError } = await supabase
        .from('sub_orders')
        .select('commission_rate, commission_amount, seller_payout, payment_status, payout_status')
        .limit(1);

      if (subOrdersError) {
        console.log('   ❌ Sub_orders payment columns missing or inaccessible');
        console.log('   🔧 Need to run migration to add payment columns to sub_orders');
      } else {
        console.log('   ✅ Sub_orders payment columns exist');
      }
    } catch (err) {
      console.log('   ❌ Error checking sub_orders columns:', err.message);
    }

    // Overall status
    if (missingTables.length === 0 && existingTables.length === paymentTables.length) {
      console.log('\n🎉 PAYMENT SYSTEM TABLES STATUS: COMPLETE');
      console.log('   All payment system tables exist and are accessible');
      console.log('   Ready to test Phase 1 functionality');
    } else {
      console.log('\n⚠️  PAYMENT SYSTEM TABLES STATUS: INCOMPLETE');
      console.log('   Some tables are missing and need to be created');
      console.log('   Run: node run-phase-1-payment-migration.js');
    }

  } catch (error) {
    console.error('💥 ERROR CHECKING TABLES:', error.message);
    process.exit(1);
  }
}

// Run the check
checkPaymentTables();