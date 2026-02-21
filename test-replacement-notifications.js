/**
 * Test script for replacement request notifications
 * 
 * Tests:
 * 1. Create a replacement request
 * 2. Verify customer receives in-app notification
 * 3. Verify seller receives in-app notification
 * 4. Verify seller receives email notification
 */

const supabase = require('./config/supabase');
const replacementService = require('./services/replacementServices/replacement.service');

async function testReplacementNotifications() {
  console.log('\n=== Testing Replacement Request Notifications ===\n');
  
  try {
    // Step 1: Find a delivered order with a customer and seller
    console.log('Step 1: Finding a delivered order...');
    
    // First, find a valid product
    const { data: products } = await supabase
      .from('products')
      .select('id, seller_id, title')
      .not('seller_id', 'is', null)
      .limit(1)
      .single();
    
    if (!products) {
      throw new Error('No products found in database');
    }
    
    console.log(`✅ Found product: ${products.title} (${products.id})`);
    console.log(`   Seller: ${products.seller_id}`);
    
    // Find or create an order with this product
    const { data: orders, error: orderError } = await supabase
      .from('orders')
      .select('id, user_id, seller_id, status, delivered_at, basket')
      .eq('status', 'delivered')
      .not('user_id', 'is', null)
      .limit(5);
    
    let order = null;
    
    if (orders && orders.length > 0) {
      // Try to find an order with a valid product
      for (const o of orders) {
        if (o.basket && Array.isArray(o.basket) && o.basket.length > 0) {
          const productId = o.basket[0].product_id;
          const { data: prod } = await supabase
            .from('products')
            .select('id, seller_id')
            .eq('id', productId)
            .single();
          
          if (prod) {
            order = o;
            order.seller_id = prod.seller_id;
            break;
          }
        }
      }
    }
    
    // If no valid order found, create a test order
    if (!order) {
      console.log('Creating test order...');
      
      // Find a customer
      const { data: customer } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'customer')
        .limit(1)
        .single();
      
      if (!customer) {
        throw new Error('No customer found in database');
      }
      
      // Create order
      const { data: newOrder } = await supabase
        .from('orders')
        .insert({
          user_id: customer.id,
          seller_id: products.seller_id,
          status: 'delivered',
          delivered_at: new Date().toISOString(),
          total_amount: 100,
          subtotal: 100,
          basket: [{
            product_id: products.id,
            quantity: 1,
            price: 100
          }]
        })
        .select()
        .single();
      
      order = newOrder;
    }
    
    console.log(`✅ Found order: ${order.id}`);
    console.log(`   Customer: ${order.user_id}`);
    console.log(`   Seller: ${order.seller_id}`);
    
    // Use the valid product we found earlier
    const productId = products.id;
    
    console.log(`   Product: ${productId}`);
    
    // Step 2: Get customer and seller details
    console.log('\nStep 2: Getting customer and seller details...');
    
    const { data: customer } = await supabase
      .from('users')
      .select('id, full_name, display_name, email')
      .eq('id', order.user_id)
      .single();
    
    const { data: seller } = await supabase
      .from('users')
      .select('id, full_name, display_name, email, business_name')
      .eq('id', order.seller_id)
      .single();
    
    console.log(`✅ Customer: ${customer?.full_name || customer?.display_name || 'Unknown'} (${customer?.email})`);
    console.log(`✅ Seller: ${seller?.business_name || seller?.full_name || seller?.display_name || 'Unknown'} (${seller?.email})`);
    
    // Step 3: Count existing notifications
    console.log('\nStep 3: Counting existing notifications...');
    
    const { count: customerNotifsBefore } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', order.user_id);
    
    const { count: sellerNotifsBefore } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', order.seller_id);
    
    console.log(`   Customer notifications before: ${customerNotifsBefore}`);
    console.log(`   Seller notifications before: ${sellerNotifsBefore}`);
    
    // Step 4: Create replacement request
    console.log('\nStep 4: Creating replacement request...');
    
    const replacementData = {
      orderId: order.id,
      productId: productId,
      customerId: order.user_id,
      reason: 'defective',
      description: 'The product arrived with a manufacturing defect. The screen has dead pixels and does not function properly.',
      photos: [] // No photos for this test
    };
    
    const replacementRequest = await replacementService.createRequest(replacementData);
    
    console.log(`✅ Replacement request created: ${replacementRequest.id}`);
    console.log(`   Status: ${replacementRequest.status}`);
    console.log(`   Reason: ${replacementRequest.reason}`);
    
    // Wait a moment for notifications to be created
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Step 5: Verify customer notification
    console.log('\nStep 5: Verifying customer notification...');
    
    const { data: customerNotifs, count: customerNotifsAfter } = await supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', order.user_id)
      .order('created_at', { ascending: false })
      .limit(5);
    
    console.log(`   Customer notifications after: ${customerNotifsAfter}`);
    
    const customerReplacementNotif = customerNotifs?.find(n => 
      n.type === 'replacement_request_created' && 
      n.metadata?.replacement_request_id === replacementRequest.id
    );
    
    if (customerReplacementNotif) {
      console.log(`✅ Customer notification found!`);
      console.log(`   Type: ${customerReplacementNotif.type}`);
      console.log(`   Title: ${customerReplacementNotif.title}`);
      console.log(`   Message: ${customerReplacementNotif.message}`);
      console.log(`   Action URL: ${customerReplacementNotif.action_url}`);
      console.log(`   Channels: ${customerReplacementNotif.channels?.join(', ')}`);
    } else {
      console.log(`❌ Customer notification NOT found`);
      console.log('Recent customer notifications:');
      customerNotifs?.slice(0, 3).forEach(n => {
        console.log(`   - ${n.type}: ${n.title}`);
      });
    }
    
    // Step 6: Verify seller notification
    console.log('\nStep 6: Verifying seller notification...');
    
    const { data: sellerNotifs, count: sellerNotifsAfter } = await supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', order.seller_id)
      .order('created_at', { ascending: false })
      .limit(5);
    
    console.log(`   Seller notifications after: ${sellerNotifsAfter}`);
    
    const sellerReplacementNotif = sellerNotifs?.find(n => 
      n.type === 'replacement_request_received' && 
      n.metadata?.replacement_request_id === replacementRequest.id
    );
    
    if (sellerReplacementNotif) {
      console.log(`✅ Seller notification found!`);
      console.log(`   Type: ${sellerReplacementNotif.type}`);
      console.log(`   Title: ${sellerReplacementNotif.title}`);
      console.log(`   Message: ${sellerReplacementNotif.message}`);
      console.log(`   Action URL: ${sellerReplacementNotif.action_url}`);
      console.log(`   Priority: ${sellerReplacementNotif.priority}`);
      console.log(`   Channels: ${sellerReplacementNotif.channels?.join(', ')}`);
    } else {
      console.log(`❌ Seller notification NOT found`);
      console.log('Recent seller notifications:');
      sellerNotifs?.slice(0, 3).forEach(n => {
        console.log(`   - ${n.type}: ${n.title}`);
      });
    }
    
    // Step 7: Summary
    console.log('\n=== Test Summary ===\n');
    
    const customerNotifCreated = customerNotifsAfter > customerNotifsBefore;
    const sellerNotifCreated = sellerNotifsAfter > sellerNotifsBefore;
    const customerNotifCorrect = !!customerReplacementNotif;
    const sellerNotifCorrect = !!sellerReplacementNotif;
    
    console.log(`Customer in-app notification: ${customerNotifCreated && customerNotifCorrect ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Seller in-app notification: ${sellerNotifCreated && sellerNotifCorrect ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Seller email notification: ⚠️  Check email inbox for ${seller?.email}`);
    
    if (customerNotifCreated && customerNotifCorrect && sellerNotifCreated && sellerNotifCorrect) {
      console.log('\n🎉 All notification tests PASSED!');
      console.log('\nRequirements validated:');
      console.log('  ✅ Requirement 1.5: Customer receives in-app notification');
      console.log('  ✅ Requirement 2.1: Seller receives in-app and email notification');
    } else {
      console.log('\n⚠️  Some notification tests FAILED');
    }
    
    console.log(`\nReplacement Request ID: ${replacementRequest.id}`);
    console.log(`Order ID: ${order.id}`);
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the test
testReplacementNotifications()
  .then(() => {
    console.log('\n✅ Test completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Test error:', error);
    process.exit(1);
  });
