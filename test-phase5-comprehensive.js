/**
 * PHASE 5 COMPREHENSIVE TEST SUITE
 * 
 * Complete end-to-end testing of all Phase 5 features
 */

const http = require('http');

const BASE_URL = 'http://localhost:5000';

// Test data storage
let testData = {
  customerToken: null,
  sellerToken: null,
  adminToken: null,
  customerId: null,
  sellerId: null,
  customerEmail: null,
  productId: null,
  orderId: null,
  disputeId: null,
  notificationId: null,
  documentId: null
};

/**
 * Make HTTP request
 */
function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    // Ensure path starts with /api if not /health
    if (!path.startsWith('/api') && !path.startsWith('/health')) {
      path = '/api' + path;
    }
    
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const result = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode, data: result });
        } catch (e) {
          resolve({ status: res.statusCode, data: { raw: body } });
        }
      });
    });

    req.on('error', reject);

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

/**
 * Test 1: Health Check
 */
async function test1_HealthCheck() {
  console.log('\n📋 Test 1: Health Check');
  try {
    const res = await makeRequest('GET', '/health');
    if (res.status === 200) {
      console.log('✅ Server is healthy');
      return true;
    }
    console.log('❌ Health check failed');
    return false;
  } catch (error) {
    console.log('❌ Health check error:', error.message);
    return false;
  }
}

/**
 * Test 2: Admin Login
 */
async function test2_AdminLogin() {
  console.log('\n📋 Test 2: Admin Login');
  try {
    const res = await makeRequest('POST', '/auth/login', {
      email: 'admin@ecommerce.com',
      password: 'Admin123!@#'
    });
    
    if (res.status === 200 && res.data.token) {
      testData.adminToken = res.data.token;
      console.log('✅ Admin logged in successfully');
      return true;
    }
    console.log('❌ Admin login failed:', res.data.message);
    return false;
  } catch (error) {
    console.log('❌ Admin login error:', error.message);
    return false;
  }
}

/**
 * Test 3: Customer Registration
 */
async function test3_CustomerRegistration() {
  console.log('\n📋 Test 3: Customer Registration');
  try {
    const timestamp = Date.now();
    const email = `test-customer-${timestamp}@example.com`;
    const res = await makeRequest('POST', '/auth/register', {
      email: email,
      password: 'Test123!@#',
      displayName: 'Test Customer'
    });
    
    if (res.status === 201 && res.data.token) {
      testData.customerToken = res.data.token;
      testData.customerId = res.data.user.id;
      testData.customerEmail = email;
      console.log('✅ Customer registered successfully');
      console.log('   Customer ID:', testData.customerId);
      return true;
    }
    console.log('❌ Customer registration failed:', res.data.message);
    return false;
  } catch (error) {
    console.log('❌ Customer registration error:', error.message);
    return false;
  }
}

/**
 * Test 4: Seller Registration
 */
async function test4_SellerRegistration() {
  console.log('\n📋 Test 4: Seller Registration');
  try {
    const res = await makeRequest('POST', '/seller/register', {
      businessName: 'Test Electronics Store',
      businessAddress: '123 Business St, City, State 12345',
      taxId: 'TAX123456789'
    }, testData.customerToken);
    
    if (res.status === 200) {
      testData.sellerId = res.data.seller.id;
      console.log('✅ Seller registration successful');
      console.log('   Verification Status:', res.data.seller.seller_verification_status);
      return true;
    }
    console.log('❌ Seller registration failed:', res.data.message);
    return false;
  } catch (error) {
    console.log('❌ Seller registration error:', error.message);
    return false;
  }
}

/**
 * Test 5: Seller Document Upload
 */
async function test5_DocumentUpload() {
  console.log('\n📋 Test 5: Seller Document Upload');
  try {
    // Re-login as seller to get fresh token
    const loginRes = await makeRequest('POST', '/auth/login', {
      email: testData.customerEmail,
      password: 'Test123!@#'
    });
    
    if (loginRes.status === 200) {
      testData.sellerToken = loginRes.data.token;
    } else {
      console.log('❌ Failed to login as seller:', loginRes.data.message);
      return false;
    }
    
    const res = await makeRequest('POST', '/seller/documents', {
      documentType: 'business_license',
      documentUrl: 'https://example.com/documents/business-license.pdf',
      documentName: 'Business License.pdf',
      fileSize: 1024000,
      mimeType: 'application/pdf'
    }, testData.sellerToken);
    
    if (res.status === 201) {
      testData.documentId = res.data.document.id;
      console.log('✅ Document uploaded successfully');
      console.log('   Document ID:', testData.documentId);
      return true;
    }
    console.log('❌ Document upload failed:', res.data.message);
    return false;
  } catch (error) {
    console.log('❌ Document upload error:', error.message);
    return false;
  }
}

/**
 * Test 6: Manager - Verify Seller
 */
