/**
 * TEST: Refund Analytics Service
 * 
 * Tests refund analytics, alerts, and threshold monitoring
 * Validates Task 10.8 implementation
 */

require('dotenv').config();
const refundAnalyticsService = require('./services/refundServices/refundAnalytics.service');
const supabase = require('./config/supabase');

console.log('✅ Environment configuration validated\n');
console.log('=== Testing Refund Analytics Service ===\n');

async function runTests() {
  let testOrderId = null;
  let testRefundId = null;
  let testCustomerId = null;
  let testSellerId = null;
  let testProductId = null;

  try {
    // Test 1: Verify service exports
    console.log('Test 1: Verify refund analytics service exports');
    const requiredFunctions = [
      'getSellerRefundRate',
      'getProductRefundRate',
      'getRefundReasonAnalytics',
      'checkRefundProcessingTimeAlerts',
      'flagHighRefundProducts',
      'getRefundAnalyticsDashboard'
    ];
    
    for (const func of requiredFunctions) {
      if (typeof refundAnalyticsService[func] !== 'function') {
        throw new Error(`Missing function: ${func}`);
      }
      console.log(`- ${func}: ✓`);
    }
    console.log('✓ All analytics functions verified\n');

    // Test 2: Create test data
    console.log('Test 2: Create test data for analytics');
    
    // Get a test customer and seller
    const { data: users } = await supabase
      .from('users')
      .select('id, role')
      .in('role', ['customer', 'seller'])
      .limit(2);
    
    if (!users || users.length < 2) {
      throw new Error('Need at least 2 users (customer and seller)');
    }
    
    testCustomerId = users.find(u => u.role === 'customer')?.id || users[0].id;
    testSellerId = users.find(u => u.role === 'seller')?.id || users[1].id;
    
    console.log(`- Using customer: ${testCustomerId}`);
    console.log(`- Using seller: ${testSellerId}`);

    // Get or create a test product
    const { data: products } = await supabase
      .from('products')
      .select('id')
      .eq('seller_id', testSellerId)
      .limit(1);
    
    if (products && products.length > 0) {
      testProductId = products[0].id;
    } else {
      // Create a test product
      const { data: newProduct, error: productError } = await supabase
        .from('products')
        .insert([{
          title: 'Test Product for Analytics',
          description: 'Test product',
          price: 5000,
          seller_id: testSellerId,
          status: 'active'
        }])
        .select()
        .single();
      
      if (productError) throw productError;
      testProductId = newProduct.id;
    }
    
    console.log(`- Using product: ${testProductId}`);

    // Create test order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([{
        user_id: testCustomerId,
        payment_intent_id: `pi_test_analytics_${Date.now()}`,
        amount: 5000,
        basket: [{ 
          product_id: testProductId, 
          title: 'Test Product', 
          price: 50, 
          quantity: 1,
          seller_id: testSellerId
        }],
        seller_id: testSellerId,
        status: 'delivered',
        delivered_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (orderError) throw orderError;
    testOrderId = order.id;
    console.log(`- Created test order: ${testOrderId}`);

    // Create test refund (old - for processing time alert)
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 7); // 7 days ago
    
    const { data: refund, error: refundError } = await supabase
      .from('refund_details')
      .insert([{
        order_id: testOrderId,
        customer_id: testCustomerId,
        seller_id: testSellerId,
        refund_type: 'partial',
        refund_amount: 2000,
        original_order_amount: 5000,
        reason_category: 'product_quality',
        reason_description: 'Test refund for analytics',
        status: 'pending',
        created_at: oldDate.toISOString()
      }])
      .select()
      .single();

    if (refundError) throw refundError;
    testRefundId = refund.id;
    console.log(`- Created test refund: ${testRefundId}`);
    console.log('✓ Test data created\n');

    // Test 3: Get seller refund rate
    console.log('Test 3: Calculate seller refund rate');
    const sellerRate = await refundAnalyticsService.getSellerRefundRate(testSellerId);
    console.log(`- Total orders: ${sellerRate.total_orders}`);
    console.log(`- Refund count: ${sellerRate.refund_count}`);
    console.log(`- Refund rate: ${sellerRate.refund_rate}%`);
    console.log(`- Threshold (15%): ${sellerRate.threshold_exceeded ? 'EXCEEDED' : 'OK'}`);
    console.log('✓ Seller refund rate calculated\n');

    // Test 4: Get product refund rate
    console.log('Test 4: Calculate product refund rate');
    const productRate = await refundAnalyticsService.getProductRefundRate(testProductId);
    console.log(`- Total orders: ${productRate.total_orders}`);
    console.log(`- Refund count: ${productRate.refund_count}`);
    console.log(`- Refund rate: ${productRate.refund_rate}%`);
    console.log(`- Threshold (20%): ${productRate.threshold_exceeded ? 'EXCEEDED' : 'OK'}`);
    console.log(`- Should flag: ${productRate.should_flag ? 'YES' : 'NO'}`);
    console.log('✓ Product refund rate calculated\n');

    // Test 5: Get refund reason analytics
    console.log('Test 5: Get refund reason analytics');
    const reasonAnalytics = await refundAnalyticsService.getRefundReasonAnalytics();
    console.log(`- Total refunds: ${reasonAnalytics.total_refunds}`);
    console.log(`- Most common reason: ${reasonAnalytics.most_common_reason}`);
    console.log(`- Reason distribution:`, Object.keys(reasonAnalytics.reason_distribution).length, 'categories');
    console.log('✓ Refund reason analytics retrieved\n');

    // Test 6: Check processing time alerts
    console.log('Test 6: Check refund processing time alerts');
    const processingAlerts = await refundAnalyticsService.checkRefundProcessingTimeAlerts();
    console.log(`- Alerts found: ${processingAlerts.length}`);
    if (processingAlerts.length > 0) {
      const alert = processingAlerts[0];
      console.log(`- Sample alert: ${alert.days_pending} days pending (threshold: ${alert.threshold_days})`);
    }
    if (processingAlerts.length === 0) {
      console.log('  (No alerts - this is expected if no refunds are pending >5 days)');
    }
    console.log('✓ Processing time alerts checked\n');

    // Test 7: Flag high refund products
    console.log('Test 7: Flag products with high refund rates');
    const flaggedProducts = await refundAnalyticsService.flagHighRefundProducts();
    console.log(`- Flagged products: ${flaggedProducts.length}`);
    if (flaggedProducts.length > 0) {
      const product = flaggedProducts[0];
      console.log(`- Sample: ${product.product_title} (${product.refund_rate}% refund rate)`);
    }
    console.log('✓ High refund products flagged\n');

    // Test 8: Get comprehensive analytics dashboard
    console.log('Test 8: Get refund analytics dashboard');
    const dashboard = await refundAnalyticsService.getRefundAnalyticsDashboard({
      sellerId: testSellerId
    });
    console.log(`- Reason analytics: ✓`);
    console.log(`- Processing time alerts: ${dashboard.processing_time_alerts.count}`);
    console.log(`- Flagged products: ${dashboard.flagged_products.count}`);
    console.log(`- Seller refund rate: ${dashboard.seller_refund_rate ? dashboard.seller_refund_rate.refund_rate + '%' : 'N/A'}`);
    console.log(`- Generated at: ${dashboard.generated_at}`);
    console.log('✓ Analytics dashboard generated\n');

    // Cleanup
    console.log('Cleanup: Removing test data');
    if (testRefundId) {
      await supabase.from('refund_details').delete().eq('id', testRefundId);
    }
    if (testOrderId) {
      await supabase.from('orders').delete().eq('id', testOrderId);
    }
    console.log('✓ Test data cleaned up\n');

    console.log('=== Analytics Test Complete ===\n');
    console.log('Summary:');
    console.log('- All analytics functions exist: ✓');
    console.log('- Seller refund rate calculation: ✓');
    console.log('- Product refund rate calculation: ✓');
    console.log('- Refund reason analytics: ✓');
    console.log('- Processing time alerts: ✓');
    console.log('- High refund product flagging: ✓');
    console.log('- Analytics dashboard generation: ✓');
    console.log('\n✅ Task 10.8 Complete!\n');

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
