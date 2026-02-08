/**
 * TEST PROFILE UPDATE
 * Tests the profile update endpoint
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5004';

// Test data
const testUser = {
  email: `testuser${Date.now()}@test.com`,
  password: 'TestPassword123!',
  displayName: 'Test User'
};

let authToken = '';

async function runTests() {
  console.log('🧪 Testing Profile Update Endpoint\n');

  try {
    // 1. Register user
    console.log('1️⃣  Registering user...');
    const registerRes = await axios.post(`${BASE_URL}/api/auth/register`, testUser);
    authToken = registerRes.data.token;
    console.log('✅ User registered successfully');
    console.log('   Token:', authToken.substring(0, 20) + '...');
    console.log('   User ID:', registerRes.data.user.id);
    console.log('');

    // 2. Get profile
    console.log('2️⃣  Getting user profile...');
    const profileRes = await axios.get(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Profile retrieved successfully');
    console.log('   Email:', profileRes.data.email);
    console.log('   Display Name:', profileRes.data.displayName);
    console.log('   Phone:', profileRes.data.phone);
    console.log('');

    // 3. Update profile
    console.log('3️⃣  Updating profile...');
    const updateData = {
      displayName: 'Updated Test User',
      phone: '+1234567890'
    };
    
    console.log('   Update data:', JSON.stringify(updateData, null, 2));
    
    const updateRes = await axios.put(
      `${BASE_URL}/api/auth/profile`,
      updateData,
      {
        headers: { 
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Profile updated successfully');
    console.log('   Response:', JSON.stringify(updateRes.data, null, 2));
    console.log('');

    // 4. Verify update
    console.log('4️⃣  Verifying update...');
    const verifyRes = await axios.get(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Verification successful');
    console.log('   Display Name:', verifyRes.data.displayName);
    console.log('   Phone:', verifyRes.data.phone);
    console.log('');

    // Check if values match
    if (verifyRes.data.displayName === updateData.displayName && 
        verifyRes.data.phone === updateData.phone) {
      console.log('✅ ALL TESTS PASSED! Profile update working correctly.\n');
    } else {
      console.log('❌ TEST FAILED! Values do not match.\n');
    }

  } catch (error) {
    console.error('❌ TEST FAILED!');
    console.error('Error:', error.message);
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    
    console.log('');
    process.exit(1);
  }
}

// Run tests
runTests();
