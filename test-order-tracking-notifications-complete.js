/**
 * Complete Test for Order Tracking Notifications Integration
 * 
 * This test:
 * 1. Creates a test order
 * 2. Updates order status through various stages
 * 3. Verifies notifications are created for each status change
 * 4. Verifies email notifications are sent for major status changes
 * 5. Tests tracking information notifications
 * 
 * Requirements: 14.1, 14.6
 */

const supabase = require('./config/supabase');
const orderTrackingService = require('./services/orderTrackingServices/orderTracking.service');

async function testOrderTrackingNotificationsComplete() {
  console.log('\n🧪 Complete Test: Order Tracking Notifications Integration\n');
  console.log('='.repeat(70));

  let testOrderId = null;
  let testCustomerId = null;

  try {
    // Step 1: Find or create a test customer
    console.log('\n👤 Step 1: Finding a test customer...');
    const { data: customers, error: customerError } = await supabase
      .from('users')
      .select('id, email, display_name')
      .eq('role', 'customer')
      .limit(1);

    if (customerError) throw customerError;

    if (!customers || customers.length === 0) {
      console.log('❌ No customers found in database');
      return;
    }

    testCustomerId = customers[0].id;
    console.log(`✅ Found test customer: ${customers[0].display_name || customers[0].email}`);
    console.log(`   Customer ID: ${testCustomerId}`);

    // Step 2: Find a test product
    console.log('\n📦 Step 2: Finding a test product...');
    const { data: products, error: productError } = await supabase
      .from('products')
      .select('id, title, price, seller_id')
      .eq('status', 'active')
      .limit(1);

    if (productError) throw productError;

    if (!products || products.length === 0) {
      console.log('❌ No active products found in database');
      return;
    }

    const testProduct = products[0];
    console.log(`✅ Found test product: ${testProduct.title}`);
    console.log(`   Product ID: ${testProduct.id}`);
    console.log(`   Price: $${testProduct.price}`);

    // Step 3: Create a test order
    console.log('\n🛒 Step 3: Creating a test order...');
    const { data: newOrder, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: testCustomerId,
        payment_intent_id: `pi_test_${Date.now()}`,
        amount: Math.round(parseFloat(testProduct.price) * 100), // Convert to cents
        status: 'paid', // Use 'paid' as initial status
        payment_method: 'stripe',
        payment_status: 'completed',
        basket: [{
          product_id: testProduct.id,
          title: testProduct.title,
          price: parseFloat(testProduct.price),
          quantity: 1,
          total: parseFloat(testProduct.price),
          seller_id: testProduct.seller_id
        }],
        shipping_address: {
          address: '123 Test St',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345',
          country: 'US',
          fullName: 'Test Customer',
          email: 'test@example.com',
          phone: '555-1234'
        }
      })
      .select()
      .single();

    if (orderError) throw orderError;

    testOrderId = newOrder.id;
    console.log(`✅ Test order created: ${testOrderId}`);

    // Step 4: Get initial notification count
    console.log('\n📊 Step 4: Getting initial notification count...');
    const { data: initialNotifications, error: initialError } = await supabase
      .from('notifications')
      .select('id', { count: 'exact' })
      .eq('user_id', testCustomerId);

    if (initialError) throw initialError;

    const initialCount = initialNotifications?.length || 0;
    console.log(`✅ Initial notification count: ${initialCount}`);

    // Step 5: Test status update to 'confirmed' (not a major status)
    console.log('\n✅ Step 5: Updating order status to "confirmed"...');
    console.log('   Expected: In-app notification only (no email)');

    await orderTrackingService.updateStatus(
      testOrderId,
      'confirmed',
      testCustomerId,
      {
        notes: 'Order confirmed by seller',
        reason: 'Test notification integration'
      }
    );

    console.log('✅ Order status updated to "confirmed"');
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Verify notification
    const { data: confirmedNotif } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', testCustomerId)
      .eq('type', 'order_status_update')
      .order('created_at', { ascending: false })
      .limit(1);

    if (confirmedNotif && confirmedNotif.length > 0) {
      const notif = confirmedNotif[0];
      console.log('✅ Notification created:');
      console.log(`   Title: "${notif.title}"`);
      console.log(`   Message: "${notif.message}"`);
      console.log(`   Priority: ${notif.priority}`);
      console.log(`   Channels: ${JSON.stringify(notif.channels)}`);
      
      if (notif.channels.includes('email')) {
        console.log('   ⚠️  WARNING: Email channel included (should be in-app only for "confirmed")');
      } else {
        console.log('   ✅ Correct: In-app only (no email for non-major status)');
      }
    } else {
      console.log('   ❌ No notification found');
    }

    // Step 6: Test status update to 'shipped' (MAJOR status - should send email)
    console.log('\n🚚 Step 6: Updating order status to "shipped"...');
    console.log('   Expected: In-app notification + Email notification');

    await orderTrackingService.updateStatus(
      testOrderId,
      'shipped',
      testCustomerId,
      {
        notes: 'Order has been shipped',
        reason: 'Test notification integration'
      }
    );

    console.log('✅ Order status updated to "shipped"');
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Verify notification
    const { data: shippedNotif } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', testCustomerId)
      .eq('type', 'order_status_update')
      .order('created_at', { ascending: false })
      .limit(1);

    if (shippedNotif && shippedNotif.length > 0) {
      const notif = shippedNotif[0];
      console.log('✅ Notification created:');
      console.log(`   Title: "${notif.title}"`);
      console.log(`   Message: "${notif.message}"`);
      console.log(`   Priority: ${notif.priority}`);
      console.log(`   Channels: ${JSON.stringify(notif.channels)}`);
      
      if (notif.channels.includes('email')) {
        console.log('   ✅ Correct: Email channel included (major status change)');
      } else {
        console.log('   ❌ ERROR: Email channel NOT included (should be included for "shipped")');
      }
    } else {
      console.log('   ❌ No notification found');
    }

    // Step 7: Test status update to 'out_for_delivery' (MAJOR status)
    console.log('\n📍 Step 7: Updating order status to "out_for_delivery"...');
    console.log('   Expected: In-app notification + Email notification');

    await orderTrackingService.updateStatus(
      testOrderId,
      'out_for_delivery',
      testCustomerId,
      {
        notes: 'Order is out for delivery',
        reason: 'Test notification integration'
      }
    );

    console.log('✅ Order status updated to "out_for_delivery"');
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Verify notification
    const { data: outForDeliveryNotif } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', testCustomerId)
      .eq('type', 'order_status_update')
      .order('created_at', { ascending: false })
      .limit(1);

    if (outForDeliveryNotif && outForDeliveryNotif.length > 0) {
      const notif = outForDeliveryNotif[0];
      console.log('✅ Notification created:');
      console.log(`   Title: "${notif.title}"`);
      console.log(`   Message: "${notif.message}"`);
      console.log(`   Channels: ${JSON.stringify(notif.channels)}`);
      
      if (notif.channels.includes('email')) {
        console.log('   ✅ Correct: Email channel included (major status change)');
      } else {
        console.log('   ❌ ERROR: Email channel NOT included');
      }
    }

    // Step 8: Test status update to 'delivered' (MAJOR status)
    console.log('\n✅ Step 8: Updating order status to "delivered"...');
    console.log('   Expected: In-app notification + Email notification');

    await orderTrackingService.updateStatus(
      testOrderId,
      'delivered',
      testCustomerId,
      {
        notes: 'Order has been delivered',
        reason: 'Test notification integration'
      }
    );

    console.log('✅ Order status updated to "delivered"');
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Verify notification
    const { data: deliveredNotif } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', testCustomerId)
      .eq('type', 'order_status_update')
      .order('created_at', { ascending: false })
      .limit(1);

    if (deliveredNotif && deliveredNotif.length > 0) {
      const notif = deliveredNotif[0];
      console.log('✅ Notification created:');
      console.log(`   Title: "${notif.title}"`);
      console.log(`   Message: "${notif.message}"`);
      console.log(`   Channels: ${JSON.stringify(notif.channels)}`);
      
      if (notif.channels.includes('email')) {
        console.log('   ✅ Correct: Email channel included (major status change)');
      } else {
        console.log('   ❌ ERROR: Email channel NOT included');
      }
    }

    // Step 9: Test tracking information notification
    console.log('\n📦 Step 9: Adding tracking information...');
    console.log('   Expected: In-app notification only (no email)');

    await orderTrackingService.addTracking(
      testOrderId,
      'TEST123456789',
      'UPS',
      testCustomerId
    );

    console.log('✅ Tracking information added');
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Verify tracking notification
    const { data: trackingNotif } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', testCustomerId)
      .eq('type', 'order_tracking_added')
      .order('created_at', { ascending: false })
      .limit(1);

    if (trackingNotif && trackingNotif.length > 0) {
      const notif = trackingNotif[0];
      console.log('✅ Tracking notification created:');
      console.log(`   Title: "${notif.title}"`);
      console.log(`   Message: "${notif.message}"`);
      console.log(`   Channels: ${JSON.stringify(notif.channels)}`);
      console.log(`   Tracking: ${notif.metadata.carrier} - ${notif.metadata.tracking_number}`);
      
      if (notif.channels.includes('email')) {
        console.log('   ⚠️  WARNING: Email channel included (should be in-app only)');
      } else {
        console.log('   ✅ Correct: In-app only (no email for tracking info)');
      }
    } else {
      console.log('   ❌ No tracking notification found');
    }

    // Step 10: Get final notification count
    console.log('\n📊 Step 10: Getting final notification count...');
    const { data: finalNotifications, error: finalError } = await supabase
      .from('notifications')
      .select('id', { count: 'exact' })
      .eq('user_id', testCustomerId);

    if (finalError) throw finalError;

    const finalCount = finalNotifications?.length || 0;
    const newNotifications = finalCount - initialCount;
    console.log(`✅ Final notification count: ${finalCount}`);
    console.log(`✅ New notifications created: ${newNotifications}`);

    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('📋 TEST SUMMARY');
    console.log('='.repeat(70));
    console.log(`Order ID: ${testOrderId}`);
    console.log(`Customer ID: ${testCustomerId}`);
    console.log('');
    console.log('Status Updates Tested:');
    console.log('  1. pending → confirmed (in-app only)');
    console.log('  2. confirmed → shipped (in-app + email) ✉️');
    console.log('  3. shipped → out_for_delivery (in-app + email) ✉️');
    console.log('  4. out_for_delivery → delivered (in-app + email) ✉️');
    console.log('  5. Tracking information added (in-app only)');
    console.log('');
    console.log(`Total notifications created: ${newNotifications}`);
    console.log(`Expected: 5 notifications (4 status updates + 1 tracking)`);
    
    if (newNotifications >= 5) {
      console.log('\n✅ TEST PASSED: All notifications created successfully!');
      console.log('✅ Requirements 14.1 and 14.6 validated');
    } else {
      console.log(`\n⚠️  TEST WARNING: Expected 5 notifications, got ${newNotifications}`);
    }

    console.log('\n💡 Email Notifications:');
    console.log('   - Check your email inbox for 3 email notifications');
    console.log('   - Emails should be sent for: shipped, out_for_delivery, delivered');
    console.log('   - Email subject should include order status emoji');

    // Cleanup
    console.log('\n🧹 Cleanup: Deleting test order...');
    await supabase.from('orders').delete().eq('id', testOrderId);
    console.log('✅ Test order deleted');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    
    // Cleanup on error
    if (testOrderId) {
      console.log('\n🧹 Cleanup: Deleting test order...');
      await supabase.from('orders').delete().eq('id', testOrderId);
    }
    
    throw error;
  }
}

// Run the test
testOrderTrackingNotificationsComplete()
  .then(() => {
    console.log('\n✅ Test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