async function test6_VerifySeller() {
  console.log('\n📋 Test 6: Manager - Verify Seller');
  try {
    const res = await makeRequest('POST', `/sellers/${testData.sellerId}/verify`, {
      status: 'verified'
    }, testData.adminToken);
    
    if (res.status === 200) {
      console.log('✅ Seller verified successfully');
      console.log('   Verification Status:', res.data.seller.seller_verification_status);
      return true;
    }
    console.log('❌ Seller verification failed:', res.data.message);
    return false;
  } catch (error) {
    console.log('❌ Seller verification error:', error.message);
    return false;
  }
}

/**
 * Test 7: Seller Dashboard
 */
async function test7_SellerDashboard() {
  console.log('\n📋 Test 7: Seller Dashboard');
  try {
    const res = await makeRequest('GET', '/seller/dashboard', null, testData.sellerToken);
    
    if (res.status === 200) {
      console.log('✅ Seller dashboard loaded');
      console.log('   Product Count:', res.data.stats.productCount);
      console.log('   Pending Orders:', res.data.stats.pendingOrders);
      console.log('   Available Balance:', res.data.stats.balance.available_balance);
      return true;
    }
    console.log('❌ Dashboard load failed:', res.data.message);
    return false;
  } catch (error) {
    console.log('❌ Dashboard load error:', error.message);
    return false;
  }
}

/**
 * Test 8: Seller Performance Metrics
 */
async function test8_SellerPerformance() {
  console.log('\n📋 Test 8: Seller Performance Metrics');
  try {
    const res = await makeRequest('GET', '/seller/performance', null, testData.sellerToken);
    
    if (res.status === 200) {
      console.log('✅ Performance metrics retrieved');
      console.log('   Total Orders:', res.data.performance.total_orders);
      console.log('   Completed Orders:', res.data.performance.completed_orders);
      return true;
    }
    console.log('❌ Performance metrics failed:', res.data.message);
    return false;
  } catch (error) {
    console.log('❌ Performance metrics error:', error.message);
    return false;
  }
}

/**
 * Test 9: Notifications - Get User Notifications
 */
async function test9_GetNotifications() {
  console.log('\n📋 Test 9: Get User Notifications');
  try {
    const res = await makeRequest('GET', '/notifications', null, testData.sellerToken);
    
    if (res.status === 200) {
      console.log('✅ Notifications retrieved');
      console.log('   Count:', res.data.count);
      if (res.data.notifications.length > 0) {
        testData.notificationId = res.data.notifications[0].id;
        console.log('   First notification:', res.data.notifications[0].title);
      }
      return true;
    }
    console.log('❌ Notifications retrieval failed:', res.data.message);
    return false;
  } catch (error) {
    console.log('❌ Notifications error:', error.message);
    return false;
  }
}

/**
 * Test 10: Notifications - Get Unread Count
 */
async function test10_UnreadCount() {
  console.log('\n📋 Test 10: Get Unread Count');
  try {
    const res = await makeRequest('GET', '/notifications/unread-count', null, testData.sellerToken);
    
    if (res.status === 200) {
      console.log('✅ Unread count retrieved');
      console.log('   Unread Count:', res.data.count);
      return true;
    }
    console.log('❌ Unread count failed:', res.data.message);
    return false;
  } catch (error) {
    console.log('❌ Unread count error:', error.message);
    return false;
  }
}

/**
 * Test 11: Notifications - Mark as Read
 */
async function test11_MarkAsRead() {
  console.log('\n📋 Test 11: Mark Notification as Read');
  try {
    if (!testData.notificationId) {
      console.log('⚠️  No notification to mark as read');
      return true;
    }
    
    const res = await makeRequest('PUT', `/notifications/${testData.notificationId}/read`, null, testData.sellerToken);
    
    if (res.status === 200) {
      console.log('✅ Notification marked as read');
      return true;
    }
    console.log('❌ Mark as read failed:', res.data.message);
    return false;
  } catch (error) {
    console.log('❌ Mark as read error:', error.message);
    return false;
  }
}

/**
 * Test 12: Manager Dashboard
 */
async function test12_ManagerDashboard() {
  console.log('\n📋 Test 12: Manager Dashboard');
  try {
    const res = await makeRequest('GET', '/manager/dashboard', null, testData.adminToken);
    
    if (res.status === 200) {
      console.log('✅ Manager dashboard loaded');
      console.log('   Pending Products:', res.data.stats.pendingProducts);
      console.log('   Pending Sellers:', res.data.stats.pendingSellers);
      console.log('   Pending Disputes:', res.data.stats.pendingDisputes);
      console.log('   Pending Returns:', res.data.stats.pendingReturns);
      return true;
    }
    console.log('❌ Manager dashboard failed:', res.data.message);
    return false;
  } catch (error) {
    console.log('❌ Manager dashboard error:', error.message);
    return false;
  }
}

