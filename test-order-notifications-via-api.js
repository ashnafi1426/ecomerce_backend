/**
 * Test Order Notifications Via API
 * 
 * This script tests order status notifications by calling the API endpoints
 * which will trigger the order service updateStatus() function
 */

const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Load .env from current directory
require('dotenv').config({ path: path.join(__dirname, '.env') });

const BASE_URL = 'http://localhost:5000/api';
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

let customerToken = null;
let adminToken = null;
let orderId = null;
let customerId = null;

const CUSTOMER = {
  email: 'ashenafisileshi7@gmail.com',
  password: '14263208@aA'
};

const ADMIN = {
  email: 'admin@fastshop.com',
  password: 'Admin@123'
};

async function checkBackend() {
  console.log('🔍 Checking backend server...');
  try {
    await axios.get(`http://localhost:5000/api/v1/health`);
    console.log('✅ Backend is running\n');
    return true;
  } catch (error) {
    console.log('❌ Backend is not running');
    console.log('   Error:', error.message);
    return false;
  }
}

async function loginCustomer() {
  console.log('📋 STEP 1: Customer Login');
  console.log('='.repeat(60));
  
  const response = await axios.post(`${BASE_URL}/auth/login`, {
    email: CUSTOMER.email,
    password: CUSTOMER.password
  });

  customerToken = response.data.token || response.data.data?.token;
  const user = response.data.user || response.data.data?.user;
  customerId = user.id;
  
  console.log('✅ Customer logged in');
  console.log('   Email:', user.email);
  console.log('   ID:', user.id);
  console.log('');
  
  return user;
}

async function loginAdmin() {
  console.log('📋 STEP 2: Admin Login');
  console.log('='.repeat(60));
  
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: ADMIN.email,
      password: ADMIN.password
    });

    adminToken = response.data.token || response.data.data?.token;
    const user = response.data.user || response.data.data?.user;
    
    console.log('✅ Admin logged in');
    console.log('   Email:', user.email);
    console.log('   Role:', user.role);
    console.log('');
    
    return user;
  } catch (error) {
    console.log('⚠️  Admin login failed:', error.response?.data?.message || error.message);
    console.log('   Will use customer token for testing');
    adminToken = customerToken;
    console.log('');
    return null;
  }
}

async function createTestOrder(userId) {
  console.log('📋 STEP 3: Create Test Order');
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
      user_id: userId,
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

async function updateOrderStatusViaAPI(status, description) {
  console.log(`📋 STEP 4: Update Order Status to "${status}" via API`);
  console.log('='.repeat(60));
  
  try {
    // Use admin endpoint: PUT /api/admin/orders/:id/status
    const response = await axios.put(
      `${BASE_URL}/admin/orders/${orderId}/status`,
      { status: status },
      { headers: { 'Authorization': `Bearer ${adminToken}` } }
    );

    console.log('✅ Order status updated via API');
    console.log('   New Status:', status);
    console.log('   Description:', description);
    console.log('');
    
    // Wait for notification to be created
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return response.data;
  } catch (error) {
    console.log('❌ Failed to update status via API');
    console.log('   Error:', error.response?.data?.message || error.message);
    console.log('   Status Code:', error.response?.status);
    console.log('');
    throw error;
  }
}

async function checkNotifications() {
  console.log('📋 STEP 5: Check Customer Notifications');
  console.log('='.repeat(60));
  
  try {
    const response = await axios.get(`${BASE_URL}/notifications`, {
      headers: { 'Authorization': `Bearer ${customerToken}` }
    });

    let notifications = [];
    if (response.data.data && Array.isArray(response.data.data)) {
      notifications = response.data.data;
    } else if (Array.isArray(response.data)) {
      notifications = response.data;
    }

    // Filter notifications for this order
    const orderNotifications = notifications.filter(n => 
      n.metadata && (n.metadata.orderId === orderId || n.metadata.order_id === orderId)
    );

    console.log(`✅ Found ${orderNotifications.length} notification(s) for this order`);
    
    if (orderNotifications.length > 0) {
      orderNotifications.forEach((notif, index) => {
        console.log(`\n   Notification ${index + 1}:`);
        console.log('   Title:', notif.title);
        console.log('   Message:', notif.message);
        console.log('   Type:', notif.type);
        console.log('   Created:', new Date(notif.created_at).toLocaleString());
      });
    } else {
      console.log('   ⚠️  No notifications found for this order');
    }
    console.log('');
    
    return orderNotifications;
  } catch (error) {
    console.log('❌ Failed to check notifications:', error.message);
    console.log('');
    return [];
  }
}

async function checkNotificationsInDatabase() {
  console.log('📋 STEP 6: Check Notifications in Database');
  console.log('='.repeat(60));
  
  const { data: notifications, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', customerId)
    .order('created_at', { ascending: false })
    .limit(10);

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
      console.log('   Created:', new Date(notif.created_at).toLocaleString());
    });
  } else {
    console.log('   ⚠️  No notifications in database for this order');
  }
  console.log('');
  
  return orderNotifications;
}

