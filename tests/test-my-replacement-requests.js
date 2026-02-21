/**
 * Test script for GET /api/replacements/my-requests endpoint
 * Tests Requirement 1.1: Customer can view their replacement request history
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

// Test credentials (use existing customer account)
const CUSTOMER_CREDENTIALS = {
  email: 'customer@example.com',
  password: 'password123'
};

let customerToken = '';

/**
 * Login as customer
 */
async function loginAsCustomer() {
  try {
    console.log('\n🔐 Logging in as customer...');
    const response = await axios.post(`${BASE_URL}/api/auth/login`, CUSTOMER_CREDENTIALS);
    
    if (response.data.success && response.data.token) {
      customerToken = response.data.token;
      console.log('✅ Customer login successful');
      console.log(`   User ID: ${response.data.user.id}`);
      console.log(`   Role: ${response.data.user.role}`);
      return true;
    } else {
      console.log('❌ Customer login failed:', response.data.message);
      return false;
    }
  } catch (error) {
    console.error('❌ Customer login error:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Test GET /api/replacements/my-requests endpoint
 */
async function testGetMyReplacementRequests() {
  try {
    console.log('\n📋 Testing GET /api/replacements/my-requests...');
    
    const response = await axios.get(`${BASE_URL}/api/replacements/my-requests`, {
      headers: {
        'Authorization': `Bearer ${customerToken}`
      }
    });
    
    console.log('✅ Request successful');
    console.log('   Status:', response.status);
    console.log('   Response structure:', JSON.stringify(response.data, null, 2));
    
    // Validate response structure
    if (response.data.success) {
      const { data } = response.data;
      console.log('\n📊 Response Data:');
      console.log(`   Total requests: ${data.total || 0}`);
      console.log(`   Current page: ${data.page || 1}`);
      console.log(`   Limit: ${data.limit || 20}`);
      console.log(`   Total pages: ${data.totalPages || 0}`);
      console.log(`   Requests count: ${data.requests?.length || 0}`);
      
      if (data.requests && data.requests.length > 0) {
        console.log('\n📦 Sample Request:');
        const sample = data.requests[0];
        console.log(`   ID: ${sample.id}`);
        console.log(`   Order ID: ${sample.order_id}`);
        console.log(`   Product ID: ${sample.product_id}`);
        console.log(`   Status: ${sample.status}`);
        console.log(`   Reason: ${sample.reason_category}`);
        console.log(`   Created: ${sample.created_at}`);
      } else {
        console.log('\n   No replacement requests found for this customer');
      }
    }
    
    return true;
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Test with status filter
 */
async function testWithStatusFilter() {
  try {
    console.log('\n🔍 Testing with status filter (status=pending)...');
    
    const response = await axios.get(`${BASE_URL}/api/replacements/my-requests?status=pending`, {
      headers: {
        'Authorization': `Bearer ${customerToken}`
      }
    });
    
    console.log('✅ Request successful');
    console.log(`   Total pending requests: ${response.data.data.total || 0}`);
    
    return true;
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Test pagination
 */
async function testPagination() {
  try {
    console.log('\n📄 Testing pagination (page=1, limit=5)...');
    
    const response = await axios.get(`${BASE_URL}/api/replacements/my-requests?page=1&limit=5`, {
      headers: {
        'Authorization': `Bearer ${customerToken}`
      }
    });
    
    console.log('✅ Request successful');
    console.log(`   Page: ${response.data.data.page}`);
    console.log(`   Limit: ${response.data.data.limit}`);
    console.log(`   Requests returned: ${response.data.data.requests?.length || 0}`);
    
    return true;
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Test unauthorized access (without token)
 */
async function testUnauthorizedAccess() {
  try {
    console.log('\n🚫 Testing unauthorized access (no token)...');
    
    await axios.get(`${BASE_URL}/api/replacements/my-requests`);
    
    console.log('❌ Should have failed but succeeded');
    return false;
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ Correctly rejected unauthorized request');
      return true;
    } else {
      console.error('❌ Unexpected error:', error.response?.data || error.message);
      return false;
    }
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('='.repeat(60));
  console.log('Testing GET /api/replacements/my-requests Endpoint');
  console.log('Requirement 1.1: Customer Replacement Request History');
  console.log('='.repeat(60));
  
  // Login first
  const loginSuccess = await loginAsCustomer();
  if (!loginSuccess) {
    console.log('\n❌ Cannot proceed without login');
    return;
  }
  
  // Run tests
  const results = {
    basicRequest: await testGetMyReplacementRequests(),
    statusFilter: await testWithStatusFilter(),
    pagination: await testPagination(),
    unauthorized: await testUnauthorizedAccess()
  };
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('Test Summary');
  console.log('='.repeat(60));
  console.log(`Basic Request:        ${results.basicRequest ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Status Filter:        ${results.statusFilter ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Pagination:           ${results.pagination ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Unauthorized Access:  ${results.unauthorized ? '✅ PASS' : '❌ FAIL'}`);
  
  const allPassed = Object.values(results).every(r => r === true);
  console.log('\n' + (allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'));
  console.log('='.repeat(60));
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
