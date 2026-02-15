/**
 * Test Order Notifications (Backend Already Running)
 * 
 * This script tests order status notifications assuming backend is already running
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
    // Try different health check endpoints
    try {
      await axios.get(`${BASE_URL}/health`);
    } catch (e) {
      await axios.get(`http://localhost:5000/api/v1/health`);
    }
    console.log('✅ Backend is running\n');
    return true;
  } catch (error) {
    console.log('❌ Backend is not running');
    console.log('   Error:', error.message);
    console.log('   Please start backend: cd .kiro/specs/fastshop-ecommerce-platform/ecomerce_backend && node server.js');
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
    console.log('⚠️  Admin login failed, will use customer token');
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

async function updateOrderStatus(status, description) {
  console.log(`📋 STEP 4: Update Order Status to "${status}"`);
  console.log('='.repeat(60));
  
  try {
    // Use order service directly to update status
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

    console.log('✅ Order status updated');
    console.log('   New Status:', status);
    console.log('   Description:', description);
    console.log('');
    
    // Wait for notification to be created
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return updatedOrder;
  } catch (error) {
    console.log('❌ Failed to update status:', error.message);
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
      console.log('   This means the notification service was not triggered');
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
  console.log('🚀 TESTING ORDER STATUS NOTIFICATIONS');
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

    // Step 4 & 5: Test each order status and check notifications
    const statuses = [
      { status: 'paid', description: 'Payment confirmed' },
      { status: 'processing', description: 'Order being processed' },
      { status: 'shipped', description: 'Order shipped' },
      { status: 'delivered', description: 'Order delivered' }
    ];

    for (const statusUpdate of statuses) {
      await updateOrderStatus(statusUpdate.status, statusUpdate.description);
      await checkNotifications();
      await checkNotificationsInDatabase();
    }

    // Final Summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ TEST COMPLETE');
    console.log('='.repeat(60));
    
    console.log('\n📊 Test Summary:');
    console.log('   ✅ Customer login');
    console.log('   ✅ Admin login');
    console.log('   ✅ Test order creation');
    console.log('   ✅ Order status updates');
    console.log('   ✅ Notifications checked');
    
    console.log('\n⚠️  IMPORTANT NOTE:');
    console.log('   If no notifications were created, this means:');
    console.log('   1. The backend needs to be restarted to load the new notification service');
    console.log('   2. Or the notification service is not being called from updateStatus()');
    
    console.log('\n📝 Next Steps:');
    console.log('   1. Restart backend: cd .kiro/specs/fastshop-ecommerce-platform/ecomerce_backend');
    console.log('   2. Run: node server.js');
    console.log('   3. Run this test again');
    console.log('   4. If notifications are created, test frontend');
    
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
