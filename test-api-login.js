/**
 * TEST API LOGIN
 * Test the actual API endpoints
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testAPILogin() {
  console.log('\n🧪 Testing API Login Endpoints...\n');

  try {
    // Test 1: Register a new customer
    console.log('📋 Test 1: Register Customer');
    const registerData = {
      email: `test-${Date.now()}@example.com`,
      password: 'TestPassword123',
      displayName: 'Test User'
    };
    
    console.log('   Request:', JSON.stringify(registerData, null, 2));
    
    try {
      const registerResponse = await axios.post(
        `${BASE_URL}/api/auth/register`,
        registerData
      );
      
      console.log('   ✅ Registration successful');
      console.log('   Status:', registerResponse.status);
      console.log('   Response:', JSON.stringify(registerResponse.data, null, 2));
      
      const token = registerResponse.data.token;
      const email = registerData.email;
      const password = registerData.password;
      
      // Test 2: Login with the registered user
      console.log('\n📋 Test 2: Login with Registered User');
      const loginData = {
        email: email,
        password: password
      };
      
      console.log('   Request:', JSON.stringify(loginData, null, 2));
      
      const loginResponse = await axios.post(
        `${BASE_URL}/api/auth/login`,
        loginData
      );
      
      console.log('   ✅ Login successful');
      console.log('   Status:', loginResponse.status);
      console.log('   Response:', JSON.stringify(loginResponse.data, null, 2));
      
      // Test 3: Try wrong password
      console.log('\n📋 Test 3: Login with Wrong Password');
      const wrongLoginData = {
        email: email,
        password: 'WrongPassword123'
      };
      
      try {
        await axios.post(
          `${BASE_URL}/api/auth/login`,
          wrongLoginData
        );
        console.log('   ❌ Should have failed but succeeded');
      } catch (error) {
        if (error.response) {
          console.log('   ✅ Correctly rejected wrong password');
          console.log('   Status:', error.response.status);
          console.log('   Error:', error.response.data.message);
        }
      }
      
      // Test 4: Try non-existent email
      console.log('\n📋 Test 4: Login with Non-existent Email');
      const nonExistentData = {
        email: 'nonexistent@example.com',
        password: 'SomePassword123'
      };
      
      try {
        await axios.post(
          `${BASE_URL}/api/auth/login`,
          nonExistentData
        );
        console.log('   ❌ Should have failed but succeeded');
      } catch (error) {
        if (error.response) {
          console.log('   ✅ Correctly rejected non-existent email');
          console.log('   Status:', error.response.status);
          console.log('   Error:', error.response.data.message);
        }
      }
      
      // Test 5: Get profile with token
      console.log('\n📋 Test 5: Get Profile with Token');
      try {
        const profileResponse = await axios.get(
          `${BASE_URL}/api/auth/me`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        
        console.log('   ✅ Profile retrieved successfully');
        console.log('   Response:', JSON.stringify(profileResponse.data, null, 2));
      } catch (error) {
        console.log('   ❌ Failed to get profile:', error.response?.data?.message || error.message);
      }
      
      console.log('\n✨ All API tests completed!\n');
      
    } catch (error) {
      if (error.response) {
        console.log('   ❌ Registration failed');
        console.log('   Status:', error.response.status);
        console.log('   Error:', JSON.stringify(error.response.data, null, 2));
      } else {
        console.log('   ❌ Request failed:', error.message);
      }
    }
    
  } catch (error) {
    console.error('\n❌ Error during test:', error.message);
  }
}

// Check if server is running first
async function checkServer() {
  try {
    await axios.get(`${BASE_URL}/api/health`);
    return true;
  } catch (error) {
    return false;
  }
}

async function main() {
  console.log('🔍 Checking if server is running...');
  const isRunning = await checkServer();
  
  if (!isRunning) {
    console.log('❌ Server is not running at', BASE_URL);
    console.log('   Please start the server with: npm start');
    console.log('   Or: node server.js\n');
    return;
  }
  
  console.log('✅ Server is running\n');
  await testAPILogin();
}

main();
