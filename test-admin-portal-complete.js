/**
 * ADMIN PORTAL - COMPLETE INTEGRATION TEST
 * 
 * Tests all admin endpoints to verify backend integration
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

// Test credentials
const ADMIN_CREDENTIALS = {
  email: 'admin@fastshop.com',
  password: 'Admin123!@#'
};

let authToken = '';
let testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

// Helper function to log test results
function logTest(name, passed, error = null) {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status}: ${name}`);
  if (error) {
    console.log(`   Error: ${error}`);
  }
  
  testResults.tests.push({ name, passed, error });
  if (passed) {
    testResults.passed++;
  } else {
    testResults.failed++;
  }
}

// Helper function to make authenticated requests
async function makeRequest(method, endpoint, data = null) {
  try {
    const config = {
      method,
      url: `${API_BASE_URL}${endpoint}`,
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message,
      status: error.response?.status
    };
  }
}

async function runTests() {
  console.log('🚀 Starting Admin Portal Integration Tests...');
  console.log('='.repeat(60));

  // ==========================================
  // AUTHENTICATION
  // ==========================================
  console.log('\n📝 Testing Authentication...');
  
  try {
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, ADMIN_CREDENTIALS);
    
    // Handle different response structures
    if (loginResponse.data && loginResponse.data.data && loginResponse.data.data.token) {
      authToken = loginResponse.data.data.token;
    } else if (loginResponse.data && loginResponse.data.token) {
      authToken = loginResponse.data.token;
    } else {
      throw new Error('No token in response');
    }
    
    logTest('Admin Login', !!authToken);
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message;
    logTest('Admin Login', false, errorMsg);
    console.log('\n❌ Cannot proceed without authentication');
    console.log('Response:', error.response?.data);
    return;
  }

  // ==========================================
  // DASHBOARD
  // ==========================================
  console.log('\n📊 Testing Dashboard...');
  
  const dashboardResult = await makeRequest('GET', '/admin/dashboard');
  logTest('Get Admin Dashboard', dashboardResult.success, dashboardResult.error);

  const dashboardStatsResult = await makeRequest('GET', '/admin/dashboard/stats');
  logTest('Get Dashboard Stats', dashboardStatsResult.success, dashboardStatsResult.error);

  // ==========================================
  // PRODUCT MANAGEMENT
  // ==========================================
  console.log('\n📦 Testing Product Management...');
  
  const productsResult = await makeRequest('GET', '/admin/products');
  logTest('Get All Products', productsResult.success, productsResult.error);

  const pendingProductsResult = await makeRequest('GET', '/admin/products/pending');
  logTest('Get Pending Products', pendingProductsResult.success, pendingProductsResult.error);

  const lowStockResult = await makeRequest('GET', '/admin/products/low-stock');
  logTest('Get Low Stock Products', lowStockResult.success, lowStockResult.error);

  // ==========================================
  // ORDER MANAGEMENT
  // ==========================================
  console.log('\n📋 Testing Order Management...');
  
  const ordersResult = await makeRequest('GET', '/admin/orders');
  logTest('Get All Orders', ordersResult.success, ordersResult.error);

  const orderStatsResult = await makeRequest('GET', '/admin/orders/statistics');
  logTest('Get Order Statistics', orderStatsResult.success, orderStatsResult.error);

  // ==========================================
  // USER MANAGEMENT
  // ==========================================
  console.log('\n👥 Testing User Management...');
  
  const usersResult = await makeRequest('GET', '/admin/users');
  logTest('Get All Users', usersResult.success, usersResult.error);

  const sellersResult = await makeRequest('GET', '/admin/sellers');
  logTest('Get All Sellers', sellersResult.success, sellersResult.error);

  const managersResult = await makeRequest('GET', '/admin/managers');
  logTest('Get All Managers', managersResult.success, managersResult.error);

  const customersResult = await makeRequest('GET', '/admin/customers');
  logTest('Get All Customers', customersResult.success, customersResult.error);

  // ==========================================
  // CATEGORY MANAGEMENT
  // ==========================================
  console.log('\n🏷️ Testing Category Management...');
  
  const categoriesResult = await makeRequest('GET', '/admin/categories');
  logTest('Get All Categories', categoriesResult.success, categoriesResult.error);

  // ==========================================
  // REFUND MANAGEMENT
  // ==========================================
  console.log('\n💰 Testing Refund Management...');
  
  const refundsResult = await makeRequest('GET', '/admin/refunds');
  logTest('Get All Refunds', refundsResult.success, refundsResult.error);

  // ==========================================
  // PAYMENT MANAGEMENT
  // ==========================================
  console.log('\n💳 Testing Payment Management...');
  
  const paymentsResult = await makeRequest('GET', '/admin/payments');
  logTest('Get All Payments', paymentsResult.success, paymentsResult.error);

  const paymentStatsResult = await makeRequest('GET', '/admin/payments/statistics');
  logTest('Get Payment Statistics', paymentStatsResult.success, paymentStatsResult.error);

  // ==========================================
  // REVENUE ANALYTICS
  // ==========================================
  console.log('\n📈 Testing Revenue Analytics...');
  
  const revenueResult = await makeRequest('GET', '/admin/revenue');
  logTest('Get Revenue Analytics', revenueResult.success, revenueResult.error);

  // ==========================================
  // AUDIT LOGS
  // ==========================================
  console.log('\n📜 Testing Audit Logs...');
  
  const logsResult = await makeRequest('GET', '/admin/logs');
  logTest('Get Audit Logs', logsResult.success, logsResult.error);

  // ==========================================
  // SETTINGS
  // ==========================================
  console.log('\n⚙️ Testing Settings...');
  
  const settingsResult = await makeRequest('GET', '/admin/settings');
  logTest('Get Settings', settingsResult.success, settingsResult.error);

  // ==========================================
  // SUMMARY
  // ==========================================
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📝 Total: ${testResults.tests.length}`);
  console.log(`📈 Success Rate: ${((testResults.passed / testResults.tests.length) * 100).toFixed(2)}%`);

  if (testResults.failed > 0) {
    console.log('\n❌ Failed Tests:');
    testResults.tests
      .filter(t => !t.passed)
      .forEach(t => console.log(`- ${t.name}: ${t.error}`));
  }

  console.log('='.repeat(60));

  if (testResults.failed === 0) {
    console.log('🎉 ADMIN PORTAL: 100% COMPLETE AND FUNCTIONAL!');
  } else {
    console.log('❌ ADMIN PORTAL: NEEDS ATTENTION (Some tests failed)');
  }
  console.log('='.repeat(60));
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
