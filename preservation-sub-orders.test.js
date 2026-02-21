/**
 * PRESERVATION PROPERTY TESTS
 * Order Detail Sub-Orders Column Fix
 * 
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**
 * 
 * Property 2: Preservation - Non-Sub-Order Query Behavior
 * 
 * IMPORTANT: Observation-first methodology
 * - These tests observe and capture behavior on UNFIXED code
 * - They test queries that DON'T use the buggy column name
 * - Expected outcome: Tests PASS on unfixed code (baseline behavior)
 * - After fix: Tests should STILL PASS (preservation confirmed)
 * 
 * Preservation scope:
 * 1. Order detail pages for orders WITHOUT sub-orders (single-seller orders)
 * 2. Queries to sub_orders table using OTHER columns (id, seller_id, fulfillment_status)
 * 3. Order status history retrieval (order_status_history table)
 * 4. Main order information display (orders table)
 * 5. Other orderTracking service methods (buildOrderTimeline, calculateEstimatedDelivery, updateStatus, addTracking)
 * 
 * These tests ensure the fix doesn't introduce regressions.
 */

const fc = require('fast-check');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env' });

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
);

// Import the service to test
const orderTrackingService = require('./services/orderTrackingServices/orderTracking.service');

describe('Preservation: Non-Sub-Order Query Behavior', () => {
  let testCustomerId;
  let testSellerId;
  let testOrderWithoutSubOrders;
  let testOrderWithSubOrders;
  let testSubOrderId;

  beforeAll(async () => {
    // Create test data for preservation tests
    
    // Create test customer
    const { data: customer, error: customerError } = await supabase
      .from('users')
      .insert({
        email: `test-preservation-customer-${Date.now()}@example.com`,
        password_hash: 'test-hash',
        role: 'customer',
        display_name: 'Test Preservation Customer'
      })
      .select()
      .single();

    if (customerError) throw new Error(`Failed to create test customer: ${customerError.message}`);
    testCustomerId = customer.id;

    // Create test seller
    const { data: seller, error: sellerError } = await supabase
      .from('users')
      .insert({
        email: `test-preservation-seller-${Date.now()}@example.com`,
        password_hash: 'test-hash',
        role: 'seller',
        display_name: 'Test Preservation Seller'
      })
      .select()
      .single();

    if (sellerError) throw new Error(`Failed to create test seller: ${sellerError.message}`);
    testSellerId = seller.id;

    // Create order WITHOUT sub-orders (single-seller order)
    const { data: orderWithoutSub, error: order1Error } = await supabase
      .from('orders')
      .insert({
        user_id: testCustomerId,
        payment_intent_id: `pi_test_preservation_${Date.now()}_1`,
        amount: 10000, // 100.00 in cents
        basket: [{ product_id: 'test-product-1', quantity: 1, price: 100.00, title: 'Test Product' }],
        status: 'processing',
        payment_status: 'paid',
        shipping_address: { street: '123 Test St', city: 'Test City', state: 'TS', zip: '12345' }
      })
      .select()
      .single();

    if (order1Error) throw new Error(`Failed to create order without sub-orders: ${order1Error.message}`);
    testOrderWithoutSubOrders = orderWithoutSub.id;

    // Create order WITH sub-orders (for testing sub-order queries by other columns)
    const { data: orderWithSub, error: order2Error } = await supabase
      .from('orders')
      .insert({
        user_id: testCustomerId,
        payment_intent_id: `pi_test_preservation_${Date.now()}_2`,
        amount: 20000, // 200.00 in cents
        basket: [{ product_id: 'test-product-2', quantity: 2, price: 100.00, title: 'Test Product 2' }],
        status: 'shipped',
        payment_status: 'paid',
        shipping_address: { street: '456 Test Ave', city: 'Test City', state: 'TS', zip: '12345' }
      })
      .select()
      .single();

    if (order2Error) throw new Error(`Failed to create order with sub-orders: ${order2Error.message}`);
    testOrderWithSubOrders = orderWithSub.id;

    // Create a sub-order (for testing queries by id, seller_id, etc.)
    const { data: subOrder, error: subOrderError } = await supabase
      .from('sub_orders')
      .insert({
        parent_order_id: testOrderWithSubOrders,
        seller_id: testSellerId,
        status: 'shipped',
        total_amount: 10000, // 100.00 in cents
        subtotal: 10000,
        tracking_number: 'PRESERVE-TRACK-001',
        carrier: 'UPS',
        fulfillment_status: 'delivered',
        items: [{ product_id: 'test-product-1', quantity: 1, price: 100.00, title: 'Test Product' }]
      })
      .select()
      .single();

    if (subOrderError) throw new Error(`Failed to create sub-order: ${subOrderError.message}`);
    testSubOrderId = subOrder.id;

    // Create status history for the order
    await supabase
      .from('order_status_history')
      .insert([
        {
          order_id: testOrderWithoutSubOrders,
          previous_status: 'pending',
          new_status: 'confirmed',
          changed_by: testSellerId,
          notes: 'Order confirmed'
        },
        {
          order_id: testOrderWithoutSubOrders,
          previous_status: 'confirmed',
          new_status: 'processing',
          changed_by: testSellerId,
          notes: 'Order processing'
        }
      ]);

    console.log('\n=== Preservation Test Data Created ===');
    console.log(`Order WITHOUT sub-orders: ${testOrderWithoutSubOrders}`);
    console.log(`Order WITH sub-orders: ${testOrderWithSubOrders}`);
    console.log(`Sub-Order ID: ${testSubOrderId}`);
    console.log(`Seller ID: ${testSellerId}`);
    console.log('======================================\n');
  });

  afterAll(async () => {
    // Cleanup test data
    if (testOrderWithoutSubOrders) {
      await supabase.from('orders').delete().eq('id', testOrderWithoutSubOrders);
    }
    if (testOrderWithSubOrders) {
      await supabase.from('orders').delete().eq('id', testOrderWithSubOrders);
    }
    if (testCustomerId) {
      await supabase.from('users').delete().eq('id', testCustomerId);
    }
    if (testSellerId) {
      await supabase.from('users').delete().eq('id', testSellerId);
    }
  });

  /**
   * Preservation Test 1: Order Status History Retrieval
   * 
   * Requirement 3.3: Order status history retrieval must continue to work correctly
   * 
   * This tests the buildOrderTimeline method which queries the order_status_history table.
   * This query does NOT use the buggy column and should work on both unfixed and fixed code.
   */
  test('Preservation 1: buildOrderTimeline retrieves status history correctly', async () => {
    console.log('\n=== Preservation Test 1: Order Status History ===');
    console.log('Testing buildOrderTimeline method (queries order_status_history table)');
    console.log('Expected: Works correctly on UNFIXED code (no regression after fix)\n');

    const timeline = await orderTrackingService.buildOrderTimeline(testOrderWithoutSubOrders);

    // Verify timeline structure
    expect(timeline).toBeDefined();
    expect(Array.isArray(timeline)).toBe(true);
    expect(timeline.length).toBeGreaterThan(0);

    // Verify timeline events have correct structure
    timeline.forEach((event, index) => {
      console.log(`Timeline Event ${index + 1}:`);
      console.log(`  - Status: ${event.status}`);
      console.log(`  - Previous Status: ${event.previousStatus}`);
      console.log(`  - Timestamp: ${event.timestamp}`);
      console.log(`  - Notes: ${event.notes}`);

      expect(event.status).toBeDefined();
      expect(event.timestamp).toBeDefined();
      expect(event.id).toBeDefined();
    });

    console.log('\n✓ Order status history retrieval works correctly\n');
  });

  /**
   * Preservation Test 2: Main Order Information Display
   * 
   * Requirement 3.3: Main order information display must continue to function correctly
   * 
   * This tests the calculateEstimatedDelivery method which queries the orders table.
   * This query does NOT use the buggy column and should work on both unfixed and fixed code.
   */
  test('Preservation 2: calculateEstimatedDelivery works for orders without sub-orders', async () => {
    console.log('\n=== Preservation Test 2: Main Order Information ===');
    console.log('Testing calculateEstimatedDelivery method (queries orders table)');
    console.log('Expected: Works correctly on UNFIXED code (no regression after fix)\n');

    const estimatedDelivery = await orderTrackingService.calculateEstimatedDelivery(testOrderWithoutSubOrders);

    // Verify estimated delivery is calculated
    console.log(`Estimated Delivery: ${estimatedDelivery}`);
    
    // Should return a date or null (both are valid)
    expect(estimatedDelivery === null || estimatedDelivery instanceof Date).toBe(true);

    console.log('\n✓ Main order information display works correctly\n');
  });

  /**
   * Preservation Test 3: Sub-Orders Query by ID
   * 
   * Requirement 3.5: Queries to sub_orders table using other columns must continue to work
   * 
   * This tests direct queries to the sub_orders table using the 'id' column.
   * This query does NOT use the buggy 'order_id' column and should work on both unfixed and fixed code.
   */
  test('Preservation 3: Direct query to sub_orders by id works correctly', async () => {
    console.log('\n=== Preservation Test 3: Sub-Orders Query by ID ===');
    console.log('Testing direct query to sub_orders table using id column');
    console.log('Expected: Works correctly on UNFIXED code (no regression after fix)\n');

    const { data: subOrder, error } = await supabase
      .from('sub_orders')
      .select('*')
      .eq('id', testSubOrderId)
      .single();

    expect(error).toBeNull();
    expect(subOrder).toBeDefined();
    expect(subOrder.id).toBe(testSubOrderId);
    expect(subOrder.seller_id).toBe(testSellerId);
    expect(subOrder.status).toBe('shipped');
    expect(subOrder.tracking_number).toBe('PRESERVE-TRACK-001');

    console.log('Sub-Order Retrieved:');
    console.log(`  - ID: ${subOrder.id}`);
    console.log(`  - Seller ID: ${subOrder.seller_id}`);
    console.log(`  - Status: ${subOrder.status}`);
    console.log(`  - Tracking: ${subOrder.tracking_number}`);

    console.log('\n✓ Sub-orders query by id works correctly\n');
  });

  /**
   * Preservation Test 4: Sub-Orders Query by Seller ID
   * 
   * Requirement 3.5: Queries to sub_orders table using other columns must continue to work
   * 
   * This tests direct queries to the sub_orders table using the 'seller_id' column.
   * This query does NOT use the buggy 'order_id' column and should work on both unfixed and fixed code.
   */
  test('Preservation 4: Direct query to sub_orders by seller_id works correctly', async () => {
    console.log('\n=== Preservation Test 4: Sub-Orders Query by Seller ID ===');
    console.log('Testing direct query to sub_orders table using seller_id column');
    console.log('Expected: Works correctly on UNFIXED code (no regression after fix)\n');

    const { data: subOrders, error } = await supabase
      .from('sub_orders')
      .select('*')
      .eq('seller_id', testSellerId);

    expect(error).toBeNull();
    expect(subOrders).toBeDefined();
    expect(Array.isArray(subOrders)).toBe(true);
    expect(subOrders.length).toBeGreaterThan(0);

    console.log(`Found ${subOrders.length} sub-order(s) for seller ${testSellerId}`);
    subOrders.forEach((subOrder, index) => {
      console.log(`Sub-Order ${index + 1}:`);
      console.log(`  - ID: ${subOrder.id}`);
      console.log(`  - Status: ${subOrder.status}`);
      console.log(`  - Amount: $${subOrder.amount}`);
    });

    console.log('\n✓ Sub-orders query by seller_id works correctly\n');
  });

  /**
   * Preservation Test 5: Sub-Orders Query by Fulfillment Status
   * 
   * Requirement 3.5: Queries to sub_orders table using other columns must continue to work
   * 
   * This tests direct queries to the sub_orders table using the 'fulfillment_status' column.
   * This query does NOT use the buggy 'order_id' column and should work on both unfixed and fixed code.
   */
  test('Preservation 5: Direct query to sub_orders by fulfillment_status works correctly', async () => {
    console.log('\n=== Preservation Test 5: Sub-Orders Query by Fulfillment Status ===');
    console.log('Testing direct query to sub_orders table using fulfillment_status column');
    console.log('Expected: Works correctly on UNFIXED code (no regression after fix)\n');

    const { data: subOrders, error } = await supabase
      .from('sub_orders')
      .select('*')
      .eq('fulfillment_status', 'delivered');

    expect(error).toBeNull();
    expect(subOrders).toBeDefined();
    expect(Array.isArray(subOrders)).toBe(true);

    console.log(`Found ${subOrders.length} sub-order(s) with fulfillment_status = 'fulfilled'`);
    if (subOrders.length > 0) {
      subOrders.forEach((subOrder, index) => {
        console.log(`Sub-Order ${index + 1}:`);
        console.log(`  - ID: ${subOrder.id}`);
        console.log(`  - Fulfillment Status: ${subOrder.fulfillment_status}`);
        console.log(`  - Status: ${subOrder.status}`);
      });
    }

    console.log('\n✓ Sub-orders query by fulfillment_status works correctly\n');
  });

  /**
   * Preservation Test 6: Order Detail for Orders WITHOUT Sub-Orders
   * 
   * Requirement 3.1, 3.4: Orders without sub-orders must continue to display correctly
   * 
   * This tests that order detail pages for single-seller orders (no sub-orders) work correctly.
   * The getSubOrderTracking method should return an empty array for these orders.
   */
  test('Preservation 6: Order detail for orders without sub-orders works correctly', async () => {
    console.log('\n=== Preservation Test 6: Orders Without Sub-Orders ===');
    console.log('Testing order detail display for single-seller orders (no sub-orders)');
    console.log('Expected: Works correctly on UNFIXED code (no regression after fix)\n');

    // For orders without sub-orders, getSubOrderTracking should return empty array
    // This query will NOT execute the buggy .eq('order_id', ...) line because there are no sub-orders
    const subOrderTracking = await orderTrackingService.getSubOrderTracking(testOrderWithoutSubOrders);

    expect(subOrderTracking).toBeDefined();
    expect(Array.isArray(subOrderTracking)).toBe(true);
    expect(subOrderTracking.length).toBe(0);

    console.log(`Sub-order tracking for order without sub-orders: ${subOrderTracking.length} sub-orders (expected: 0)`);

    // Verify main order information is still accessible
    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', testOrderWithoutSubOrders)
      .single();

    expect(error).toBeNull();
    expect(order).toBeDefined();
    expect(order.id).toBe(testOrderWithoutSubOrders);
    expect(order.status).toBe('processing');

    console.log('Main Order Information:');
    console.log(`  - Order ID: ${order.id}`);
    console.log(`  - Status: ${order.status}`);
    console.log(`  - Amount: $${(order.amount / 100).toFixed(2)}`);
    console.log(`  - Payment Status: ${order.payment_status}`);

    console.log('\n✓ Order detail for orders without sub-orders works correctly\n');
  });

  /**
   * Property-Based Test: Preservation Across Multiple Orders
   * 
   * This property test generates multiple test cases to ensure preservation
   * holds across different order configurations.
   */
  test('Preservation (PBT): Order status history works for multiple orders', async () => {
    console.log('\n=== Preservation PBT: Multiple Orders ===');
    console.log('Testing buildOrderTimeline across multiple generated orders');
    console.log('Expected: Works correctly on UNFIXED code (no regression after fix)\n');

    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 3 }), // Number of status changes
        async (statusChangeCount) => {
          // Create a test order
          const { data: testOrder, error: orderError } = await supabase
            .from('orders')
            .insert({
              user_id: testCustomerId,
              payment_intent_id: `pi_test_pbt_${Date.now()}_${Math.random()}`,
              amount: statusChangeCount * 5000, // 50.00 per status change in cents
              basket: [{ product_id: 'test-product-pbt', quantity: 1, price: 50.00, title: 'Test PBT Product' }],
              status: 'processing',
              payment_status: 'paid',
              shipping_address: { street: '123 Test St', city: 'Test City', state: 'TS', zip: '12345' }
            })
            .select()
            .single();

          if (orderError) throw orderError;

          // Create status history entries
          const statuses = ['pending', 'confirmed', 'processing', 'shipped'];
          const historyData = Array.from({ length: statusChangeCount }, (_, i) => ({
            order_id: testOrder.id,
            previous_status: statuses[i] || 'pending',
            new_status: statuses[i + 1] || 'processing',
            changed_by: testSellerId,
            notes: `Status change ${i + 1}`
          }));

          await supabase.from('order_status_history').insert(historyData);

          try {
            // Test buildOrderTimeline (should work on unfixed code)
            const timeline = await orderTrackingService.buildOrderTimeline(testOrder.id);

            // Verify results
            expect(timeline).toBeDefined();
            expect(Array.isArray(timeline)).toBe(true);
            expect(timeline.length).toBe(statusChangeCount);

            // Cleanup
            await supabase.from('orders').delete().eq('id', testOrder.id);

            return true;
          } catch (error) {
            // Cleanup even on error
            await supabase.from('orders').delete().eq('id', testOrder.id);
            throw error;
          }
        }
      ),
      { numRuns: 5 } // Run 5 test cases
    );

    console.log('\n✓ Preservation holds across multiple orders\n');
  }, 30000); // 30 second timeout for PBT
});
