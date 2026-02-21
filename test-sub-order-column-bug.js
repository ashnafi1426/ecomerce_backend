/**
 * BUG CONDITION EXPLORATION TEST
 * Order Detail Sub-Orders Column Fix
 * 
 * **Validates: Requirements 2.1, 2.2, 2.3, 2.4**
 * 
 * Property 1: Fault Condition - Sub-Order Tracking Column Name Mismatch
 * 
 * CRITICAL: This test MUST FAIL on unfixed code - failure confirms the bug exists
 * 
 * Expected behavior (encoded in this test):
 * - When fetching sub-order tracking data for an order with sub-orders
 * - The system SHALL query the sub_orders table using the correct column name 'parent_order_id'
 * - The system SHALL successfully retrieve all matching sub-orders
 * - The system SHALL return a 200 OK response with complete sub-order tracking data
 * 
 * Expected failure on unfixed code:
 * - PostgreSQL error 42703: "column sub_orders.order_id does not exist"
 * - API returns 500 Internal Server Error
 * - Order detail page fails to load
 * 
 * This test will PASS after the fix is implemented, confirming the expected behavior is satisfied.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Import the service to test
const orderTrackingService = require('./services/orderTrackingServices/orderTracking.service');

async function runBugExplorationTest() {
  console.log('\n========================================');
  console.log('BUG EXPLORATION TEST');
  console.log('Sub-Order Tracking Column Name Mismatch');
  console.log('========================================\n');

  let testOrderId;
  let testSubOrderIds = [];
  let testSellerId;
  let testCustomerId;

  try {
    // ===== SETUP: Create test data =====
    console.log('Setting up test data...\n');

    // Create test customer
    const { data: customer, error: customerError } = await supabase
      .from('users')
      .insert({
        email: `test-customer-${Date.now()}@example.com`,
        password_hash: 'test-hash',
        role: 'customer',
        display_name: 'Test Customer'
      })
      .select()
      .single();

    if (customerError) throw new Error(`Failed to create test customer: ${customerError.message}`);
    testCustomerId = customer.id;
    console.log(`✓ Created test customer: ${testCustomerId}`);

    // Create test seller
    const { data: seller, error: sellerError } = await supabase
      .from('users')
      .insert({
        email: `test-seller-${Date.now()}@example.com`,
        password_hash: 'test-hash',
        role: 'seller',
        display_name: 'Test Seller'
      })
      .select()
      .single();

    if (sellerError) throw new Error(`Failed to create test seller: ${sellerError.message}`);
    testSellerId = seller.id;
    console.log(`✓ Created test seller: ${testSellerId}`);

    // Create parent order
    const { data: order, error: orderError} = await supabase
      .from('orders')
      .insert({
        user_id: testCustomerId,
        payment_intent_id: `pi_test_${Date.now()}`,
        amount: 15000, // 150.00 in cents
        basket: [
          { product_id: 'test-product-1', quantity: 1, price: 75.00 },
          { product_id: 'test-product-2', quantity: 1, price: 75.00 }
        ],
        status: 'processing',
        shipping_address: { street: '123 Test St', city: 'Test City', state: 'TS', zip: '12345' }
      })
      .select()
      .single();

    if (orderError) throw new Error(`Failed to create test order: ${orderError.message}`);
    testOrderId = order.id;
    console.log(`✓ Created parent order: ${testOrderId}`);

    // Create sub-orders (this is what we're testing)
    const subOrdersData = [
      {
        parent_order_id: testOrderId,
        seller_id: testSellerId,
        items: [{ product_id: 'test-product-1', quantity: 1, price: 75.00 }],
        subtotal: 75.00,
        total_amount: 75.00,
        fulfillment_status: 'pending',
        tracking_number: 'TRACK001',
        carrier: 'UPS'
      },
      {
        parent_order_id: testOrderId,
        seller_id: testSellerId,
        items: [{ product_id: 'test-product-2', quantity: 1, price: 75.00 }],
        subtotal: 75.00,
        total_amount: 75.00,
        fulfillment_status: 'shipped',
        tracking_number: 'TRACK002',
        carrier: 'FedEx'
      }
    ];

    const { data: subOrders, error: subOrderError } = await supabase
      .from('sub_orders')
      .insert(subOrdersData)
      .select();

    if (subOrderError) {
      console.error('Sub-order creation error:', subOrderError);
      throw new Error(`Failed to create test sub-orders: ${subOrderError.message}`);
    }
    testSubOrderIds = subOrders.map(so => so.id);
    console.log(`✓ Created ${testSubOrderIds.length} sub-orders: ${testSubOrderIds.join(', ')}\n`);

    // ===== TEST: Call the buggy function =====
    console.log('========================================');
    console.log('RUNNING TEST');
    console.log('========================================\n');
    console.log(`Testing getSubOrderTracking with Order ID: ${testOrderId}\n`);
    console.log('Expected on UNFIXED code:');
    console.log('  ✗ PostgreSQL error 42703: "column sub_orders.order_id does not exist"');
    console.log('  ✗ Function throws: "Failed to get sub-order tracking information"\n');
    console.log('Expected AFTER fix:');
    console.log('  ✓ Success with sub-order data');
    console.log('  ✓ Returns array with 2 sub-orders');
    console.log('  ✓ Each sub-order has seller info, status, tracking\n');
    console.log('Executing test...\n');

    try {
      // Call the function that contains the bug
      const result = await orderTrackingService.getSubOrderTracking(testOrderId);

      // If we reach here on unfixed code, something is wrong
      // On fixed code, these assertions should pass
      console.log('========================================');
      console.log('TEST RESULT: PASSED ✓');
      console.log('========================================\n');
      console.log('✓ Function executed successfully (bug is FIXED)');
      console.log(`✓ Retrieved ${result.length} sub-orders\n`);

      // Verify the result structure
      if (!result || !Array.isArray(result)) {
        throw new Error('Result is not an array');
      }

      if (result.length === 0) {
        throw new Error('Result array is empty - expected sub-orders');
      }

      // Verify each sub-order has required fields
      result.forEach((subOrder, index) => {
        console.log(`Sub-Order ${index + 1}:`);
        console.log(`  - Sub-Order ID: ${subOrder.subOrderId}`);
        console.log(`  - Seller ID: ${subOrder.sellerId}`);
        console.log(`  - Seller Name: ${subOrder.sellerName}`);
        console.log(`  - Status: ${subOrder.status}`);
        console.log(`  - Tracking Number: ${subOrder.trackingNumber}`);
        console.log(`  - Carrier: ${subOrder.carrier}`);
        console.log(`  - Timeline events: ${subOrder.timeline.length}`);
        console.log(`  - Items: ${subOrder.items.length}\n`);

        // Assertions
        if (!subOrder.subOrderId) throw new Error('Missing subOrderId');
        if (!subOrder.sellerId) throw new Error('Missing sellerId');
        if (!subOrder.sellerName) throw new Error('Missing sellerName');
        if (!subOrder.status) throw new Error('Missing status');
        if (!subOrder.trackingNumber) throw new Error('Missing trackingNumber');
        if (!subOrder.carrier) throw new Error('Missing carrier');
        if (!Array.isArray(subOrder.timeline)) throw new Error('Timeline is not an array');
        if (!Array.isArray(subOrder.items)) throw new Error('Items is not an array');
      });

      console.log('✓ All assertions passed - Bug is FIXED!\n');
      console.log('========================================\n');

    } catch (error) {
      // On unfixed code, we expect this error
      console.log('========================================');
      console.log('TEST RESULT: FAILED ✗');
      console.log('========================================\n');
      console.log('✗ Function threw error (bug EXISTS)\n');
      console.log(`Error message: ${error.message}\n`);
      
      // Document the counterexample
      console.log('========================================');
      console.log('COUNTEREXAMPLE FOUND');
      console.log('========================================\n');
      console.log(`Order ID that triggers bug: ${testOrderId}`);
      console.log(`Number of sub-orders: ${testSubOrderIds.length}`);
      console.log(`Sub-Order IDs: ${testSubOrderIds.join(', ')}`);
      console.log(`\nError: ${error.message}`);
      console.log('\nExpected PostgreSQL error:');
      console.log('  "column sub_orders.order_id does not exist"');
      console.log('  Error code: 42703');
      console.log('\nRoot cause:');
      console.log('  File: services/orderTrackingServices/orderTracking.service.js');
      console.log('  Line: ~134');
      console.log('  Current: .eq(\'order_id\', orderId)');
      console.log('  Should be: .eq(\'parent_order_id\', orderId)');
      console.log('\n========================================\n');

      // Re-throw to indicate test failure
      throw error;
    }

  } finally {
    // ===== CLEANUP: Remove test data =====
    console.log('Cleaning up test data...\n');
    
    if (testOrderId) {
      await supabase.from('orders').delete().eq('id', testOrderId);
      console.log(`✓ Deleted test order: ${testOrderId}`);
    }
    if (testCustomerId) {
      await supabase.from('users').delete().eq('id', testCustomerId);
      console.log(`✓ Deleted test customer: ${testCustomerId}`);
    }
    if (testSellerId) {
      await supabase.from('users').delete().eq('id', testSellerId);
      console.log(`✓ Deleted test seller: ${testSellerId}`);
    }
    
    console.log('\n✓ Cleanup complete\n');
  }
}

// Run the test
runBugExplorationTest()
  .then(() => {
    console.log('Test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nTest failed (expected on unfixed code)');
    process.exit(1);
  });
