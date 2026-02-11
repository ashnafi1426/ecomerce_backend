/**
 * Phase 2: API Endpoints Test Script
 * 
 * Tests all inventory API endpoints via HTTP
 * 
 * Prerequisites:
 *   - Backend server must be running (npm run dev)
 *   - Database migration must be completed
 * 
 * Usage:
 *   node test-phase-2-api.js
 */

const http = require('http');

const BASE_URL = 'http://localhost:5000';
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function success(message) {
  log(`✅ ${message}`, 'green');
}

function error(message) {
  log(`❌ ${message}`, 'red');
}

function info(message) {
  log(`ℹ️  ${message}`, 'cyan');
}

function section(message) {
  log(`\n${'='.repeat(60)}`, 'blue');
  log(`${message}`, 'bold');
  log(`${'='.repeat(60)}`, 'blue');
}

// Test data
let testProductId = null;
let testReservationId = null;
const testSessionId = `test-session-${Date.now()}`;

/**
 * Make HTTP request
 */
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const req = http.request(url, options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = {
            status: res.statusCode,
            data: body ? JSON.parse(body) : null
          };
          resolve(response);
        } catch (err) {
          resolve({
            status: res.statusCode,
            data: body
          });
        }
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

/**
 * Test 1: Health check
 */
async function testHealthCheck() {
  section('TEST 1: Server Health Check');
  
  try {
    info('Checking if server is running...');
    const response = await makeRequest('GET', '/api/v1/health');
    
    if (response.status === 200) {
      success('Server is running');
      return true;
    } else {
      error(`Server returned status ${response.status}`);
      return false;
    }
  } catch (err) {
    error(`Server is not running: ${err.message}`);
    error('Please start the server with: npm run dev');
    return false;
  }
}

/**
 * Test 2: Get a product
 */
async function getTestProduct() {
  section('TEST 2: Get Test Product');
  
  try {
    info('Fetching products...');
    const response = await makeRequest('GET', '/api/products?limit=1');
    
    if (response.status === 200 && response.data.products && response.data.products.length > 0) {
      testProductId = response.data.products[0].id;
      success(`Found test product: ${response.data.products[0].title}`);
      info(`Product ID: ${testProductId}`);
      return true;
    } else {
      error('No products found');
      info('Please add some products to the database');
      return false;
    }
  } catch (err) {
    error(`Failed to get product: ${err.message}`);
    return false;
  }
}

/**
 * Test 3: Check availability endpoint
 */
async function testCheckAvailability() {
  section('TEST 3: Check Availability Endpoint');
  
  try {
    info(`Testing: GET /api/inventory/check/${testProductId}?quantity=1`);
    const response = await makeRequest('GET', `/api/inventory/check/${testProductId}?quantity=1`);
    
    if (response.status === 200) {
      success('Availability check endpoint works');
      info(`Available: ${response.data.available}`);
      info(`Total Stock: ${response.data.total_stock}`);
      info(`Available Stock: ${response.data.available_stock}`);
      return true;
    } else {
      error(`Endpoint returned status ${response.status}`);
      error(`Response: ${JSON.stringify(response.data)}`);
      return false;
    }
  } catch (err) {
    error(`Availability check failed: ${err.message}`);
    return false;
  }
}

/**
 * Test 4: Reserve inventory endpoint
 */
async function testReserveInventory() {
  section('TEST 4: Reserve Inventory Endpoint');
  
  try {
    info('Testing: POST /api/inventory/reserve');
    const response = await makeRequest('POST', '/api/inventory/reserve', {
      cartItems: [
        {
          product_id: testProductId,
          quantity: 1
        }
      ],
      sessionId: testSessionId
    });
    
    if (response.status === 200 && response.data.success) {
      testReservationId = response.data.reservations[0].reservation_id;
      success('Reserve inventory endpoint works');
      info(`Reservation ID: ${testReservationId}`);
      info(`Expires in: ${response.data.expires_in_minutes} minutes`);
      return true;
    } else {
      error(`Endpoint returned status ${response.status}`);
      error(`Response: ${JSON.stringify(response.data)}`);
      return false;
    }
  } catch (err) {
    error(`Reserve inventory failed: ${err.message}`);
    return false;
  }
}

/**
 * Test 5: Get inventory status endpoint
 */
async function testInventoryStatus() {
  section('TEST 5: Inventory Status Endpoint');
  
  try {
    info('Testing: GET /api/inventory/status');
    const response = await makeRequest('GET', `/api/inventory/status?productId=${testProductId}`);
    
    if (response.status === 200 || response.status === 401) {
      if (response.status === 401) {
        info('Endpoint requires authentication (expected for admin/manager)');
        success('Inventory status endpoint exists');
        return true;
      } else {
        success('Inventory status endpoint works');
        info(`Found ${response.data.inventory.length} inventory record(s)`);
        return true;
      }
    } else {
      error(`Endpoint returned status ${response.status}`);
      error(`Response: ${JSON.stringify(response.data)}`);
      return false;
    }
  } catch (err) {
    error(`Inventory status check failed: ${err.message}`);
    return false;
  }
}

