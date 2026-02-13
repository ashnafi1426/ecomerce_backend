const supabase = require('./config/supabase');

async function checkOrdersTableStructure() {
  console.log('🔍 Checking orders table structure...\n');
  
  try {
    // Get a sample order to see the structure
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Error:', error.message);
      return;
    }
    
    if (orders && orders.length > 0) {
      console.log('✅ Orders table columns:');
      console.log(Object.keys(orders[0]));
      console.log('\n📋 Sample order:');
      console.log(JSON.stringify(orders[0], null, 2));
    } else {
      console.log('⚠️  No orders found in table');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkOrdersTableStructure();
