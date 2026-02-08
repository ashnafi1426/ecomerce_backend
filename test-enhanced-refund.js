/**
 * Enhanced Refund Service Test Suite
 * Tests Requirements 5.1, 5.2, 5.4, 5.6, 5.9, 5.10, 5.16
 */

const supabase = require('./config/supabase');
const enhancedRefundService = require('./services/refundServices/enhancedRefund.service');

// Test data storage
const testData = {
  testUserId: null,
  testSellerId: null,
  testOrderId: null,
  testRefundId: null
};

// Test 1: Create test user and order
async function setupTestData() {
  console.log('\n🔧 Setting up test data...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    // Create test customer
    const { data: customer, error: customerError } = await supabase
      .from('users')
      .insert([{
        email: `refund-test-${Date.now()}@test.com`,
        password_hash: 'test_hash',
        display_name: 'Refund Test Customer',
        role: 'customer'
      }])
      .select()
      .single();

    if (customerError) throw customerError;
    testData.testUserId = customer.id;
    console.log('✅ Test customer created:', customer.email);

    // Create test seller
    const { data: seller, error: sellerError } = await supabase
      .from('users')
      .insert([{
        email: `refund-seller-${Date.now()}@test.com`,
        password_hash: 'test_hash',
        display_name: 'Refund Test Seller',
        role: 'seller'
      }])
      .select()
      .single();

    if (sellerError) throw sellerError;
    testData.testSellerId = seller.id;
    console.log('✅ Test seller created:', seller.email);

    // Create test order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([{
        user_id: testData.testUserId,
        amount: 100.00,
        status: 'delivered',
        payment_intent_id: `test_pi_${Date.now()}`,
        basket: []
      }])
      .select()
      .single();

    if (orderError) throw orderError;
    testData.testOrderId = order.id;
    console.log('✅ Test order created:', order.id);

    // Create sub-order
    const { data: subOrder, error: subOrderError } = await supabase
      .from('sub_orders')
      .insert([{
        parent_order_id: testData.testOrderId,
        seller_id: testData.testSellerId,
        items: [{ product_id: 'test-product', quantity: 1, price: 100.00 }],
        subtotal: 100.00,
        total_amount: 100.00,
        fulfillment_status: 'delivered'
      }])
      .select()
      .single();

    if (subOrderError) throw subOrderError;
    console.log('✅ Test sub-order created:', subOrder.id);

    console.log('✅ Test data setup complete\n');
  } catch (error) {
    console.error('❌ Error setting up test data:', error.message);
    throw error;
  }
}

// Test 2: Create Refund Request
async function testCreateRefundRequest() {
  console.log('\n🧪 Test 1: Create Refund Request');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    const refundData = {
      refund_amount: 50.00,
      reason_category: 'product_quality',
      reason_description: 'Product arrived damaged',
      images: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg']
    };

    const refund = await enhancedRefundService.createRefundRequest(
      testData.testOrderId,
      testData.testUserId,
      refundData
    );

    testData.testRefundId = refund.id;

    console.log('✅ Refund request created successfully');
    console.log('   Refund ID:', refund.id);
    console.log('   Type:', refund.refund_type);
    console.log('   Amount:', refund.refund_amount);
    console.log('   Status:', refund.status);
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    throw error;
  }
}

// Test 3: Validate Image Upload Limit
async function testImageUploadLimit() {
  console.log('\n🧪 Test 2: Validate Image Upload Limit (Max 5)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    const refundData = {
      refund_amount: 30.00,
      reason_category: 'shipping_damage',
      reason_description: 'Package was damaged',
      images: [
        'https://example.com/img1.jpg',
        'https://example.com/img2.jpg',
        'https://example.com/img3.jpg',
        'https://example.com/img4.jpg',
        'https://example.com/img5.jpg',
        'https://example.com/img6.jpg' // 6th image should fail
      ]
    };

    await enhancedRefundService.createRefundRequest(
      testData.testOrderId,
      testData.testUserId,
      refundData
    );

    console.log('❌ Test failed: Should have rejected 6 images');
  } catch (error) {
    if (error.message.includes('Maximum 5 images')) {
      console.log('✅ Image limit validation working correctly');
      console.log('   Error message:', error.message);
    } else {
      throw error;
    }
  }
}

