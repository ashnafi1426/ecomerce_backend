/**
 * Test Order Detail API
 * Test if the /api/orders/:id endpoint works correctly
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testOrderDetailAPI() {
  try {
    console.log('🧪 Testing Order Detail API...\n');

    // Step 1: Login as customer
    console.log('1️⃣ Logging in as customer...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'ashenafisileshi7@gmail.com',
      password: '14263208@aA'
    });

    const token = loginResponse.data.token || loginResponse.data.data?.token;
    if (!token) {
      console.error('❌ No token received from login');
      console.log('Response:', JSON.stringify(loginResponse.data, null, 2));
      return;
    }

    console.log('✅ Login successful');
    console.log('   Token:', token.substring(0, 20) + '...');
    console.log('');

    // Step 2: Test order detail endpoint with first order
    const orderId = '09364be8-fb99-4023-8012-d10620ae58f9';
    console.log(`2️⃣ Fetching order detail for: ${orderId.substring(0, 8)}...`);
    
    try {
      const orderResponse = await axios.get(`${BASE_URL}/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('✅ Order detail API response:');
      console.log(JSON.stringify(orderResponse.data, null, 2));
      console.log('');

      // Check response structure
      if (orderResponse.data.data) {
        console.log('✅ Response has data property');
        console.log('   Order ID:', orderResponse.data.data.id);
        console.log('   Status:', orderResponse.data.data.status);
      } else if (orderResponse.data.id) {
        console.log('⚠️  Response does NOT have data property (order at root)');
        console.log('   Order ID:', orderResponse.data.id);
        console.log('   Status:', orderResponse.data.status);
      } else {
        console.log('❌ Unexpected response structure');
      }

    } catch (orderError) {
      console.error('❌ Error fetching order detail:');
      if (orderError.response) {
        console.log('   Status:', orderError.response.status);
        console.log('   Data:', JSON.stringify(orderError.response.data, null, 2));
      } else {
        console.log('   Error:', orderError.message);
      }
    }

    console.log('');

    // Step 3: Test with second order
    const orderId2 = '5c8eab57-9491-4b25-8efd-7e529b4e8a4d';
    console.log(`3️⃣ Fetching order detail for: ${orderId2.substring(0, 8)}...`);
    
    try {
      const orderResponse2 = await axios.get(`${BASE_URL}/orders/${orderId2}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('✅ Order detail API response:');
      console.log('   Order ID:', orderResponse2.data.id || orderResponse2.data.data?.id);
      console.log('   Status:', orderResponse2.data.status || orderResponse2.data.data?.status);
      console.log('   Amount:', orderResponse2.data.amount || orderResponse2.data.data?.amount);

    } catch (orderError) {
      console.error('❌ Error fetching order detail:');
      if (orderError.response) {
        console.log('   Status:', orderError.response.status);
        console.log('   Data:', JSON.stringify(orderError.response.data, null, 2));
      } else {
        console.log('   Error:', orderError.message);
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.log('Response:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testOrderDetailAPI();
