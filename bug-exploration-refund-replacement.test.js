/**
 * Bug Condition Exploration Test
 * Refund & Replacement System Routing and Data Issues
 * 
 * CRITICAL: This test MUST FAIL on unfixed code to confirm bugs exist
 * DO NOT attempt to fix the test or code when it fails
 * 
 * This test validates Property 1: Fault Condition - Replacement Routes Return Data Without UUID Errors
 * Validates Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 2.11
 * 
 * Expected Outcome on UNFIXED code:
 * - UUID parsing errors when accessing /customer and /seller routes
 * - 404 errors when accessing /api/admin/replacements
 * - 0 delivered orders in database
 * - Refund/replacement workflows fail due to missing eligible orders
 */

const axios = require('axios');
const { Pool } = require('pg');

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api';
const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'ecommerce_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres'
};

// Test accounts
const TEST_ACCOUNTS = {
  customer: {
    email: 'customer@test.com',
    password: 'password123'
  },
  seller: {
    email: 'seller@test.com',
    password: 'password123'
  },
  admin: {
    email: 'admin@fastshop.com',
    password: 'admin123'
  }
};

let pool;
let customerToken;
let sellerToken;
let adminToken;

/**
 * Setup: Authenticate test users
 */
async function setup() {
  console.log('\n=== Bug Exploration Test Setup ===\n');
  
  pool = new Pool(DB_CONFIG);
  
  try {
    // Authenticate customer
    console.log('Authenticating customer...');
    const customerAuth = await axios.post(`${API_BASE_URL}/auth/login`, TEST_ACCOUNTS.customer);
    customerToken = customerAuth.data.token || customerAuth.data.data?.token;
    console.log(`✓ Customer authenticated: ${customerToken ? 'Success' : 'Failed'}`);
    
    // Authenticate seller
    console.log('Authenticating seller...');
    const sellerAuth = await axios.post(`${API_BASE_URL}/auth/login`, TEST_ACCOUNTS.seller);
    sellerToken = sellerAuth.data.token || sellerAuth.data.data?.token;
    console.log(`✓ Seller authenticated: ${sellerToken ? 'Success' : 'Failed'}`);
    
    // Authenticate admin
    console.log('Authenticating admin...');
    const adminAuth = await axios.post(`${API_BASE_URL}/auth/login`, TEST_ACCOUNTS.admin);
    adminToken = adminAuth.data.token || adminAuth.data.data?.token;
    console.log(`✓ Admin authenticated: ${adminToken ? 'Success' : 'Failed'}`);
    
  } catch (error) {
    console.error('Setup error:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Cleanup: Close database connection
 */
async function cleanup() {
  if (pool) {
    await pool.end();
  }
}

/**
 * Test 1: Customer Route UUID Error Test
 * Bug Condition: GET /api/replacements/customer with valid customer token
 * Expected on UNFIXED code: UUID parsing error "invalid input syntax for type uuid: customer"
 * Expected on FIXED code: 200 status with array data
 */
async function testCustomerRouteUUIDError() {
  console.log('\n--- Test 1: Customer Route UUID Error ---');
  
  try {
    const response = await axios.get(`${API_BASE_URL}/replacements/customer`, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    
    console.log(`Status: ${response.status}`);
    console.log(`Response type: ${Array.isArray(response.data.data?.requests || response.data.data) ? 'Array' : typeof response.data.data}`);
    
    // On FIXED code: Should return 200 with array
    if (response.status === 200 && (Array.isArray(response.data.data?.requests) || Array.isArray(response.data.data))) {
      console.log('✓ PASS: Customer route returns 200 with array data (BUG IS FIXED)');
      return { passed: true, message: 'Customer route works correctly' };
    } else {
      console.log('✗ FAIL: Unexpected response format');
      return { passed: false, message: 'Unexpected response format', data: response.data };
    }
    
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message;
    console.log(`Error: ${errorMessage}`);
    
    // On UNFIXED code: Should get UUID parsing error
    if (errorMessage.includes('uuid') || errorMessage.includes('UUID')) {
      console.log('✓ EXPECTED FAILURE: UUID parsing error detected (BUG EXISTS)');
      return { passed: false, message: 'UUID parsing error', counterexample: errorMessage };
    } else if (error.response?.status === 404) {
      console.log('✓ EXPECTED FAILURE: 404 Not Found (BUG EXISTS - route not found)');
      return { passed: false, message: '404 Not Found', counterexample: errorMessage };
    } else {
      console.log('✗ UNEXPECTED ERROR:', errorMessage);
      return { passed: false, message: 'Unexpected error', counterexample: errorMessage };
    }
  }
}

/**
 * Test 2: Seller Route UUID Error Test
 * Bug Condition: GET /api/replacements/seller with valid seller token
 * Expected on UNFIXED code: UUID parsing error "invalid input syntax for type uuid: seller"
 * Expected on FIXED code: 200 status with array data
 */
async function testSellerRouteUUIDError() {
  console.log('\n--- Test 2: Seller Route UUID Error ---');
  
  try {
    const response = await axios.get(`${API_BASE_URL}/replacements/seller`, {
      headers: { Authorization: `Bearer ${sellerToken}` }
    });
    
    console.log(`Status: ${response.status}`);
    console.log(`Response type: ${Array.isArray(response.data.data?.requests || response.data.data) ? 'Array' : typeof response.data.data}`);
    
    // On FIXED code: Should return 200 with array
    if (response.status === 200 && (Array.isArray(response.data.data?.requests) || Array.isArray(response.data.data))) {
      console.log('✓ PASS: Seller route returns 200 with array data (BUG IS FIXED)');
      return { passed: true, message: 'Seller route works correctly' };
    } else {
      console.log('✗ FAIL: Unexpected response format');
      return { passed: false, message: 'Unexpected response format', data: response.data };
    }
    
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message;
    console.log(`Error: ${errorMessage}`);
    
    // On UNFIXED code: Should get UUID parsing error
    if (errorMessage.includes('uuid') || errorMessage.includes('UUID')) {
      console.log('✓ EXPECTED FAILURE: UUID parsing error detected (BUG EXISTS)');
      return { passed: false, message: 'UUID parsing error', counterexample: errorMessage };
    } else if (error.response?.status === 404) {
      console.log('✓ EXPECTED FAILURE: 404 Not Found (BUG EXISTS - route not found)');
      return { passed: false, message: '404 Not Found', counterexample: errorMessage };
    } else {
      console.log('✗ UNEXPECTED ERROR:', errorMessage);
      return { passed: false, message: 'Unexpected error', counterexample: errorMessage };
    }
  }
}

/**
 * Test 3: Admin Route 404 Test
 * Bug Condition: GET /api/admin/replacements with valid admin token
 * Expected on UNFIXED code: 404 Not Found
 * Expected on FIXED code: 200 status with all replacements
 */
async function testAdminRoute404() {
  console.log('\n--- Test 3: Admin Route 404 Test ---');
  
  try {
    const response = await axios.get(`${API_BASE_URL}/admin/replacements`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    console.log(`Status: ${response.status}`);
    console.log(`Response type: ${Array.isArray(response.data.data?.requests || response.data.data) ? 'Array' : typeof response.data.data}`);
    
    // On FIXED code: Should return 200 with array
    if (response.status === 200 && (Array.isArray(response.data.data?.requests) || Array.isArray(response.data.data))) {
      console.log('✓ PASS: Admin route returns 200 with array data (BUG IS FIXED)');
      return { passed: true, message: 'Admin route works correctly' };
    } else {
      console.log('✗ FAIL: Unexpected response format');
      return { passed: false, message: 'Unexpected response format', data: response.data };
    }
    
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message;
    const statusCode = error.response?.status;
    console.log(`Error: ${statusCode} - ${errorMessage}`);
    
    // On UNFIXED code: Should get 404
    if (statusCode === 404) {
      console.log('✓ EXPECTED FAILURE: 404 Not Found (BUG EXISTS - admin route not mounted)');
      return { passed: false, message: '404 Not Found', counterexample: `${statusCode}: ${errorMessage}` };
    } else {
      console.log('✗ UNEXPECTED ERROR:', errorMessage);
      return { passed: false, message: 'Unexpected error', counterexample: errorMessage };
    }
  }
}

/**
 * Test 4: Delivered Orders Query Test
 * Bug Condition: Query database for orders with fulfillment_status = 'delivered'
 * Expected on UNFIXED code: 0 rows returned
 * Expected on FIXED code: At least 1 delivered order exists
 */
async function testDeliveredOrdersQuery() {
  console.log('\n--- Test 4: Delivered Orders Query Test ---');
  
  try {
    const result = await pool.query(`
      SELECT 
        so.id,
        so.order_id,
        so.fulfillment_status,
        so.delivered_at,
        o.user_id,
        u.email as customer_email
      FROM sub_orders so
      JOIN orders o ON so.parent_order_id = o.id
      JOIN users u ON o.user_id = u.id
      WHERE so.fulfillment_status = 'delivered'
      LIMIT 5
    `);
    
    console.log(`Delivered orders found: ${result.rows.length}`);
    
    if (result.rows.length > 0) {
      console.log('Sample delivered orders:');
      result.rows.forEach((order, idx) => {
        console.log(`  ${idx + 1}. Order ID: ${order.order_id}, Customer: ${order.customer_email}, Delivered: ${order.delivered_at}`);
      });
      console.log('✓ PASS: Delivered orders exist in database (BUG IS FIXED)');
      return { passed: true, message: `${result.rows.length} delivered orders found` };
    } else {
      console.log('✓ EXPECTED FAILURE: No delivered orders found (BUG EXISTS)');
      return { passed: false, message: 'No delivered orders', counterexample: '0 rows with fulfillment_status = delivered' };
    }
    
  } catch (error) {
    console.error('Database query error:', error.message);
    return { passed: false, message: 'Database error', counterexample: error.message };
  }
}

/**
 * Test 5: Refund Workflow Eligible Orders Test
 * Bug Condition: Attempt to find eligible orders for refund workflow
 * Expected on UNFIXED code: 0 eligible orders
 * Expected on FIXED code: At least 1 eligible order for test customer
 */
async function testRefundWorkflowEligibleOrders() {
  console.log('\n--- Test 5: Refund Workflow Eligible Orders Test ---');
  
  try {
    // Get customer ID
    const customerResult = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [TEST_ACCOUNTS.customer.email]
    );
    
    if (customerResult.rows.length === 0) {
      console.log('✗ FAIL: Test customer not found in database');
      return { passed: false, message: 'Test customer not found' };
    }
    
    const customerId = customerResult.rows[0].id;
    
    // Query for eligible refund orders (delivered orders for this customer)
    const result = await pool.query(`
      SELECT 
        so.id as sub_order_id,
        so.order_id,
        so.fulfillment_status,
        so.delivered_at,
        p.name as product_name
      FROM sub_orders so
      JOIN orders o ON so.parent_order_id = o.id
      JOIN products p ON so.product_id = p.id
      WHERE o.user_id = $1
        AND so.fulfillment_status = 'delivered'
        AND so.delivered_at IS NOT NULL
      LIMIT 5
    `, [customerId]);
    
    console.log(`Eligible refund orders for customer: ${result.rows.length}`);
    
    if (result.rows.length > 0) {
      console.log('Sample eligible orders:');
      result.rows.forEach((order, idx) => {
        console.log(`  ${idx + 1}. Sub-order ID: ${order.sub_order_id}, Product: ${order.product_name}, Delivered: ${order.delivered_at}`);
      });
      console.log('✓ PASS: Eligible refund orders exist (BUG IS FIXED)');
      return { passed: true, message: `${result.rows.length} eligible orders found` };
    } else {
      console.log('✓ EXPECTED FAILURE: No eligible refund orders (BUG EXISTS)');
      return { passed: false, message: 'No eligible refund orders', counterexample: '0 delivered orders for test customer' };
    }
    
  } catch (error) {
    console.error('Database query error:', error.message);
    return { passed: false, message: 'Database error', counterexample: error.message };
  }
}

/**
 * Test 6: Replacement Workflow Eligible Orders Test
 * Bug Condition: Attempt to find eligible orders for replacement workflow
 * Expected on UNFIXED code: 0 eligible orders
 * Expected on FIXED code: At least 1 eligible order for test customer
 */
async function testReplacementWorkflowEligibleOrders() {
  console.log('\n--- Test 6: Replacement Workflow Eligible Orders Test ---');
  
  try {
    // Get customer ID
    const customerResult = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [TEST_ACCOUNTS.customer.email]
    );
    
    if (customerResult.rows.length === 0) {
      console.log('✗ FAIL: Test customer not found in database');
      return { passed: false, message: 'Test customer not found' };
    }
    
    const customerId = customerResult.rows[0].id;
    
    // Query for eligible replacement orders (delivered orders for this customer)
    const result = await pool.query(`
      SELECT 
        so.id as sub_order_id,
        so.order_id,
        so.fulfillment_status,
        so.delivered_at,
        p.name as product_name,
        s.id as seller_id,
        su.email as seller_email
      FROM sub_orders so
      JOIN orders o ON so.parent_order_id = o.id
      JOIN products p ON so.product_id = p.id
      JOIN users s ON so.seller_id = s.id
      LEFT JOIN users su ON s.id = su.id
      WHERE o.user_id = $1
        AND so.fulfillment_status = 'delivered'
        AND so.delivered_at IS NOT NULL
      LIMIT 5
    `, [customerId]);
    
    console.log(`Eligible replacement orders for customer: ${result.rows.length}`);
    
    if (result.rows.length > 0) {
      console.log('Sample eligible orders:');
      result.rows.forEach((order, idx) => {
        console.log(`  ${idx + 1}. Sub-order ID: ${order.sub_order_id}, Product: ${order.product_name}, Seller: ${order.seller_email || order.seller_id}`);
      });
      console.log('✓ PASS: Eligible replacement orders exist (BUG IS FIXED)');
      return { passed: true, message: `${result.rows.length} eligible orders found` };
    } else {
      console.log('✓ EXPECTED FAILURE: No eligible replacement orders (BUG EXISTS)');
      return { passed: false, message: 'No eligible replacement orders', counterexample: '0 delivered orders for test customer' };
    }
    
  } catch (error) {
    console.error('Database query error:', error.message);
    return { passed: false, message: 'Database error', counterexample: error.message };
  }
}

/**
 * Main test runner
 */
async function runBugExplorationTests() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║  Bug Condition Exploration Test                                ║');
  console.log('║  Refund & Replacement System Routing and Data Issues           ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  
  const results = {
    total: 6,
    passed: 0,
    failed: 0,
    counterexamples: []
  };
  
  try {
    await setup();
    
    // Run all tests
    const test1 = await testCustomerRouteUUIDError();
    const test2 = await testSellerRouteUUIDError();
    const test3 = await testAdminRoute404();
    const test4 = await testDeliveredOrdersQuery();
    const test5 = await testRefundWorkflowEligibleOrders();
    const test6 = await testReplacementWorkflowEligibleOrders();
    
    // Collect results
    const allTests = [test1, test2, test3, test4, test5, test6];
    allTests.forEach(test => {
      if (test.passed) {
        results.passed++;
      } else {
        results.failed++;
        if (test.counterexample) {
          results.counterexamples.push({
            test: test.message,
            counterexample: test.counterexample
          });
        }
      }
    });
    
    // Summary
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║  Test Summary                                                  ║');
    console.log('╚════════════════════════════════════════════════════════════════╝');
    console.log(`Total Tests: ${results.total}`);
    console.log(`Passed: ${results.passed}`);
    console.log(`Failed: ${results.failed}`);
    
    if (results.counterexamples.length > 0) {
      console.log('\n--- Counterexamples Found (Bugs Detected) ---');
      results.counterexamples.forEach((ce, idx) => {
        console.log(`${idx + 1}. ${ce.test}`);
        console.log(`   Counterexample: ${ce.counterexample}`);
      });
    }
    
    console.log('\n--- Interpretation ---');
    if (results.failed === results.total) {
      console.log('✓ ALL TESTS FAILED: This is EXPECTED on unfixed code.');
      console.log('  The bugs exist and have been confirmed through counterexamples.');
      console.log('  Proceed to implement the fix (Task 3).');
    } else if (results.passed === results.total) {
      console.log('✓ ALL TESTS PASSED: The bugs have been FIXED.');
      console.log('  All routes work correctly and test data exists.');
      console.log('  The system is ready for production use.');
    } else {
      console.log('⚠ PARTIAL FAILURES: Some bugs are fixed, others remain.');
      console.log('  Review the counterexamples and continue fixing.');
    }
    
    // Exit with appropriate code
    process.exit(results.failed > 0 ? 1 : 0);
    
  } catch (error) {
    console.error('\n✗ FATAL ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await cleanup();
  }
}

// Run tests
runBugExplorationTests();
