/**
 * Test Payment Endpoint
 * 
 * This script tests if the payment endpoint is working correctly
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testPaymentEndpoint() {
  console.log('\n🧪 Testing Payment Endpoint\n');
  console.log('='.repeat(60));
  
  try {
    // Test data
    const testData = {
      cartItems: [
        {
          id: 'test-product-id',
          quantity: 1
        }
      ],
      shippingAddress: {
        fullName: 'Test User',
        email: 'test@example.com',
        address: '123 Test St',
        city: 'Test City',
        state: 'TS',
        zipCode: '12345',
        country: 'United States',
        phone: '1234567890'
      },
      billingAddress: {
        fullName: 'Test User',
        email: 'test@example.com',
        address: '123 Test St',
        city: 'Test City',
        state: 'TS',
        zipCode: '12345',
        country: 'United States',
        phone: '1234567890'
      }
    };
    
    console.log('\n1️⃣  Testing POST /api/payments/create-intent\n');
    console.log('   Endpoint: ' + BASE_URL + '/api/payments/create-intent');
    console.log('   Method: POST');
    console.log('   Data: Cart with 1 item\n');
    
    const response = await axios.post(
      BASE_URL + '/api/payments/create-intent',
      testData,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );
    
    console.log('✅ Payment endpoint is working!\n');
    console.log('Response Status:', response.status);
    console.log('Response Data:', JSON.stringify(response.data, null, 2));
    console.log('\n' + '='.repeat(60));
    console.log('\n✅ Test Passed! Payment endpoint is accessible.\n');
    
  } catch (error) {
    console.log('❌ Payment endpoint test failed!\n');
    
    if (error.code === 'ECONNREFUSED') {
      console.log('🔴 ERROR: Cannot connect to backend server');
      console.log('   The backend server is not running on ' + BASE_URL);
      console.log('\n💡 SOLUTION:');
      console.log('   1. Open a new terminal');
      console.log('   2. cd ecomerce_backend');
      console.log('   3. npm start');
      console.log('   4. Wait for "Server running on port 5000"');
      console.log('   5. Run this test again\n');
    } else if (error.response) {
      console.log('🔴 ERROR: Server responded with error');
      console.log('   Status:', error.response.status);
      console.log('   Message:', error.response.data?.error || error.response.data?.message || 'Unknown error');
      console.log('\n   Full Response:', JSON.stringify(error.response.data, null, 2));
      
      if (error.response.status === 404) {
        console.log('\n💡 SOLUTION:');
        console.log('   The payment route is not registered.');
        console.log('   Check ecomerce_backend/routes/index.js');
        console.log('   Ensure payment routes are imported and mounted.\n');
      } else if (error.response.status === 500) {
        console.log('\n💡 SOLUTION:');
        console.log('   Internal server error. Check backend logs.');
        console.log('   Common causes:');
        console.log('   - Missing STRIPE_SECRET_KEY in .env');
        console.log('   - Database connection error');
        console.log('   - Missing product in database\n');
      }
    } else if (error.request) {
      console.log('🔴 ERROR: No response from server');
      console.log('   Request was made but no response received');
      console.log('   Error:', error.message);
    } else {
      console.log('🔴 ERROR:', error.message);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('');
    process.exit(1);
  }
  
  process.exit(0);
}

testPaymentEndpoint();