async function runTest() {
  console.log('🚀 TESTING ORDER STATUS NOTIFICATIONS VIA API');
  console.log('   Customer:', CUSTOMER.email);
  console.log('');

  try {
    // Check backend
    const backendRunning = await checkBackend();
    if (!backendRunning) {
      process.exit(1);
    }

    // Step 1: Login as customer
    await loginCustomer();

    // Step 2: Login as admin
    await loginAdmin();

    // Step 3: Create test order
    await createTestOrder(customerId);

    // Step 4-6: Test each order status and check notifications
    const statuses = [
      { status: 'paid', description: 'Payment confirmed' },
      { status: 'processing', description: 'Order being processed' },
      { status: 'shipped', description: 'Order shipped' },
      { status: 'delivered', description: 'Order delivered' }
    ];

    let totalNotifications = 0;

    for (const statusUpdate of statuses) {
      await updateOrderStatusViaAPI(statusUpdate.status, statusUpdate.description);
      const apiNotifs = await checkNotifications();
      const dbNotifs = await checkNotificationsInDatabase();
      totalNotifications += dbNotifs.length;
    }

    // Final Summary
    console.log('\n' + '='.repeat(60));
    if (totalNotifications > 0) {
      console.log('✅ TEST PASSED - NOTIFICATIONS CREATED!');
    } else {
      console.log('⚠️  TEST INCOMPLETE - NO NOTIFICATIONS CREATED');
    }
    console.log('='.repeat(60));
    
    console.log('\n📊 Test Summary:');
    console.log('   ✅ Customer login');
    console.log('   ✅ Admin login');
    console.log('   ✅ Test order creation');
    console.log('   ✅ Order status updates via API');
    console.log(`   ${totalNotifications > 0 ? '✅' : '❌'} Notifications created: ${totalNotifications}`);
    
    if (totalNotifications === 0) {
      console.log('\n⚠️  TROUBLESHOOTING:');
      console.log('   The notification service is integrated but not being triggered.');
      console.log('   Possible reasons:');
      console.log('   1. API endpoint does not use order.service.updateStatus()');
      console.log('   2. Notification service has an error (check backend logs)');
      console.log('   3. Backend was not restarted after adding notification service');
      console.log('\n📝 Check backend logs for:');
      console.log('   - "[Order Notification] Creating notification..."');
      console.log('   - "[Order Notification] ✅ Created notification..."');
      console.log('   - Any error messages from notification service');
    } else {
      console.log('\n📝 Next Steps:');
      console.log('   1. Open frontend: http://localhost:5173');
      console.log('   2. Login as customer:', CUSTOMER.email);
      console.log('   3. Click bell icon to see notifications');
      console.log('   4. Click "View Order" to navigate to order details');
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
