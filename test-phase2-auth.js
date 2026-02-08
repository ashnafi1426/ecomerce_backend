/**
 * PHASE 2 TESTING SCRIPT
 * Authentication & Authorization Testing
 * 
 * Tests:
 * 1. Seller Registration
 * 2. Seller Login
 * 3. Manager Creation (Admin only)
 * 4. Manager Login
 * 5. Seller Approval Workflow
 * 6. Role-based Route Protection
 * 7. Permission Checks
 */

const supabase = require('./config/supabase');

// Test configuration
const TEST_CONFIG = {
  adminEmail: 'admin@ecommerce.com',
  adminPassword: 'Admin123!@#',
  testSellerEmail: 'testseller@example.com',
  testSellerPassword: 'Seller123!',
  testManagerEmail: 'testmanager@example.com',
  testManagerPassword: 'Manager123!',
};

// Store test data
const testData = {
  adminToken: null,
  sellerId: null,
  sellerToken: null,
  managerId: null,
  managerToken: null,
};

// Helper function to make API requests
async function makeRequest(method, endpoint, data = null, token = null) {
  const baseURL = 'http://localhost:5000';
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = {
    method,
    headers,
  };

  if (data && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(`${baseURL}${endpoint}`, options);
    const responseData = await response.json();
    return { status: response.status, data: responseData };
  } catch (error) {
    return { status: 500, error: error.message };
  }
}

// Test functions
async function test1_AdminLogin() {
  console.log('\n📝 Test 1: Admin Login');
  console.log('=====================================');
  
  const result = await makeRequest('POST', '/api/auth/login', {
    email: TEST_CONFIG.adminEmail,
    password: TEST_CONFIG.adminPassword,
  });

  if (result.status === 200 && result.data.token) {
    testData.adminToken = result.data.token;
    console.log('✅ PASS: Admin logged in successfully');
    console.log(`   Token: ${result.data.token.substring(0, 20)}...`);
    console.log(`   Role: ${result.data.user.role}`);
    return true;
  } else {
    console.log('❌ FAIL: Admin login failed');
    console.log(`   Status: ${result.status}`);
    console.log(`   Error: ${JSON.stringify(result.data)}`);
    return false;
  }
}

async function test2_SellerRegistration() {
  console.log('\n📝 Test 2: Seller Registration');
  console.log('=====================================');
  
  const result = await makeRequest('POST', '/api/auth/register/seller', {
    email: TEST_CONFIG.testSellerEmail,
    password: TEST_CONFIG.testSellerPassword,
    displayName: 'Test Seller',
    businessName: 'Test Electronics Store',
    businessInfo: {
      description: 'Electronics and gadgets retailer',
      address: '123 Test Street, Test City',
      taxId: '12-3456789',
    },
    phone: '+1234567890',
  });

  if (result.status === 201 && result.data.seller) {
    testData.sellerId = result.data.seller.id;
    testData.sellerToken = result.data.token;
    console.log('✅ PASS: Seller registered successfully');
    console.log(`   Seller ID: ${result.data.seller.id}`);
    console.log(`   Business Name: ${result.data.seller.businessName}`);
    console.log(`   Verification Status: ${result.data.seller.verificationStatus}`);
    
    if (result.data.seller.verificationStatus === 'pending') {
      console.log('✅ PASS: Seller status correctly set to pending');
      return true;
    } else {
      console.log('❌ FAIL: Seller status should be pending');
      return false;
    }
  } else {
    console.log('❌ FAIL: Seller registration failed');
    console.log(`   Status: ${result.status}`);
    console.log(`   Error: ${JSON.stringify(result.data)}`);
    return false;
  }
}

async function test3_SellerLogin() {
  console.log('\n📝 Test 3: Seller Login');
  console.log('=====================================');
  
  const result = await makeRequest('POST', '/api/auth/login', {
    email: TEST_CONFIG.testSellerEmail,
    password: TEST_CONFIG.testSellerPassword,
  });

  if (result.status === 200 && result.data.token) {
    testData.sellerToken = result.data.token;
    console.log('✅ PASS: Seller logged in successfully');
    console.log(`   Role: ${result.data.user.role}`);
    console.log(`   Verification Status: ${result.data.user.verificationStatus}`);
    return true;
  } else {
    console.log('❌ FAIL: Seller login failed');
    console.log(`   Status: ${result.status}`);
    console.log(`   Error: ${JSON.stringify(result.data)}`);
    return false;
  }
}

