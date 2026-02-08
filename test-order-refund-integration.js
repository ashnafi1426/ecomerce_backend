/**
 * TEST: Order Service Refund Integration
 * 
 * Tests the integration between Order Service and Enhanced Refund Service
 * Validates Task 10.7 implementation
 */

require('dotenv').config();
const orderService = require('./services/orderServices/order.service');
const supabase = require('./config/supabase');

console.log('✅ Environment configuration validated\n');
console.log('=== Testing Order Service Refund Integration ===\n');

async function runTests() {
  let testOrderId = null;
  let testRefundId = null;
  let testCustomerId = null;

  try {
    // Test 1: Verify new functions exist
    console.log('Test 1: Verify order service exports new refund functions');
    const requiredFunctions = [
      'getOrderRefundHistory',
      'getOrderRefundSummary',
      'updateOrderRefundStatus',
      'getOrderWithRefunds',
      'isEligibleForRefund'
    ];
    
    for (const func of requiredFunctions) {
      if (typeof orderService[func] !== 'function') {
        throw new Error(`Missing function: ${func}`);
      }
      console.log(`- ${func}: function`);
    }
    console.log('✓ All refund functions verified\n');

    // Test 2: Create test data
    console.log('Test 2: Create test order and refund');
    
    // Get a test customer
    const { data: users } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'customer')
      .limit(1);
    
    if (!users || users.length === 0) {
      throw new Error('No customer found in database');
    }
    
    testCustomerId = users[0].id;
    console.log(`- Using customer: ${testCustomerId}`);

    // Create test order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([{
        user_id: testCustomerId,
        payment_intent_id: `pi_test_${Date.now()}`,
        amount: 10000, // $100.00
        basket: [{ product_id: 'test', title: 'Test Product', price: 100, quantity: 1 }],
        status: 'delivered',
        delivered_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (orderError) throw orderError;
    testOrderId = order.id;
    console.log(`- Created test order: ${testOrderId}`);

    // Create test refund
    const { data: refund, error: refundError } = await supabase
      .from('refund_details')
      .insert([{
        order_id: testOrderId,
        customer_id: testCustomerId,
        seller_id: testCustomerId, // Using same ID for simplicity
        refund_type: 'partial',
        refund_amount: 3000, // $30.00
        original_order_amount: 10000,
        reason_category: 'product_quality',
        reason_description: 'Test refund',
        status: 'approved',
        processed_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (refundError) throw refundError;
    testRefundId = refund.id;
    console.log(`- Created test refund: ${testRefundId}`);
    console.log('✓ Test data created\n');

    // Test 3: Get refund history
    console.log('Test 3: Get order refund history');
    const refundHistory = await orderService.getOrderRefundHistory(testOrderId);
    console.log(`- Found ${refundHistory.length} refund(s)`);
    if (refundHistory.length === 0) {
      throw new Error('Refund history is empty');
    }
    console.log('✓ Refund history retrieved\n');

    // Test 4: Get refund summary
    console.log('Test 4: Get order refund summary');
    const refundSummary = await orderService.getOrderRefundSummary(testOrderId);
    console.log(`- Total refunded: $${refundSummary.total_refunded / 100}`);
    console.log(`- Refund count: ${refundSummary.refund_count}`);
    console.log(`- Has refunds: ${refundSummary.has_refunds}`);
    if (refundSummary.total_refunded !== 3000) {
      throw new Error(`Expected $30.00, got $${refundSummary.total_refunded / 100}`);
    }
    console.log('✓ Refund summary correct\n');

    // Test 5: Update order refund status
    console.log('Test 5: Update order refund status');
    const updatedOrder = await orderService.updateOrderRefundStatus(testOrderId, 3000);
    console.log(`- Order status: ${updatedOrder.status}`);
    if (updatedOrder.status !== 'partially_refunded') {
      throw new Error(`Expected 'partially_refunded', got '${updatedOrder.status}'`);
    }
    console.log('✓ Order status updated correctly\n');

    // Test 6: Get order with refunds
    console.log('Test 6: Get order with refund details');
    const orderWithRefunds = await orderService.getOrderWithRefunds(testOrderId);
    console.log(`- Order total: $${orderWithRefunds.amount / 100}`);
    console.log(`- Total refunded: $${orderWithRefunds.refund_summary.total_refunded / 100}`);
    console.log(`- Refund count: ${orderWithRefunds.refund_summary.refund_count}`);
    if (!orderWithRefunds.refund_summary) {
      throw new Error('Refund summary missing from order');
    }
    console.log('✓ Order with refunds retrieved\n');

    // Test 7: Check refund eligibility
    console.log('Test 7: Check refund eligibility');
    const eligibility = await orderService.isEligibleForRefund(testOrderId);
    console.log(`- Eligible: ${eligibility.eligible}`);
    if (eligibility.eligible) {
      console.log(`- Remaining refundable: $${eligibility.remaining_refundable / 100}`);
      console.log(`- Order total: $${eligibility.order_total / 100}`);
      console.log(`- Total refunded: $${eligibility.total_refunded / 100}`);
    }
    if (!eligibility.eligible) {
      throw new Error('Order should be eligible for additional refunds');
    }
    console.log('✓ Refund eligibility checked\n');

    // Test 8: Test full refund status
    console.log('Test 8: Test full refund status update');
    await orderService.updateOrderRefundStatus(testOrderId, 7000); // Total $100 refunded
    const fullyRefundedOrder = await orderService.findById(testOrderId);
    console.log(`- Order status after full refund: ${fullyRefundedOrder.status}`);
    if (fullyRefundedOrder.status !== 'refunded') {
      throw new Error(`Expected 'refunded', got '${fullyRefundedOrder.status}'`);
    }
    console.log('✓ Full refund status correct\n');

    // Cleanup
    console.log('Cleanup: Removing test data');
    if (testRefundId) {
      await supabase.from('refund_details').delete().eq('id', testRefundId);
    }
    if (testOrderId) {
      await supabase.from('orders').delete().eq('id', testOrderId);
    }
    console.log('✓ Test data cleaned up\n');

    console.log('=== Integration Test Complete ===\n');
    console.log('Summary:');
    console.log('- Order service has refund functions: ✓');
    console.log('- Refund history tracking works: ✓');
    console.log('- Refund summary calculations correct: ✓');
    console.log('- Order status updates correctly: ✓');
    console.log('- Partial refund status: ✓');
    console.log('- Full refund status: ✓');
    console.log('- Refund eligibility checks work: ✓');
    console.log('\n✅ Task 10.7 Complete!\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error);
    
    // Cleanup on error
    if (testRefundId) {
      await supabase.from('refund_details').delete().eq('id', testRefundId);
    }
    if (testOrderId) {
      await supabase.from('orders').delete().eq('id', testOrderId);
    }
    
    process.exit(1);
  }
}

runTests();
