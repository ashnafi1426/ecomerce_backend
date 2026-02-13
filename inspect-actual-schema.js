const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspectActualSchema() {
  try {
    console.log('🔍 INSPECTING ACTUAL DATABASE SCHEMA');
    console.log('===================================\n');

    // Check what tables exist
    console.log('1. 📋 Checking available tables...');
    
    const tables = ['seller_earnings', 'payouts', 'commission_settings', 'payout_settings'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
          
        if (error) {
          console.log(`   ❌ ${table}: ${error.message}`);
        } else {
          console.log(`   ✅ ${table}: accessible`);
          if (data && data.length > 0) {
            console.log(`     📊 Sample columns:`, Object.keys(data[0]));
          }
        }
      } catch (err) {
        console.log(`   ❌ ${table}: ${err.message}`);
      }
    }

    // Try to understand seller_earnings structure by attempting different inserts
    console.log('\n2. 🧪 Testing seller_earnings structure...');
    
    const sellerId = 'bb8959e5-36f1-46e2-a22a-c15a9c17f87e';
    
    // Test 1: Minimal possible record
    console.log('   Testing minimal record...');
    const { data: test1, error: error1 } = await supabase
      .from('seller_earnings')
      .insert({
        seller_id: sellerId
      })
      .select();
      
    if (error1) {
      console.log('   ❌ Minimal record error:', error1.message);
    } else {
      console.log('   ✅ Minimal record success:', test1[0]);
      // Clean up
      await supabase.from('seller_earnings').delete().eq('id', test1[0].id);
    }

    // Test 2: With order_id (old schema)
    console.log('   Testing with order_id...');
    const { data: test2, error: error2 } = await supabase
      .from('seller_earnings')
      .insert({
        seller_id: sellerId,
        order_id: 'test-order-id',
        amount: 10000
      })
      .select();
      
    if (error2) {
      console.log('   ❌ order_id record error:', error2.message);
    } else {
      console.log('   ✅ order_id record success:', test2[0]);
      // Clean up
      await supabase.from('seller_earnings').delete().eq('id', test2[0].id);
    }

    // Test 3: Check existing records
    console.log('\n3. 📊 Checking existing seller_earnings records...');
    const { data: existing, error: existingError } = await supabase
      .from('seller_earnings')
      .select('*')
      .limit(5);
      
    if (existingError) {
      console.log('   ❌ Error fetching existing records:', existingError.message);
    } else if (existing && existing.length > 0) {
      console.log(`   ✅ Found ${existing.length} existing records`);
      console.log('   📋 Column structure:', Object.keys(existing[0]));
      console.log('   📄 Sample record:', existing[0]);
    } else {
      console.log('   ℹ️  No existing records found');
    }

    // Test 4: Check if we can create a working record
    console.log('\n4. 🎯 Attempting to create a working earnings record...');
    
    // Based on the error messages, try the most likely schema
    const workingRecord = {
      seller_id: sellerId,
      order_id: 'test-order-' + Date.now(),
      amount: 50000, // $500
      status: 'available'
    };
    
    const { data: working, error: workingError } = await supabase
      .from('seller_earnings')
      .insert(workingRecord)
      .select();
      
    if (workingError) {
      console.log('   ❌ Working record error:', workingError.message);
      
      // Try alternative column names
      const alternatives = [
        { seller_id: sellerId, order_id: 'test-' + Date.now(), net_amount: 50000 },
        { seller_id: sellerId, sub_order_id: 'test-' + Date.now(), amount: 50000 },
        { seller_id: sellerId, order_id: 'test-' + Date.now(), gross_amount: 50000, net_amount: 45000 }
      ];
      
      for (const alt of alternatives) {
        const { data: altData, error: altError } = await supabase
          .from('seller_earnings')
          .insert(alt)
          .select();
          
        if (!altError && altData) {
          console.log('   ✅ SUCCESS with schema:', Object.keys(alt));
          console.log('   📄 Created record:', altData[0]);
          
          // Clean up
          await supabase.from('seller_earnings').delete().eq('id', altData[0].id);
          break;
        } else {
          console.log(`   ❌ Alternative failed:`, altError?.message);
        }
      }
    } else {
      console.log('   ✅ Working record success:', working[0]);
      // Clean up
      await supabase.from('seller_earnings').delete().eq('id', working[0].id);
    }

    console.log('\n🎉 SCHEMA INSPECTION COMPLETED!');
    console.log('==============================');

  } catch (error) {
    console.error('💥 SCHEMA INSPECTION FAILED:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the inspection
inspectActualSchema();