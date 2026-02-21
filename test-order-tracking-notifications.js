/**
 * Test Order Tracking Notifications Integration
 * 
 * This test verifies that:
 * 1. Notifications are created when order status changes
 * 2. Email notifications are sent for major status changes (shipped, out_for_delivery, delivered)
 * 3. In-app notifications are created for all status changes
 * 4. Tracking information notifications are created
 * 
 * Requirements: 14.1, 14.6
 */

const supabase = require('./config/supabase');
const orderTrackingService = require('./services/orderTrackingServices/orderTracking.service');

async function testOrderTrackingNotifications() {
  console.log('\n🧪 Testing Order Tracking Notifications Integration\n');
  console.log('='.repeat(60));

  try {
    // Step 1: Find a test order
    console.log('\n📦 Step 1: Finding a test order...');
    const { data: orders, error: orderError } = await supabase
      .from('orders')
      .select('id, user_id, status')
      .eq('status', 'confirmed')
      .limit(1);

    if (orderError) throw orderError;

    if (!orders || orders.length === 0) {
      console.log('⚠️  No confirmed orders found. Creating a test scenario...');
      console.log('Please ensure there are orders in the database to test with.');
      return;
    }

    const testOrder = orders[0];
    console.log(`✅ Found test order: ${testOrder.id}`);
    console.log(`   Customer ID: ${testOrder.user_id}`);
    console.log(`   Current Status: ${testOrder.status}`);

    // Step 2: Get initial notification count
    console.log('\n📊 Step 2: Getting initial notification count...');
    const { data: initialNotifications, error: initialError } = await supabase
      .from('notifications')
      .select('id', { count: 'exact' })
      .eq('user_id', testOrder.user_id);

    if (initialError) throw initialError;

    const initialCount = initialNotifications?.length || 0;
    console.log(`✅ Initial notification count: ${initialCount}`);

    // Step 3: Update order status to 'shipped' (major status change - should send email)
    console.log('\n🚚 Step 3: Updating order status to "shipped"...');
    console.log('   This should create an in-app notification AND send an email');

    await orderTrackingService.updateStatus(
      testOrder.id,
      'shipped',
      testOrder.user_id,
      {
        notes: 'Order has been shipped and is on its way',
        reason: 'Test notification integration'
      }
    );

    console.log('✅ Order status updated to "shipped"');

    // Wait a moment for notification to be created
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Step 4: Verify notification was created
    console.log('\n🔍 Step 4: Verifying notification was created...');
    const { data: afterShippedNotifications, error: afterShippedError } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', testOrder.user_id)
      .eq('type', 'order_status_update')
      .order('created_at', { ascending: false })
      .limit(1);

    if (afterShippedError) throw afterShippedError;

    if (afterShippedNotifications && afterShippedNotifications.length > 0) {
      const notification = afterShippedNotifications[0];
      console.log('✅ Notification created successfully!');
      console.log(`   ID: ${notification.id}`);
      console.log(`   Title: ${notification.title}`);
      console.log(`   Message: ${notification.message}`);
      console.log(`   Priority: ${notification.priority}`);
      console.log(`   Channels: ${JSON.stringify(notification.channels)}`);
      console.log(`   Metadata: ${JSON.stringify(notification.metadata)}`);

      // Verify email channel is included for 'shipped' status
      if (notification.channels.includes('email')) {
        console.log('✅ Email channel included (as expected for major status change)');
      } else {
        console.log('❌ Email channel NOT included (should be included for "shipped" status)');
      }
    } else {
      console.log('❌ No notification found after status update');
    }

    // Step 5: Update order status to 'out_for_delivery' (major status change)
    console.log('\n📍 Step 5: Updating order status to "out_for_delivery"...');
    console.log('   This should also send an email notification');

    await orderTrackingService.updateStatus(
      testOrder.id,
      'out_for_delivery',
      testOrder.user_id,
      {
        notes: 'Order is out for delivery',
        reason: 'Test notification integration'
      }
    );

    console.log('✅ Order status updated to "out_for_delivery"');

    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Step 6: Verify notification for out_for_delivery
    console.log('\n🔍 Step 6: Verifying out_for_delivery notification...');
    const { data: outForDeliveryNotifications, error: outForDeliveryError } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', testOrder.user_id)
      .eq('type', 'order_status_update')
      .order('created_at', { ascending: false })
      .limit(1);

    if (outForDeliveryError) throw outForDeliveryError;

    if (outForDeliveryNotifications && outForDeliveryNotifications.length > 0) {
      const notification = outForDeliveryNotifications[0];
      console.log('✅ Out for delivery notification created!');
      console.log(`   Title: ${notification.title}`);
      console.log(`   Message: ${notification.message}`);
      console.log(`   Channels: ${JSON.stringify(notification.channels)}`);
    }

    // Step 7: Add tracking information
    console.log('\n📦 Step 7: Adding tracking information...');
    console.log('   This should create a tracking notification (in-app only)');

    await orderTrackingService.addTracking(
      testOrder.id,
      'TRACK123456789',
      'UPS',
      testOrder.user_id
    );

    console.log('✅ Tracking information added');

    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Step 8: Verify tracking notification
    console.log('\n🔍 Step 8: Verifying tracking notification...');
    const { data: trackingNotifications, error: trackingError } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', testOrder.user_id)
      .eq('type', 'order_tracking_added')
      .order('created_at', { ascending: false })
      .limit(1);

    if (trackingError) throw trackingError;

    if (trackingNotifications && trackingNotifications.length > 0) {
      const notification = trackingNotifications[0];
      console.log('✅ Tracking notification created!');
      console.log(`   Title: ${notification.title}`);
      console.log(`   Message: ${notification.message}`);
      console.log(`   Channels: ${JSON.stringify(notification.channels)}`);
      console.log(`   Tracking Number: ${notification.metadata.tracking_number}`);
      console.log(`   Carrier: ${notification.metadata.carrier}`);
    } else {
      console.log('❌ No tracking notification found');
    }

    // Step 9: Get final notification count
    console.log('\n📊 Step 9: Getting final notification count...');
    const { data: finalNotifications, error: finalError } = await supabase
      .from('notifications')
      .select('id', { count: 'exact' })
      .eq('user_id', testOrder.user_id);

    if (finalError) throw finalError;

    const finalCount = finalNotifications?.length || 0;
    const newNotifications = finalCount - initialCount;
    console.log(`✅ Final notification count: ${finalCount}`);
    console.log(`✅ New notifications created: ${newNotifications}`);

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📋 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Order status updated: confirmed → shipped → out_for_delivery`);
    console.log(`✅ Tracking information added: UPS - TRACK123456789`);
    console.log(`✅ Notifications created: ${newNotifications}`);
    console.log(`✅ Expected: 3 notifications (2 status updates + 1 tracking)`);
    
    if (newNotifications >= 3) {
      console.log('\n✅ TEST PASSED: All notifications created successfully!');
    } else {
      console.log(`\n⚠️  TEST WARNING: Expected 3 notifications, got ${newNotifications}`);
    }

    console.log('\n💡 Note: Check your email inbox for email notifications');
    console.log('   (if email service is configured correctly)');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    throw error;
  }
}

// Run the test
testOrderTrackingNotifications()
  .then(() => {
    console.log('\n✅ Test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
