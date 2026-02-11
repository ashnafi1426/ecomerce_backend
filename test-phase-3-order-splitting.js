/**
 * Phase 3: Order Splitting Test Script
 * 
 * Tests the multi-vendor order splitting functionality
 * 
 * Usage:
 *   node test-phase-3-order-splitting.js
 */

const supabase = require('./config/supabase.js');
const {
  splitOrderBySeller,
  notifySellers,
  getSubOrders,
  updateSubOrderStatus
} = require('./services/orderServices/order-splitting.service.js');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function success(message) {
  log(`✅ ${message}`, 'green');
}

function error(message) {
  log(`❌ ${message}`, 'red');
}

function info(message) {
  log(`ℹ️  ${message}`, 'cyan');
}

function section(message) {
  log(`\n${'='.repeat(60)}`, 'blue');
  log(`${message}`, 'bold');
  log(`${'='.repeat(60)}`, 'blue');
}

// Test data
let testOrderId = null;
let testProducts = [];
let testSellers = [];

/**
 * Test 1: Check if sub_orders table exists
 */
async function testSubOrdersTable() {
  section('TEST 1: Sub-Orders Table Check');
  
  try {
    info('Checking if sub_orders table exists...');
    
    const { data, error } = await supabase
      .from('sub_orders')
      .select('id')
      .limit(1);
    
    if (error && error.code === '42P01') {
      error('sub_orders table does not exist');
      error('Please run the database migration first');
      return false;
    }
    
    success('sub_orders table exists');
    return true;
    
  } catch (err) {
    error(`Table check failed: ${err.message}`);
    return false;
  }
}

/**
 * Test 2: Get test products from different sellers
 */
async function getTestProducts() {
  section('TEST 2: Get Test Products');
  
  try {
    info('Fetching products from different sellers...');
    
    // Get products with seller information
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select(`
        id,
        title,
        price,
        seller_id
      `)
      .eq('status', 'active')
      .not('seller_id', 'is', null)
      .limit(10);
    
    if (productsError) {
      error(`Failed to fetch products: ${productsError.message}`);
      return false;
    }
    
    if (!products || products.length === 0) {
      error('No products found with sellers');
      info('Please ensure products have seller_id assigned');
      return false;
    }
    
    // Group by seller
    const sellerMap = {};
    products.forEach(product => {
      if (!sellerMap[product.seller_id]) {
        sellerMap[product.seller_id] = [];
      }
      sellerMap[product.seller_id].push(product);
    });
    
    testSellers = Object.keys(sellerMap);
    
    if (testSellers.length < 2) {
      error('Need at least 2 different sellers for testing');
      info(`Found only ${testSellers.length} seller(s)`);
      return false;
    }
    
    // Select products from different sellers
    testProducts = [
      sellerMap[testSellers[0]][0],
      sellerMap[testSellers[1]][0]
    ];
    
    success(`Found ${testSellers.length} seller(s)`);
    info(`Seller 1 ID: ${testProducts[0].seller_id}`);
    info(`  Product: ${testProducts[0].title} ($${testProducts[0].price})`);
    info(`Seller 2 ID: ${testProducts[1].seller_id}`);
    info(`  Product: ${testProducts[1].title} ($${testProducts[1].price})`);
    
    return true;
    
  } catch (err) {
    error(`Get products failed: ${err.message}`);
    return false;
  }
}

/**
 * Test 3: Create a test order
 */
async function createTestOrder() {
  section('TEST 3: Create Test Order');
  
  try {
    info('Creating test order...');
    
    const orderItems = testProducts.map(product => ({
      product_id: product.id,
      title: product.title,
      price: parseFloat(product.price),
      quantity: 1
    }));
    
    const totalAmount = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        payment_intent_id: `pi_test_${Date.now()}`, // Mock payment intent for testing
        guest_email: 'test-phase3@example.com',
        amount: Math.round(totalAmount * 100), // Convert to cents
        status: 'paid',
        basket: { items: orderItems },
        order_items: orderItems,
        shipping_address: {
          street: '123 Test St',
          city: 'Test City',
          state: 'TS',
          zip: '12345',
          country: 'US'
        },
        order_tracking_token: `TEST-${Date.now()}`
      })
      .select()
      .single();
    
    if (orderError) {
      error(`Failed to create order: ${orderError.message}`);
      return false;
    }
    
    testOrderId = order.id;
    success(`Created test order: ${testOrderId}`);
    info(`Total amount: $${totalAmount.toFixed(2)}`);
    info(`Items: ${orderItems.length}`);
    
    // Create order_items
    for (const item of orderItems) {
      const { error: itemError } = await supabase
        .from('order_items')
        .insert({
          order_id: testOrderId,
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.price * item.quantity // Required field
        });
      
      if (itemError) {
        error(`Failed to create order item: ${itemError.message}`);
      }
    }
    
    success('Created order items');
    return true;
    
  } catch (err) {
    error(`Create order failed: ${err.message}`);
    return false;
  }
}

