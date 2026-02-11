/**
 * CUSTOMER PORTAL INTEGRATION TEST
 * 
 * Tests all customer-facing functionality step by step
 */

const axios = require('axios');

const API_URL = 'http://localhost:5000';
const FRONTEND_URL = 'http://localhost:3001';

// Test data
let testCustomer = {
  email: `customer_${Date.now()}@test.com`,
  password: 'Test123!@#',
  fullName: 'Test Customer',
  token: null,
  userId: null
};

let testProduct = null;
let testCart = null;
let testOrder = null;

// Results tracking
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

function logTest(name, passed, error = null, data = null) {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status}: ${name}`);
  
  if (error) {
    console.log(`   Error: ${error.message}`);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Data:`, JSON.stringify(error.response.data, null, 2));
    }
  }
  
  if (data && passed) {
    console.log(`   ✓ Success:`, JSON.stringify(data, null, 2).substring(0, 200));
  }
  
  results.tests.push({ name, passed, error: error?.message });
  if (passed) results.passed++;
  else results.failed++;
}

async function authRequest(method, url, data = null) {
  const config = {
    method,
    url: `${API_URL}${url}`,
    headers: {}
  };
  
  if (testCustomer.token) {
    config.headers.Authorization = `Bearer ${testCustomer.token}`;
  }
  
  if (data) {
    config.data = data;
  }
  
  return axios(config);
}

// ============================================
// TEST 1: PUBLIC ROUTES
// ============================================

async function testPublicRoutes() {
  console.log('\n📦 Testing Public Routes...\n');
  
  // Test get all products
  try {
    const response = await axios.get(`${API_URL}/api/products`);
    const hasProducts = response.data && (Array.isArray(response.data) || Array.isArray(response.data.data));
    logTest('Get All Products', hasProducts, null, { count: response.data.length || response.data.data?.length });
    
    if (hasProducts) {
      const products = Array.isArray(response.data) ? response.data : response.data.data;
      if (products && products.length > 0) {
        testProduct = products[0];
        console.log(`   📌 Selected test product: ${testProduct.title || testProduct.name} (ID: ${testProduct.id})`);
      }
    }
  } catch (error) {
    console.log('   Full error:', error.message);
    console.log('   Response:', error.response?.data);
    console.log('   Status:', error.response?.status);
    logTest('Get All Products', false, error);
  }
  
  // Test get categories
  try {
    const response = await axios.get(`${API_URL}/api/categories`);
    const hasCategories = response.data && (Array.isArray(response.data) || Array.isArray(response.data.data));
    logTest('Get Categories', hasCategories, null, { count: response.data.length || response.data.data?.length });
  } catch (error) {
    logTest('Get Categories', false, error);
  }
  
  // Test get product by ID
  if (testProduct) {
    try {
      const response = await axios.get(`${API_URL}/api/products/${testProduct.id}`);
      const hasProduct = response.data && (response.data.id || response.data.data?.id);
      logTest('Get Product by ID', hasProduct, null, { id: testProduct.id });
    } catch (error) {
      logTest('Get Product by ID', false, error);
    }
  }
}

// ============================================
// TEST 2: AUTHENTICATION
// ============================================

async function testAuthentication() {
  console.log('\n🔐 Testing Authentication...\n');
  
  // Test customer registration
  try {
    const response = await axios.post(`${API_URL}/api/auth/register`, {
      email: testCustomer.email,
      password: testCustomer.password,
      fullName: testCustomer.fullName
    });
    const success = response.status === 201 || response.status === 200;
    logTest('Customer Registration', success, null, { email: testCustomer.email });
    
    if (response.data.token) {
      testCustomer.token = response.data.token;
    }
    if (response.data.user) {
      testCustomer.userId = response.data.user.id;
    }
  } catch (error) {
    logTest('Customer Registration', false, error);
  }
  
  // Test customer login
  try {
    const response = await axios.post(`${API_URL}/api/auth/login`, {
      email: testCustomer.email,
      password: testCustomer.password
    });
    const hasToken = response.data.token || response.data.access_token;
    testCustomer.token = hasToken;
    logTest('Customer Login', !!hasToken, null, { hasToken: !!hasToken });
  } catch (error) {
    logTest('Customer Login', false, error);
  }
  
  // Test get profile
  if (testCustomer.token) {
    try {
      const response = await authRequest('GET', '/api/auth/me');
      const hasProfile = response.data && (response.data.email || response.data.data?.email);
      logTest('Get Customer Profile', hasProfile, null, { email: response.data.email || response.data.data?.email });
    } catch (error) {
      logTest('Get Customer Profile', false, error);
    }
  }
}