/**
 * Test 13: Get All Sellers (Admin)
 */
async function test13_GetAllSellers() {
  console.log('\n📋 Test 13: Get All Sellers');
  try {
    const res = await makeRequest('GET', '/sellers', null, testData.adminToken);
    
    if (res.status === 200) {
      console.log('✅ Sellers retrieved');
      console.log('   Total Sellers:', res.data.count);
      return true;
    }
    console.log('❌ Get sellers failed:', res.data.message);
    return false;
  } catch (error) {
    console.log('❌ Get sellers error:', error.message);
    return false;
  }
}

/**
 * Test 14: Manager Activity Log
 */
async function test14_ManagerActivity() {
  console.log('\n📋 Test 14: Manager Activity Log');
  try {
    const res = await makeRequest('GET', '/manager/activity', null, testData.adminToken);
    
    if (res.status === 200) {
      console.log('✅ Activity log retrieved');
      console.log('   Activity Count:', res.data.count);
      return true;
    }
    console.log('❌ Activity log failed:', res.data.message);
    return false;
  } catch (error) {
    console.log('❌ Activity log error:', error.message);
    return false;
  }
}

/**
 * Test 15: Route Integration Test
 */
async function test15_RouteIntegration() {
  console.log('\n📋 Test 15: Route Integration Test');
  try {
    const routes = [
      { method: 'GET', path: '/seller/profile', token: 'seller' },
      { method: 'GET', path: '/seller/documents', token: 'seller' },
      { method: 'GET', path: '/seller/earnings', token: 'seller' },
      { method: 'GET', path: '/seller/payouts', token: 'seller' },
      { method: 'GET', path: '/manager/products/pending', token: 'admin' },
      { method: 'GET', path: '/manager/sellers/pending', token: 'admin' },
      { method: 'GET', path: '/manager/orders', token: 'admin' }
    ];
    
    let passed = 0;
    let failed = 0;
    
    for (const route of routes) {
      const token = route.token === 'seller' ? testData.sellerToken : testData.adminToken;
      const res = await makeRequest(route.method, route.path, null, token);
      
      if (res.status === 200 || res.status === 201) {
        passed++;
        console.log(`   ✅ ${route.method} ${route.path}`);
      } else {
        failed++;
        console.log(`   ❌ ${route.method} ${route.path} (${res.status})`);
      }
    }
    
    console.log(`\n   Routes Tested: ${routes.length}`);
    console.log(`   Passed: ${passed}`);
    console.log(`   Failed: ${failed}`);
    
    return failed === 0;
  } catch (error) {
    console.log('❌ Route integration error:', error.message);
    return false;
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('\n🚀 Starting Phase 5 Comprehensive Test Suite');
  console.log('='.repeat(60));
  
  const tests = [
    { name: 'Health Check', fn: test1_HealthCheck },
    { name: 'Admin Login', fn: test2_AdminLogin },
    { name: 'Customer Registration', fn: test3_CustomerRegistration },
    { name: 'Seller Registration', fn: test4_SellerRegistration },
    { name: 'Document Upload', fn: test5_DocumentUpload },
    { name: 'Verify Seller', fn: test6_VerifySeller },
    { name: 'Seller Dashboard', fn: test7_SellerDashboard },
    { name: 'Seller Performance', fn: test8_SellerPerformance },
    { name: 'Get Notifications', fn: test9_GetNotifications },
    { name: 'Unread Count', fn: test10_UnreadCount },
    { name: 'Mark as Read', fn: test11_MarkAsRead },
    { name: 'Manager Dashboard', fn: test12_ManagerDashboard },
    { name: 'Get All Sellers', fn: test13_GetAllSellers },
    { name: 'Manager Activity', fn: test14_ManagerActivity },
    { name: 'Route Integration', fn: test15_RouteIntegration }
  ];
  
  let passed = 0;
  let failed = 0;
  const failedTests = [];
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passed++;
      } else {
        failed++;
        failedTests.push(test.name);
      }
    } catch (error) {
      failed++;
      failedTests.push(test.name);
      console.log(`❌ ${test.name} threw error:`, error.message);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Test Summary:');
  console.log(`   Total Tests: ${tests.length}`);
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   Success Rate: ${((passed / tests.length) * 100).toFixed(1)}%`);
  
  if (failedTests.length > 0) {
    console.log('\n❌ Failed Tests:');
    failedTests.forEach(test => console.log(`   - ${test}`));
  }
  
  if (failed === 0) {
    console.log('\n🎉 ALL PHASE 5 TESTS PASSED! 🎉');
    console.log('✅ Phase 5 is working perfectly!\n');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the output above.\n');
  }
  
  return failed === 0;
}

// Run tests
runAllTests()
  .then(success => process.exit(success ? 0 : 1))
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
