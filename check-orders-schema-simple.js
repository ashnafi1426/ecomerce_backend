require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkOrdersSchema() {
  console.log('🔍 Checking orders table schema...\n');

  // Get a sample order to see what columns exist
  const { data: orders, error } = await supabase
    .from('orders')
    .select('*')
    .limit(1);

  if (error) {
    console.error('❌ Error fetching orders:', error.message);
    return;
  }

  if (orders && orders.length > 0) {
    console.log('✅ Sample order columns:');
    console.log(Object.keys(orders[0]));
    console.log('\n📊 Sample order data:');
    console.log(JSON.stringify(orders[0], null, 2));
  } else {
    console.log('⚠️ No orders found in database');
  }

  // Count total orders
  const { count, error: countError } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true });

  if (!countError) {
    console.log(`\n📈 Total orders in database: ${count}`);
  }
}

checkOrdersSchema();