async function test4_SellerCheckStatus() {
  console.log('\n📝 Test 4: Seller Check Status');
  console.log('=====================================');
  
  const result = await makeRequest('GET', '/api/auth/seller/status', null, testData.sellerToken);

  if (result.status === 200) {
    console.log('✅ PASS: Seller status retrieved successfully');
    console.log(`   Verification Status: ${result.data.verificationStatus}`);
    console.log(`   Business Name: ${result.data.businessName}`);
    return true;
  } else {
    console.log('❌ FAIL: Seller status check failed');
    console.log(`   Status: ${result.status}`);
    console.log(`   Error: ${JSON.stringify(result.data)}`);
    return false;
  }
}

async function test5_ManagerCreation() {
  console.log('\n📝 Test 5: Manager Creation (Admin Only)');
  console.log('=====================================');
  
  const result = await makeRequest('POST', '/api/admin/users/manager', {
    email: TEST_CONFIG.testManagerEmail,
    password: TEST_CONFIG.testManagerPassword,
    displayName: 'Test Manager',
    phone: '+1234567891',
  }, testData.adminToken);

  if (result.status === 201 && result.data.manager) {
    testData.managerId = result.data.manager.id;
    console.log('✅ PASS: Manager created successfully');
    console.log(`   Manager ID: ${result.data.manager.id}`);
    console.log(`   Role: ${result.data.manager.role}`);
    return true;
  } else {
    console.log('❌ FAIL: Manager creation failed');
    console.log(`   Status: ${result.status}`);
    console.log(`   Error: ${JSON.stringify(result.data)}`);
    return false;
  }
}

async function test6_ManagerLogin() {
  console.log('\n📝 Test 6: Manager Login');
  console.log('=====================================');
  
  const result = await makeRequest('POST', '/api/auth/login', {
    email: TEST_CONFIG.testManagerEmail,
    password: TEST_CONFIG.testManagerPassword,
  });

  if (result.status === 200 && result.data.token) {
    testData.managerToken = result.data.token;
    console.log('✅ PASS: Manager logged in successfully');
    console.log(`   Role: ${result.data.user.role}`);
    return true;
  } else {
    console.log('❌ FAIL: Manager login failed');
    console.log(`   Status: ${result.status}`);
    console.log(`   Error: ${JSON.stringify(result.data)}`);
    return false;
  }
}

async function test7_AdminApproveSeller() {
  console.log('\n📝 Test 7: Admin Approve Seller');
  console.log('=====================================');
  
  const result = await makeRequest('POST', `/api/admin/sellers/${testData.sellerId}/approve`, null, testData.adminToken);

  if (result.status === 200) {
    console.log('✅ PASS: Seller approved successfully');
    console.log(`   Verification Status: ${result.data.seller.verificationStatus}`);
    return true;
  } else {
    console.log('❌ FAIL: Seller approval failed');
    console.log(`   Status: ${result.status}`);
    console.log(`   Error: ${JSON.stringify(result.data)}`);
    return false;
  }
}

async function test8_ListSellers() {
  console.log('\n📝 Test 8: List All Sellers (Admin/Manager)');
  console.log('=====================================');
  
  // Test with Admin token
  const adminResult = await makeRequest('GET', '/api/admin/sellers', null, testData.adminToken);
  
  if (adminResult.status === 200) {
    console.log('✅ PASS: Admin can list sellers');
    console.log(`   Count: ${adminResult.data.count}`);
  } else {
    console.log('❌ FAIL: Admin cannot list sellers');
    return false;
  }

  // Test with Manager token
  const managerResult = await makeRequest('GET', '/api/admin/sellers', null, testData.managerToken);
  
  if (managerResult.status === 200) {
    console.log('✅ PASS: Manager can list sellers');
    console.log(`   Count: ${managerResult.data.count}`);
    return true;
  } else {
    console.log('❌ FAIL: Manager cannot list sellers');
    return false;
  }
}

