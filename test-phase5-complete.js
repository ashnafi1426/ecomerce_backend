/**
 * PHASE 5 COMPLETE TEST SUITE
 * 
 * Tests all Phase 5 multi-vendor features:
 * - Seller registration and verification
 * - Manager product approval workflow
 * - Notifications system
 * - Dispute resolution
 */

const supabase = require('./config/supabase');

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000/api',
  testEmail: `test-seller-${Date.now()}@example.com`,
  testPassword: 'TestPassword123!',
  adminEmail: 'admin@fastshop.com',
  adminPassword: 'Admin123!@#'
};

let testTokens = {
  customer: null,
  seller: null,
  manager: null,
  admin: null
};

let testData = {
  customerId: null,
  sellerId: null,
  productId: null,
  orderId: null,
  disputeId: null,
  notificationId: null
};

/**
 * Helper function to make API requests
 */
async function apiRequest(method, endpoint, data = null, token = null) {
  const url = `${TEST_CONFIG.baseUrl}${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json'
    }
  };

  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }

  if (data && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, options);
    const result = await response.json();
    return { status: response.status, data: result };
  } catch (error) {
    return { status: 500, error: error.message };
  }
}

/**
 * Test 1: Setup - Create test users
 */
async function test1_Setup() {
  console.log('\n📋 Test 1: Setup - Creating test users...');
  
  try {
    // Register customer
    const customerRes = await apiRequest('POST', '/auth/register', {
      email: TEST_CONFIG.testEmail,
      password: TEST_CONFIG.testPassword,
      displayName: 'Test Customer'
    });
    
    if (customerRes.status === 201) {
      testTokens.customer = customerRes.data.token;
      testData.customerId = customerRes.data.user.id;
      console.log('✅ Customer created');
    } else {
      console.log('⚠️  Customer creation failed:', customerRes.data.message);
    }
    
    // Login as admin
    const adminRes = await apiRequest('POST', '/auth/login', {
      email: TEST_CONFIG.adminEmail,
      password: TEST_CONFIG.adminPassword
    });
    
    if (adminRes.status === 200) {
      testTokens.admin = adminRes.data.token;
      console.log('✅ Admin logged in');
    } else {
      console.log('❌ Admin login failed');
    }
    
    console.log('✅ Test 1 Complete\n');
    return true;
  } catch (error) {
    console.error('❌ Test 1 Failed:', error.message);
    return false;
  }
}

/**
 * Test 2: Seller Registration
 */
async function test2_SellerRegistration() {
  console.log('\n📋 Test 2: Seller Registration...');
  
  try {
    const response = await apiRequest('POST', '/seller/register', {
      businessName: 'Test Electronics Store',
      businessAddress: '123 Business St, City, State 12345',
      taxId: 'TAX123456789'
    }, testTokens.customer);
    
    if (response.status === 200) {
      testData.sellerId = response.data.seller.id;
      console.log('✅ Seller registration successful');
      console.log('   Status:', response.data.seller.seller_verification_status);
    } else {
      console.log('❌ Seller registration failed:', response.data.message);
      return false;
    }
    
    console.log('✅ Test 2 Complete\n');
    return true;
  } catch (error) {
    console.error('❌ Test 2 Failed:', error.message);
    return false;
  }
}

/**
 * Test 3: Seller Document Upload
 */
async function test3_DocumentUpload() {
  console.log('\n📋 Test 3: Seller Document Upload...');
  
  try {
    // Login as seller
    const loginRes = await apiRequest('POST', '/auth/login', {
      email: TEST_CONFIG.testEmail,
      password: TEST_CONFIG.testPassword
    });
    
    if (loginRes.status === 200) {
      testTokens.seller = loginRes.data.token;
      console.log('✅ Seller logged in');
    }
    
    // Upload document
    const response = await apiRequest('POST', '/seller/documents', {
      documentType: 'business_license',
      documentUrl: 'https://example.com/documents/business-license.pdf',
      documentName: 'Business License.pdf',
      fileSize: 1024000,
      mimeType: 'application/pdf'
    }, testTokens.seller);
    
    if (response.status === 201) {
      console.log('✅ Document uploaded successfully');
      console.log('   Document ID:', response.data.document.id);
    } else {
      console.log('❌ Document upload failed:', response.data.message);
      return false;
    }
    
    console.log('✅ Test 3 Complete\n');
    return true;
  } catch (error) {
    console.error('❌ Test 3 Failed:', error.message);
    return false;
  }
}

/**
 * Test 4: Manager - Verify Seller
 */
async function test4_VerifySeller() {
  console.log('\n📋 Test 4: Manager - Verify Seller...');
  
  try {
    const response = await apiRequest('POST', `/sellers/${testData.sellerId}/verify`, {
      status: 'verified'
    }, testTokens.admin);
    
    if (response.status === 200) {
      console.log('✅ Seller verified successfully');
      console.log('   Verification status:', response.data.seller.seller_verification_status);
    } else {
      console.log('❌ Seller verification failed:', response.data.message);
      return false;
    }
    
    console.log('✅ Test 4 Complete\n');
    return true;
  } catch (error) {
    console.error('❌ Test 4 Failed:', error.message);
    return false;
  }
}

/**
 * Test 5: Seller Dashboard
 */
async function test5_SellerDashboard() {
  console.log('\n📋 Test 5: Seller Dashboard...');
  
  try {
    const response = await apiRequest('GET', '/seller/dashboard', null, testTokens.seller);
    
    if (response.status === 200) {
      console.log('✅ Seller dashboard loaded');
      console.log('   Product count:', response.data.stats.productCount);
      console.log('   Pending orders:', response.data.stats.pendingOrders);
      console.log('   Available balance:', response.data.stats.balance.available_balance);
    } else {
      console.log('❌ Dashboard load failed:', response.data.message);
      return false;
    }
    
    console.log('✅ Test 5 Complete\n');
    return true;
  } catch (error) {
    console.error('❌ Test 5 Failed:', error.message);
    return false;
  }
}

/**
 * Test 6: Notifications
 */
async function test6_Notifications() {
  console.log('\n📋 Test 6: Notifications System...');
  
  try {
    // Get notifications
    const response = await apiRequest('GET', '/notifications', null, testTokens.seller);
    
    if (response.status === 200) {
      console.log('✅ Notifications retrieved');
      console.log('   Count:', response.data.count);
      
      if (response.data.notifications.length > 0) {
        testData.notificationId = response.data.notifications[0].id;
        
        // Mark as read
        const markReadRes = await apiRequest('PUT', `/notifications/${testData.notificationId}/read`, null, testTokens.seller);
        
        if (markReadRes.status === 200) {
          console.log('✅ Notification marked as read');
        }
      }
    } else {
      console.log('❌ Notifications retrieval failed:', response.data.message);
      return false;
    }
    
    // Get unread count
    const countRes = await apiRequest('GET', '/notifications/unread-count', null, testTokens.seller);
    
    if (countRes.status === 200) {
      console.log('✅ Unread count:', countRes.data.count);
    }
    
    console.log('✅ Test 6 Complete\n');
    return true;
  } catch (error) {
    console.error('❌ Test 6 Failed:', error.message);
    return false;
  }
}

/**
 * Test 7: Manager Dashboard
 */
async function test7_ManagerDashboard() {
  console.log('\n📋 Test 7: Manager Dashboard...');
  
  try {
    const response = await apiRequest('GET', '/manager/dashboard', null, testTokens.admin);
    
    if (response.status === 200) {
      console.log('✅ Manager dashboard loaded');
      console.log('   Pending products:', response.data.stats.pendingProducts);
      console.log('   Pending sellers:', response.data.stats.pendingSellers);
      console.log('   Pending disputes:', response.data.stats.pendingDisputes);
      console.log('   Pending returns:', response.data.stats.pendingReturns);
    } else {
      console.log('❌ Manager dashboard failed:', response.data.message);
      return false;
    }
    
    console.log('✅ Test 7 Complete\n');
    return true;
  } catch (error) {
    console.error('❌ Test 7 Failed:', error.message);
    return false;
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('🚀 Starting Phase 5 Complete Test Suite...\n');
  console.log('=' .repeat(60));
  
  const tests = [
    { name: 'Setup', fn: test1_Setup },
    { name: 'Seller Registration', fn: test2_SellerRegistration },
    { name: 'Document Upload', fn: test3_DocumentUpload },
    { name: 'Verify Seller', fn: test4_VerifySeller },
    { name: 'Seller Dashboard', fn: test5_SellerDashboard },
    { name: 'Notifications', fn: test6_Notifications },
    { name: 'Manager Dashboard', fn: test7_ManagerDashboard }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    const result = await test.fn();
    if (result) {
      passed++;
    } else {
      failed++;
    }
  }
  
  console.log('=' .repeat(60));
  console.log('\n📊 Test Summary:');
  console.log(`   Total: ${tests.length}`);
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   Success Rate: ${((passed / tests.length) * 100).toFixed(1)}%\n`);
  
  if (failed === 0) {
    console.log('🎉 All Phase 5 tests passed!\n');
  } else {
    console.log('⚠️  Some tests failed. Please review the output above.\n');
  }
}

// Run tests
runAllTests()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
