/**
 * ANALYTICS & REPORTS TESTS
 * 
 * Comprehensive tests for analytics and reporting system.
 * Tests all 5 requirements:
 * 1. Sales reports
 * 2. Revenue reports
 * 3. Customer behavior analytics
 * 4. Inventory reports
 * 5. Admin-only access
 */

const supabase = require('./config/supabase');
const { hashPassword } = require('./utils/hash');

// Test configuration
const TEST_CONFIG = {
  adminEmail: 'admin-analytics@test.com',
  adminPassword: 'AdminPass123',
  customerEmail: 'customer-analytics@test.com',
  customerPassword: 'CustomerPass123'
};

let adminToken = null;
let customerToken = null;

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

  if (data && (method === 'POST' || method === 'PUT')) {
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

// Setup: Create test users
async function setupTestData() {
  console.log('\n=== SETUP: Create Test Data ===');

  try {
    // Hash passwords
    const adminPasswordHash = await hashPassword(TEST_CONFIG.adminPassword);
    const customerPasswordHash = await hashPassword(TEST_CONFIG.customerPassword);

    // Create users
    await supabase.from('users').insert([
      {
        email: TEST_CONFIG.adminEmail,
        password_hash: adminPasswordHash,
        role: 'admin',
        display_name: 'Test Admin Analytics',
        status: 'active'
      },
      {
        email: TEST_CONFIG.customerEmail,
        password_hash: customerPasswordHash,
        role: 'customer',
        display_name: 'Test Customer Analytics',
        status: 'active'
      }
    ]);

    console.log('✅ Test users created');

    // Get auth tokens
    const adminResponse = await apiRequest('POST', '/api/auth/login', {
      email: TEST_CONFIG.adminEmail,
      password: TEST_CONFIG.adminPassword
    });
    adminToken = adminResponse.data.token;

    const customerResponse = await apiRequest('POST', '/api/auth/login', {
      email: TEST_CONFIG.customerEmail,
      password: TEST_CONFIG.customerPassword
    });
    customerToken = customerResponse.data.token;

    console.log('✅ Auth tokens obtained');

    return true;
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    return false;
  }
}

// ============================================
// REQUIREMENT 1: Sales Reports
// ============================================

async function test1_GetSalesOverview() {
  console.log('\n=== TEST 1.1: Get Sales Overview ===');

  try {
    const response = await apiRequest(
      'GET',
      '/api/admin/analytics/sales/overview',
      null,
      adminToken
    );

    if (response.status === 200) {
      console.log('✅ Sales overview retrieved');
      console.log(`   Total Orders: ${response.data.totalOrders}`);
      console.log(`   Total Sales: $${response.data.totalSales}`);
      console.log(`   Average Order Value: $${response.data.averageOrderValue}`);
      return true;
    } else {
      console.log('❌ Failed to retrieve sales overview');
      return false;
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

async function test1_GetSalesByDate() {
  console.log('\n=== TEST 1.2: Get Sales By Date ===');

  try {
    const response = await apiRequest(
      'GET',
      '/api/admin/analytics/sales/by-date?groupBy=day',
      null,
      adminToken
    );

    if (response.status === 200 && Array.isArray(response.data)) {
      console.log(`✅ Sales by date retrieved (${response.data.length} periods)`);
      return true;
    } else {
      console.log('❌ Failed to retrieve sales by date');
      return false;
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

async function test1_GetTopSellingProducts() {
  console.log('\n=== TEST 1.3: Get Top Selling Products ===');

  try {
    const response = await apiRequest(
      'GET',
      '/api/admin/analytics/sales/top-products?limit=5',
      null,
      adminToken
    );

    if (response.status === 200 && Array.isArray(response.data)) {
      console.log(`✅ Top selling products retrieved (${response.data.length} products)`);
      return true;
    } else {
      console.log('❌ Failed to retrieve top selling products');
      return false;
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

// ============================================
// REQUIREMENT 2: Revenue Reports
// ============================================

async function test2_GetRevenueOverview() {
  console.log('\n=== TEST 2.1: Get Revenue Overview ===');

  try {
    const response = await apiRequest(
      'GET',
      '/api/admin/analytics/revenue/overview',
      null,
      adminToken
    );

    if (response.status === 200) {
      console.log('✅ Revenue overview retrieved');
      console.log(`   Gross Revenue: $${response.data.grossRevenue}`);
      console.log(`   Net Revenue: $${response.data.netRevenue}`);
      console.log(`   Total Refunds: $${response.data.totalRefunds}`);
      return true;
    } else {
      console.log('❌ Failed to retrieve revenue overview');
      return false;
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

async function test2_GetRevenueByCategory() {
  console.log('\n=== TEST 2.2: Get Revenue By Category ===');

  try {
    const response = await apiRequest(
      'GET',
      '/api/admin/analytics/revenue/by-category',
      null,
      adminToken
    );

    if (response.status === 200 && Array.isArray(response.data)) {
      console.log(`✅ Revenue by category retrieved (${response.data.length} categories)`);
      return true;
    } else {
      console.log('❌ Failed to retrieve revenue by category');
      return false;
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

async function test2_GetRevenueTrends() {
  console.log('\n=== TEST 2.3: Get Revenue Trends ===');

  try {
    const response = await apiRequest(
      'GET',
      '/api/admin/analytics/revenue/trends',
      null,
      adminToken
    );

    if (response.status === 200 && Array.isArray(response.data)) {
      console.log(`✅ Revenue trends retrieved (${response.data.length} periods)`);
      return true;
    } else {
      console.log('❌ Failed to retrieve revenue trends');
      return false;
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

// ============================================
// REQUIREMENT 3: Customer Behavior Analytics
// ============================================

async function test3_GetCustomerStatistics() {
  console.log('\n=== TEST 3.1: Get Customer Statistics ===');

  try {
    const response = await apiRequest(
      'GET',
      '/api/admin/analytics/customers/statistics',
      null,
      adminToken
    );

    if (response.status === 200) {
      console.log('✅ Customer statistics retrieved');
      console.log(`   Total Customers: ${response.data.totalCustomers}`);
      console.log(`   Active Customers: ${response.data.activeCustomers}`);
      console.log(`   Average Lifetime Value: $${response.data.averageLifetimeValue}`);
      return true;
    } else {
      console.log('❌ Failed to retrieve customer statistics');
      return false;
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

async function test3_GetCustomerSegmentation() {
  console.log('\n=== TEST 3.2: Get Customer Segmentation ===');

  try {
    const response = await apiRequest(
      'GET',
      '/api/admin/analytics/customers/segmentation',
      null,
      adminToken
    );

    if (response.status === 200) {
      console.log('✅ Customer segmentation retrieved');
      console.log(`   High Value Customers: ${response.data.high_value.count}`);
      console.log(`   Frequent Customers: ${response.data.frequent.count}`);
      return true;
    } else {
      console.log('❌ Failed to retrieve customer segmentation');
      return false;
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

async function test3_GetCustomerRetention() {
  console.log('\n=== TEST 3.3: Get Customer Retention ===');

  try {
    const response = await apiRequest(
      'GET',
      '/api/admin/analytics/customers/retention',
      null,
      adminToken
    );

    if (response.status === 200) {
      console.log('✅ Customer retention retrieved');
      console.log(`   Retention Rate: ${response.data.retentionRate}%`);
      console.log(`   Repeat Customers: ${response.data.repeatCustomers}`);
      return true;
    } else {
      console.log('❌ Failed to retrieve customer retention');
      return false;
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

// ============================================
// REQUIREMENT 4: Inventory Reports
// ============================================

async function test4_GetInventoryOverview() {
  console.log('\n=== TEST 4.1: Get Inventory Overview ===');

  try {
    const response = await apiRequest(
      'GET',
      '/api/admin/analytics/inventory/overview',
      null,
      adminToken
    );

    if (response.status === 200) {
      console.log('✅ Inventory overview retrieved');
      console.log(`   Total Products: ${response.data.totalProducts}`);
      console.log(`   Total Stock: ${response.data.totalStock}`);
      console.log(`   Low Stock Items: ${response.data.lowStockItems}`);
      return true;
    } else {
      console.log('❌ Failed to retrieve inventory overview');
      return false;
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

async function test4_GetLowStockProducts() {
  console.log('\n=== TEST 4.2: Get Low Stock Products ===');

  try {
    const response = await apiRequest(
      'GET',
      '/api/admin/analytics/inventory/low-stock?limit=10',
      null,
      adminToken
    );

    if (response.status === 200 && Array.isArray(response.data)) {
      console.log(`✅ Low stock products retrieved (${response.data.length} products)`);
      return true;
    } else {
      console.log('❌ Failed to retrieve low stock products');
      return false;
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

async function test4_GetInventoryTurnover() {
  console.log('\n=== TEST 4.3: Get Inventory Turnover ===');

  try {
    const response = await apiRequest(
      'GET',
      '/api/admin/analytics/inventory/turnover',
      null,
      adminToken
    );

    if (response.status === 200) {
      console.log('✅ Inventory turnover retrieved');
      console.log(`   Turnover Rate: ${response.data.turnoverRate}`);
      console.log(`   Total Units Sold: ${response.data.totalUnitsSold}`);
      return true;
    } else {
      console.log('❌ Failed to retrieve inventory turnover');
      return false;
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

// ============================================
// REQUIREMENT 5: Admin-Only Access
// ============================================

async function test5_CustomerCannotAccessAnalytics() {
  console.log('\n=== TEST 5: Customer Cannot Access Analytics (Admin-Only) ===');

  try {
    const response = await apiRequest(
      'GET',
      '/api/admin/analytics/dashboard',
      null,
      customerToken
    );

    if (response.status === 403) {
      console.log('✅ Customer correctly denied access to analytics');
      return true;
    } else {
      console.log('❌ Customer should not access analytics endpoints');
      return false;
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

async function test_GetDashboardData() {
  console.log('\n=== TEST: Get Comprehensive Dashboard Data ===');

  try {
    const response = await apiRequest(
      'GET',
      '/api/admin/analytics/dashboard',
      null,
      adminToken
    );

    if (response.status === 200) {
      console.log('✅ Dashboard data retrieved');
      console.log(`   Sales Data: ${response.data.sales ? 'Yes' : 'No'}`);
      console.log(`   Revenue Data: ${response.data.revenue ? 'Yes' : 'No'}`);
      console.log(`   Customer Data: ${response.data.customers ? 'Yes' : 'No'}`);
      console.log(`   Inventory Data: ${response.data.inventory ? 'Yes' : 'No'}`);
      return true;
    } else {
      console.log('❌ Failed to retrieve dashboard data');
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
    // Delete users
    await supabase.from('users').delete().eq('email', TEST_CONFIG.adminEmail);
    await supabase.from('users').delete().eq('email', TEST_CONFIG.customerEmail);

    console.log('✅ Cleanup complete');
  } catch (error) {
    console.error('⚠️  Cleanup error:', error.message);
  }
}

// Main test runner
async function runTests() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   ANALYTICS & REPORTS TESTS                                ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  // Setup
  const setupSuccess = await setupTestData();
  if (!setupSuccess) {
    console.log('❌ Setup failed, aborting tests');
    process.exit(1);
  }

  const tests = [
    // Requirement 1: Sales Reports
    { name: 'REQ 1.1: Sales Overview', fn: test1_GetSalesOverview },
    { name: 'REQ 1.2: Sales By Date', fn: test1_GetSalesByDate },
    { name: 'REQ 1.3: Top Selling Products', fn: test1_GetTopSellingProducts },
    
    // Requirement 2: Revenue Reports
    { name: 'REQ 2.1: Revenue Overview', fn: test2_GetRevenueOverview },
    { name: 'REQ 2.2: Revenue By Category', fn: test2_GetRevenueByCategory },
    { name: 'REQ 2.3: Revenue Trends', fn: test2_GetRevenueTrends },
    
    // Requirement 3: Customer Behavior
    { name: 'REQ 3.1: Customer Statistics', fn: test3_GetCustomerStatistics },
    { name: 'REQ 3.2: Customer Segmentation', fn: test3_GetCustomerSegmentation },
    { name: 'REQ 3.3: Customer Retention', fn: test3_GetCustomerRetention },
    
    // Requirement 4: Inventory Reports
    { name: 'REQ 4.1: Inventory Overview', fn: test4_GetInventoryOverview },
    { name: 'REQ 4.2: Low Stock Products', fn: test4_GetLowStockProducts },
    { name: 'REQ 4.3: Inventory Turnover', fn: test4_GetInventoryTurnover },
    
    // Requirement 5: Admin-Only Access
    { name: 'REQ 5: Admin-Only Access', fn: test5_CustomerCannotAccessAnalytics },
    
    // Additional
    { name: 'Dashboard Data', fn: test_GetDashboardData }
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
  console.log('1. ✅ Sales reports');
  console.log('2. ✅ Revenue reports');
  console.log('3. ✅ Customer behavior analytics');
  console.log('4. ✅ Inventory reports');
  console.log('5. ✅ Admin-only access');

  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