/**
 * Test 4: Split order by seller
 */
async function testOrderSplitting() {
  section('TEST 4: Order Splitting');
  
  try {
    info(`Splitting order ${testOrderId}...`);
    
    const orderItems = testProducts.map(product => ({
      product_id: product.id,
      title: product.title,
      price: parseFloat(product.price),
      quantity: 1
    }));
    
    const result = await splitOrderBySeller(testOrderId, orderItems);
    
    if (!result.isSplit) {
      error('Order was not split (expected split for multi-vendor)');
      return false;
    }
    
    success(`Order split successfully`);
    info(`Seller count: ${result.sellerCount}`);
    info(`Sub-orders created: ${result.subOrders.length}`);
    
    result.subOrders.forEach((subOrder, index) => {
      info(`\nSub-order ${index + 1}:`);
      info(`  ID: ${subOrder.sub_order_id}`);
      info(`  Seller: ${subOrder.seller_id}`);
      info(`  Items: ${subOrder.item_count}`);
      info(`  Subtotal: $${subOrder.subtotal.toFixed(2)}`);
    });
    
    return true;
    
  } catch (err) {
    error(`Order splitting failed: ${err.message}`);
    console.error(err);
    return false;
  }
}

/**
 * Test 5: Verify sub-orders in database
 */
async function verifySubOrders() {
  section('TEST 5: Verify Sub-Orders');
  
  try {
    info('Fetching sub-orders from database...');
    
    const subOrders = await getSubOrders(testOrderId);
    
    if (!subOrders || subOrders.length === 0) {
      error('No sub-orders found in database');
      return false;
    }
    
    success(`Found ${subOrders.length} sub-order(s)`);
    
    subOrders.forEach((subOrder, index) => {
      info(`\nSub-order ${index + 1}:`);
      info(`  ID: ${subOrder.id}`);
      info(`  Seller ID: ${subOrder.seller_id}`);
      info(`  Status: ${subOrder.fulfillment_status}`);
      info(`  Subtotal: $${subOrder.subtotal}`);
      info(`  Items: ${subOrder.items?.length || 0}`);
    });
    
    // Verify order_items are linked
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select('id, sub_order_id, product_id')
      .eq('order_id', testOrderId);
    
    if (itemsError) {
      error(`Failed to fetch order items: ${itemsError.message}`);
      return false;
    }
    
    const linkedItems = orderItems.filter(item => item.sub_order_id !== null);
    success(`${linkedItems.length}/${orderItems.length} order items linked to sub-orders`);
    
    return true;
    
  } catch (err) {
    error(`Verify sub-orders failed: ${err.message}`);
    return false;
  }
}

/**
 * Test 6: Test seller notifications
 */
