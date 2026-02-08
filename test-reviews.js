/**
 * REVIEWS & RATINGS TESTS
 * 
 * Comprehensive tests for product reviews and ratings.
 * Tests all 4 requirements:
 * 1. Customers can review purchased products
 * 2. One review per user per product
 * 3. Calculate average ratings
 * 4. Admin moderation
 */

const supabase = require('./config/supabase');
const { hashPassword } = require('./utils/hash');

// Test configuration
const TEST_CONFIG = {
  customerEmail: 'customer-review@test.com',
  customerPassword: 'CustomerPass123',
  customer2Email: 'customer2-review@test.com',
  customer2Password: 'Customer2Pass123',
  adminEmail: 'admin-review@test.com',
  adminPassword: 'AdminPass123'
};

let customerToken = null;
let customer2Token = null;
let adminToken = null;
let testProductId = null;
let testCategoryId = null;
let testReviewId = null;
let testOrderId = null;

// Helper function to make API requests
async function apiRequest(method, endpoint, data = null, token = null) {
  const baseURL = 'http://localhost:5004';
  const headers = {
    'Content-Type': 'application/json'
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = {
    method,
    headers
  };

  if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE')) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(`${baseURL}${endpoint}`, options);
    const responseData = await response.json();
    return {
      status: response.status,
      data: responseData
    };
  } catch (error) {
    console.error(`API Request Error: ${error.message}`);
    throw error;
  }
}

// Setup: Create test users and products
async function setupTestData() {
  console.log('\n=== SETUP: Create Test Data ===');

  try {
    // Hash passwords
    const customerPasswordHash = await hashPassword(TEST_CONFIG.customerPassword);
    const customer2PasswordHash = await hashPassword(TEST_CONFIG.customer2Password);
    const adminPasswordHash = await hashPassword(TEST_CONFIG.adminPassword);

    // Create users
    await supabase.from('users').insert([
      {
        email: TEST_CONFIG.customerEmail,
        password_hash: customerPasswordHash,
        role: 'customer',
        display_name: 'Test Customer Review',
        status: 'active'
      },
      {
        email: TEST_CONFIG.customer2Email,
        password_hash: customer2PasswordHash,
        role: 'customer',
        display_name: 'Test Customer 2 Review',
        status: 'active'
      },
      {
        email: TEST_CONFIG.adminEmail,
        password_hash: adminPasswordHash,
        role: 'admin',
        display_name: 'Test Admin Review',
        status: 'active'
      }
    ]);

    console.log('✅ Test users created');

    // Get auth tokens
    const customerResponse = await apiRequest('POST', '/api/auth/login', {
      email: TEST_CONFIG.customerEmail,
      password: TEST_CONFIG.customerPassword
    });
    customerToken = customerResponse.data.token;

    const customer2Response = await apiRequest('POST', '/api/auth/login', {
      email: TEST_CONFIG.customer2Email,
      password: TEST_CONFIG.customer2Password
    });
    customer2Token = customer2Response.data.token;

    const adminResponse = await apiRequest('POST', '/api/auth/login', {
      email: TEST_CONFIG.adminEmail,
      password: TEST_CONFIG.adminPassword
    });
    adminToken = adminResponse.data.token;

    console.log('✅ Auth tokens obtained');

    // Create test category
    const { data: categoryData } = await supabase
      .from('categories')
      .insert([{
        name: 'Test Review Category',
        description: 'Category for review testing'
      }])
      .select()
      .single();

    testCategoryId = categoryData?.id;

    // Create test product
    const { data: product } = await supabase
      .from('products')
      .insert([{
        title: 'Test Review Product',
        description: 'Product for review testing',
        price: 79.99,
        category_id: testCategoryId,
        status: 'active'
      }])
      .select()
      .single();

    testProductId = product?.id;

    // Create inventory
    await supabase.from('inventory').insert([{
      product_id: testProductId,
      quantity: 100,
      reserved_quantity: 0,
      low_stock_threshold: 10
    }]);

    console.log('✅ Test product and inventory created');

    // Create a completed order for customer 1 (so they can review)
    const { data: order } = await supabase
      .from('orders')
      .insert([{
        user_id: (await supabase.from('users').select('id').eq('email', TEST_CONFIG.customerEmail).single()).data.id,
        payment_intent_id: 'pi_test_review_123',
        amount: 7999,
        basket: [{
          product_id: testProductId,
          title: 'Test Review Product',
          price: 79.99,
          quantity: 1
        }],
        status: 'delivered'
      }])
      .select()
      .single();

    testOrderId = order?.id;
    console.log('✅ Test order created (delivered status)');

    return true;
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    return false;
  }
}

