const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSubOrdersColumns() {
  try {
    console.log('🔍 CHECKING SUB_ORDERS TABLE STRUCTURE');
    console.log('=====================================\n');

    // Get table structure using raw SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'sub_orders' 
        AND table_schema = 'public'
        ORDER BY ordinal_position;
      `
    });

    if (error) {
      console.log('❌ Error getting table structure:', error.message);
      
      // Try alternative method - just select from table to see what columns exist
      console.log('\n🔄 Trying alternative method...');
      const { data: sampleData, error: sampleError } = await supabase
        .from('sub_orders')
        .select('*')
        .limit(1);

      if (sampleError) {
        console.log('❌ Cannot access sub_orders table:', sampleError.message);
        return;
      }

      if (sampleData && sampleData.length > 0) {
        console.log('✅ Sub_orders table accessible. Sample record columns:');
        Object.keys(sampleData[0]).forEach(column => {
          console.log(`   - ${column}`);
        });
      } else {
        console.log('⚠️  Sub_orders table exists but is empty');
      }
      return;
    }

    if (data && data.length > 0) {
      console.log('✅ SUB_ORDERS TABLE COLUMNS:');
      data.forEach(column => {
        console.log(`   - ${column.column_name} (${column.data_type}) ${column.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
      });

      // Check for payment-related columns
      const paymentColumns = [
        'commission_rate',
        'commission_amount', 
        'seller_payout',
        'platform_fee',
        'processing_fee',
        'net_amount',
        'payment_status',
        'payout_status',
        'earnings_available_date'
      ];

      console.log('\n🔍 PAYMENT COLUMNS STATUS:');
      const existingColumns = data.map(col => col.column_name);
      const missingColumns = [];

      paymentColumns.forEach(col => {
        if (existingColumns.includes(col)) {
          console.log(`   ✅ ${col} - exists`);
        } else {
          console.log(`   ❌ ${col} - missing`);
          missingColumns.push(col);
        }
      });

      if (missingColumns.length > 0) {
        console.log('\n⚠️  MISSING PAYMENT COLUMNS:');
        missingColumns.forEach(col => console.log(`   - ${col}`));
        console.log('\n🔧 RECOMMENDATION: Run migration to add missing payment columns');
      } else {
        console.log('\n🎉 ALL PAYMENT COLUMNS EXIST!');
      }

    } else {
      console.log('❌ No column information found');
    }

  } catch (error) {
    console.error('💥 ERROR:', error.message);
  }
}

// Run the check
checkSubOrdersColumns();