async function test9_RoleBasedAccessControl() {
  console.log('\n📝 Test 9: Role-Based Access Control');
  console.log('=====================================');
  
  // Test: Seller should NOT be able to create manager
  const sellerAttempt = await makeRequest('POST', '/api/admin/users/manager', {
    email: 'unauthorized@example.com',
    password: 'Test123!',
    displayName: 'Unauthorized Manager',
  }, testData.sellerToken);

  if (sellerAttempt.status === 403 || sellerAttempt.status === 401) {
    console.log('✅ PASS: Seller correctly denied access to create manager');
  } else {
    console.log('❌ FAIL: Seller should not be able to create manager');
    console.log(`   Status: ${sellerAttempt.status}`);
    return false;
  }

  // Test: Manager should NOT be able to approve sellers
  const managerAttempt = await makeRequest('POST', `/api/admin/sellers/${testData.sellerId}/approve`, null, testData.managerToken);

  if (managerAttempt.status === 403 || managerAttempt.status === 401) {
    console.log('✅ PASS: Manager correctly denied access to approve sellers');
    return true;
  } else {
    console.log('❌ FAIL: Manager should not be able to approve sellers');
    console.log(`   Status: ${managerAttempt.status}`);
    return false;
  }
}

async function test10_GetSellerDetails() {
  console.log('\n📝 Test 10: Get Seller Details');
  console.log('=====================================');
  
  const result = await makeRequest('GET', `/api/admin/sellers/${testData.sellerId}`, null, testData.adminToken);

  if (result.status === 200 && result.data && result.data.id) {
    console.log('✅ PASS: Seller details retrieved successfully');
    console.log(`   Business Name: ${result.data.business_name}`);
    console.log(`   Verification Status: ${result.data.verification_status}`);
    return true;
  } else {
    console.log('❌ FAIL: Get seller details failed');
    console.log(`   Status: ${result.status}`);
    console.log(`   Error: ${JSON.stringify(result.data)}`);
    return false;
  }
}

// Cleanup function
async function cleanup() {
  console.log('\n🧹 Cleaning up test data...');
  
  try {
    // Delete test seller
    if (testData.sellerId) {
      await supabase.from('users').delete().eq('id', testData.sellerId);
      console.log('✅ Test seller deleted');
    }

    // Delete test manager
    if (testData.managerId) {
      await supabase.from('users').delete().eq('id', testData.managerId);
      console.log('✅ Test manager deleted');
    }

    console.log('✅ Cleanup complete');
  } catch (error) {
    console.log('⚠️  Cleanup error:', error.message);
  }
}

// Main test runner
async function runTests() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║     PHASE 2: AUTHENTICATION & AUTHORIZATION TESTS      ║');
  console.log('╚════════════════════════════════════════════════════════╝');

  const tests = [
    { name: 'Admin Login', fn: test1_AdminLogin },
    { name: 'Seller Registration', fn: test2_SellerRegistration },
    { name: 'Seller Login', fn: test3_SellerLogin },
    { name: 'Seller Check Status', fn: test4_SellerCheckStatus },
    { name: 'Manager Creation', fn: test5_ManagerCreation },
    { name: 'Manager Login', fn: test6_ManagerLogin },
    { name: 'Admin Approve Seller', fn: test7_AdminApproveSeller },
    { name: 'List Sellers', fn: test8_ListSellers },
    { name: 'Role-Based Access Control', fn: test9_RoleBasedAccessControl },
    { name: 'Get Seller Details', fn: test10_GetSellerDetails },
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
      console.log(`❌ FAIL: ${test.name} - ${error.message}`);
      failed++;
    }
  }

  // Print summary
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║                     TEST SUMMARY                       ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log(`\n✅ Passed: ${passed}/${tests.length}`);
  console.log(`❌ Failed: ${failed}/${tests.length}`);
  console.log(`📊 Success Rate: ${((passed / tests.length) * 100).toFixed(1)}%\n`);

  // Cleanup
  await cleanup();

  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
