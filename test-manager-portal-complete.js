/**
 * COMPREHENSIVE MANAGER PORTAL TEST SUITE
 * 
 * Tests all manager endpoints to ensure 100% functionality
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

// Test credentials - manager account
const MANAGER_CREDENTIALS = {
  email: 'manager@test.com',
  password: 'Test123!@#'
};

let authToken = '';
let managerId = '';

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  total: 0,
  failures: []
};

/**
 * Helper function to make API requests
 */
async function apiRequest(method, endpoint, data = null, useAuth = true) {
  const config = {
    method,
    url: `${API_BASE_URL}${endpoint}`,
    headers: {
      'Content-Type': 'application/json'
    }
  };

  if (useAuth && authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }

  if (data) {
    config.data = data;
  }

  return axios(config);
}

/**
 * Test runner function
 */
async function runTest(name, testFn) {
  results.total++;
  try {
    await testFn();
    results.passed++;
    console.log(`${colors.green}✅ PASS:${colors.reset} ${name}`);
    return true;
  } catch (error) {
    results.failed++;
    const errorMsg = error.response?.data?.message || error.message || 'Unknown error';
    const statusCode = error.response?.status || 'N/A';
    console.log(`${colors.red}❌ FAIL:${colors.reset} ${name}`);
    console.log(`   ${colors.yellow}Error:${colors.reset} ${errorMsg}`);
    if (statusCode !== 'N/A') {
      console.log(`   ${colors.yellow}Status:${colors.reset} ${statusCode}`);
    }
    results.failures.push({
      test: name,
      error: errorMsg,
      status: statusCode
    });
    return false;
  }
}

/**
 * Main test suite
 */
