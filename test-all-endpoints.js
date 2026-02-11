/**
 * COMPREHENSIVE ENDPOINT TESTING SCRIPT
 * 
 * Tests all backend endpoints with proper authentication
 * Run: node test-all-endpoints.js
 */

const axios = require('axios');

const API_URL = 'http://localhost:5000';

// Test credentials
const testUsers = {
  customer: {
    email: 'customer@test.com',
    password: 'Test123!@#',
    token: null
  },
  seller: {
    email: 'seller@test.com',
    password: 'Test123!@#',
    token: null
  },
  manager: {
    email: 'manager@fastshop.com',
    password: 'Manager123!@#',
    token: null
  },
  admin: {
    email: 'admin@fastshop.com',
    password: 'Admin123!@#',
    token: null
  }
};

// Test results
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

// Helper function to log test results
function logTest(name, passed, error = null) {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status}: ${name}`);
  
  if (error) {
    console.log(`   Error: ${error.message}`);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Data:`, error.response.data);
    }
  }
  
  results.tests.push({ name, passed, error: error?.message });
  if (passed) results.passed++;
  else results.failed++;
}

// Helper function to make authenticated requests
async function authRequest(method, url, data = null, userType = 'customer') {
  const config = {
    method,
    url: `${API_URL}${url}`,
    headers: {}
  };
  
  if (testUsers[userType]?.token) {
    config.headers.Authorization = `Bearer ${testUsers[userType].token}`;
  }
  
  if (data) {
    config.data = data;
  }
  
  return axios(config);
}

// ============================================
// AUTHENTICATION TESTS
// ============================================

async function testAuthentication() {
  console.log('\n📝 Testing Authentication Endpoints...\n');
  
  // Test customer registration
  try {
    const response = await axios.post(`${API_URL}/api/auth/register`, {
      email: testUsers.customer.email,
      password: testUsers.customer.password,
      fullName: 'Test Customer'
    });
    logTest('Customer Registration', response.status === 201);
  } catch (error) {
    // User might already exist
    logTest('Customer Registration', error.response?.status === 409 || error.response?.status === 201);
  }
  
  // Test customer login
  try {
    const response = await axios.post(`${API_URL}/api/auth/login`, {
      email: testUsers.customer.email,
      password: testUsers.customer.password
    });
    testUsers.customer.token = response.data.token || response.data.access_token;
    logTest('Customer Login', !!testUsers.customer.token);
  } catch (error) {
    logTest('Customer Login', false, error);
  }
  
  // Test seller registration
  try {
    const response = await axios.post(`${API_URL}/api/auth/seller/register`, {
      email: testUsers.seller.email,
      password: testUsers.seller.password,
      fullName: 'Test Seller',
      storeName: 'Test Store',
      businessType: 'individual'
    });
    logTest('Seller Registration', response.status === 201);
  } catch (error) {
    logTest('Seller Registration', error.response?.status === 409 || error.response?.status === 201);
  }
  
  // Test seller login
  try {
    const response = await axios.post(`${API_URL}/api/auth/login`, {
      email: testUsers.seller.email,
      password: testUsers.seller.password
    });
    testUsers.seller.token = response.data.token || response.data.access_token;
    logTest('Seller Login', !!testUsers.seller.token);
  } catch (error) {
    logTest('Seller Login', false, error);
  }
  
  // Test manager login
  try {
    const response = await axios.post(`${API_URL}/api/auth/login`, {
      email: testUsers.manager.email,
      password: testUsers.manager.password
    });
    testUsers.manager.token = response.data.token || response.data.access_token;
    logTest('Manager Login', !!testUsers.manager.token);
  } catch (error) {
    logTest('Manager Login', false, error);
  }
  
  // Test admin login
  try {
    const response = await axios.post(`${API_URL}/api/auth/login`, {
      email: testUsers.admin.email,
      password: testUsers.admin.password
    });
    testUsers.admin.token = response.data.token || response.data.access_token;
    logTest('Admin Login', !!testUsers.admin.token);
  } catch (error) {
    logTest('Admin Login', false, error);
  }
}

// ============================================
// PRODUCT TESTS
// ============================================