// ============================================
// REQUIREMENT 1: Customers can review purchased products
// ============================================

async function test1_CreateReview() {
  console.log('\n=== TEST 1.1: Create Review for Purchased Product ===');

  try {
    const response = await apiRequest(
      'POST',
      '/api/reviews',
      {
        productId: testProductId,
        rating: 5,
        title: 'Excellent Product!',
        comment: 'This product exceeded my expectations. Highly recommended!'
      },
      customerToken
    );

    if (response.status === 201) {
      testReviewId = response.data.review.id;
      console.log('✅ Review created successfully');
      console.log(`   Review ID: ${testReviewId}`);
      console.log(`   Rating: ${response.data.review.rating}`);
      console.log(`   Status: ${response.data.review.status}`);
      console.log(`   Verified Purchase: ${response.data.review.verified_purchase}`);
      return true;
    } else {
      console.log('❌ Failed to create review');
      console.log(`   Status: ${response.status}`);
      console.log(`   Response:`, JSON.stringify(response.data, null, 2));
      return false;
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

async function test1_CreateReviewWithoutPurchase() {
  console.log('\n=== TEST 1.2: Create Review Without Purchase (Should Still Work) ===');

  try {
    const response = await apiRequest(
      'POST',
      '/api/reviews',
      {
        productId: testProductId,
        rating: 4,
        title: 'Good Product',
        comment: 'Nice product overall'
      },
      customer2Token
    );

    if (response.status === 201) {
      console.log('✅ Review created (not verified purchase)');
      console.log(`   Verified Purchase: ${response.data.review.verified_purchase}`);
      return true;
    } else {
      console.log('❌ Failed to create review');
      return false;
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

// ============================================
// REQUIREMENT 2: One review per user per product
// ============================================

async function test2_PreventDuplicateReview() {
  console.log('\n=== TEST 2: Prevent Duplicate Review (Should Fail) ===');

  try {
    const response = await apiRequest(
      'POST',
      '/api/reviews',
      {
        productId: testProductId,
        rating: 3,
        title: 'Another Review',
        comment: 'Trying to review again'
      },
      customerToken
    );

    if (response.status === 400 && response.data.message.includes('already reviewed')) {
      console.log('✅ Correctly prevented duplicate review');
      return true;
    } else {
      console.log('❌ Should have prevented duplicate review');
      return false;
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

// ============================================
// REQUIREMENT 3: Calculate average ratings
// ============================================

async function test3_GetProductRatingStats() {
  console.log('\n=== TEST 3.1: Get Product Rating Statistics (Before Approval) ===');

  try {
    const response = await apiRequest(
      'GET',
      `/api/products/${testProductId}/rating-stats`,
      null,
      null
    );

    if (response.status === 200) {
      console.log('✅ Retrieved rating statistics');
      console.log(`   Average Rating: ${response.data.averageRating}`);
      console.log(`   Total Reviews: ${response.data.totalReviews}`);
      console.log(`   Distribution:`, response.data.ratingDistribution);
      
      // Should be 0 because reviews are pending
      if (response.data.totalReviews === 0) {
        console.log('✅ Correctly shows 0 reviews (pending approval)');
        return true;
      } else {
        console.log('⚠️  Should show 0 reviews before approval');
        return false;
      }
    } else {
      console.log('❌ Failed to retrieve rating stats');
      return false;
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

// ============================================
// REQUIREMENT 4: Admin moderation
// ============================================

async function test4_GetPendingReviews() {
  console.log('\n=== TEST 4.1: Admin Get Pending Reviews ===');

  try {
    const response = await apiRequest(
      'GET',
      '/api/admin/reviews/pending',
      null,
      adminToken
    );

    if (response.status === 200 && Array.isArray(response.data)) {
      console.log(`✅ Retrieved ${response.data.length} pending reviews`);
      return true;
    } else {
      console.log('❌ Failed to retrieve pending reviews');
      return false;
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

async function test4_ApproveReview() {
  console.log('\n=== TEST 4.2: Admin Approve Review ===');

  try {
    const response = await apiRequest(
      'POST',
      `/api/admin/reviews/${testReviewId}/approve`,
      {},
      adminToken
    );

    if (response.status === 200 && response.data.review.status === 'approved') {
      console.log('✅ Review approved successfully');
      return true;
    } else {
      console.log('❌ Failed to approve review');
      return false;
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

async function test3_GetProductRatingStatsAfterApproval() {
  console.log('\n=== TEST 3.2: Get Product Rating Statistics (After Approval) ===');

  try {
    const response = await apiRequest(
      'GET',
      `/api/products/${testProductId}/rating-stats`,
      null,
      null
    );

    if (response.status === 200) {
      console.log('✅ Retrieved rating statistics');
      console.log(`   Average Rating: ${response.data.averageRating}`);
      console.log(`   Total Reviews: ${response.data.totalReviews}`);
      console.log(`   Distribution:`, response.data.ratingDistribution);
      
      if (response.data.totalReviews > 0) {
        console.log('✅ Correctly shows reviews after approval');
        return true;
      } else {
        console.log('⚠️  Should show reviews after approval');
        return false;
      }
    } else {
      console.log('❌ Failed to retrieve rating stats');
      return false;
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

async function test_GetProductReviews() {
  console.log('\n=== TEST: Get Product Reviews ===');

  try {
    const response = await apiRequest(
      'GET',
      `/api/products/${testProductId}/reviews`,
      null,
      null
    );

    if (response.status === 200 && Array.isArray(response.data)) {
      console.log(`✅ Retrieved ${response.data.length} approved reviews`);
      return true;
    } else {
      console.log('❌ Failed to retrieve reviews');
      return false;
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

async function test_UpdateReview() {
  console.log('\n=== TEST: Update Review ===');

  try {
    const response = await apiRequest(
      'PUT',
      `/api/reviews/${testReviewId}`,
      {
        rating: 4,
        title: 'Updated Review Title',
        comment: 'Updated comment'
      },
      customerToken
    );

    if (response.status === 200) {
      console.log('✅ Review updated successfully');
      console.log(`   New Status: ${response.data.review.status} (reset to pending)`);
      return true;
    } else {
      console.log('❌ Failed to update review');
      return false;
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

async function test_GetMyReviews() {
  console.log('\n=== TEST: Get My Reviews ===');

  try {
    const response = await apiRequest(
      'GET',
      '/api/reviews/my-reviews',
      null,
      customerToken
    );

    if (response.status === 200 && Array.isArray(response.data)) {
      console.log(`✅ Retrieved ${response.data.length} my reviews`);
      return true;
    } else {
      console.log('❌ Failed to retrieve my reviews');
      return false;
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

async function test_AdminGetAllReviews() {
  console.log('\n=== TEST: Admin Get All Reviews ===');

  try {
    const response = await apiRequest(
      'GET',
      '/api/admin/reviews',
      null,
      adminToken
    );

    if (response.status === 200 && Array.isArray(response.data)) {
      console.log(`✅ Admin retrieved ${response.data.length} reviews`);
      return true;
    } else {
      console.log('❌ Failed to retrieve all reviews');
      return false;
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

async function test_AdminGetStatistics() {
  console.log('\n=== TEST: Admin Get Review Statistics ===');

  try {
    const response = await apiRequest(
      'GET',
      '/api/admin/reviews/statistics',
      null,
      adminToken
    );

    if (response.status === 200) {
      console.log('✅ Retrieved review statistics');
      console.log(`   Total Reviews: ${response.data.total_reviews}`);
      console.log(`   Pending: ${response.data.pending}`);
      console.log(`   Approved: ${response.data.approved}`);
      console.log(`   Rejected: ${response.data.rejected}`);
      console.log(`   Average Rating: ${response.data.average_rating}`);
      return true;
    } else {
      console.log('❌ Failed to retrieve statistics');
      return false;
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

async function test_CustomerCannotAccessAdminEndpoints() {
  console.log('\n=== TEST: Customer Cannot Access Admin Endpoints ===');

  try {
    const response = await apiRequest(
      'GET',
      '/api/admin/reviews',
      null,
      customerToken
    );

    if (response.status === 403) {
      console.log('✅ Customer correctly denied admin access');
      return true;
    } else {
      console.log('❌ Customer should not access admin endpoints');
      return false;
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

// Cleanup function
async function cleanup() {
  console.log('\n=== CLEANUP ===');

  try {
    // Delete reviews
    await supabase.from('reviews').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // Delete orders
    if (testOrderId) {
      await supabase.from('orders').delete().eq('id', testOrderId);
    }

    // Delete inventory
    if (testProductId) {
      await supabase.from('inventory').delete().eq('product_id', testProductId);
    }

    // Delete product
    if (testProductId) {
      await supabase.from('products').delete().eq('id', testProductId);
    }

    // Delete category
    if (testCategoryId) {
      await supabase.from('categories').delete().eq('id', testCategoryId);
    }

    // Delete users
    await supabase.from('users').delete().eq('email', TEST_CONFIG.customerEmail);
    await supabase.from('users').delete().eq('email', TEST_CONFIG.customer2Email);
    await supabase.from('users').delete().eq('email', TEST_CONFIG.adminEmail);

    console.log('✅ Cleanup complete');
  } catch (error) {
    console.error('⚠️  Cleanup error:', error.message);
  }
}

// Main test runner
async function runTests() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   REVIEWS & RATINGS TESTS                                  ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  // Setup
  const setupSuccess = await setupTestData();
  if (!setupSuccess) {
    console.log('❌ Setup failed, aborting tests');
    process.exit(1);
  }

  const tests = [
    // Requirement 1: Customers can review purchased products
    { name: 'REQ 1.1: Create Review (Purchased)', fn: test1_CreateReview },
    { name: 'REQ 1.2: Create Review (Not Purchased)', fn: test1_CreateReviewWithoutPurchase },
    
    // Requirement 2: One review per user per product
    { name: 'REQ 2: Prevent Duplicate Review', fn: test2_PreventDuplicateReview },
    
    // Requirement 3: Calculate average ratings
    { name: 'REQ 3.1: Rating Stats (Before Approval)', fn: test3_GetProductRatingStats },
    
    // Requirement 4: Admin moderation
    { name: 'REQ 4.1: Get Pending Reviews', fn: test4_GetPendingReviews },
    { name: 'REQ 4.2: Approve Review', fn: test4_ApproveReview },
    
    // Requirement 3: Calculate average ratings (after approval)
    { name: 'REQ 3.2: Rating Stats (After Approval)', fn: test3_GetProductRatingStatsAfterApproval },
    
    // Additional tests
    { name: 'Get Product Reviews', fn: test_GetProductReviews },
    { name: 'Update Review', fn: test_UpdateReview },
    { name: 'Get My Reviews', fn: test_GetMyReviews },
    { name: 'Admin: Get All Reviews', fn: test_AdminGetAllReviews },
    { name: 'Admin: Get Statistics', fn: test_AdminGetStatistics },
    { name: 'Security: Customer Denied Admin Access', fn: test_CustomerCannotAccessAdminEndpoints }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.error(`❌ Test "${test.name}" threw an error:`, error.message);
      failed++;
    }
  }

  // Cleanup
  await cleanup();

  // Summary
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║   TEST SUMMARY                                             ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`Total Tests: ${tests.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / tests.length) * 100).toFixed(2)}%`);
  
  console.log('\n📋 REQUIREMENTS COVERAGE:');
  console.log('1. ✅ Customers can review purchased products');
  console.log('2. ✅ One review per user per product');
  console.log('3. ✅ Calculate average ratings');
  console.log('4. ✅ Admin moderation');

  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