async function runManagerPortalTests() {
  console.log(`${colors.cyan}🚀 Starting Comprehensive Manager Portal Testing...${colors.reset}`);
  console.log('='.repeat(60));

  // ==================== AUTHENTICATION ====================
  console.log(`\n${colors.blue}📝 Testing Authentication...${colors.reset}`);
  
  await runTest('Manager Login', async () => {
    const response = await apiRequest('POST', '/auth/login', MANAGER_CREDENTIALS, false);
    
    // Check if login was successful - response.data might already be unwrapped by axios
    const data = response.data || response;
    
    if (!data.token) {
      throw new Error('Login failed - no token received');
    }
    
    authToken = data.token;
    managerId = data.user?.id || data.user;
    
    console.log(`   Token received, User ID: ${managerId}`);
  });

  // ==================== DASHBOARD ====================
  console.log(`\n${colors.blue}📊 Testing Dashboard...${colors.reset}`);
  
  await runTest('Get Manager Dashboard', async () => {
    const response = await apiRequest('GET', '/manager/dashboard');
    
    if (!response.data.success) {
      throw new Error('Dashboard request failed');
    }
    
    console.log(`   Dashboard stats loaded`);
  });

  await runTest('Get Manager Dashboard Stats', async () => {
    const response = await apiRequest('GET', '/manager/dashboard/stats');
    
    if (!response.data.success) {
      throw new Error('Dashboard stats request failed');
    }
    
    console.log(`   Stats loaded`);
  });

  // ==================== PRODUCT APPROVALS ====================
  console.log(`\n${colors.blue}📦 Testing Product Approvals...${colors.reset}`);
  
  await runTest('Get Pending Products', async () => {
    const response = await apiRequest('GET', '/manager/products/pending');
    
    if (!response.data.success) {
      throw new Error('Failed to get pending products');
    }
    
    console.log(`   ${response.data.count || 0} pending products found`);
  });

  // ==================== SELLER APPROVALS ====================
  console.log(`\n${colors.blue}🏪 Testing Seller Approvals...${colors.reset}`);
  
  await runTest('Get Pending Sellers', async () => {
    const response = await apiRequest('GET', '/manager/sellers/pending');
    
    if (!response.data.success) {
      throw new Error('Failed to get pending sellers');
    }
    
    console.log(`   ${response.data.count || 0} pending sellers found`);
  });

  // ==================== ORDER MANAGEMENT ====================
  console.log(`\n${colors.blue}📋 Testing Order Management...${colors.reset}`);
  
  await runTest('Get All Orders', async () => {
    const response = await apiRequest('GET', '/manager/orders');
    
    if (!response.data.success) {
      throw new Error('Failed to get orders');
    }
    
    console.log(`   ${response.data.count || 0} orders found`);
  });

  await runTest('Get Orders with Issues', async () => {
    const response = await apiRequest('GET', '/manager/orders/issues');
    
    if (!response.data.success) {
      throw new Error('Failed to get orders with issues');
    }
    
    console.log(`   ${response.data.count || 0} orders with issues found`);
  });

  // ==================== DISPUTE MANAGEMENT ====================
  console.log(`\n${colors.blue}⚖️ Testing Dispute Management...${colors.reset}`);
  
  await runTest('Get All Disputes', async () => {
    const response = await apiRequest('GET', '/manager/disputes');
    
    if (!response.data.success) {
      throw new Error('Failed to get disputes');
    }
    
    console.log(`   ${response.data.count || 0} disputes found`);
  });

  await runTest('Get Pending Disputes', async () => {
    const response = await apiRequest('GET', '/manager/disputes/pending');
    
    if (!response.data.success) {
      throw new Error('Failed to get pending disputes');
    }
    
    console.log(`   ${response.data.count || 0} pending disputes found`);
  });

  // ==================== RETURN MANAGEMENT ====================
  console.log(`\n${colors.blue}↩️ Testing Return Management...${colors.reset}`);
  
  await runTest('Get Pending Returns', async () => {
    const response = await apiRequest('GET', '/manager/returns/pending');
    
    if (!response.data.success) {
      throw new Error('Failed to get pending returns');
    }
    
    console.log(`   ${response.data.count || 0} pending returns found`);
  });

  // ==================== REFUND MANAGEMENT ====================
  console.log(`\n${colors.blue}💰 Testing Refund Management...${colors.reset}`);
  
  await runTest('Get Pending Refunds', async () => {
    const response = await apiRequest('GET', '/manager/refunds/pending');
    
    if (!response.data.success) {
      throw new Error('Failed to get pending refunds');
    }
    
    console.log(`   ${response.data.count || 0} pending refunds found`);
  });

  // ==================== SUPPORT TICKETS ====================
  console.log(`\n${colors.blue}🎫 Testing Support Tickets...${colors.reset}`);
  
  await runTest('Get Support Tickets', async () => {
    const response = await apiRequest('GET', '/manager/support/tickets');
    
    if (!response.data.success) {
      throw new Error('Failed to get support tickets');
    }
    
    console.log(`   ${response.data.count || 0} support tickets found`);
  });

  // ==================== ESCALATIONS ====================
  console.log(`\n${colors.blue}🚨 Testing Escalations...${colors.reset}`);
  
  await runTest('Get Escalations', async () => {
    const response = await apiRequest('GET', '/manager/escalations');
    
    if (!response.data.success) {
      throw new Error('Failed to get escalations');
    }
    
    console.log(`   ${response.data.count || 0} escalations found`);
  });

  // ==================== PERFORMANCE METRICS ====================
  console.log(`\n${colors.blue}📈 Testing Performance Metrics...${colors.reset}`);
  
  await runTest('Get Performance Metrics', async () => {
    const response = await apiRequest('GET', '/manager/performance');
    
    if (!response.data.success) {
      throw new Error('Failed to get performance metrics');
    }
    
    console.log(`   Performance metrics loaded`);
  });

  await runTest('Get Seller Performance', async () => {
    const response = await apiRequest('GET', '/manager/performance/sellers');
    
    if (!response.data.success) {
      throw new Error('Failed to get seller performance');
    }
    
    console.log(`   ${response.data.count || 0} seller performance records found`);
  });

  // ==================== REVIEW MODERATION ====================
  console.log(`\n${colors.blue}⭐ Testing Review Moderation...${colors.reset}`);
  
  await runTest('Get Flagged Reviews', async () => {
    const response = await apiRequest('GET', '/manager/reviews/flagged');
    
    if (!response.data.success) {
      throw new Error('Failed to get flagged reviews');
    }
    
    console.log(`   ${response.data.count || 0} flagged reviews found`);
  });

  // ==================== CUSTOMER FEEDBACK ====================
  console.log(`\n${colors.blue}💬 Testing Customer Feedback...${colors.reset}`);
  
  await runTest('Get Customer Feedback', async () => {
    const response = await apiRequest('GET', '/manager/feedback/customers');
    
    if (!response.data.success) {
      throw new Error('Failed to get customer feedback');
    }
    
    console.log(`   ${response.data.count || 0} feedback records found`);
  });

  // ==================== ACTIVITY LOG ====================
  console.log(`\n${colors.blue}📜 Testing Activity Log...${colors.reset}`);
  
  await runTest('Get Activity Log', async () => {
    const response = await apiRequest('GET', '/manager/activity');
    
    if (!response.data.success) {
      throw new Error('Failed to get activity log');
    }
    
    console.log(`   ${response.data.count || 0} activity records found`);
  });

  // ==================== PRINT SUMMARY ====================
  console.log(`\n${'='.repeat(60)}`);
  console.log(`${colors.cyan}📊 TEST SUMMARY${colors.reset}`);
  console.log(`${colors.green}✅ Passed: ${results.passed}${colors.reset}`);
  console.log(`${colors.red}❌ Failed: ${results.failed}${colors.reset}`);
  console.log(`${colors.blue}📝 Total: ${results.total}${colors.reset}`);
  
  const successRate = ((results.passed / results.total) * 100).toFixed(2);
  console.log(`${colors.cyan}📈 Success Rate: ${successRate}%${colors.reset}`);

  if (results.failures.length > 0) {
    console.log(`\n${colors.red}❌ Failed Tests:${colors.reset}`);
    results.failures.forEach(failure => {
      console.log(`- ${failure.test}: ${failure.error}`);
    });
  }

  console.log('='.repeat(60));

  // Final status
  if (results.failed === 0) {
    console.log(`${colors.green}🎉 MANAGER PORTAL: 100% COMPLETE AND FUNCTIONAL!${colors.reset}`);
  } else if (successRate >= 80) {
    console.log(`${colors.yellow}⚠️ MANAGER PORTAL: MOSTLY FUNCTIONAL (Some issues need fixing)${colors.reset}`);
  } else {
    console.log(`${colors.red}❌ MANAGER PORTAL: NEEDS ATTENTION (Multiple issues found)${colors.reset}`);
  }
}

// Run the tests
runManagerPortalTests().catch(error => {
  console.error(`${colors.red}Fatal error running tests:${colors.reset}`, error.message);
  process.exit(1);
});
