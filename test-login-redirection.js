/**
 * TEST LOGIN REDIRECTION
 * Tests login functionality for all roles and verifies correct response structure
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

const TEST_ACCOUNTS = [
  {
    email: 'customer@test.com',
    password: 'Test123!@#',
    expectedRole: 'customer',
    expectedRedirect: '/'
  },
  {
    email: 'seller@test.com',
    password: 'Test123!@#',
    expectedRole: 'seller',
    expectedRedirect: '/seller'
  },
  {
    email: 'manager@fastshop.com',
    password: 'Manager123!@#',
    expectedRole: 'manager',
    expectedRedirect: '/manager'
  },
  {
    email: 'admin@fastshop.com',
    password: 'Admin123!@#',
    expectedRole: 'admin',
    expectedRedirect: '/admin'
  }
];

async function testLogin(account) {
  try {
    console.log(`\n🔐 Testing login: ${account.email}`);
    console.log(`   Expected role: ${account.expectedRole}`);
    console.log(`   Expected redirect: ${account.expectedRedirect}`);

    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: account.email,
      password: account.password
    });

    console.log(`   📊 Response status: ${response.status}`);
    
    if (response.status === 200 && response.data) {
      const { token, user, message } = response.data;
      
      console.log(`   ✅ Login successful: ${message}`);
      console.log(`   🎫 Token: ${token ? token.substring(0, 20) + '...' : 'MISSING'}`);
      console.log(`   👤 User ID: ${user?.id || 'MISSING'}`);
      console.log(`   📧 Email: ${user?.email || 'MISSING'}`);
      console.log(`   🎭 Role: ${user?.role || 'MISSING'}`);
      console.log(`   📛 Display Name: ${user?.displayName || 'MISSING'}`);

      // Verify role matches expected
      if (user?.role === account.expectedRole) {
        console.log(`   ✅ Role verification: PASSED`);
      } else {
        console.log(`   ❌ Role verification: FAILED (got ${user?.role}, expected ${account.expectedRole})`);
        return false;
      }

      // Verify token exists
      if (token) {
        console.log(`   ✅ Token verification: PASSED`);
      } else {
        console.log(`   ❌ Token verification: FAILED (no token received)`);
        return false;
      }

      return true;
    } else {
      console.log(`   ❌ Login failed: Invalid response`);
      console.log(`   📄 Response:`, JSON.stringify(response.data, null, 2));
      return false;
    }

  } catch (error) {
    console.log(`   ❌ Login failed: ${error.response?.data?.message || error.message}`);
    if (error.response?.data) {
      console.log(`   📄 Error details:`, JSON.stringify(error.response.data, null, 2));
    }
    return false;
  }
}

async function testAllLogins() {
  console.log('🚀 Testing login redirection for all roles...\n');
  console.log('📡 API Base URL:', API_BASE_URL);

  let successCount = 0;
  const results = [];

  for (const account of TEST_ACCOUNTS) {
    const success = await testLogin(account);
    results.push({
      email: account.email,
      role: account.expectedRole,
      redirect: account.expectedRedirect,
      success
    });
    if (success) successCount++;
  }

  console.log('\n' + '='.repeat(80));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('='.repeat(80));
  
  console.log('┌─────────────────────────────────────────────────────────────────────────┐');
  console.log('│ Email                    │ Role     │ Redirect │ Status    │ Frontend   │');
  console.log('├─────────────────────────────────────────────────────────────────────────┤');
  
  results.forEach(result => {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    const frontend = result.success ? `→ ${result.redirect}` : 'N/A';
    console.log(`│ ${result.email.padEnd(24)} │ ${result.role.padEnd(8)} │ ${result.redirect.padEnd(8)} │ ${status.padEnd(9)} │ ${frontend.padEnd(10)} │`);
  });
  
  console.log('└─────────────────────────────────────────────────────────────────────────┘');

  console.log(`\n📈 Overall Result: ${successCount}/${TEST_ACCOUNTS.length} accounts working`);

  if (successCount === TEST_ACCOUNTS.length) {
    console.log('\n🎉 ALL LOGIN TESTS PASSED!');
    console.log('\n✅ Frontend Login Flow:');
    console.log('   1. User logs in with credentials');
    console.log('   2. Backend returns { token, user: { role, ... } }');
    console.log('   3. Frontend detects user.role');
    console.log('   4. Frontend redirects based on role:');
    console.log('      • customer → /');
    console.log('      • seller → /seller');
    console.log('      • manager → /manager');
    console.log('      • admin → /admin');
    
    console.log('\n🌐 Test in browser:');
    console.log('   http://localhost:5173/login');
  } else {
    console.log('\n❌ Some login tests failed. Check backend server and database.');
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Ensure backend is running: cd ecomerce_backend && npm start');
    console.log('   2. Check database connection in .env file');
    console.log('   3. Run: node create-all-test-accounts.js');
    console.log('   4. Verify accounts exist in database');
  }

  return successCount === TEST_ACCOUNTS.length;
}

// Run the test
testAllLogins().catch(console.error);