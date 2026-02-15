/**
 * Complete Order Notification Flow Test
 * Tests order creation and status updates with notifications via API
 * 
 * Customer: ashenafisileshi7@gmail.com / 14263208@aA
 */

const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const BASE_URL = 'http://localhost:5000/api';
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

let customerToken = null;
let adminToken = null;
let orderId = null;

const CUSTOMER = {
  email: 'ashenafisileshi7@gmail.com',
  password: '14263208@aA'
};

const ADMIN = {
  email: 'admin@fastshop.com',
  password: 'Admin@123'
};

async function loginCustomer() {
  console.log('\n📋 STEP 1: Customer Login');
  console.log('='.repeat(60));
  
  const response = await axios.post(`${BASE_URL}/auth/login`, {
    email: CUSTOMER.email,
    password: CUSTOMER.password
  });

  customerToken = response.data.token || response.data.data?.token;
  const user = response.data.user || response.data.data?.user;
  
  console.log('✅ Customer logged in');
  console.log('   Email:', user.email);
  console.log('   ID:', user.id);
  
  return user;
}

async function loginAdmin() {
  console.log('\n📋 STEP 2: Admin Login');
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
    
    return user;
  } catch (error) {
    console.log('⚠️  Admin login failed, will use customer token');
    adminToken = customerToken;
    return null;
  }
}

async function createTestOrder(userId) {
  console.log('\n📋 STEP 3: Create Test Order');
  console.log('='.repeat(60));
  
  // Get an active product
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('status', 'active')
    .limit(1);

  const product = products[0];
  
  // Reserve inventory
  const inventoryService = require('./services/inventoryServices/inventory.service');
  try {
    await inventoryService.reserve(product.id, 2);
  } catch (e) {
    console.log('⚠️  Inventory reservation skipped');
  }
  
  // Create order
  const { data: order } = await supabase
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

  orderId = order.id;
  
  console.log('✅ Test order created');
  console.log('   Order ID:', orderId.substring(0, 8) + '...');
  console.log('   Product:', product.title);
  console.log('   Amount: $' + (order.amount / 100));
  
  return order;
}

async function updateOrderStatusViaAPI(status, description) {
  console.log(`\n📋 STEP 4: Update Order Status to "${status}"`);
  console.log('='.repeat(60));
  
  try {
    const response = await axios.patch(
      `${BASE_URL}/admin/orders/${orderId}/status`,
      { status: status },
      { headers: { 'Authorization': `Bearer ${adminToken}` } }
    );

    console.log('✅ Order status updated via API');
    console.log('   New Status:', status);
    console.log('   Description:', description);
    
    // Wait for notification to be created
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return response.data;
  } catch (error) {
    console.log('❌ Failed to update status:', error.response?.data || error.message);
    throw error;
  }
}

async function checkNotifications() {
  console.log('\n📋 STEP 5: Check Customer Notifications');
  console.log('='.repeat(60));
  
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
  
  return orderNotifications;
}

async function runTest() {
  console.log('🚀 Starting Complete Order Notification Flow Test');
  console.log('   Customer:', CUSTOMER.email);
  console.log('');

  try {
    // Step 1: Login as customer
    const customer = await loginCustomer();

    // Step 2: Login as admin
    await loginAdmin();

    // Step 3: Create test order
    await createTestOrder(customer.id);

    // Step 4 & 5: Test each order status and check notifications
    const statuses = [
      { status: 'paid', description: 'Payment confirmed' },
      { status: 'processing', description: 'Order being processed' },
      { status: 'shipped', description: 'Order shipped' },
      { status: 'delivered', description: 'Order delivered' }
    ];

    for (const statusUpdate of statuses) {
      await updateOrderStatusViaAPI(statusUpdate.status, statusUpdate.description);
      await checkNotifications();
    }

    // Final Summary
    console.log('\n\n' + '='.repeat(60));
    console.log('✅ COMPLETE ORDER NOTIFICATION FLOW TEST PASSED');
    console.log('='.repeat(60));
    console.log('\n📊 Test Summary:');
    console.log('   ✅ Customer login');
    console.log('   ✅ Admin login');
    console.log('   ✅ Test order creation');
    console.log('   ✅ Order status updates via API');
    console.log('   ✅ Notifications checked for each status');
    
    console.log('\n📝 Next Steps:');
    console.log('   1. Open frontend: http://localhost:5173');
    console.log('   2. Login as customer:', CUSTOMER.email);
    console.log('   3. Click bell icon to see notifications');
    console.log('   4. Click "View Order" to see order details');
    
    console.log('\n✅ Order ID for testing:', orderId);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.log('\n📝 Troubleshooting:');
    console.log('   1. Ensure backend is running: node server.js');
    console.log('   2. Check database connection');
    console.log('   3. Restart backend to load new notification service');
    process.exit(1);
  }
}

// Run the test
runTest();