// ============================================
// TEST 3: SHOPPING CART
// ============================================

async function testShoppingCart() {
  console.log('\n🛒 Testing Shopping Cart...\n');
  
  if (!testCustomer.token) {
    console.log('⚠️  Skipping cart tests - no authentication token');
    return;
  }
  
  if (!testProduct) {
    console.log('⚠️  Skipping cart tests - no test product available');
    return;
  }
  
  // Test get cart
  try {
    const response = await authRequest('GET', '/api/cart');
    const hasCart = response.data !== null;
    logTest('Get Customer Cart', hasCart, null, { hasCart });
    testCart = response.data;
  } catch (error) {
    logTest('Get Customer Cart', false, error);
  }
  
  // Test add to cart
  try {
    const response = await authRequest('POST', '/api/cart/items', {
      productId: testProduct.id,
      quantity: 2
    });
    const success = response.status === 200 || response.status === 201;
    logTest('Add Product to Cart', success, null, { productId: testProduct.id, quantity: 2 });
  } catch (error) {
    logTest('Add Product to Cart', false, error);
  }
  
  // Test get cart again (should have items)
  try {
    const response = await authRequest('GET', '/api/cart');
    const hasItems = response.data && (response.data.items?.length > 0 || response.data.data?.items?.length > 0);
    logTest('Get Cart with Items', hasItems, null, { itemCount: response.data.items?.length || response.data.data?.items?.length });
  } catch (error) {
    logTest('Get Cart with Items', false, error);
  }
}

// ============================================
// TEST 4: ORDERS
// ============================================

async function testOrders() {
  console.log('\n📋 Testing Orders...\n');
  
  if (!testCustomer.token) {
    console.log('⚠️  Skipping order tests - no authentication token');
    return;
  }
  
  // Test get orders
  try {
    const response = await authRequest('GET', '/api/orders');
    const hasOrders = response.data !== null;
    logTest('Get Customer Orders', hasOrders, null, { count: response.data?.length || response.data?.data?.length || 0 });
  } catch (error) {
    logTest('Get Customer Orders', false, error);
  }
}

// ============================================
// TEST 5: REVIEWS
// ============================================

async function testReviews() {
  console.log('\n⭐ Testing Reviews...\n');
  
  if (!testCustomer.token) {
    console.log('⚠️  Skipping review tests - no authentication token');
    return;
  }
  
  // Test get customer reviews
  try {
    const response = await authRequest('GET', '/api/reviews/my-reviews');
    const hasReviews = response.data !== null;
    logTest('Get Customer Reviews', hasReviews, null, { count: response.data?.length || response.data?.data?.length || 0 });
  } catch (error) {
    logTest('Get Customer Reviews', false, error);
  }
}

// ============================================
// TEST 6: RETURNS
// ============================================

async function testReturns() {
  console.log('\n↩️  Testing Returns...\n');
  
  if (!testCustomer.token) {
    console.log('⚠️  Skipping return tests - no authentication token');
    return;
  }
  
  // Test get customer returns
  try {
    const response = await authRequest('GET', '/api/returns/user/me');
    const hasReturns = response.data !== null;
    logTest('Get Customer Returns', hasReturns, null, { count: response.data?.length || response.data?.data?.length || 0 });
  } catch (error) {
    logTest('Get Customer Returns', false, error);
  }
}

// ============================================
// MAIN TEST RUNNER
// ============================================

async function runTests() {
  console.log('🚀 Starting Customer Portal Integration Tests...\n');
  console.log('==================================================\n');
  
  await testPublicRoutes();
  await testAuthentication();
  await testShoppingCart();
  await testOrders();
  await testReviews();
  await testReturns();
  
  console.log('\n==================================================\n');
  console.log('📊 CUSTOMER PORTAL TEST SUMMARY\n');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📝 Total: ${results.passed + results.failed}`);
  console.log(`📈 Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(2)}%`);
  
  if (results.failed > 0) {
    console.log('\n❌ Failed Tests:');
    results.tests.filter(t => !t.passed).forEach(t => {
      console.log(`   - ${t.name}: ${t.error || 'Unknown error'}`);
    });
  }
  
  console.log('\n==================================================\n');
}

// Run tests
runTests().catch(console.error);
