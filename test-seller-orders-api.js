/**
 * Test Seller Orders API
 * 
 * This script tests the seller orders endpoint to see what data is returned
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

// Test credentials for seller
const SELLER_CREDENTIALS = {
  email: 'seller@test.com',
  password: 'password123'
};

async function testSellerOrdersAPI() {
  try {
    console.log('🔍 Testing Seller Orders API...\n');
    
    // Step 1: Login as seller
    console.log('1. Logging in as seller...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, SELLER_CREDENTIALS);
    const token = loginResponse.data.token;
    console.log('✅ Login successful');
    
    // Step 2: Test dashboard stats
    console.log('\n2. Testing dashboard stats...');
    const dashboardResponse = await axios.get(`${API_BASE_URL}/seller/dashboard`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Dashboard stats response:');
    console.log(JSON.stringify(dashboardResponse.data, null, 2));
    
    // Step 3: Test orders endpoint
    console.log('\n3. Testing orders endpoint...');
    const ordersResponse = await axios.get(`${API_BASE_URL}/seller/orders`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Orders response:');
    console.log(JSON.stringify(ordersResponse.data, null, 2));
    
    // Step 4: Test sub-orders endpoint
    console.log('\n4. Testing sub-orders endpoint...');
    const subOrdersResponse = await axios.get(`${API_BASE_URL}/seller/sub-orders`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Sub-orders response:');
    console.log(JSON.stringify(subOrdersResponse.data, null, 2));
    
    // Step 5: Test products endpoint
    console.log('\n5. Testing products endpoint...');
    const productsResponse = await axios.get(`${API_BASE_URL}/seller/products`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Products response:');
    console.log(JSON.stringify(productsResponse.data, null, 2));
    
    console.log('\n🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
    console.error('URL:', error.config?.url);
  }
}

// Run the test
testSellerOrdersAPI();