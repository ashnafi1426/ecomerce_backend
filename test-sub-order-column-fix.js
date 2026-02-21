/**
 * Bug Exploration Test for Sub-Order Column Fix
 * Tests that getSubOrderTracking uses the correct column name 'parent_order_id'
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
);

// Import the service to test
const orderTrackingService = require('./services/orderTrackingServices/orderTracking.service');

async function runTest() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  Bug Condition Exploration Test: Sub-Order Column Fix     ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  console.log('Testing: getSubOrderTracking method');
  console.log('Expected: Uses correct column name "parent_order_id"');
  console.log('Result: Test should PASS (bug is fixed)\n');

  try {
    // Find an order with sub-orders
    console.log('Step 1: Finding an order with sub-orders...');
    const { data: subOrders, error: findError } = await supabase
      .from('sub_orders')
      .select('parent_order_id')
      .limit(1);

    if (findError) {
      console.error('❌ Error finding sub-orders:', findError.message);
      return false;
    }

    let orderIdWithSubOrders;
    let testData = null;

    if (!subOrders || subOrders.length === 0) {
      console.log('⚠️  No existing orders with sub-orders found.');
      console.log('Step 2: Creating test data...\n');
      
      testData = await createTestData();
      if (!testData) {
        console.error('❌ Failed to create test data');
        return false;
      }

      orderIdWithSubOrders = testData.orderId;
      console.log(`✓ Test data created successfully`);
      console.log(`  Order ID: ${orderIdWithSubOrders}`);
      console.log(`  Sub-Order ID: ${testData.subOrderId}\n`);
    } else {
      orderIdWithSubOrders = subOrders[0].parent_order_id;
      console.log(`✓ Found existing order with sub-orders`);
      console.log(`  Order ID: ${orderIdWithSubOrders}\n`);
    }

    // Test the method
    console.log('Step 3: Calling getSubOrderTracking...');
    console.log('─────────────────────────────────────────────────────────\n');
    
    const subOrderTracking = await orderTrackingService.getSubOrderTracking(orderIdWithSubOrders);

    console.log('✅ SUCCESS: Method executed without errors!\n');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('                    TEST RESULTS                           ');
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log(`Sub-orders retrieved: ${subOrderTracking.length}`);
    
    if (subOrderTracking.length > 0) {
      console.log('\nSub-Order Details:');
      console.log('─────────────────────────────────────────────────────────');
      subOrderTracking.forEach((subOrder, index) => {
        console.log(`\n[${index + 1}] Sub-Order ID: ${subOrder.subOrderId}`);
        console.log(`    Seller: ${subOrder.sellerName} (ID: ${subOrder.sellerId})`);
        console.log(`    Status: ${subOrder.status}`);
        console.log(`    Amount: $${(subOrder.amount / 100).toFixed(2)}`);
        console.log(`    Tracking: ${subOrder.trackingNumber || 'Not assigned'}`);
        console.log(`    Carrier: ${subOrder.carrier || 'N/A'}`);
        console.log(`    Timeline Events: ${subOrder.timeline.length}`);
      });
      console.log('\n─────────────────────────────────────────────────────────');
    }

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                    ✅ TEST PASSED                          ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('\nConclusion:');
    console.log('  • The fix is working correctly');
    console.log('  • Sub-order tracking data retrieved successfully');
    console.log('  • Column name "parent_order_id" is being used correctly');
    console.log('  • No PostgreSQL error 42703 (column does not exist)\n');

    // Cleanup if we created test data
    if (testData) {
      await cleanupTestData(testData);
    }
    
    return true;

  } catch (error) {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                    ❌ TEST FAILED                          ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.error(`\nError: ${error.message}`);
    
    if (error.code) {
      console.error(`Error code: ${error.code}`);
      if (error.code === '42703') {
        console.error('\n⚠️  PostgreSQL Error 42703: Column does not exist');
        console.error('This indicates the bug still exists.');
        console.error('The code is likely using "order_id" instead of "parent_order_id"\n');
      }
    }
    
    return false;
  }
}

async function createTestData() {
  try {
    // Create test customer
    const { data: customer, error: customerError } = await supabase
      .from('users')
      .insert({
        email: `test-bug-exploration-${Date.now()}@example.com`,
        password_hash: 'test-hash',
        role: 'customer',
        display_name: 'Test Bug Exploration Customer'
      })
      .select()
      .single();

    if (customerError) throw customerError;

    // Create test seller
    const { data: seller, error: sellerError } = await supabase
      .from('users')
      .insert({
        email: `test-bug-seller-${Date.now()}@example.com`,
        password_hash: 'test-hash',
        role: 'seller',
        display_name: 'Test Bug Seller'
      })
      .select()
      .single();

    if (sellerError) throw sellerError;

    // Create test order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: customer.id,
        payment_intent_id: `pi_test_bug_${Date.now()}`,
        amount: 10000,
        basket: [{ product_id: 'test-product', quantity: 1, price: 100.00, title: 'Test Product' }],
        status: 'processing',
        payment_status: 'paid',
        shipping_address: { street: '123 Test St', city: 'Test City', state: 'TS', zip: '12345' }
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // Create sub-order
    const { data: subOrder, error: subOrderError } = await supabase
      .from('sub_orders')
      .insert({
        parent_order_id: order.id,
        seller_id: seller.id,
        status: 'processing',
        total_amount: 10000,
        subtotal: 10000,
        tracking_number: 'TEST-TRACK-001',
        carrier: 'UPS',
        fulfillment_status: 'pending',
        items: [{ product_id: 'test-product', quantity: 1, price: 100.00, title: 'Test Product' }]
      })
      .select()
      .single();

    if (subOrderError) throw subOrderError;

    return {
      customerId: customer.id,
      sellerId: seller.id,
      orderId: order.id,
      subOrderId: subOrder.id
    };
  } catch (error) {
    console.error('Error creating test data:', error.message);
    return null;
  }
}

async function cleanupTestData(testData) {
  try {
    console.log('\nCleaning up test data...');
    if (testData.subOrderId) {
      await supabase.from('sub_orders').delete().eq('id', testData.subOrderId);
    }
    if (testData.orderId) {
      await supabase.from('orders').delete().eq('id', testData.orderId);
    }
    if (testData.customerId) {
      await supabase.from('users').delete().eq('id', testData.customerId);
    }
    if (testData.sellerId) {
      await supabase.from('users').delete().eq('id', testData.sellerId);
    }
    console.log('✓ Test data cleaned up successfully\n');
  } catch (error) {
    console.error('⚠️  Warning: Error cleaning up test data:', error.message);
  }
}

// Run the test
runTest()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
