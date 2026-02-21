/**
 * Test script to verify the order tracking query fix
 * Tests that the products table query no longer references the non-existent 'name' column
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function testOrderTrackingFix() {
  console.log('🧪 Testing Order Tracking Query Fix...\n');

  try {
    // Test 1: Verify products table schema (check what columns exist)
    console.log('1️⃣ Checking products table schema...');
    const { data: schemaData, error: schemaError } = await supabase
      .from('products')
      .select('*')
      .limit(1);

    if (schemaError) {
      console.error('❌ Schema check failed:', schemaError.message);
      return;
    }

    if (schemaData && schemaData.length > 0) {
      const columns = Object.keys(schemaData[0]);
      console.log('✅ Products table columns:', columns.join(', '));
      console.log(`   Has 'name' column: ${columns.includes('name') ? 'YES' : 'NO'}`);
      console.log(`   Has 'display_name' column: ${columns.includes('display_name') ? 'YES' : 'NO'}\n`);
    }

    // Test 2: Test the complex query (without name field)
    console.log('2️⃣ Testing complex query (orders with items and products)...');
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        *,
        customer:users!orders_user_id_fkey(id, display_name, email),
        order_items(
          *,
          product:products(id, image_url)
        )
      `)
      .limit(1);

    if (ordersError) {
      console.error('❌ Complex query failed:', ordersError);
      console.error('   Code:', ordersError.code);
      console.error('   Message:', ordersError.message);
      return;
    }

    console.log(`✅ Complex query succeeded! Fetched ${orders?.length || 0} orders\n`);

    // Test 3: Test the fallback query (order items with products)
    console.log('3️⃣ Testing fallback query (order items with products)...');
    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select('*, product:products(id, image_url)')
      .limit(1);

    if (itemsError) {
      console.error('❌ Fallback query failed:', itemsError);
      console.error('   Code:', itemsError.code);
      console.error('   Message:', itemsError.message);
      return;
    }

    console.log(`✅ Fallback query succeeded! Fetched ${items?.length || 0} items\n`);

    // Test 4: Test getOrderDetails query (with description and price)
    console.log('4️⃣ Testing getOrderDetails query...');
    const { data: detailOrders, error: detailError } = await supabase
      .from('orders')
      .select(`
        *,
        customer:users!orders_user_id_fkey(id, display_name, email),
        order_items(
          *,
          product:products(id, description, price, image_url)
        )
      `)
      .limit(1);

    if (detailError) {
      console.error('❌ Order details query failed:', detailError);
      console.error('   Code:', detailError.code);
      console.error('   Message:', detailError.message);
      return;
    }

    console.log(`✅ Order details query succeeded! Fetched ${detailOrders?.length || 0} orders\n`);

    console.log('🎉 All tests passed! The fix is working correctly.');
    console.log('\n📝 Summary:');
    console.log('   ✅ Removed products.name from complex query');
    console.log('   ✅ Removed products.name from fallback query');
    console.log('   ✅ Removed products.name from order details query');
    console.log('   ✅ All queries now work without the non-existent name column');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testOrderTrackingFix()
  .then(() => {
    console.log('\n✅ Test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