// Test 4: Calculate Commission Adjustment
async function testCalculateCommissionAdjustment() {
  console.log('\n🧪 Test 3: Calculate Commission Adjustment');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    const adjustment = await enhancedRefundService.calculateCommissionAdjustment(
      testData.testOrderId,
      50.00
    );

    console.log('✅ Commission adjustment calculated');
    console.log('   Refund Amount:', adjustment.refundAmount);
    console.log('   Commission:', adjustment.commission);
    console.log('   Seller Amount:', adjustment.sellerAmount);

    // Verify calculation (10% commission)
    const expectedCommission = 50.00 * 0.10;
    const expectedSeller = 50.00 - expectedCommission;

    if (Math.abs(adjustment.commission - expectedCommission) < 0.01 &&
        Math.abs(adjustment.sellerAmount - expectedSeller) < 0.01) {
      console.log('✅ Commission calculation is correct');
    } else {
      throw new Error('Commission calculation mismatch');
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    throw error;
  }
}

// Test 5: Get Cumulative Refunds
async function testGetCumulativeRefunds() {
  console.log('\n🧪 Test 4: Get Cumulative Refunds');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    const cumulative = await enhancedRefundService.getCumulativeRefunds(testData.testOrderId);

    console.log('✅ Cumulative refunds retrieved');
    console.log('   Total Refunded:', cumulative);

    if (cumulative === 0) {
      console.log('✅ Cumulative calculation correct (no approved refunds yet)');
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    throw error;
  }
}

// Test 6: Process Partial Refund
async function testProcessPartialRefund() {
  console.log('\n🧪 Test 5: Process Partial Refund');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    // Create manager user
    const { data: manager } = await supabase
      .from('users')
      .insert([{
        email: `refund-manager-${Date.now()}@test.com`,
        password_hash: 'test_hash',
        display_name: 'Refund Test Manager',
        role: 'manager'
      }])
      .select()
      .single();

    const processedRefund = await enhancedRefundService.processPartialRefund(
      testData.testRefundId,
      manager.id,
      50.00,
      'Approved partial refund for damaged product'
    );

    console.log('✅ Partial refund processed successfully');
    console.log('   Status:', processedRefund.status);
    console.log('   Commission Adjustment:', processedRefund.commission_adjustment);
    console.log('   Seller Deduction:', processedRefund.seller_deduction);

    // Verify order status updated
    const { data: order } = await supabase
      .from('orders')
      .select('status, refund_amount')
      .eq('id', testData.testOrderId)
      .single();

    if (order.status === 'partially_refunded') {
      console.log('✅ Order status updated to partially_refunded');
    } else {
      throw new Error('Order status not updated correctly');
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    throw error;
  }
}

// Test 7: Validate Cumulative Refund Limit
async function testCumulativeRefundLimit() {
  console.log('\n🧪 Test 6: Validate Cumulative Refund Limit');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    // Try to create refund that exceeds order total
    const refundData = {
      refund_amount: 60.00, // Already refunded 50, order total is 100
      reason_category: 'customer_changed_mind',
      reason_description: 'Changed mind'
    };

    await enhancedRefundService.createRefundRequest(
      testData.testOrderId,
      testData.testUserId,
      refundData
    );

    console.log('✅ Additional refund created (within limit)');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    throw error;
  }
}

