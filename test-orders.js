/**
 * ORDER MANAGEMENT TESTS
 * 
 * Comprehensive tests for order operations.
 * Tests all 5 requirements:
 * 1. Create orders from cart
 * 2. Order status lifecycle
 * 3. Customer order history
 * 4. Admin order control
 * 5. Generate invoices
 */

const supabase = require('./config/supabase');
const { hashPassword } = require('./utils/hash');

// Test configuration
const TEST_CONFIG = {
  customerEmail: 'customer-order@test.com',
  customerPassword: 'CustomerPass123',
  adminEmail: 'admin-order@test.com',
  adminPassword: 'AdminPass123'
};

let customerToken = null;
let adminToken = null;
let testProductId = null;
let testCategoryId = null;
let testOrderId = null;

// Helper function to make API requests
async function apiRequest(method, endpoint, data = null, token = null) {
  const baseURL = 'http://localhost:5004';
  const headers = {
    'Content-Type': 'application/json'
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = {
    method,
    headers
  };

  if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(`${baseURL}${endpoint}`, options);
    const responseData = await response.json();
    return {
      status: response.status,
      data: responseData
    };
  } catch (error) {
    console.error(`API Request Error: ${error.message}`);
    throw error;
  }
}

// Setup: Create test users and products
async function setupTestData() {
  console.log('\n=== SETUP: Create Test Data ===');

  try {
    // Hash passwords
    const customerPasswordHash = await hashPassword(TEST_CONFIG.customerPassword);
    const adminPasswordHash = await hashPassword(TEST_CONFIG.adminPassword);

    // Create users
    await supabase.from('users').insert([
      {
        email: TEST_CONFIG.customerEmail,
        password_hash: customerPasswordHash,
        role: 'customer',
        display_name: 'Test Customer Order',
        status: 'active'
      },
      {
        email: TEST_CONFIG.adminEmail,
        password_hash: adminPasswordHash,
        role: 'admin',
        display_name: 'Test Admin Order',
        status: 'active'
      }
    ]);

    console.log('✅ Test users created');

    // Get auth tokens
    const customerResponse = await apiRequest('POST', '/api/auth/login', {
      email: TEST_CONFIG.customerEmail,
      password: TEST_CONFIG.customerPassword
    });
    customerToken = customerResponse.data.token;

    const adminResponse = await apiRequest('POST', '/api/auth/login', {
      email: TEST_CONFIG.adminEmail,
      password: TEST_CONFIG.adminPassword
    });
    adminToken = adminResponse.data.token;

    console.log('✅ Auth tokens obtained');

    // Create test category
    const { data: categoryData } = await supabase
      .from('categories')
      .insert([{
        name: 'Test Order Category',
        description: 'Category for order testing'
      }])
      .select()
      .single();

    testCategoryId = categoryData?.id;

    // Create test product
    const { data: product } = await supabase
      .from('products')
      .insert([{
        title: 'Test Order Product',
        description: 'Product for order testing',
        price: 99.99,
        category_id: testCategoryId,
        status: 'active'
      }])
      .select()
      .single();

    testProductId = product?.id;

    // Create inventory
    await supabase.from('inventory').insert([{
      product_id: testProductId,
      quantity: 100,
      reserved_quantity: 0,
      low_stock_threshold: 10
    }]);

    console.log('✅ Test product and inventory created');
    console.log(`   Product ID: ${testProductId}`);

    return true;
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    return false;
  }
}

// ============================================
// REQUIREMENT 1: Create Orders from Cart
// ============================================

