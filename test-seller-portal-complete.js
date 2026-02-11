/**
 * COMPREHENSIVE SELLER PORTAL TEST
 * 
 * Tests all seller endpoints and functionality
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test credentials
const SELLER_CREDENTIALS = {
  email: 'seller@test.com',
  password: 'Test123!@#'
};

let sellerToken = '';
let sellerId = '';

// Color codes for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(name, passed, details = '') {
  const icon = passed ? '✅' : '❌';
  const color = passed ? 'green' : 'red';
  log(`${icon} ${passed ? 'PASS' : 'FAIL'}: ${name}`, color);
  if (details) {
    log(`   ${details}`, 'yellow');
  }
}

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

function recordTest(name, passed, error = null) {
  results.tests.push({ name, passed, error });
  if (passed) {
    results.passed++;
  } else {
    results.failed++;
  }
}

async function testSellerLogin() {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, SELLER_CREDENTIALS);
    
    if (response.data.token && response.data.user) {
      sellerToken = response.data.token;
      sellerId = response.data.user.id;
      logTest('Seller Login', true, `Token received, User ID: ${sellerId}`);
      recordTest('Seller Login', true);
      return true;
    } else {
      logTest('Seller Login', false, 'No token or user in response');
      recordTest('Seller Login', false, 'No token or user in response');
      return false;
    }
  } catch (error) {
    logTest('Seller Login', false, error.response?.data?.message || error.message);
    recordTest('Seller Login', false, error.message);
    return false;
  }
}

async function testSellerProfile() {
  try {
    const response = await axios.get(`${BASE_URL}/seller/profile`, {
      headers: { Authorization: `Bearer ${sellerToken}` }
    });
    
    logTest('Get Seller Profile', true, `Profile loaded: ${response.data.user?.display_name || 'N/A'}`);
    recordTest('Get Seller Profile', true);
    return true;
  } catch (error) {
    logTest('Get Seller Profile', false, error.response?.data?.message || error.message);
    recordTest('Get Seller Profile', false, error.message);
    return false;
  }
}

async function testSellerDashboard() {
  try {
    const response = await axios.get(`${BASE_URL}/seller/dashboard`, {
      headers: { Authorization: `Bearer ${sellerToken}` }
    });
    
    logTest('Get Seller Dashboard', true, `Stats loaded`);
    recordTest('Get Seller Dashboard', true);
    return true;
  } catch (error) {
    logTest('Get Seller Dashboard', false, error.response?.data?.message || error.message);
    recordTest('Get Seller Dashboard', false, error.message);
    return false;
  }
}

async function testSellerDashboardStats() {
  try {
    const response = await axios.get(`${BASE_URL}/seller/dashboard/stats`, {
      headers: { Authorization: `Bearer ${sellerToken}` }
    });
    
    logTest('Get Seller Dashboard Stats', true, `Stats loaded`);
    recordTest('Get Seller Dashboard Stats', true);
    return true;
  } catch (error) {
    logTest('Get Seller Dashboard Stats', false, error.response?.data?.message || error.message);
    recordTest('Get Seller Dashboard Stats', false, error.message);
    return false;
  }
}

async function testSellerProducts() {
  try {
    const response = await axios.get(`${BASE_URL}/seller/products`, {
      headers: { Authorization: `Bearer ${sellerToken}` }
    });
    
    const count = response.data.count || 0;
    logTest('Get Seller Products', true, `${count} products found`);
    recordTest('Get Seller Products', true);
    return true;
  } catch (error) {
    logTest('Get Seller Products', false, error.response?.data?.message || error.message);
    recordTest('Get Seller Products', false, error.message);
    return false;
  }
}

async function testSellerOrders() {
  try {
    const response = await axios.get(`${BASE_URL}/seller/orders`, {
      headers: { Authorization: `Bearer ${sellerToken}` }
    });
    
    const count = response.data.count || 0;
    logTest('Get Seller Orders', true, `${count} orders found`);
    recordTest('Get Seller Orders', true);
    return true;
  } catch (error) {
    logTest('Get Seller Orders', false, error.response?.data?.message || error.message);
    recordTest('Get Seller Orders', false, error.message);
    return false;
  }
}

async function testSellerSubOrders() {
  try {
    const response = await axios.get(`${BASE_URL}/seller/sub-orders`, {
      headers: { Authorization: `Bearer ${sellerToken}` }
    });
    
    const count = response.data.count || 0;
    logTest('Get Seller Sub-Orders', true, `${count} sub-orders found`);
    recordTest('Get Seller Sub-Orders', true);
    return true;
  } catch (error) {
    logTest('Get Seller Sub-Orders', false, error.response?.data?.message || error.message);
    recordTest('Get Seller Sub-Orders', false, error.message);
    return false;
  }
}

async function testSellerInventory() {
  try {
    const response = await axios.get(`${BASE_URL}/seller/inventory`, {
      headers: { Authorization: `Bearer ${sellerToken}` }
    });
    
    const count = response.data.count || 0;
    logTest('Get Seller Inventory', true, `${count} inventory items found`);
    recordTest('Get Seller Inventory', true);
    return true;
  } catch (error) {
    logTest('Get Seller Inventory', false, error.response?.data?.message || error.message);
    recordTest('Get Seller Inventory', false, error.message);
    return false;
  }
}

async function testSellerReturns() {
  try {
    const response = await axios.get(`${BASE_URL}/seller/returns`, {
      headers: { Authorization: `Bearer ${sellerToken}` }
    });
    
    const count = response.data.count || 0;
    logTest('Get Seller Returns', true, `${count} returns found`);
    recordTest('Get Seller Returns', true);
    return true;
  } catch (error) {
    logTest('Get Seller Returns', false, error.response?.data?.message || error.message);
    recordTest('Get Seller Returns', false, error.message);
    return false;
  }
}

async function testSellerReviews() {
  try {
    const response = await axios.get(`${BASE_URL}/seller/reviews`, {
      headers: { Authorization: `Bearer ${sellerToken}` }
    });
    
    const count = response.data.count || 0;
    logTest('Get Seller Reviews', true, `${count} reviews found`);
    recordTest('Get Seller Reviews', true);
    return true;
  } catch (error) {
    logTest('Get Seller Reviews', false, error.response?.data?.message || error.message);
    recordTest('Get Seller Reviews', false, error.message);
    return false;
  }
}

async function testSellerDisputes() {
  try {
    const response = await axios.get(`${BASE_URL}/seller/disputes`, {
      headers: { Authorization: `Bearer ${sellerToken}` }
    });
    
    const count = response.data.count || 0;
    logTest('Get Seller Disputes', true, `${count} disputes found`);
    recordTest('Get Seller Disputes', true);
    return true;
  } catch (error) {
    logTest('Get Seller Disputes', false, error.response?.data?.message || error.message);
    recordTest('Get Seller Disputes', false, error.message);
    return false;
  }
}

async function testSellerCommissions() {
  try {
    const response = await axios.get(`${BASE_URL}/seller/commissions`, {
      headers: { Authorization: `Bearer ${sellerToken}` }
    });
    
    const count = response.data.count || 0;
    logTest('Get Seller Commissions', true, `${count} commission records found`);
    recordTest('Get Seller Commissions', true);
    return true;
  } catch (error) {
    logTest('Get Seller Commissions', false, error.response?.data?.message || error.message);
    recordTest('Get Seller Commissions', false, error.message);
    return false;
  }
}

async function testSellerSettings() {
  try {
    const response = await axios.get(`${BASE_URL}/seller/settings`, {
      headers: { Authorization: `Bearer ${sellerToken}` }
    });
    
    logTest('Get Seller Settings', true, `Settings loaded`);
    recordTest('Get Seller Settings', true);
    return true;
  } catch (error) {
    logTest('Get Seller Settings', false, error.response?.data?.message || error.message);
    recordTest('Get Seller Settings', false, error.message);
    return false;
  }
}

async function testSellerMessages() {
  try {
    const response = await axios.get(`${BASE_URL}/seller/messages`, {
      headers: { Authorization: `Bearer ${sellerToken}` }
    });
    
    const count = response.data.count || 0;
    logTest('Get Seller Messages', true, `${count} messages found`);
    recordTest('Get Seller Messages', true);
    return true;
  } catch (error) {
    logTest('Get Seller Messages', false, error.response?.data?.message || error.message);
    recordTest('Get Seller Messages', false, error.message);
    return false;
  }
}

async function testSellerInvoices() {
  try {
    const response = await axios.get(`${BASE_URL}/seller/invoices`, {
      headers: { Authorization: `Bearer ${sellerToken}` }
    });
    
    const count = response.data.count || 0;
    logTest('Get Seller Invoices', true, `${count} invoices found`);
    recordTest('Get Seller Invoices', true);
    return true;
  } catch (error) {
    logTest('Get Seller Invoices', false, error.response?.data?.message || error.message);
    recordTest('Get Seller Invoices', false, error.message);
    return false;
  }
}

async function testSellerAnalytics() {
  try {
    const response = await axios.get(`${BASE_URL}/seller/analytics`, {
      headers: { Authorization: `Bearer ${sellerToken}` }
    });
    
    logTest('Get Seller Analytics', true, `Analytics loaded`);
    recordTest('Get Seller Analytics', true);
    return true;
  } catch (error) {
    logTest('Get Seller Analytics', false, error.response?.data?.message || error.message);
    recordTest('Get Seller Analytics', false, error.message);
    return false;
  }
}

async function testSellerRevenueAnalytics() {
  try {
    const response = await axios.get(`${BASE_URL}/seller/analytics/revenue`, {
      headers: { Authorization: `Bearer ${sellerToken}` }
    });
    
    logTest('Get Seller Revenue Analytics', true, `Revenue analytics loaded`);
    recordTest('Get Seller Revenue Analytics', true);
    return true;
  } catch (error) {
    logTest('Get Seller Revenue Analytics', false, error.response?.data?.message || error.message);
    recordTest('Get Seller Revenue Analytics', false, error.message);
    return false;
  }
}

async function testSellerSalesAnalytics() {
  try {
    const response = await axios.get(`${BASE_URL}/seller/analytics/sales`, {
      headers: { Authorization: `Bearer ${sellerToken}` }
    });
    
    logTest('Get Seller Sales Analytics', true, `Sales analytics loaded`);
    recordTest('Get Seller Sales Analytics', true);
    return true;
  } catch (error) {
    logTest('Get Seller Sales Analytics', false, error.response?.data?.message || error.message);
    recordTest('Get Seller Sales Analytics', false, error.message);
    return false;
  }
}

async function testSellerEarnings() {
  try {
    const response = await axios.get(`${BASE_URL}/seller/earnings`, {
      headers: { Authorization: `Bearer ${sellerToken}` }
    });
    
    logTest('Get Seller Earnings', true, `Earnings loaded`);
    recordTest('Get Seller Earnings', true);
    return true;
  } catch (error) {
    logTest('Get Seller Earnings', false, error.response?.data?.message || error.message);
    recordTest('Get Seller Earnings', false, error.message);
    return false;
  }
}

async function testSellerPayouts() {
  try {
    const response = await axios.get(`${BASE_URL}/seller/payouts`, {
      headers: { Authorization: `Bearer ${sellerToken}` }
    });
    
    logTest('Get Seller Payouts', true, `Payouts loaded`);
    recordTest('Get Seller Payouts', true);
    return true;
  } catch (error) {
    logTest('Get Seller Payouts', false, error.response?.data?.message || error.message);
    recordTest('Get Seller Payouts', false, error.message);
    return false;
  }
}

async function testSellerPayoutBalance() {
  try {
    const response = await axios.get(`${BASE_URL}/seller/payouts/balance`, {
      headers: { Authorization: `Bearer ${sellerToken}` }
    });
    
    logTest('Get Seller Payout Balance', true, `Balance loaded`);
    recordTest('Get Seller Payout Balance', true);
    return true;
  } catch (error) {
    logTest('Get Seller Payout Balance', false, error.response?.data?.message || error.message);
    recordTest('Get Seller Payout Balance', false, error.message);
    return false;
  }
}

async function testSellerPerformance() {
  try {
    const response = await axios.get(`${BASE_URL}/seller/performance`, {
      headers: { Authorization: `Bearer ${sellerToken}` }
    });
    
    logTest('Get Seller Performance', true, `Performance metrics loaded`);
    recordTest('Get Seller Performance', true);
    return true;
  } catch (error) {
    logTest('Get Seller Performance', false, error.response?.data?.message || error.message);
    recordTest('Get Seller Performance', false, error.message);
    return false;
  }
}

async function testSellerDocuments() {
  try {
    const response = await axios.get(`${BASE_URL}/seller/documents`, {
      headers: { Authorization: `Bearer ${sellerToken}` }
    });
    
    logTest('Get Seller Documents', true, `Documents loaded`);
    recordTest('Get Seller Documents', true);
    return true;
  } catch (error) {
    logTest('Get Seller Documents', false, error.response?.data?.message || error.message);
    recordTest('Get Seller Documents', false, error.message);
    return false;
  }
}

async function runAllTests() {
  log('\n🚀 Starting Comprehensive Seller Portal Testing...\n', 'blue');
  log('=' .repeat(60), 'blue');
  
  // Test 1: Authentication
  log('\n📝 Testing Authentication...', 'magenta');
  const loginSuccess = await testSellerLogin();
  
  if (!loginSuccess) {
    log('\n❌ Cannot proceed without valid seller login', 'red');
    log('Please ensure seller account exists with credentials:', 'yellow');
    log(`   Email: ${SELLER_CREDENTIALS.email}`, 'yellow');
    log(`   Password: ${SELLER_CREDENTIALS.password}`, 'yellow');
    return;
  }
  
  // Test 2: Profile & Dashboard
  log('\n📊 Testing Profile & Dashboard...', 'magenta');
  await testSellerProfile();
  await testSellerDashboard();
  await testSellerDashboardStats();
  
  // Test 3: Product Management
  log('\n📦 Testing Product Management...', 'magenta');
  await testSellerProducts();
  await testSellerInventory();
  
  // Test 4: Order Management
  log('\n📋 Testing Order Management...', 'magenta');
  await testSellerOrders();
  await testSellerSubOrders();
  
  // Test 5: Returns & Reviews
  log('\n↩️ Testing Returns & Reviews...', 'magenta');
  await testSellerReturns();
  await testSellerReviews();
  
  // Test 6: Disputes & Communications
  log('\n⚖️ Testing Disputes & Communications...', 'magenta');
  await testSellerDisputes();
  await testSellerMessages();
  
  // Test 7: Financial Management
  log('\n💰 Testing Financial Management...', 'magenta');
  await testSellerCommissions();
  await testSellerEarnings();
  await testSellerPayouts();
  await testSellerPayoutBalance();
  
  // Test 8: Analytics & Performance
  log('\n📈 Testing Analytics & Performance...', 'magenta');
  await testSellerAnalytics();
  await testSellerRevenueAnalytics();
  await testSellerSalesAnalytics();
  await testSellerPerformance();
  
  // Test 9: Settings & Documents
  log('\n⚙️ Testing Settings & Documents...', 'magenta');
  await testSellerSettings();
  await testSellerDocuments();
  await testSellerInvoices();
  
  // Print Summary
  log('\n' + '='.repeat(60), 'blue');
  log('\n📊 TEST SUMMARY\n', 'blue');
  
  const total = results.passed + results.failed;
  const percentage = ((results.passed / total) * 100).toFixed(2);
  
  log(`✅ Passed: ${results.passed}`, 'green');
  log(`❌ Failed: ${results.failed}`, 'red');
  log(`📝 Total: ${total}`, 'blue');
  log(`📈 Success Rate: ${percentage}%`, percentage >= 90 ? 'green' : percentage >= 70 ? 'yellow' : 'red');
  
  if (results.failed > 0) {
    log('\n❌ Failed Tests:', 'red');
    results.tests
      .filter(t => !t.passed)
      .forEach(t => {
        log(`   - ${t.name}: ${t.error || 'Unknown error'}`, 'red');
      });
  }
  
  log('\n' + '='.repeat(60), 'blue');
  
  // Status determination
  if (percentage === 100) {
    log('\n🎉 SELLER PORTAL: 100% COMPLETE AND FUNCTIONAL!', 'green');
  } else if (percentage >= 90) {
    log('\n✅ SELLER PORTAL: MOSTLY FUNCTIONAL (Minor issues)', 'yellow');
  } else if (percentage >= 70) {
    log('\n⚠️ SELLER PORTAL: FUNCTIONAL (Some issues need fixing)', 'yellow');
  } else {
    log('\n❌ SELLER PORTAL: NEEDS ATTENTION (Multiple issues)', 'red');
  }
  
  log('\n');
}

// Run all tests
runAllTests().catch(error => {
  log(`\n❌ Fatal Error: ${error.message}`, 'red');
  process.exit(1);
});
