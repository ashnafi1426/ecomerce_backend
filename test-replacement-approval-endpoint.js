/**
 * Test: PATCH /api/replacements/:id/approve Endpoint
 * 
 * Tests the seller replacement approval endpoint
 * Spec: customer-order-management-enhancements
 * Task: 4.4
 * Requirements: 2.3
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api/v1';

// Test credentials (update these with actual test accounts)
const SELLER_CREDENTIALS = {
  email: 'ashu@gmail.com', // Seller account
  password: 'ashu123'
};

const CUSTOMER_CREDENTIALS = {
  email: 'customer@test.com',
  password: 'customer123'
};

let sellerToken = '';
let customerToken = '';
let testReplacementRequestId = '';
let testOrderId = '';
let testProductId = '';

/**
 * Login as seller
 */
async function loginAsSeller() {
  try {
    console.log('\n1. Logging in as seller...');
    const response = await axios.post(`${API_BASE_URL}/auth/login`, SELLER_CREDENTIALS);
    
    if (response.data.success && response.data.token) {
      sellerToken = response.data.token;
      console.log('✓ Seller login successful');
      console.log('  Seller ID:', response.data.user.id);
      console.log('  Seller Name:', response.data.user.full_name);
      return response.data.user;
    } else {
      throw new Error('Login failed: No token received');
    }
  } catch (error) {
    console.error('✗ Seller login failed:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Login as customer
 */
async function loginAsCustomer() {
  try {
    console.log('\n2. Logging in as customer...');
    const response = await axios.post(`${API_BASE_URL}/auth/login`, CUSTOMER_CREDENTIALS);
    
    if (response.data.success && response.data.token) {
      customerToken = response.data.token;
      console.log('✓ Customer login successful');
      console.log('  Customer ID:', response.data.user.id);
      return response.data.user;
    } else {
      throw new Error('Login failed: No token received');
    }
  } catch (error) {
    console.error('✗ Customer login failed:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Get seller's pending replacement requests
 */
async function getSellerReplacementRequests() {
  try {
    console.log('\n3. Fetching seller\'s replacement requests...');
    const response = await axios.get(`${API_BASE_URL}/replacements/seller-requests`, {
      headers: { Authorization: `Bearer ${sellerToken}` },
      params: { status: 'pending', limit: 10 }
    });
    
    if (response.data.success) {
      const requests = response.data.data.requests || [];
      console.log(`✓ Found ${requests.length} pending replacement request(s)`);
      
      if (requests.length > 0) {
        const request = requests[0];
        testReplacementRequestId = request.id;
        testOrderId = request.order_id;
        testProductId = request.product_id;
        
        console.log('\n  First pending request:');
        console.log('  Request ID:', request.id);
        console.log('  Order ID:', request.order_id);
        console.log('  Product:', request.product?.title || 'N/A');
        console.log('  Reason:', request.reason);
        console.log('  Status:', request.status);
        console.log('  Customer:', request.customer?.full_name || 'N/A');
        
        return request;
      } else {
        console.log('  No pending replacement requests found');
        console.log('  You may need to create a test replacement request first');
        return null;
      }
    }
  } catch (error) {
    console.error('✗ Failed to fetch replacement requests:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Test: Approve replacement request using PATCH endpoint
 */
async function testApproveReplacement() {
  try {
    console.log('\n4. Testing PATCH /api/replacements/:id/approve endpoint...');
    
    if (!testReplacementRequestId) {
      console.log('✗ No replacement request ID available for testing');
      console.log('  Please create a test replacement request first');
      return;
    }
    
    console.log(`  Approving replacement request: ${testReplacementRequestId}`);
    
    const response = await axios.patch(
      `${API_BASE_URL}/replacements/${testReplacementRequestId}/approve`,
      {},
      {
        headers: { Authorization: `Bearer ${sellerToken}` }
      }
    );
    
    if (response.data.success) {
      console.log('✓ Replacement request approved successfully!');
      console.log('\n  Response data:');
      console.log('  Status:', response.data.data.status);
      console.log('  Reviewed by:', response.data.data.reviewed_by);
      console.log('  Reviewed at:', response.data.data.reviewed_at);
      console.log('  Replacement Order ID:', response.data.data.replacement_order_id);
      
      // Verify replacement order was created
      if (response.data.data.replacement_order_id) {
        console.log('\n  ✓ Replacement order created successfully');
        console.log('    Order ID:', response.data.data.replacement_order_id);
        
        if (response.data.data.replacement_order) {
          console.log('    Order Status:', response.data.data.replacement_order.status);
          console.log('    Order Amount:', response.data.data.replacement_order.total_amount);
        }
      } else {
        console.log('\n  ⚠ Warning: No replacement order ID in response');
      }
      
      return response.data.data;
    }
  } catch (error) {
    console.error('✗ Failed to approve replacement:', error.response?.data || error.message);
    
    if (error.response?.status === 400) {
      console.log('\n  Error details:');
      console.log('  Message:', error.response.data.message);
    }
    
    throw error;
  }
}

/**
 * Test: Verify seller authorization (should fail for non-owner)
 */
async function testUnauthorizedApproval() {
  try {
    console.log('\n5. Testing authorization (should fail for non-owner)...');
    
    // Try to approve with customer token (should fail)
    if (customerToken && testReplacementRequestId) {
      try {
        await axios.patch(
          `${API_BASE_URL}/replacements/${testReplacementRequestId}/approve`,
          {},
          {
            headers: { Authorization: `Bearer ${customerToken}` }
          }
        );
        
        console.log('✗ Authorization check failed: Customer was able to approve');
      } catch (error) {
        if (error.response?.status === 403 || error.response?.status === 401) {
          console.log('✓ Authorization check passed: Customer cannot approve');
        } else {
          console.log('⚠ Unexpected error:', error.response?.data?.message || error.message);
        }
      }
    }
  } catch (error) {
    console.error('✗ Authorization test failed:', error.message);
  }
}

/**
 * Test: Verify cannot approve already approved request
 */
async function testDoubleApproval() {
  try {
    console.log('\n6. Testing double approval prevention...');
    
    if (!testReplacementRequestId) {
      console.log('  Skipping: No replacement request ID available');
      return;
    }
    
    try {
      await axios.patch(
        `${API_BASE_URL}/replacements/${testReplacementRequestId}/approve`,
        {},
        {
          headers: { Authorization: `Bearer ${sellerToken}` }
        }
      );
      
      console.log('✗ Double approval check failed: Request was approved twice');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✓ Double approval prevented successfully');
        console.log('  Error message:', error.response.data.message);
      } else {
        console.log('⚠ Unexpected error:', error.response?.data?.message || error.message);
      }
    }
  } catch (error) {
    console.error('✗ Double approval test failed:', error.message);
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('='.repeat(70));
  console.log('REPLACEMENT APPROVAL ENDPOINT TEST');
  console.log('Testing: PATCH /api/replacements/:id/approve');
  console.log('='.repeat(70));
  
  try {
    // Step 1: Login as seller
    await loginAsSeller();
    
    // Step 2: Login as customer (for authorization test)
    try {
      await loginAsCustomer();
    } catch (error) {
      console.log('  Note: Customer login failed, skipping authorization test');
    }
    
    // Step 3: Get pending replacement requests
    await getSellerReplacementRequests();
    
    // Step 4: Test approval endpoint
    await testApproveReplacement();
    
    // Step 5: Test authorization
    await testUnauthorizedApproval();
    
    // Step 6: Test double approval prevention
    await testDoubleApproval();
    
    console.log('\n' + '='.repeat(70));
    console.log('TEST COMPLETED');
    console.log('='.repeat(70));
    
  } catch (error) {
    console.error('\n' + '='.repeat(70));
    console.error('TEST FAILED');
    console.error('='.repeat(70));
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Run tests
runTests();
