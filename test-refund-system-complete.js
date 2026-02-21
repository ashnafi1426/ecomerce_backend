const supabase = require('./config/supabase');

console.log('🧪 Testing Refund System Functionality\n');

async function testRefundSystem() {
  try {
    // Step 1: Find a delivered order
    console.log('📦 Step 1: Finding a delivered order...');
    const { data: orders, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('status', 'delivered')
      .limit(1);

    if (orderError) {
      console.error('❌ Error fetching orders:', orderError.message);
      return;
    }

    if (!orders || orders.length === 0) {
      console.log('⚠️  No delivered orders found. Creating test scenario...');
      console.log('   Please ensure you have at least one delivered order in the database.');
      return;
    }

    const testOrder = orders[0];
    console.log('✅ Found delivered order:', testOrder.id);
    console.log('   User ID:', testOrder.user_id);
    console.log('   Amount:', testOrder.amount);
    console.log('   Status:', testOrder.status);

    // Step 2: Check refund_requests table structure
    console.log('\n📋 Step 2: Verifying refund_requests table...');
    const { data: refundCheck, error: refundCheckError } = await supabase
      .from('refund_requests')
      .select('*')
      .limit(1);

    if (refundCheckError) {
      console.error('❌ Error accessing refund_requests table:', refundCheckError.message);
      return;
    }

    console.log('✅ refund_requests table is accessible');

    // Step 3: Check for existing refund requests for this order
    console.log('\n🔍 Step 3: Checking existing refund requests...');
    const { data: existingRefunds, error: existingError } = await supabase
      .from('refund_requests')
      .select('*')
      .eq('order_id', testOrder.id);

    if (existingError) {
      console.error('❌ Error checking existing refunds:', existingError.message);
      return;
    }

    console.log(`✅ Found ${existingRefunds?.length || 0} existing refund request(s) for this order`);

    if (existingRefunds && existingRefunds.length > 0) {
      console.log('\n📊 Existing Refund Request Details:');
      existingRefunds.forEach((refund, index) => {
        console.log(`\n   Refund #${index + 1}:`);
        console.log('   - ID:', refund.id);
        console.log('   - Status:', refund.status);
        console.log('   - Reason:', refund.reason);
        console.log('   - Amount:', refund.refund_amount);
        console.log('   - Created:', refund.created_at);
      });
    }

    // Step 4: Get product and seller info from order
    console.log('\n📦 Step 4: Getting product and seller info from order...');
    
    const basket = testOrder.basket || [];
    if (basket.length === 0) {
      console.log('⚠️  Order has no products in basket');
      return;
    }
    
    const firstProduct = basket[0];
    console.log('✅ Found product in order:');
    console.log('   Product ID:', firstProduct.product_id);
    console.log('   Seller ID:', firstProduct.seller_id);
    console.log('   Price:', firstProduct.price);

    // Step 5: Create a test refund request
    console.log('\n➕ Step 5: Creating a test refund request...');
    
    const testRefundData = {
      order_id: testOrder.id,
      product_id: firstProduct.product_id,
      customer_id: testOrder.user_id,
      seller_id: firstProduct.seller_id,
      reason: 'quality_issue',
      description: 'This is a test refund request to verify the refund system functionality. Product arrived damaged.',
      product_price: firstProduct.price || 10.00,
      shipping_cost: 5.00,
      refund_amount: (firstProduct.price || 10.00) + 5.00,
      status: 'pending'
    };

    const { data: newRefund, error: createError } = await supabase
      .from('refund_requests')
      .insert([testRefundData])
      .select();

    if (createError) {
      console.error('❌ Error creating refund request:', createError.message);
      console.error('   Details:', createError);
      return;
    }

    console.log('✅ Test refund request created successfully!');
    console.log('   Refund ID:', newRefund[0].id);
    console.log('   Status:', newRefund[0].status);
    console.log('   Amount:', newRefund[0].refund_amount);

    // Step 6: Retrieve the refund request
    console.log('\n🔎 Step 6: Retrieving refund request...');
    const { data: retrievedRefund, error: retrieveError } = await supabase
      .from('refund_requests')
      .select('*')
      .eq('id', newRefund[0].id)
      .single();

    if (retrieveError) {
      console.error('❌ Error retrieving refund:', retrieveError.message);
      return;
    }

    console.log('✅ Refund request retrieved successfully');
    console.log('   All fields present:', Object.keys(retrievedRefund).length > 0);

    // Step 7: Update refund status
    console.log('\n🔄 Step 7: Testing status update...');
    const { data: updatedRefund, error: updateError } = await supabase
      .from('refund_requests')
      .update({ 
        status: 'approved',
        rejection_reason: 'Test approval - automated test'
      })
      .eq('id', newRefund[0].id)
      .select();

    if (updateError) {
      console.error('❌ Error updating refund status:', updateError.message);
      return;
    }

    console.log('✅ Refund status updated successfully');
    console.log('   New status:', updatedRefund[0].status);

    // Step 8: Test filtering by status
    console.log('\n🔍 Step 8: Testing status filtering...');
    const { data: pendingRefunds, error: filterError } = await supabase
      .from('refund_requests')
      .select('*')
      .eq('status', 'pending');

    if (filterError) {
      console.error('❌ Error filtering refunds:', filterError.message);
      return;
    }

    console.log(`✅ Found ${pendingRefunds?.length || 0} pending refund request(s)`);

    // Step 9: Test customer-specific refunds
    console.log('\n👤 Step 9: Testing customer-specific refund retrieval...');
    const { data: customerRefunds, error: customerError } = await supabase
      .from('refund_requests')
      .select('*')
      .eq('customer_id', testOrder.user_id);

    if (customerError) {
      console.error('❌ Error fetching customer refunds:', customerError.message);
      return;
    }

    console.log(`✅ Found ${customerRefunds?.length || 0} refund request(s) for customer ${testOrder.user_id}`);

    // Step 10: Cleanup test data
    console.log('\n🧹 Step 10: Cleaning up test data...');
    const { error: deleteError } = await supabase
      .from('refund_requests')
      .delete()
      .eq('id', newRefund[0].id);

    if (deleteError) {
      console.error('❌ Error deleting test refund:', deleteError.message);
      console.log('   You may need to manually delete refund ID:', newRefund[0].id);
      return;
    }

    console.log('✅ Test refund request deleted successfully');

    // Final Summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ REFUND SYSTEM TEST COMPLETE');
    console.log('='.repeat(60));
    console.log('\n📊 Test Results:');
    console.log('   ✅ Database table accessible');
    console.log('   ✅ Create refund request');
    console.log('   ✅ Retrieve refund request');
    console.log('   ✅ Update refund status');
    console.log('   ✅ Filter by status');
    console.log('   ✅ Filter by user');
    console.log('   ✅ Delete refund request');
    console.log('\n🎉 All refund system tests passed!');
    console.log('\n📝 Next Steps:');
    console.log('   1. Implement refund controller endpoints');
    console.log('   2. Add refund routes to the API');
    console.log('   3. Create frontend refund request form');
    console.log('   4. Add admin refund management interface');
    console.log('   5. Implement refund notification system');

  } catch (error) {
    console.error('\n❌ Unexpected error:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testRefundSystem()
  .then(() => {
    console.log('\n✅ Test execution completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test execution failed:', error.message);
    process.exit(1);
  });