/**
 * Test 6: Release reservation endpoint
 */
async function testReleaseReservation() {
  section('TEST 6: Release Reservation Endpoint');
  
  try {
    info(`Testing: POST /api/inventory/release/${testReservationId}`);
    const response = await makeRequest('POST', `/api/inventory/release/${testReservationId}`);
    
    if (response.status === 200 && response.data.success) {
      success('Release reservation endpoint works');
      info('Reservation released successfully');
      return true;
    } else {
      error(`Endpoint returned status ${response.status}`);
      error(`Response: ${JSON.stringify(response.data)}`);
      return false;
    }
  } catch (err) {
    error(`Release reservation failed: ${err.message}`);
    return false;
  }
}

/**
 * Test 7: Get active reservations endpoint
 */
async function testActiveReservations() {
  section('TEST 7: Active Reservations Endpoint');
  
  try {
    info('Testing: GET /api/inventory/reservations');
    const response = await makeRequest('GET', '/api/inventory/reservations');
    
    if (response.status === 200 || response.status === 401) {
      if (response.status === 401) {
        info('Endpoint requires authentication (expected for admin/manager)');
        success('Active reservations endpoint exists');
        return true;
      } else {
        success('Active reservations endpoint works');
        info(`Found ${response.data.count} active reservation(s)`);
        return true;
      }
    } else {
      error(`Endpoint returned status ${response.status}`);
      error(`Response: ${JSON.stringify(response.data)}`);
      return false;
    }
  } catch (err) {
    error(`Active reservations check failed: ${err.message}`);
    return false;
  }
}

/**
 * Test 8: Expire reservations endpoint
 */
async function testExpireReservations() {
  section('TEST 8: Expire Reservations Endpoint');
  
  try {
    info('Testing: POST /api/inventory/expire-reservations');
    const response = await makeRequest('POST', '/api/inventory/expire-reservations');
    
    if (response.status === 200 || response.status === 401) {
      if (response.status === 401) {
        info('Endpoint requires authentication (expected for admin only)');
        success('Expire reservations endpoint exists');
        return true;
      } else {
        success('Expire reservations endpoint works');
        info(`Expired ${response.data.expired_count} reservation(s)`);
        return true;
      }
    } else {
      error(`Endpoint returned status ${response.status}`);
      error(`Response: ${JSON.stringify(response.data)}`);
      return false;
    }
  } catch (err) {
    error(`Expire reservations check failed: ${err.message}`);
    return false;
  }
}

/**
 * Main test runner
 */
async function runTests() {
  log('\n' + '='.repeat(60), 'bold');
  log('PHASE 2: API ENDPOINTS - TEST SUITE', 'bold');
  log('='.repeat(60) + '\n', 'bold');
  
  const results = {
    passed: 0,
    failed: 0,
    total: 8
  };
  
  // Run tests
  const tests = [
    { name: 'Health Check', fn: testHealthCheck, critical: true },
    { name: 'Get Test Product', fn: getTestProduct, critical: true },
    { name: 'Check Availability', fn: testCheckAvailability },
    { name: 'Reserve Inventory', fn: testReserveInventory },
    { name: 'Inventory Status', fn: testInventoryStatus },
    { name: 'Release Reservation', fn: testReleaseReservation },
    { name: 'Active Reservations', fn: testActiveReservations },
    { name: 'Expire Reservations', fn: testExpireReservations }
  ];
  
  for (const test of tests) {
    const result = await test.fn();
    if (result) {
      results.passed++;
    } else {
      results.failed++;
      if (test.critical) {
        log('\n❌ Critical test failed. Stopping test suite.', 'red');
        break;
      }
    }
  }
  
  // Summary
  section('TEST SUMMARY');
  log(`\nTotal Tests: ${results.total}`, 'bold');
  log(`Passed: ${results.passed}`, 'green');
  log(`Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'green');
  
  if (results.failed === 0) {
    log('\n🎉 ALL API TESTS PASSED!', 'green');
    log('\n✅ Phase 2 API endpoints are working correctly!', 'green');
    log('\n📋 Available Endpoints:', 'cyan');
    log('   GET  /api/inventory/check/:productId - Check availability', 'cyan');
    log('   POST /api/inventory/reserve - Reserve inventory', 'cyan');
    log('   POST /api/inventory/release/:id - Release reservation', 'cyan');
    log('   GET  /api/inventory/status - View inventory status (auth)', 'cyan');
    log('   GET  /api/inventory/reservations - View reservations (auth)', 'cyan');
    log('   POST /api/inventory/expire-reservations - Expire old (auth)\n', 'cyan');
  } else {
    log('\n⚠️  SOME TESTS FAILED', 'yellow');
    log('\nPlease check:', 'yellow');
    log('   1. Server is running (npm run dev)', 'yellow');
    log('   2. Database migration completed', 'yellow');
    log('   3. Products exist in database', 'yellow');
    log('   4. Review error messages above\n', 'yellow');
  }
  
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(err => {
  error(`\nTest suite crashed: ${err.message}`);
  console.error(err);
  process.exit(1);
});
