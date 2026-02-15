/**
 * Test Notification Navigation Fix
 * 
 * This script tests that notifications have the correct action_url
 * for frontend navigation
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Load .env from current directory
require('dotenv').config({ path: path.join(__dirname, '.env') });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Import order service
const orderService = require('./services/orderServices/order.service');

const CUSTOMER = {
  email: 'ashenafisileshi7@gmail.com',
  password: '14263208@aA'
};

async function getCustomerId() {
  console.log('📋 STEP 1: Get Customer ID');
  console.log('='.repeat(60));
  
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('email', CUSTOMER.email)
    .single();
  
  if (!user) {
    throw new Error('Customer not found');
  }
  
  console.log('✅ Customer found');
  console.log('   Email:', user.email);
  console.log('   ID:', user.id);
  console.log('');
  
  return user;
}

async function getExistingOrder(userId) {
  console.log('📋 STEP 2: Get Existing Order');
  console.log('='.repeat(60));
  
  // Get an existing order for this user
  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'pending_payment')
    .limit(1);

  if (!orders || orders.length === 0) {
    // Create a simple order
    const { data: products } = await supabase
      .from('products')
      .select('*')
      .eq('status', 'active')
      .limit(1);

    const product = products[0];
    
    const { data: order } = await supabase
      .from('orders')
      .insert({
        user_id: userId,
        payment_intent_id: `pi_test_${Date.now()}`,
        amount: Math.round(product.price * 100),
        basket: [{
          product_id: product.id,
          title: product.title,
          price: product.price,
          quantity: 1,
          image_url: product.image_url,
          seller_id: product.seller_id
        }],
        shipping_address: {
          fullName: 'Test Customer',
          address: '123 Test Street',
          city: 'Test City',
          state: 'NY',
          zipCode: '10001',
          country: 'US',
          phone: '(123) 456-7890',
          email: CUSTOMER.email
        },
        status: 'pending_payment'
      })
      .select()
      .single();
    
    console.log('✅ Created new test order');
    console.log('   Order ID:', order.id.substring(0, 8) + '...');
    console.log('');
    
    return order;
  }
  
  console.log('✅ Found existing order');
  console.log('   Order ID:', orders[0].id.substring(0, 8) + '...');
  console.log('   Status:', orders[0].status);
  console.log('');
  
  return orders[0];
}

async function updateOrderStatusDirectly(orderId, status, description) {
  console.log(`📋 STEP 3: Update Order Status to "${status}"`);
  console.log('='.repeat(60));
  
  try {
    // Update status directly in database (skip inventory checks)
    const { data: updatedOrder, error } = await supabase
      .from('orders')
      .update({ 
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Manually trigger notification service
    const orderNotificationService = require('./services/notificationServices/order-notification.service');
    await orderNotificationService.notifyOrderStatusChange(updatedOrder, 'pending_payment', status);

    console.log('✅ Order status updated and notification created');
    console.log('   New Status:', status);
    console.log('   Description:', description);
    console.log('');
    
    // Wait for notification to be created
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return updatedOrder;
  } catch (error) {
    console.log('❌ Failed to update status:', error.message);
    console.log('');
    throw error;
  }
}

async function checkNotificationActionUrl(orderId, customerId) {
  console.log('📋 STEP 4: Check Notification Action URL');
  console.log('='.repeat(60));
  
  const { data: notifications, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', customerId)
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.log('❌ Failed to query database:', error.message);
    console.log('');
    return [];
  }

  const orderNotifications = notifications.filter(n => 
    n.metadata && (n.metadata.orderId === orderId || n.metadata.order_id === orderId)
  );

  console.log(`✅ Found ${orderNotifications.length} notification(s) for this order`);
  
  if (orderNotifications.length > 0) {
    const latestNotif = orderNotifications[0];
    console.log(`\n   Latest Notification:`);
    console.log('   Title:', latestNotif.title);
    console.log('   Message:', latestNotif.message);
    console.log('   Type:', latestNotif.type);
    console.log('   Action URL:', latestNotif.action_url);
    console.log('   Action Text:', latestNotif.action_text);
    console.log('');
    
    // Check if action_url is correct
    const expectedUrl = `/customer/orders/${orderId}`;
    if (latestNotif.action_url === expectedUrl) {
      console.log('   ✅ Action URL is CORRECT!');
      console.log(`   Expected: ${expectedUrl}`);
      console.log(`   Actual:   ${latestNotif.action_url}`);
    } else {
      console.log('   ❌ Action URL is INCORRECT!');
      console.log(`   Expected: ${expectedUrl}`);
      console.log(`   Actual:   ${latestNotif.action_url}`);
    }
  } else {
    console.log('   ⚠️  No notifications found for this order');
  }
  console.log('');
  
  return orderNotifications;
}

async function runTest() {
  console.log('🚀 TESTING NOTIFICATION NAVIGATION FIX');
  console.log('   Customer:', CUSTOMER.email);
  console.log('');

  try {
    // Step 1: Get customer ID
    const customer = await getCustomerId();

    // Step 2: Get existing order
    const order = await getExistingOrder(customer.id);

    // Step 3: Update order status
    await updateOrderStatusDirectly(order.id, 'paid', 'Payment confirmed');

    // Step 4: Check notification action URL
    const notifications = await checkNotificationActionUrl(order.id, customer.id);

    // Final Summary
    console.log('\n' + '='.repeat(60));
    if (notifications.length > 0 && notifications[0].action_url === `/customer/orders/${order.id}`) {
      console.log('✅ TEST PASSED - NAVIGATION FIX WORKING!');
    } else {
      console.log('❌ TEST FAILED - NAVIGATION FIX NOT WORKING');
    }
    console.log('='.repeat(60));
    
    console.log('\n📊 Test Summary:');
    console.log('   ✅ Customer ID retrieved');
    console.log('   ✅ Order found/created');
    console.log('   ✅ Order status updated');
    console.log(`   ${notifications.length > 0 ? '✅' : '❌'} Notification created`);
    console.log(`   ${notifications.length > 0 && notifications[0].action_url === `/customer/orders/${order.id}` ? '✅' : '❌'} Action URL correct`);
    
    if (notifications.length > 0 && notifications[0].action_url === `/customer/orders/${order.id}`) {
      console.log('\n🎉 SUCCESS! Notification navigation is fixed!');
      console.log('\n📝 Next Steps:');
      console.log('   1. Open frontend: http://localhost:5173');
      console.log('   2. Login as customer:', CUSTOMER.email);
      console.log('   3. Click bell icon to see notifications');
      console.log('   4. Click "View Order" button');
      console.log('   5. Should navigate to order detail page');
    } else {
      console.log('\n❌ FAILURE! Notification navigation is not fixed.');
    }
    
    console.log('\n✅ Order ID for testing:', order.id);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
    process.exit(1);
  }
}

// Run the test
runTest();