async function testProducts() {
  console.log('\n📦 Testing Product Endpoints...\n');
  
  // Test get all products (public)
  try {
    const response = await axios.get(`${API_URL}/api/products`);
    logTest('Get All Products (Public)', response.status === 200);
  } catch (error) {
    logTest('Get All Products (Public)', false, error);
  }
  
  // Test get categories
  try {
    const response = await axios.get(`${API_URL}/api/categories`);
    logTest('Get Categories', response.status === 200);
  } catch (error) {
    logTest('Get Categories', false, error);
  }
  
  // Test seller get products
  try {
    const response = await authRequest('GET', '/api/seller/products', null, 'seller');
    logTest('Seller Get Products', response.status === 200);
  } catch (error) {
    logTest('Seller Get Products', false, error);
  }
  
  // Test seller create product
  try {
    const response = await authRequest('POST', '/api/seller/products', {
      name: 'Test Product',
      description: 'Test Description',
      price: 99.99,
      categoryId: 1,
      stock: 100,
      sku: `TEST-${Date.now()}`
    }, 'seller');
    logTest('Seller Create Product', response.status === 201);
  } catch (error) {
    logTest('Seller Create Product', false, error);
  }
}

// ============================================
// CART TESTS
// ============================================

async function testCart() {
  console.log('\n🛒 Testing Cart Endpoints...\n');
  
  // Test get cart
  try {
    const response = await authRequest('GET', '/api/cart', null, 'customer');
    logTest('Get Customer Cart', response.status === 200);
  } catch (error) {
    logTest('Get Customer Cart', false, error);
  }
  
  // Test add to cart
  try {
    const response = await authRequest('POST', '/api/cart/items', {
      productId: 1,
      quantity: 2
    }, 'customer');
    logTest('Add to Cart', response.status === 200 || response.status === 201);
  } catch (error) {
    logTest('Add to Cart', false, error);
  }
  
  // Test guest cart
  try {
    const guestId = `guest-${Date.now()}`;
    const response = await axios.get(`${API_URL}/api/guest/cart/${guestId}`);
    logTest('Get Guest Cart', response.status === 200);
  } catch (error) {
    logTest('Get Guest Cart', false, error);
  }
}

// ============================================
// ORDER TESTS
// ============================================

async function testOrders() {
  console.log('\n📋 Testing Order Endpoints...\n');
  
  // Test customer get orders
  try {
    const response = await authRequest('GET', '/api/orders', null, 'customer');
    logTest('Customer Get Orders', response.status === 200);
  } catch (error) {
    logTest('Customer Get Orders', false, error);
  }
  
  // Test seller get orders
  try {
    const response = await authRequest('GET', '/api/seller/orders', null, 'seller');
    logTest('Seller Get Orders', response.status === 200);
  } catch (error) {
    logTest('Seller Get Orders', false, error);
  }
  
  // Test admin get orders
  try {
    const response = await authRequest('GET', '/api/admin/orders', null, 'admin');
    logTest('Admin Get Orders', response.status === 200);
  } catch (error) {
    logTest('Admin Get Orders', false, error);
  }
}

// ============================================
// SELLER DASHBOARD TESTS
// ============================================

async function testSellerDashboard() {
  console.log('\n📊 Testing Seller Dashboard Endpoints...\n');
  
  // Test dashboard stats
  try {
    const response = await authRequest('GET', '/api/seller/dashboard/stats', null, 'seller');
    logTest('Seller Dashboard Stats', response.status === 200);
  } catch (error) {
    logTest('Seller Dashboard Stats', false, error);
  }
  
  // Test analytics
  try {
    const response = await authRequest('GET', '/api/seller/analytics', null, 'seller');
    logTest('Seller Analytics', response.status === 200);
  } catch (error) {
    logTest('Seller Analytics', false, error);
  }
  
  // Test inventory
  try {
    const response = await authRequest('GET', '/api/seller/inventory', null, 'seller');
    logTest('Seller Inventory', response.status === 200);
  } catch (error) {
    logTest('Seller Inventory', false, error);
  }
}

// ============================================
// MANAGER TESTS
// ============================================

