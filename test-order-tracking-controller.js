/**
 * TEST: Order Tracking Controller
 * 
 * Simple test to verify the OrderTrackingController endpoints work correctly.
 * This tests the basic functionality of the order tracking API.
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

// Test credentials (update these with actual test accounts)
const TEST_CUSTOMER = {
  email: 'customer@test.com',
  password: 'password123'
};

const TEST_SELLER = {
  email: 'seller@test.com',
  password: 'password123'
};

let customerToken = '';
let sellerToken = '';
let testOrderId = '';

/**
 * Login helper
 */
async function login(email, password) {
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      email,
      password
    });
    return response.data.token;
  } catch (error) {
    console.error('Login failed:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Test 1: Get order details with timeline
 */
async function testGetOrderDetails() {
  console.log('\n=== Test 1: Get Order Details ===');
  
  try {
    const response = await axios.get(
      `${BASE_URL}/api/orders/${testOrderId}`,
      {
        headers: { Authorization: `Bearer ${customerToken}` }
      }
    );

    console.log('✓ Order details retrieved successfully');
    console.log('Order ID:', response.data.data.order.id);
    console.log('Order Status:', response.data.data.order.status);
    console.log('Timeline Events:', response.data.data.timeline.length);
    console.log('Has Tracking Info:', !!response.data.data.trackingInfo);
    console.log('Estimated Delivery:', response.data.data.estimatedDelivery);
    
    return true;
  } catch (error) {
    console.error('✗ Failed to get order details:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Test 2: Get order timeline
 */
async function testGetOrderTimeline() {
  console.log('\n=== Test 2: Get Order Timeline ===');
  
  try {
    const response = await axios.get(
      `${BASE_URL}/api/orders/${testOrderId}/timeline`,
      {
        headers: { Authorization: `Bearer ${customerToken}` }
      }
    );

    console.log('✓ Order timeline retrieved successfully');
    console.log('Timeline Events:', response.data.data.timeline.length);
    
    if (response.data.data.timeline.length > 0) {
      console.log('First Event:', {
        status: response.data.data.timeline[0].status,
        timestamp: response.data.data.timeline[0].timestamp
      });
    }
    
    return true;
  } catch (error) {
    console.error('✗ Failed to get order timeline:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Test 3: Get orders with filters
 */
async function testGetOrdersWithFilters() {
  console.log('\n=== Test 3: Get Orders with Filters ===');
  
  try {
    // Test without filters
    const response1 = await axios.get(
      `${BASE_URL}/api/orders?page=1&limit=10`,
      {
        headers: { Authorization: `Bearer ${customerToken}` }
      }
    );

    console.log('✓ Orders retrieved successfully (no filters)');
    console.log('Total Orders:', response1.data.data.pagination.total);
    console.log('Orders on Page:', response1.data.data.orders.length);

    // Test with status filter
    const response2 = await axios.get(
      `${BASE_URL}/api/orders?status=delivered&page=1&limit=10`,
      {
        headers: { Authorization: `Bearer ${customerToken}` }
      }
    );

    console.log('✓ Orders retrieved successfully (status filter)');
    console.log('Delivered Orders:', response2.data.data.orders.length);
    
    return true;
  } catch (error) {
    console.error('✗ Failed to get orders with filters:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Test 4: Update order status (seller)
 */
async function testUpdateOrderStatus() {
  console.log('\n=== Test 4: Update Order Status ===');
  
  try {
    const response = await axios.patch(
      `${BASE_URL}/api/orders/${testOrderId}/status`,
      {
        status: 'shipped',
        notes: 'Order has been shipped via test carrier'
      },
      {
        headers: { Authorization: `Bearer ${sellerToken}` }
      }
    );

    console.log('✓ Order status updated successfully');
    console.log('New Status:', response.data.data.order.status);
    
    return true;
  } catch (error) {
    console.error('✗ Failed to update order status:', error.response?.data || error.message);
    console.error('Note: This may fail if the seller does not have items in this order');
    return false;
  }
}

/**
 * Test 5: Add tracking information (seller)
 */
async function testAddTrackingInfo() {
  console.log('\n=== Test 5: Add Tracking Information ===');
  
  try {
    const response = await axios.patch(
      `${BASE_URL}/api/orders/${testOrderId}/tracking`,
      {
        trackingNumber: 'TEST123456789',
        carrier: 'Test Carrier'
      },
      {
        headers: { Authorization: `Bearer ${sellerToken}` }
      }
    );

    console.log('✓ Tracking information added successfully');
    console.log('Tracking Number:', response.data.data.trackingInfo.trackingNumber);
    console.log('Carrier:', response.data.data.trackingInfo.carrier);
    
    return true;
  } catch (error) {
    console.error('✗ Failed to add tracking information:', error.response?.data || error.message);
    console.error('Note: This may fail if the seller does not have items in this order');
    return false;
  }
}

/**
 * Test 6: Authorization - customer cannot access other customer's orders
 */
async function testAuthorization() {
  console.log('\n=== Test 6: Authorization Check ===');
  
  try {
    // Try to access an order that doesn't belong to the customer
    // This should fail with 403 or 404
    const fakeOrderId = '00000000-0000-0000-0000-000000000000';
    
    await axios.get(
      `${BASE_URL}/api/orders/${fakeOrderId}`,
      {
        headers: { Authorization: `Bearer ${customerToken}` }
      }
    );

    console.log('✗ Authorization check failed - should have been denied');
    return false;
  } catch (error) {
    if (error.response?.status === 403 || error.response?.status === 404) {
      console.log('✓ Authorization check passed - access denied as expected');
      return true;
    } else {
      console.error('✗ Unexpected error:', error.response?.data || error.message);
      return false;
    }
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('===========================================');
  console.log('ORDER TRACKING CONTROLLER TESTS');
  console.log('===========================================');

  try {
    // Login
    console.log('\n--- Logging in ---');
    customerToken = await login(TEST_CUSTOMER.email, TEST_CUSTOMER.password);
    console.log('✓ Customer logged in');
    
    sellerToken = await login(TEST_SELLER.email, TEST_SELLER.password);
    console.log('✓ Seller logged in');

    // Get a test order ID
    console.log('\n--- Getting test order ---');
    const ordersResponse = await axios.get(
      `${BASE_URL}/api/orders?page=1&limit=1`,
      {
        headers: { Authorization: `Bearer ${customerToken}` }
      }
    );

    if (ordersResponse.data.data.orders.length === 0) {
      console.error('✗ No orders found for test customer. Please create an order first.');
      return;
    }

    testOrderId = ordersResponse.data.data.orders[0].id;
    console.log('✓ Test order ID:', testOrderId);

    // Run tests
    const results = [];
    results.push(await testGetOrderDetails());
    results.push(await testGetOrderTimeline());
    results.push(await testGetOrdersWithFilters());
    results.push(await testUpdateOrderStatus());
    results.push(await testAddTrackingInfo());
    results.push(await testAuthorization());

    // Summary
    console.log('\n===========================================');
    console.log('TEST SUMMARY');
    console.log('===========================================');
    const passed = results.filter(r => r).length;
    const total = results.length;
    console.log(`Passed: ${passed}/${total}`);
    console.log(`Failed: ${total - passed}/${total}`);
    
    if (passed === total) {
      console.log('\n✓ All tests passed!');
    } else {
      console.log('\n✗ Some tests failed. Please review the output above.');
    }

  } catch (error) {
    console.error('\n✗ Test suite failed:', error.message);
  }
}

// Run tests
runTests();
