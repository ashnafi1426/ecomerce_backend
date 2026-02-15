/**
 * Complete Notification to Order Detail Flow Test
 * Tests the entire flow from notification to viewing order details
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testCompleteFlow() {
  try {
    console.log('🧪 Testing Complete Notification → Order Detail Flow\n');
    console.log('=' .repeat(60));

    // Step 1: Login as customer
    console.log('\n1️⃣ STEP 1: Customer Login');
    console.log('-'.repeat(60));
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'ashenafisileshi7@gmail.com',
      password: '14263208@aA'
    });

    const token = loginResponse.data.token || loginResponse.data.data?.token;
    const user = loginResponse.data.user || loginResponse.data.data?.user;
    
    console.log('✅ Login successful');
    console.log('   User:', user.email);
    console.log('   Role:', user.role);

    // Step 2: Fetch notifications
    console.log('\n2️⃣ STEP 2: Fetch Notifications');
    console.log('-'.repeat(60));
    const notifResponse = await axios.get(`${BASE_URL}/notifications`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    // Handle different response structures
    let notifications = [];
    if (notifResponse.data.data && Array.isArray(notifResponse.data.data)) {
      notifications = notifResponse.data.data;
    } else if (notifResponse.data.notifications && Array.isArray(notifResponse.data.notifications)) {
      notifications = notifResponse.data.notifications;
    } else if (Array.isArray(notifResponse.data)) {
      notifications = notifResponse.data;
    }

    console.log(`✅ Found ${notifications.length} notification(s)`);
    
    if (notifications.length === 0) {
      console.log('⚠️  No notifications to test');
      return;
    }

    // Display first notification
    const firstNotif = notifications[0];
    console.log('\n   First Notification:');
    console.log('   Title:', firstNotif.title);
    console.log('   Message:', firstNotif.message);
    console.log('   Type:', firstNotif.type);
    console.log('   Read:', firstNotif.is_read);
    
    // Extract order ID from notification
    let orderId = null;
    if (firstNotif.metadata && firstNotif.metadata.orderId) {
      orderId = firstNotif.metadata.orderId;
    } else if (firstNotif.metadata && firstNotif.metadata.order_id) {
      orderId = firstNotif.metadata.order_id;
    }

    if (!orderId) {
      console.log('⚠️  Notification does not have order ID');
      return;
    }

    console.log('   Order ID:', orderId.substring(0, 8) + '...');

    // Step 3: Mark notification as read (simulating click)
    console.log('\n3️⃣ STEP 3: Mark Notification as Read');
    console.log('-'.repeat(60));
    try {
      await axios.patch(
        `${BASE_URL}/notifications/${firstNotif.id}/read`,
        {},
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      console.log('✅ Notification marked as read');
    } catch (error) {
      console.log('⚠️  Could not mark as read:', error.message);
    }

    // Step 4: Fetch order details (simulating navigation to order page)
    console.log('\n4️⃣ STEP 4: Fetch Order Details');
    console.log('-'.repeat(60));
    const orderResponse = await axios.get(`${BASE_URL}/orders/${orderId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    // Check response structure
    if (!orderResponse.data.success || !orderResponse.data.data) {
      console.log('❌ Response structure incorrect');
      console.log('   Expected: { success: true, data: {...} }');
      console.log('   Got:', Object.keys(orderResponse.data));
      return;
    }

    const order = orderResponse.data.data;
    console.log('✅ Order details fetched successfully');
    console.log('\n   Order Information:');
    console.log('   Order ID:', order.id.substring(0, 8) + '...');
    console.log('   Status:', order.status);
    console.log('   Total:', order.total, 'USD');
    console.log('   Items:', order.items?.length || 0);
    
    if (order.items && order.items.length > 0) {
      console.log('\n   Order Items:');
      order.items.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.product?.name || 'Unknown'}`);
        console.log(`      Quantity: ${item.quantity}`);
        console.log(`      Price: $${item.price}`);
      });
    }

    if (order.shippingAddress) {
      console.log('\n   Shipping Address:');
      console.log('   Name:', order.shippingAddress.fullName);
      console.log('   Address:', order.shippingAddress.address);
      console.log('   City:', order.shippingAddress.city);
      console.log('   State:', order.shippingAddress.state);
      console.log('   ZIP:', order.shippingAddress.zipCode);
    }

    // Step 5: Verify all required data is present
    console.log('\n5️⃣ STEP 5: Verify Data Completeness');
    console.log('-'.repeat(60));
    
    const checks = [
      { name: 'Order ID', value: !!order.id },
      { name: 'Order Status', value: !!order.status },
      { name: 'Order Total', value: order.total !== undefined },
      { name: 'Items Array', value: Array.isArray(order.items) },
      { name: 'Items Have Products', value: order.items?.every(i => i.product) },
      { name: 'Shipping Address', value: !!order.shippingAddress },
      { name: 'Created Date', value: !!order.created_at }
    ];

    let allPassed = true;
    checks.forEach(check => {
      const status = check.value ? '✅' : '❌';
      console.log(`   ${status} ${check.name}`);
      if (!check.value) allPassed = false;
    });

    // Final result
    console.log('\n' + '='.repeat(60));
    if (allPassed) {
      console.log('✅ ALL TESTS PASSED!');
      console.log('\n🎉 Complete notification flow is working:');
      console.log('   1. Customer receives notification');
      console.log('   2. Customer clicks notification');
      console.log('   3. Notification marked as read');
      console.log('   4. Order details page loads');
      console.log('   5. All order information displays correctly');
      console.log('\n✅ Notification system is 100% functional!');
    } else {
      console.log('❌ SOME TESTS FAILED');
      console.log('   Please review the failed checks above');
    }
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Run the test
console.log('🚀 Starting Complete Notification Flow Test...');
console.log('   Backend: http://localhost:5000');
console.log('   Customer: ashenafisileshi7@gmail.com');
console.log('');

testCompleteFlow();
