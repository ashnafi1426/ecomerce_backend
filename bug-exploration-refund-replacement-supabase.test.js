/**
 * Bug Condition Exploration Test (Supabase Version)
 * Refund & Replacement System Routing and Data Issues
 * 
 * This test validates Property 1: Fault Condition - Replacement Routes Return Data Without UUID Errors
 * Validates Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 2.11
 */

const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api';
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('✗ ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

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

let customerToken;
let sellerToken;
let adminToken;

/**
 * Setup: Authenticate test users
 */
async function setup() {
  console.log('\n=== Bug Exploration Test Setup ===\n');
  
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
 * Test 1: Customer Route UUID Error Test
 */
async function testCustomerRouteUUIDError() {
  console.log('\n--- Test 1: Customer Route UUID Error ---');
  
  try {
    const response = await axios.get(`${API_BASE_URL}/replacements/customer`, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    
    console.log(`Status: ${response.status}`);
    console.log(`Response type: ${Array.isArray(response.data.data?.requests || response.data.data) ? 'Array' : typeof response.data.data}`);
    
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
 */
async function testSellerRouteUUIDError() {
  console.log('\n--- Test 2: Seller Route UUID Error ---');
  
  try {
    const response = await axios.get(`${API_BASE_URL}/replacements/seller`, {
      headers: { Authorization: `Bearer ${sellerToken}` }
    });
    
    console.log(`Status: ${response.status}`);
    console.log(`Response type: ${Array.isArray(response.data.data?.requests || response.data.data) ? 'Array' : typeof response.data.data}`);
    
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
 */
async function testAdminRoute404() {
  console.log('\n--- Test 3: Admin Route 404 Test ---');
  
  try {
    const response = await axios.get(`${API_BASE_URL}/admin/replacements`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    console.log(`Status: ${response.status}`);
    console.log(`Response type: ${Array.isArray(response.data.data?.requests || response.data.data) ? 'Array' : typeof response.data.data}`);
    
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
 */
async function testDeliveredOrdersQuery() {
  console.log('\n--- Test 4: Delivered Orders Query Test ---');
  
  try {
    const { data: customerData } = await supabase
      .from('users')
      .select('id')
      .eq('email', 'customer@test.com')
      .single();
    
    if (!customerData) {
      console.log('✗ FAIL: customer@test.com not found');
      return { passed: false, message: 'Customer not found' };
    }
    
    const { data: deliveredOrders, count } = await supabase
      .from('sub_orders')
      .select(`
        id,
        parent_order_id,
        fulfillment_status,
        delivered_at,
        orders!inner(user_id)
      `, { count: 'exact' })
      .eq('orders.user_id', customerData.id)
      .eq('fulfillment_status', 'delivered')
      .limit(5);
    
    console.log(`Delivered orders found: ${count || 0}`);
    
    if (deliveredOrders && deliveredOrders.length > 0) {
      console.log('Sample delivered orders:');
      deliveredOrders.forEach((order, idx) => {
        console.log(`  ${idx + 1}. Sub-order ID: ${order.id}, Delivered: ${order.delivered_at}`);
      });
      console.log('✓ PASS: Delivered orders exist in database (BUG IS FIXED)');
      return { passed: true, message: `${count} delivered orders found` };
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
 * Test 5 & 6: Refund and Replacement Workflow Eligible Orders
 */
async function testWorkflowEligibleOrders() {
  console.log('\n--- Test 5 & 6: Workflow Eligible Orders Test ---');
  
  try {
    const { data: customerData } = await supabase
      .from('users')
      .select('id')
      .eq('email', 'customer@test.com')
      .single();
    
    if (!customerData) {
      console.log('✗ FAIL: customer@test.com not found');
      return { passed: false, message: 'Customer not found' };
    }
    
    const { data: eligibleOrders, count } = await supabase
      .from('sub_orders')
      .select(`
        id,
        parent_order_id,
        fulfillment_status,
        delivered_at,
        orders!inner(user_id)
      `, { count: 'exact' })
      .eq('orders.user_id', customerData.id)
      .eq('fulfillment_status', 'delivered')
      .not('delivered_at', 'is', null)
      .limit(5);
    
    console.log(`Eligible orders for refund/replacement: ${count || 0}`);
    
    if (eligibleOrders && eligibleOrders.length > 0) {
      console.log('Sample eligible orders:');
      eligibleOrders.forEach((order, idx) => {
        console.log(`  ${idx + 1}. Sub-order ID: ${order.id}`);
      });
      console.log('✓ PASS: Eligible orders exist for workflows (BUG IS FIXED)');
      return { passed: true, message: `${count} eligible orders found` };
    } else {
      console.log('✓ EXPECTED FAILURE: No eligible orders (BUG EXISTS)');
      return { passed: false, message: 'No eligible orders', counterexample: '0 delivered orders for test customer' };
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
  console.log('║  Bug Condition Exploration Test (Supabase)                    ║');
  console.log('║  Refund & Replacement System Routing and Data Issues           ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  
  const results = {
    total: 5,
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
    const test5 = await testWorkflowEligibleOrders();
    
    // Collect results
    const allTests = [test1, test2, test3, test4, test5];
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
  }
}

// Run tests
runBugExplorationTests();