async function testSellerNotifications() {
  section('TEST 6: Seller Notifications');
  
  try {
    info('Testing seller notifications...');
    
    const subOrders = await getSubOrders(testOrderId);
    
    if (!subOrders || subOrders.length === 0) {
      error('No sub-orders to notify');
      return false;
    }
    
    const notificationData = subOrders.map(so => ({
      sub_order_id: so.id,
      seller_id: so.seller_id,
      item_count: so.items?.length || 0,
      subtotal: parseFloat(so.subtotal)
    }));
    
    await notifySellers(notificationData, testOrderId);
    
    success('Notifications sent');
    
    // Verify notifications in database
    for (const seller of testSellers.slice(0, 2)) {
      const { data: notifications, error: notifError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', seller)
        .eq('type', 'new_order')
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (notifError) {
        error(`Failed to fetch notifications: ${notifError.message}`);
        continue;
      }
      
      if (notifications && notifications.length > 0) {
        success(`Notification created for seller ${seller}`);
        info(`  Title: ${notifications[0].title}`);
        info(`  Message: ${notifications[0].message}`);
      } else {
        error(`No notification found for seller ${seller}`);
      }
    }
    
    return true;
    
  } catch (err) {
    error(`Seller notifications failed: ${err.message}`);
    return false;
  }
}

/**
 * Test 7: Update sub-order status
 */
async function testStatusUpdate() {
  section('TEST 7: Sub-Order Status Update');
  
  try {
    info('Testing status updates...');
    
    const subOrders = await getSubOrders(testOrderId);
    
    if (!subOrders || subOrders.length === 0) {
      error('No sub-orders to update');
      return false;
    }
    
    const firstSubOrder = subOrders[0];
    
    // Update to shipped
    info(`Updating sub-order ${firstSubOrder.id} to 'shipped'...`);
    await updateSubOrderStatus(firstSubOrder.id, 'shipped', {
      tracking_number: 'TEST123456',
      carrier: 'Test Carrier'
    });
    
    success('Status updated to shipped');
    
    // Verify update
    const { data: updated, error: updateError } = await supabase
      .from('sub_orders')
      .select('fulfillment_status, tracking_number, carrier')
      .eq('id', firstSubOrder.id)
      .single();
    
    if (updateError) {
      error(`Failed to verify update: ${updateError.message}`);
      return false;
    }
    
    if (updated.fulfillment_status === 'shipped') {
      success('Status verified in database');
      info(`  Tracking: ${updated.tracking_number}`);
      info(`  Carrier: ${updated.carrier}`);
    } else {
      error(`Status not updated correctly: ${updated.fulfillment_status}`);
      return false;
    }
    
    return true;
    
  } catch (err) {
    error(`Status update failed: ${err.message}`);
    return false;
  }
}

/**
 * Test 8: Cleanup test data
 */
async function cleanup() {
  section('TEST 8: Cleanup');
  
  try {
    info('Cleaning up test data...');
    
    if (testOrderId) {
      // Delete sub-orders (cascade will handle order_items)
      const { error: subOrderError } = await supabase
        .from('sub_orders')
        .delete()
        .eq('parent_order_id', testOrderId);
      
      if (subOrderError) {
        error(`Failed to delete sub-orders: ${subOrderError.message}`);
      } else {
        success('Deleted sub-orders');
      }
      
      // Delete order_items
      const { error: itemsError } = await supabase
        .from('order_items')
        .delete()
        .eq('order_id', testOrderId);
      
      if (itemsError) {
        error(`Failed to delete order items: ${itemsError.message}`);
      } else {
        success('Deleted order items');
      }
      
      // Delete order
      const { error: orderError } = await supabase
        .from('orders')
        .delete()
        .eq('id', testOrderId);
      
      if (orderError) {
        error(`Failed to delete order: ${orderError.message}`);
      } else {
        success('Deleted test order');
      }
      
      // Delete notifications
      for (const seller of testSellers.slice(0, 2)) {
        await supabase
          .from('notifications')
          .delete()
          .eq('user_id', seller)
          .eq('type', 'new_order')
          .contains('metadata', { order_id: testOrderId });
      }
      success('Deleted test notifications');
    }
    
    return true;
    
  } catch (err) {
    error(`Cleanup failed: ${err.message}`);
    return false;
  }
}

/**
 * Main test runner
 */
async function runTests() {
  log('\n' + '='.repeat(60), 'bold');
  log('PHASE 3: ORDER SPLITTING - TEST SUITE', 'bold');
  log('='.repeat(60) + '\n', 'bold');
  
  const results = {
    passed: 0,
    failed: 0,
    total: 8
  };
  
  // Run tests
  const tests = [
    { name: 'Sub-Orders Table', fn: testSubOrdersTable, critical: true },
    { name: 'Get Test Products', fn: getTestProducts, critical: true },
    { name: 'Create Test Order', fn: createTestOrder, critical: true },
    { name: 'Order Splitting', fn: testOrderSplitting },
    { name: 'Verify Sub-Orders', fn: verifySubOrders },
    { name: 'Seller Notifications', fn: testSellerNotifications },
    { name: 'Status Update', fn: testStatusUpdate },
    { name: 'Cleanup', fn: cleanup }
  ];
  
  for (const test of tests) {
    const result = await test.fn();
    if (result) {
      results.passed++;
    } else {
      results.failed++;
      if (test.critical) {
        log('\n❌ Critical test failed. Stopping test suite.', 'red');
        break;
      }
    }
  }
  
  // Summary
  section('TEST SUMMARY');
  log(`\nTotal Tests: ${results.total}`, 'bold');
  log(`Passed: ${results.passed}`, 'green');
  log(`Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'green');
  
  if (results.failed === 0) {
    log('\n🎉 ALL TESTS PASSED! Phase 3 is working correctly!', 'green');
    log('\n✅ Next Steps:', 'cyan');
    log('   1. Integrate with payment controller', 'cyan');
    log('   2. Add seller order endpoints', 'cyan');
    log('   3. Test with real orders', 'cyan');
    log('   4. Monitor seller notifications\n', 'cyan');
  } else {
    log('\n⚠️  SOME TESTS FAILED', 'yellow');
    log('\nPlease check:', 'yellow');
    log('   1. Database migration completed', 'yellow');
    log('   2. Products have seller_id assigned', 'yellow');
    log('   3. At least 2 different sellers exist', 'yellow');
    log('   4. Review error messages above\n', 'yellow');
  }
  
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(err => {
  error(`\nTest suite crashed: ${err.message}`);
  console.error(err);
  process.exit(1);
});
