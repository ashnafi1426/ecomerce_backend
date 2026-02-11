/**
 * Test Manager Login Flow
 * 
 * This script tests the manager login and verifies the response structure
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

// Manager credentials
const MANAGER_CREDENTIALS = {
  email: 'manager@test.com',
  password: 'Test123!@#'
};

async function testManagerLogin() {
  console.log('🧪 Testing Manager Login Flow...\n');
  console.log('='.repeat(60));
  
  try {
    console.log('\n📝 Step 1: Attempting login...');
    console.log('Email:', MANAGER_CREDENTIALS.email);
    
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, MANAGER_CREDENTIALS);
    
    console.log('\n✅ Login successful!');
    console.log('\n📦 Response structure:');
    console.log(JSON.stringify(loginResponse.data, null, 2));
    
    // Verify response structure
    const { token, user } = loginResponse.data;
    
    console.log('\n🔍 Verification:');
    console.log('✓ Token exists:', !!token);
    console.log('✓ User exists:', !!user);
    console.log('✓ User ID:', user?.id);
    console.log('✓ User email:', user?.email);
    console.log('✓ User role:', user?.role);
    console.log('✓ User displayName:', user?.displayName);
    
    if (user?.role !== 'manager') {
      console.log('\n❌ ERROR: User role is not "manager"!');
      console.log('Expected: manager');
      console.log('Got:', user?.role);
      return false;
    }
    
    console.log('\n✅ All checks passed!');
    console.log('\n📋 Frontend should redirect to: /manager');
    
    return true;
  } catch (error) {
    console.error('\n❌ Login failed!');
    console.error('Error:', error.response?.data || error.message);
    return false;
  }
}

// Run test
testManagerLogin().then(success => {
  console.log('\n' + '='.repeat(60));
  if (success) {
    console.log('✅ Manager login test PASSED');
  } else {
    console.log('❌ Manager login test FAILED');
  }
  console.log('='.repeat(60));
  process.exit(success ? 0 : 1);
});
