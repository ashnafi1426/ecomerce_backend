/**
 * Test Notification Service Directly
 * 
 * This script tests the notification service by calling order.service.updateStatus() directly
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

let orderId = null;
let customerId = null;

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
  
  customerId = user.id;
  
  console.log('✅ Customer found');
  console.log('   Email:', user.email);
  console.log('   ID:', user.id);
  console.log('');
  
  return user;
}

async function createTestOrder() {
  console.log('📋 STEP 2: Create Test Order');
  console.log('='.repeat(60));
  
  // Get an active product
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('status', 'active')
    .limit(1);

  if (!products || products.length === 0) {
    throw new Error('No active products found');
  }

  const product = products[0];
  
  // Create order directly in database
  const { data: order, error } = await supabase
    .from('orders')
    .insert({
      user_id: customerId,
      payment_intent_id: `pi_test_${Date.now()}`,
      amount: Math.round(product.price * 2 * 100),
      basket: [{
        product_id: product.id,
        title: product.title,
        price: product.price,
        quantity: 2,
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

  if (error) {
    throw new Error(`Failed to create order: ${error.message}`);
  }

  orderId = order.id;
  
  console.log('✅ Test order created');
  console.log('   Order ID:', orderId.substring(0, 8) + '...');
  console.log('   Product:', product.title);
  console.log('   Amount: $' + (order.amount / 100));
  console.log('   Status:', order.status);
  console.log('');
  
  return order;
}

async function updateOrderStatusDirectly(status, description) {
  console.log(`📋 STEP 3: Update Order Status to "${status}" via Order Service`);
  console.log('='.repeat(60));
  
  try {
    // Call order service directly
    const updatedOrder = await orderService.updateStatus(orderId, status);

    console.log('✅ Order status updated via order service');
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

async function checkNotificationsInDatabase() {
  console.log('📋 STEP 4: Check Notifications in Database');
  console.log('='.repeat(60));
  
  const { data: notifications, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', customerId)
    .order('created_at', { ascending: false})
    .limit(20);

  if (error) {
    console.log('❌ Failed to query database:', error.message);
    console.log('');
    return [];
  }

  const orderNotifications = notifications.filter(n => 
    n.metadata && (n.metadata.orderId === orderId || n.metadata.order_id === orderId)
  );

  console.log(`✅ Found ${orderNotifications.length} notification(s) in database for this order`);
  
  if (orderNotifications.length > 0) {
    orderNotifications.forEach((notif, index) => {
      console.log(`\n   Notification ${index + 1}:`);
      console.log('   Title:', notif.title);
      console.log('   Message:', notif.message);
      console.log('   Type:', notif.type);
      console.log('   Priority:', notif.priority);
      console.log('   Action URL:', notif.action_url);
      console.log('   Created:', new Date(notif.created_at).toLocaleString());
    });
  } else {
    console.log('   ⚠️  No notifications in database for this order');
  }
  console.log('');
  
  return orderNotifications;
}

async function runTest() {
  console.log('🚀 TESTING NOTIFICATION SERVICE DIRECTLY');
  console.log('   Customer:', CUSTOMER.email);
  console.log('');

  try {
    // Step 1: Get customer ID
    await getCustomerId();

    // Step 2: Create test order
    await createTestOrder();

    // Step 3-4: Test each order status and check notifications
    const statuses = [
      { status: 'paid', description: 'Payment confirmed' },
      { status: 'processing', description: 'Order being processed' },
      { status: 'shipped', description: 'Order shipped' },
      { status: 'delivered', description: 'Order delivered' }
    ];

    let totalNotifications = 0;

    for (const statusUpdate of statuses) {
      await updateOrderStatusDirectly(statusUpdate.status, statusUpdate.description);
      const dbNotifs = await checkNotificationsInDatabase();
      totalNotifications = dbNotifs.length; // Total count
    }

    // Final Summary
    console.log('\n' + '='.repeat(60));
    if (totalNotifications > 0) {
      console.log('✅ TEST PASSED - NOTIFICATIONS CREATED!');
    } else {
      console.log('❌ TEST FAILED - NO NOTIFICATIONS CREATED');
    }
    console.log('='.repeat(60));
    
    console.log('\n📊 Test Summary:');
    console.log('   ✅ Customer ID retrieved');
    console.log('   ✅ Test order created');
    console.log('   ✅ Order status updates via order service');
    console.log(`   ${totalNotifications > 0 ? '✅' : '❌'} Notifications created: ${totalNotifications}`);
    
    if (totalNotifications > 0) {
      console.log('\n🎉 SUCCESS! The notification service is working!');
      console.log('\n📝 Next Steps:');
      console.log('   1. Open frontend: http://localhost:5173');
      console.log('   2. Login as customer:', CUSTOMER.email);
      console.log('   3. Click bell icon to see notifications');
      console.log('   4. Click "View Order" to navigate to order details');
    } else {
      console.log('\n❌ FAILURE! The notification service is not working.');
      console.log('\n📝 Troubleshooting:');
      console.log('   1. Check backend logs for notification service errors');
      console.log('   2. Verify order-notification.service.js is loaded');
      console.log('   3. Check if notification.service.createNotification() works');
    }
    
    console.log('\n✅ Order ID for testing:', orderId);
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