async function testManager() {
  console.log('\n👔 Testing Manager Endpoints...\n');
  
  // Test dashboard stats
  try {
    const response = await authRequest('GET', '/api/manager/dashboard/stats', null, 'manager');
    logTest('Manager Dashboard Stats', response.status === 200);
  } catch (error) {
    logTest('Manager Dashboard Stats', false, error);
  }
  
  // Test pending product approvals
  try {
    const response = await authRequest('GET', '/api/approvals/products/pending', null, 'manager');
    logTest('Manager Get Pending Products', response.status === 200);
  } catch (error) {
    logTest('Manager Get Pending Products', false, error);
  }
  
  // Test pending seller approvals
  try {
    const response = await authRequest('GET', '/api/approvals/sellers/pending', null, 'manager');
    logTest('Manager Get Pending Sellers', response.status === 200);
  } catch (error) {
    logTest('Manager Get Pending Sellers', false, error);
  }
}

// ============================================
// ADMIN TESTS
// ============================================

async function testAdmin() {
  console.log('\n👑 Testing Admin Endpoints...\n');
  
  // Test dashboard stats
  try {
    const response = await authRequest('GET', '/api/admin/dashboard/stats', null, 'admin');
    logTest('Admin Dashboard Stats', response.status === 200);
  } catch (error) {
    logTest('Admin Dashboard Stats', false, error);
  }
  
  // Test get users
  try {
    const response = await authRequest('GET', '/api/admin/users', null, 'admin');
    logTest('Admin Get Users', response.status === 200);
  } catch (error) {
    logTest('Admin Get Users', false, error);
  }
  
  // Test get sellers
  try {
    const response = await authRequest('GET', '/api/admin/sellers', null, 'admin');
    logTest('Admin Get Sellers', response.status === 200);
  } catch (error) {
    logTest('Admin Get Sellers', false, error);
  }
  
  // Test get managers
  try {
    const response = await authRequest('GET', '/api/admin/managers', null, 'admin');
    logTest('Admin Get Managers', response.status === 200);
  } catch (error) {
    logTest('Admin Get Managers', false, error);
  }
  
  // Test revenue analytics
  try {
    const response = await authRequest('GET', '/api/admin/revenue', null, 'admin');
    logTest('Admin Revenue Analytics', response.status === 200);
  } catch (error) {
    logTest('Admin Revenue Analytics', false, error);
  }
}

// ============================================
// REVIEW TESTS
// ============================================

async function testReviews() {
  console.log('\n⭐ Testing Review Endpoints...\n');
  
  // Test get customer reviews
  try {
    const response = await authRequest('GET', '/api/reviews/my-reviews', null, 'customer');
    logTest('Customer Get Reviews', response.status === 200);
  } catch (error) {
    logTest('Customer Get Reviews', false, error);
  }
  
  // Test get seller reviews
  try {
    const response = await authRequest('GET', '/api/seller/reviews', null, 'seller');
    logTest('Seller Get Reviews', response.status === 200);
  } catch (error) {
    logTest('Seller Get Reviews', false, error);
  }
}

// ============================================
// RETURNS TESTS
// ============================================

async function testReturns() {
  console.log('\n↩️ Testing Return Endpoints...\n');
  
  // Test customer get returns
  try {
    const response = await authRequest('GET', '/api/returns', null, 'customer');
    logTest('Customer Get Returns', response.status === 200);
  } catch (error) {
    logTest('Customer Get Returns', false, error);
  }
  
  // Test seller get returns
  try {
    const response = await authRequest('GET', '/api/seller/returns', null, 'seller');
    logTest('Seller Get Returns', response.status === 200);
  } catch (error) {
    logTest('Seller Get Returns', false, error);
  }
}

// ============================================
// MAIN TEST RUNNER
// ============================================

async function runAllTests() {
  console.log('🚀 Starting Comprehensive Backend Testing...\n');
  console.log('='.repeat(50));
  
  try {
    await testAuthentication();
    await testProducts();
    await testCart();
    await testOrders();
    await testSellerDashboard();
    await testManager();
    await testAdmin();
    await testReviews();
    await testReturns();
    
    console.log('\n' + '='.repeat(50));
    console.log('\n📊 TEST SUMMARY\n');
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`📝 Total: ${results.tests.length}`);
    console.log(`📈 Success Rate: ${((results.passed / results.tests.length) * 100).toFixed(2)}%`);
    
    if (results.failed > 0) {
      console.log('\n❌ Failed Tests:');
      results.tests
        .filter(t => !t.passed)
        .forEach(t => console.log(`   - ${t.name}: ${t.error}`));
    }
    
    console.log('\n' + '='.repeat(50));
    
  } catch (error) {
    console.error('Fatal error during testing:', error);
  }
}

// Run tests
runAllTests();

