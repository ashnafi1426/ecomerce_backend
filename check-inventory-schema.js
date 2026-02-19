/**
 * Check Inventory Table Schema
 * 
 * This script checks the current inventory table structure
 */

const supabase = require('./config/supabase');

async function checkInventorySchema() {
  console.log('🔍 Checking Inventory Table Schema\n');
  console.log('=' .repeat(60));

  try {
    // Try to get a sample inventory record to see the structure
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .limit(1);

    if (error) {
      console.error('\n❌ Error querying inventory:', error.message);
      console.error('   Code:', error.code);
      console.error('   Details:', error.details);
      console.error('   Hint:', error.hint);
    } else {
      console.log('\n✅ Inventory table exists');
      
      if (data && data.length > 0) {
        console.log('\n📋 Current Columns:');
        Object.keys(data[0]).forEach(column => {
          console.log(`   - ${column}: ${typeof data[0][column]}`);
        });
      } else {
        console.log('\n⚠️  No inventory records found');
        console.log('   Cannot determine column structure from data');
      }
    }

    // Try to insert a test record to see what columns are expected
    console.log('\n🧪 Testing inventory insert...');
    
    const testData = {
      product_id: '00000000-0000-0000-0000-000000000000', // Fake UUID for testing
      quantity: 10,
      reserved_quantity: 0,
      low_stock_threshold: 5
    };

    const { data: insertData, error: insertError } = await supabase
      .from('inventory')
      .insert(testData)
      .select();

    if (insertError) {
      console.log('\n❌ Insert test failed (expected):');
      console.log(`   Error: ${insertError.message}`);
      console.log(`   Code: ${insertError.code}`);
      
      if (insertError.message.includes('created_at')) {
        console.log('\n🔍 ISSUE FOUND: created_at column is missing or has wrong type');
      }
    } else {
      console.log('\n✅ Insert test succeeded');
      console.log('   Columns in inserted record:');
      Object.keys(insertData[0]).forEach(column => {
        console.log(`   - ${column}`);
      });
      
      // Clean up test record
      await supabase
        .from('inventory')
        .delete()
        .eq('product_id', testData.product_id);
    }

  } catch (error) {
    console.error('\n❌ Unexpected error:', error.message);
  }

  console.log('\n' + '='.repeat(60));
  console.log('🏁 Check Complete\n');
}

// Run the check
checkInventorySchema();
