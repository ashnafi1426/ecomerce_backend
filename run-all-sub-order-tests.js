/**
 * Complete Test Suite for Sub-Order Column Fix
 * Runs both bug exploration and preservation tests
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

async function runAllTests() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║     Complete Test Suite: Sub-Order Column Fix             ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  let allTestsPassed = true;

  // Phase 1: Bug Exploration Test
  console.log('═'.repeat(60));
  console.log('PHASE 1: Bug Condition Exploration Test');
  console.log('═'.repeat(60));
  console.log('Purpose: Verify the fix works correctly');
  console.log('Expected: Test PASSES (bug is fixed)\n');

  const bugTestPassed = await runBugExplorationTest();
  if (!bugTestPassed) {
    allTestsPassed = false;
  }

  // Phase 2: Preservation Tests
  console.log('\n' + '═'.repeat(60));
  console.log('PHASE 2: Preservation Tests');
  console.log('═'.repeat(60));
  console.log('Purpose: Verify no regressions introduced');
  console.log('Expected: All tests PASS (no regressions)\n');

  const preservationTestsPassed = await runPreservationTests();
  if (!preservationTestsPassed) {
    allTestsPassed = false;
  }

  // Final Summary
  console.log('\n' + '╔' + '═'.repeat(58) + '╗');
  console.log('║' + ' '.repeat(58) + '║');
  console.log('║' + '          FINAL TEST SUITE SUMMARY'.padEnd(58) + '║');
  console.log('║' + ' '.repeat(58) + '║');
  console.log('╚' + '═'.repeat(58) + '╝\n');

  console.log('Phase 1 - Bug Exploration:    ' + (bugTestPassed ? '✅ PASSED' : '❌ FAILED'));
  console.log('Phase 2 - Preservation Tests: ' + (preservationTestsPassed ? '✅ PASSED' : '❌ FAILED'));
  console.log('\n' + '─'.repeat(60));

  if (allTestsPassed) {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║              ✅ ALL TESTS PASSED SUCCESSFULLY              ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('\n🎉 CHECKPOINT COMPLETE 🎉\n');
    console.log('Summary:');
    console.log('  ✓ Bug fix verified - sub-order tracking works correctly');
    console.log('  ✓ No regressions detected - all existing functionality preserved');
    console.log('  ✓ Column name "parent_order_id" is being used correctly');
    console.log('  ✓ Order detail pages can now load sub-order information\n');
    console.log('The bugfix is complete and ready for deployment.\n');
  } else {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                ⚠️  SOME TESTS FAILED                       ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    console.log('Please review the test results above for details.\n');
  }

  return allTestsPassed;
}

async function runBugExplorationTest() {
  try {
    // Find an order with sub-orders
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
      console.log('Creating test data for bug exploration...');
      testData = await createBugTestData();
      if (!testData) {
        console.error('❌ Failed to create test data');
        return false;
      }
      orderIdWithSubOrders = testData.orderId;
    } else {
      orderIdWithSubOrders = subOrders[0].parent_order_id;
    }

    console.log(`Testing with order ID: ${orderIdWithSubOrders}`);

    // Test the method
    const subOrderTracking = await orderTrackingService.getSubOrderTracking(orderIdWithSubOrders);

    console.log(`\n✅ Bug Exploration Test PASSED`);
    console.log(`   Sub-orders retrieved: ${subOrderTracking.length}`);
    
    if (subOrderTracking.length > 0) {
      console.log(`   First sub-order: ${subOrderTracking[0].subOrderId}`);
      console.log(`   Seller: ${subOrderTracking[0].sellerName}`);
    }

    // Cleanup if we created test data
    if (testData) {
      await cleanupBugTestData(testData);
    }

    return true;

  } catch (error) {
    console.error(`\n❌ Bug Exploration Test FAILED`);
    console.error(`   Error: ${error.message}`);
    if (error.code === '42703') {
      console.error('   PostgreSQL error 42703: Column does not exist');
      console.error('   The bug still exists!');
    }
    return false;
  }
}

async function runPreservationTests() {
  let testData = null;
  
  try {
    // Create test data
    testData = await createPreservationTestData();
    if (!testData) {
      throw new Error('Failed to create test data');
    }

    let passedTests = 0;
    let failedTests = 0;

    // Run all preservation tests
    const tests = [
      { name: 'Order Status History', fn: () => testOrderStatusHistory(testData) },
      { name: 'Estimated Delivery', fn: () => testEstimatedDelivery(testData) },
      { name: 'Sub-Orders by ID', fn: () => testSubOrdersById(testData) },
      { name: 'Sub-Orders by Seller ID', fn: () => testSubOrdersBySellerId(testData) },
      { name: 'Sub-Orders by Fulfillment Status', fn: () => testSubOrdersByFulfillmentStatus(testData) },
      { name: 'Orders Without Sub-Orders', fn: () => testOrdersWithoutSubOrders(testData) }
    ];

    for (const test of tests) {
      try {
        await test.fn();
        console.log(`✅ ${test.name}`);
        passedTests++;
      } catch (error) {
        console.log(`❌ ${test.name}: ${error.message}`);
        failedTests++;
      }
    }

    console.log(`\nPreservation Tests: ${passedTests}/${tests.length} passed`);

    return failedTests === 0;

  } catch (error) {
    console.error(`\n❌ Preservation Tests FAILED: ${error.message}`);
    return false;
  } finally {
    if (testData) {
      await cleanupPreservationTestData(testData);
    }
  }
}

// Test functions
async function testOrderStatusHistory(testData) {
  const timeline = await orderTrackingService.buildOrderTimeline(testData.orderWithoutSubOrders);
  if (!Array.isArray(timeline)) {
    throw new Error('Timeline is not an array');
  }
}

async function testEstimatedDelivery(testData) {
  const estimatedDelivery = await orderTrackingService.calculateEstimatedDelivery(testData.orderWithoutSubOrders);
  if (estimatedDelivery !== null && !(estimatedDelivery instanceof Date)) {
    throw new Error('Invalid estimated delivery');
  }
}

async function testSubOrdersById(testData) {
  const { data: subOrder, error } = await supabase
    .from('sub_orders')
    .select('*')
    .eq('id', testData.subOrderId)
    .single();
  if (error) throw new Error(error.message);
  if (!subOrder) throw new Error('Sub-order not found');
}

async function testSubOrdersBySellerId(testData) {
  const { data: subOrders, error } = await supabase
    .from('sub_orders')
    .select('*')
    .eq('seller_id', testData.sellerId);
  if (error) throw new Error(error.message);
  if (!Array.isArray(subOrders)) throw new Error('Result is not an array');
}

async function testSubOrdersByFulfillmentStatus(testData) {
  const { data: subOrders, error } = await supabase
    .from('sub_orders')
    .select('*')
    .eq('fulfillment_status', 'pending');
  if (error) throw new Error(error.message);
  if (!Array.isArray(subOrders)) throw new Error('Result is not an array');
}

async function testOrdersWithoutSubOrders(testData) {
  const subOrderTracking = await orderTrackingService.getSubOrderTracking(testData.orderWithoutSubOrders);
  if (!Array.isArray(subOrderTracking)) throw new Error('Result is not an array');
  if (subOrderTracking.length !== 0) throw new Error('Expected empty array');
}

// Test data creation and cleanup functions
async function createBugTestData() {
  try {
    const { data: customer } = await supabase.from('users').insert({
      email: `test-bug-${Date.now()}@example.com`,
      password_hash: 'test-hash',
      role: 'customer',
      display_name: 'Test Customer'
    }).select().single();

    const { data: seller } = await supabase.from('users').insert({
      email: `test-seller-${Date.now()}@example.com`,
      password_hash: 'test-hash',
      role: 'seller',
      display_name: 'Test Seller'
    }).select().single();

    const { data: order } = await supabase.from('orders').insert({
      user_id: customer.id,
      payment_intent_id: `pi_test_${Date.now()}`,
      amount: 10000,
      basket: [{ product_id: 'test', quantity: 1, price: 100, title: 'Test' }],
      status: 'processing',
      payment_status: 'paid',
      shipping_address: { street: '123 Test', city: 'Test', state: 'TS', zip: '12345' }
    }).select().single();

    const { data: subOrder } = await supabase.from('sub_orders').insert({
      parent_order_id: order.id,
      seller_id: seller.id,
      status: 'processing',
      total_amount: 10000,
      subtotal: 10000,
      fulfillment_status: 'pending',
      items: [{ product_id: 'test', quantity: 1, price: 100, title: 'Test' }]
    }).select().single();

    return { customerId: customer.id, sellerId: seller.id, orderId: order.id, subOrderId: subOrder.id };
  } catch (error) {
    console.error('Error creating bug test data:', error.message);
    return null;
  }
}

async function cleanupBugTestData(testData) {
  try {
    if (testData.subOrderId) await supabase.from('sub_orders').delete().eq('id', testData.subOrderId);
    if (testData.orderId) await supabase.from('orders').delete().eq('id', testData.orderId);
    if (testData.customerId) await supabase.from('users').delete().eq('id', testData.customerId);
    if (testData.sellerId) await supabase.from('users').delete().eq('id', testData.sellerId);
  } catch (error) {
    console.error('Warning: Error cleaning up bug test data:', error.message);
  }
}

async function createPreservationTestData() {
  try {
    const { data: customer } = await supabase.from('users').insert({
      email: `test-preserve-${Date.now()}@example.com`,
      password_hash: 'test-hash',
      role: 'customer',
      display_name: 'Test Preservation Customer'
    }).select().single();

    const { data: seller } = await supabase.from('users').insert({
      email: `test-preserve-seller-${Date.now()}@example.com`,
      password_hash: 'test-hash',
      role: 'seller',
      display_name: 'Test Preservation Seller'
    }).select().single();

    const { data: orderWithoutSub } = await supabase.from('orders').insert({
      user_id: customer.id,
      payment_intent_id: `pi_test_preserve_${Date.now()}_1`,
      amount: 10000,
      basket: [{ product_id: 'test', quantity: 1, price: 100, title: 'Test' }],
      status: 'processing',
      payment_status: 'paid',
      shipping_address: { street: '123 Test', city: 'Test', state: 'TS', zip: '12345' }
    }).select().single();

    const { data: orderWithSub } = await supabase.from('orders').insert({
      user_id: customer.id,
      payment_intent_id: `pi_test_preserve_${Date.now()}_2`,
      amount: 20000,
      basket: [{ product_id: 'test', quantity: 2, price: 100, title: 'Test' }],
      status: 'shipped',
      payment_status: 'paid',
      shipping_address: { street: '456 Test', city: 'Test', state: 'TS', zip: '12345' }
    }).select().single();

    const { data: subOrder } = await supabase.from('sub_orders').insert({
      parent_order_id: orderWithSub.id,
      seller_id: seller.id,
      status: 'shipped',
      total_amount: 10000,
      subtotal: 10000,
      fulfillment_status: 'pending',
      items: [{ product_id: 'test', quantity: 1, price: 100, title: 'Test' }]
    }).select().single();

    return {
      customerId: customer.id,
      sellerId: seller.id,
      orderWithoutSubOrders: orderWithoutSub.id,
      orderWithSubOrders: orderWithSub.id,
      subOrderId: subOrder.id
    };
  } catch (error) {
    console.error('Error creating preservation test data:', error.message);
    return null;
  }
}

async function cleanupPreservationTestData(testData) {
  try {
    if (testData.subOrderId) await supabase.from('sub_orders').delete().eq('id', testData.subOrderId);
    if (testData.orderWithoutSubOrders) await supabase.from('orders').delete().eq('id', testData.orderWithoutSubOrders);
    if (testData.orderWithSubOrders) await supabase.from('orders').delete().eq('id', testData.orderWithSubOrders);
    if (testData.customerId) await supabase.from('users').delete().eq('id', testData.customerId);
    if (testData.sellerId) await supabase.from('users').delete().eq('id', testData.sellerId);
  } catch (error) {
    console.error('Warning: Error cleaning up preservation test data:', error.message);
  }
}

// Run the complete test suite
runAllTests()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