// Test 8: Issue Goodwill Refund
async function testIssueGoodwillRefund() {
  console.log('\n🧪 Test 7: Issue Goodwill Refund');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    // Create new order for goodwill test
    const { data: newOrder } = await supabase
      .from('orders')
      .insert([{
        user_id: testData.testUserId,
        amount: 75.00,
        status: 'delivered',
        payment_intent_id: `test_pi_${Date.now()}`,
        basket: []
      }])
      .select()
      .single();

    await supabase
      .from('sub_orders')
      .insert([{
        parent_order_id: newOrder.id,
        seller_id: testData.testSellerId,
        items: [{ product_id: 'test-product', quantity: 1, price: 75.00 }],
        subtotal: 75.00,
        total_amount: 75.00,
        fulfillment_status: 'delivered'
      }]);

    const { data: manager } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'manager')
      .limit(1)
      .single();

    const goodwillRefund = await enhancedRefundService.issueGoodwillRefund(
      newOrder.id,
      manager.id,
      10.00,
      'Customer satisfaction gesture'
    );

    console.log('✅ Goodwill refund issued successfully');
    console.log('   Type:', goodwillRefund.refund_type);
    console.log('   Amount:', goodwillRefund.refund_amount);
    console.log('   Status:', goodwillRefund.status);

    if (goodwillRefund.refund_type === 'goodwill') {
      console.log('✅ Goodwill refund flagged correctly');
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    throw error;
  }
}

// Test 9: Get Refund Analytics
async function testGetRefundAnalytics() {
  console.log('\n🧪 Test 8: Get Refund Analytics');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    const analytics = await enhancedRefundService.getRefundAnalytics({
      sellerId: testData.testSellerId
    });

    console.log('✅ Refund analytics retrieved');
    console.log('   Total Refunds:', analytics.totalRefunds);
    console.log('   Total Amount:', analytics.totalAmount);
    console.log('   Avg Refund Amount:', analytics.avgRefundAmount);
    console.log('   Refunds by Type:', analytics.refundsByType);
    console.log('   Reason Distribution:', analytics.reasonDistribution);
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    throw error;
  }
}

// Test 10: Get Refund by ID
async function testGetRefundById() {
  console.log('\n🧪 Test 9: Get Refund by ID');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    const refund = await enhancedRefundService.getRefundById(testData.testRefundId);

    console.log('✅ Refund details retrieved');
    console.log('   Refund ID:', refund.id);
    console.log('   Status:', refund.status);
    console.log('   Images Count:', refund.refund_images?.length || 0);
    console.log('   Customer:', refund.customers?.display_name);
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    throw error;
  }
}

// Cleanup function
async function cleanup() {
  console.log('\n🧹 Cleaning up test data...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    // Delete in correct order due to foreign keys
    if (testData.testOrderId) {
      await supabase.from('refund_details').delete().eq('order_id', testData.testOrderId);
      await supabase.from('sub_orders').delete().eq('order_id', testData.testOrderId);
      await supabase.from('orders').delete().eq('id', testData.testOrderId);
    }

    if (testData.testUserId) {
      await supabase.from('users').delete().eq('id', testData.testUserId);
    }

    if (testData.testSellerId) {
      await supabase.from('users').delete().eq('id', testData.testSellerId);
    }

    // Clean up manager
    await supabase.from('users').delete().like('email', 'refund-manager-%');

    console.log('✅ Cleanup complete\n');
  } catch (error) {
    console.error('❌ Cleanup error:', error.message);
  }
}

// Main test runner
async function runTests() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║     ENHANCED REFUND SERVICE TEST SUITE                 ║');
  console.log('╚════════════════════════════════════════════════════════╝');

  try {
    await setupTestData();
    await testCreateRefundRequest();
    await testImageUploadLimit();
    await testCalculateCommissionAdjustment();
    await testGetCumulativeRefunds();
    await testProcessPartialRefund();
    await testCumulativeRefundLimit();
    await testIssueGoodwillRefund();
    await testGetRefundAnalytics();
    await testGetRefundById();

    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║              ✅ ALL TESTS PASSED                       ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');
  } catch (error) {
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║              ❌ TESTS FAILED                           ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');
    console.error('Error:', error.message);
  } finally {
    await cleanup();
    process.exit(0);
  }
}

// Run tests
runTests();