async function test1_CreateOrderFromCart() {
  console.log('\n=== TEST 1: Create Order from Cart ===');

  try {
    // Add item to cart
    await apiRequest(
      'POST',
      '/api/cart/items',
      { productId: testProductId, quantity: 2 },
      customerToken
    );

    console.log('✅ Item added to cart');

    // Create order from cart
    const response = await apiRequest(
      'POST',
      '/api/orders',
      {
        paymentIntentId: 'pi_test_123',
        shippingAddress: {
          line1: '123 Test St',
          city: 'Test City',
          state: 'TS',
          postal_code: '12345',
          country: 'US'
        }
      },
      customerToken
    );

    if (response.status === 201) {
      testOrderId = response.data.order.id;
      console.log('✅ Order created from cart successfully');
      console.log(`   Order ID: ${testOrderId}`);
      console.log(`   Status: ${response.data.order.status}`);
      console.log(`   Amount: $${response.data.order.amount / 100}`);
      return true;
    } else {
      console.log('❌ Failed to create order from cart');
      return false;
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

// ============================================
// REQUIREMENT 2: Order Status Lifecycle
// ============================================

async function test2_UpdateStatusToPaid() {
  console.log('\n=== TEST 2.1: Update Status to PAID ===');

  try {
    const response = await apiRequest(
      'PATCH',
      `/api/admin/orders/${testOrderId}/status`,
      { status: 'paid' },
      adminToken
    );

    if (response.status === 200 && response.data.order.status === 'paid') {
      console.log('✅ Order status updated to PAID');
      return true;
    } else {
      console.log('❌ Failed to update status to PAID');
      return false;
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

async function test2_UpdateStatusToConfirmed() {
  console.log('\n=== TEST 2.2: Update Status to CONFIRMED ===');

  try {
    const response = await apiRequest(
      'PATCH',
      `/api/admin/orders/${testOrderId}/status`,
      { status: 'confirmed' },
      adminToken
    );

    if (response.status === 200 && response.data.order.status === 'confirmed') {
      console.log('✅ Order status updated to CONFIRMED');
      return true;
    } else {
      console.log('❌ Failed to update status to CONFIRMED');
      return false;
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

async function test2_UpdateStatusToPacked() {
  console.log('\n=== TEST 2.3: Update Status to PACKED ===');

  try {
    const response = await apiRequest(
      'PATCH',
      `/api/admin/orders/${testOrderId}/status`,
      { status: 'packed' },
      adminToken
    );

    if (response.status === 200 && response.data.order.status === 'packed') {
      console.log('✅ Order status updated to PACKED');
      return true;
    } else {
      console.log('❌ Failed to update status to PACKED');
      return false;
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

async function test2_UpdateStatusToShipped() {
  console.log('\n=== TEST 2.4: Update Status to SHIPPED ===');

  try {
    const response = await apiRequest(
      'PATCH',
      `/api/admin/orders/${testOrderId}/status`,
      { status: 'shipped' },
      adminToken
    );

    if (response.status === 200 && response.data.order.status === 'shipped') {
      console.log('✅ Order status updated to SHIPPED');
      return true;
    } else {
      console.log('❌ Failed to update status to SHIPPED');
      return false;
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

async function test2_UpdateStatusToDelivered() {
  console.log('\n=== TEST 2.5: Update Status to DELIVERED ===');

  try {
    const response = await apiRequest(
      'PATCH',
      `/api/admin/orders/${testOrderId}/status`,
      { status: 'delivered' },
      adminToken
    );

    if (response.status === 200 && response.data.order.status === 'delivered') {
      console.log('✅ Order status updated to DELIVERED');
      return true;
    } else {
      console.log('❌ Failed to update status to DELIVERED');
      return false;
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

async function test2_InvalidStatusTransition() {
  console.log('\n=== TEST 2.6: Invalid Status Transition (Should Fail) ===');

  try {
    // Try to change delivered order back to pending
    const response = await apiRequest(
      'PATCH',
      `/api/admin/orders/${testOrderId}/status`,
      { status: 'pending_payment' },
      adminToken
    );

    if (response.status === 400) {
      console.log('✅ Correctly rejected invalid status transition');
      return true;
    } else {
      console.log('❌ Should have rejected invalid transition');
      return false;
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

// ============================================
// REQUIREMENT 3: Customer Order History
// ============================================

async function test3_GetCustomerOrders() {
  console.log('\n=== TEST 3: Get Customer Order History ===');

  try {
    const response = await apiRequest('GET', '/api/orders', null, customerToken);

    if (response.status === 200 && Array.isArray(response.data)) {
      console.log(`✅ Retrieved ${response.data.length} orders`);
      response.data.forEach((order, index) => {
        console.log(`   ${index + 1}. Order ${order.id.substring(0, 8)} - Status: ${order.status}`);
      });
      return true;
    } else {
      console.log('❌ Failed to retrieve order history');
      return false;
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

async function test3_GetOrderById() {
  console.log('\n=== TEST 3.2: Get Order by ID ===');

  try {
    const response = await apiRequest(
      'GET',
      `/api/orders/${testOrderId}`,
      null,
      customerToken
    );

    if (response.status === 200) {
      console.log('✅ Retrieved order details');
      console.log(`   Order ID: ${response.data.id.substring(0, 8)}`);
      console.log(`   Status: ${response.data.status}`);
      console.log(`   Amount: $${response.data.amount / 100}`);
      return true;
    } else {
      console.log('❌ Failed to retrieve order details');
      return false;
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

// ============================================
// REQUIREMENT 4: Admin Order Control
// ============================================

async function test4_AdminGetAllOrders() {
  console.log('\n=== TEST 4.1: Admin Get All Orders ===');

  try {
    const response = await apiRequest('GET', '/api/admin/orders', null, adminToken);

    if (response.status === 200 && Array.isArray(response.data)) {
      console.log(`✅ Admin retrieved ${response.data.length} orders`);
      return true;
    } else {
      console.log('❌ Failed to retrieve all orders');
      return false;
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

async function test4_AdminGetStatistics() {
  console.log('\n=== TEST 4.2: Admin Get Order Statistics ===');

  try {
    const response = await apiRequest(
      'GET',
      '/api/admin/orders/statistics',
      null,
      adminToken
    );

    if (response.status === 200) {
      console.log('✅ Retrieved order statistics');
      console.log(`   Total Orders: ${response.data.total_orders}`);
      console.log(`   Delivered: ${response.data.delivered}`);
      console.log(`   Total Revenue: $${response.data.total_revenue / 100}`);
      return true;
    } else {
      console.log('❌ Failed to retrieve statistics');
      return false;
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

async function test4_CustomerCannotAccessAdminEndpoints() {
  console.log('\n=== TEST 4.3: Customer Cannot Access Admin Endpoints ===');

  try {
    const response = await apiRequest(
      'GET',
      '/api/admin/orders',
      null,
      customerToken
    );

    if (response.status === 403) {
      console.log('✅ Customer correctly denied admin access');
      return true;
    } else {
      console.log('❌ Customer should not access admin endpoints');
      return false;
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

// ============================================
// REQUIREMENT 5: Generate Invoices
// ============================================

async function test5_GenerateInvoice() {
  console.log('\n=== TEST 5: Generate Invoice ===');

  try {
    const response = await apiRequest(
      'GET',
      `/api/orders/${testOrderId}/invoice`,
      null,
      customerToken
    );

    if (response.status === 200) {
      console.log('✅ Invoice generated successfully');
      console.log(`   Invoice Number: ${response.data.invoice_number}`);
      console.log(`   Subtotal: $${response.data.subtotal}`);
      console.log(`   Tax: $${response.data.tax}`);
      console.log(`   Shipping: $${response.data.shipping}`);
      console.log(`   Total: $${response.data.total}`);
      console.log(`   Items: ${response.data.items.length}`);
      return true;
    } else {
      console.log('❌ Failed to generate invoice');
      return false;
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

// Cleanup function
async function cleanup() {
  console.log('\n=== CLEANUP ===');

  try {
    // Delete orders
    if (testOrderId) {
      await supabase.from('orders').delete().eq('id', testOrderId);
    }

    // Delete cart items
    await supabase.from('cart_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // Delete inventory
    if (testProductId) {
      await supabase.from('inventory').delete().eq('product_id', testProductId);
    }

    // Delete product
    if (testProductId) {
      await supabase.from('products').delete().eq('id', testProductId);
    }

    // Delete category
    if (testCategoryId) {
      await supabase.from('categories').delete().eq('id', testCategoryId);
    }

    // Delete users
    await supabase.from('users').delete().eq('email', TEST_CONFIG.customerEmail);
    await supabase.from('users').delete().eq('email', TEST_CONFIG.adminEmail);

    console.log('✅ Cleanup complete');
  } catch (error) {
    console.error('⚠️  Cleanup error:', error.message);
  }
}

// Main test runner
async function runTests() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   ORDER MANAGEMENT TESTS                                   ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  // Setup
  const setupSuccess = await setupTestData();
  if (!setupSuccess) {
    console.log('❌ Setup failed, aborting tests');
    process.exit(1);
  }

  const tests = [
    // Requirement 1: Create Orders from Cart
    { name: 'REQ 1: Create Order from Cart', fn: test1_CreateOrderFromCart },
    
    // Requirement 2: Order Status Lifecycle
    { name: 'REQ 2.1: Update to PAID', fn: test2_UpdateStatusToPaid },
    { name: 'REQ 2.2: Update to CONFIRMED', fn: test2_UpdateStatusToConfirmed },
    { name: 'REQ 2.3: Update to PACKED', fn: test2_UpdateStatusToPacked },
    { name: 'REQ 2.4: Update to SHIPPED', fn: test2_UpdateStatusToShipped },
    { name: 'REQ 2.5: Update to DELIVERED', fn: test2_UpdateStatusToDelivered },
    { name: 'REQ 2.6: Invalid Transition', fn: test2_InvalidStatusTransition },
    
    // Requirement 3: Customer Order History
    { name: 'REQ 3.1: Get Order History', fn: test3_GetCustomerOrders },
    { name: 'REQ 3.2: Get Order by ID', fn: test3_GetOrderById },
    
    // Requirement 4: Admin Order Control
    { name: 'REQ 4.1: Admin Get All Orders', fn: test4_AdminGetAllOrders },
    { name: 'REQ 4.2: Admin Get Statistics', fn: test4_AdminGetStatistics },
    { name: 'REQ 4.3: Customer Denied Admin Access', fn: test4_CustomerCannotAccessAdminEndpoints },
    
    // Requirement 5: Generate Invoices
    { name: 'REQ 5: Generate Invoice', fn: test5_GenerateInvoice }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.error(`❌ Test "${test.name}" threw an error:`, error.message);
      failed++;
    }
  }

  // Cleanup
  await cleanup();

  // Summary
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║   TEST SUMMARY                                             ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`Total Tests: ${tests.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / tests.length) * 100).toFixed(2)}%`);
  
  console.log('\n📋 REQUIREMENTS COVERAGE:');
  console.log('1. ✅ Create Orders from Cart');
  console.log('2. ✅ Order Status Lifecycle (PENDING → PAID → CONFIRMED → PACKED → SHIPPED → DELIVERED)');
  console.log('3. ✅ Customer Order History');
  console.log('4. ✅ Admin Order Control');
  console.log('5. ✅ Generate Invoices');

  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
