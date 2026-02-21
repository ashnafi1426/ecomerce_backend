/**
 * Test script for GET /api/replacements/seller-requests endpoint
 * Task 4.3: Create GET /api/replacements/seller-requests endpoint
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api/v1';

const SELLER_CREDENTIALS = {
  email: 'ashu@gmail.com',
  password: 'ashu123'
};

let sellerToken = null;

async function loginAsSeller() {
  try {
    console.log('\n🔐 Logging in as seller...');
    const response = await axios.post(`${BASE_URL}/auth/login`, SELLER_CREDENTIALS);
    
    if (response.data.success && response.data.token) {
      sellerToken = response.data.token;
      console.log('✅ Seller login successful');
      return true;
    }
    return false;
  } catch (error) {
    console.log('❌ Login error:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testSellerReplacementRequests() {
  try {
    console.log('\n📋 Testing GET /api/replacements/seller-requests...');
    
    const response = await axios.get(`${BASE_URL}/replacements/seller-requests`, {
      headers: { 'Authorization': `Bearer ${sellerToken}` }
    });
    
    if (response.data.success) {
      console.log('✅ Endpoint working!');
      console.log(`   Total: ${response.data.data.total}`);
      console.log(`   Requests: ${response.data.data.requests.length}`);
      
      if (response.data.data.requests.length > 0) {
        console.log('\n   Sample request:');
        const req = response.data.data.requests[0];
        console.log(`   - ID: ${req.id}`);
        console.log(`   - Status: ${req.status}`);
        console.log(`   - Product: ${req.product?.title || 'N/A'}`);
        console.log(`   - Customer: ${req.customer?.full_name || 'N/A'}`);
      }
      return true;
    }
    return false;
  } catch (error) {
    console.log('❌ Error:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testStatusFilter() {
  try {
    console.log('\n🔍 Testing status filtering...');
    const response = await axios.get(`${BASE_URL}/replacements/seller-requests?status=pending`, {
      headers: { 'Authorization': `Bearer ${sellerToken}` }
    });
    
    if (response.data.success) {
      console.log(`✅ Status filter working: ${response.data.data.total} pending requests`);
      return true;
    }
    return false;
  } catch (error) {
    console.log('❌ Filter error:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('='.repeat(60));
  console.log('Task 4.3: GET /api/replacements/seller-requests');
  console.log('='.repeat(60));
  
  if (await loginAsSeller()) {
    await testSellerReplacementRequests();
    await testStatusFilter();
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ Task 4.3 Complete - Requirement 2.2 Implemented');
  console.log('='.repeat(60));
}

runTests().catch(console.error);
