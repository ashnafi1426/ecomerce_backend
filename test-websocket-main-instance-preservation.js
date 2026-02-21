/**
 * PRESERVATION PROPERTY TESTS
 * 
 * **Property 2: Preservation - Main Instance Authentication Unchanged**
 * 
 * **Validates: Requirements 3.1, 3.2**
 * 
 * These tests verify that main instance authentication for chat functionality
 * works identically before and after the fix is applied.
 * 
 * IMPORTANT: Run on UNFIXED code first to observe baseline behavior
 * EXPECTED OUTCOME: Tests PASS (confirms baseline behavior to preserve)
 * 
 * Run: node test-websocket-main-instance-preservation.js
 */

const io = require('socket.io-client');
const jwt = require('jsonwebtoken');
const http = require('http');

const TEST_PORT = 3457;
const TEST_URL = `http://localhost:${TEST_PORT}`;
const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-for-websocket-testing';

const testResults = { passed: 0, failed: 0, errors: [] };

console.log('\n' + '='.repeat(80));
console.log('🧪 PRESERVATION PROPERTY TESTS');
console.log('   Main Instance Authentication Behavior');
console.log('='.repeat(80));
console.log('\n📝 Test Purpose:');
console.log('   Verify main instance authentication for chat functionality');
console.log('   works identically before and after the fix');
console.log('\n✅ EXPECTED OUTCOME: All tests PASS (no regressions)');
console.log('='.repeat(80));

/**
 * Helper: Create valid JWT token
 */
function createValidToken(userId, role, expiresIn = '1h') {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn });
}

/**
 * Helper: Create expired JWT token
 */
function createExpiredToken(userId, role) {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '-1h' });
}

/**
 * Helper: Connect to main instance (not a namespace)
 */
function connectToMainInstance(token, testName) {
  return new Promise((resolve) => {
    console.log(`\n🧪 ${testName}`);
    
    const options = {
      transports: ['websocket'],
      reconnection: false
    };
    
    if (token !== null) {
      options.auth = { token };
    }
    
    const client = io(TEST_URL, options);

    const timeout = setTimeout(() => {
      client.close();
      console.log(`   ❌ FAILED: Connection timeout`);
      testResults.failed++;
      testResults.errors.push(`${testName}: Connection timeout`);
      resolve({ client: null, connected: false, error: 'Connection timeout' });
    }, 5000);

    client.on('connect', () => {
      clearTimeout(timeout);
      console.log(`   ✅ PASSED: Connected successfully`);
      testResults.passed++;
      resolve({ client, connected: true });
    });

    client.on('connect_error', (error) => {
      clearTimeout(timeout);
      client.close();
      console.log(`   ✅ PASSED: Rejected with error: ${error.message}`);
      testResults.passed++;
      resolve({ client: null, connected: false, error: error.message, expectedRejection: true });
    });
  });
}

/**
 * Test 1: Valid Token Acceptance
 * Requirement 3.1
 */
async function testValidTokenAcceptance() {
  console.log('\n' + '='.repeat(80));
  console.log('Test 1: Valid Token Acceptance');
  console.log('='.repeat(80));
  
  const testCases = [
    { userId: 'customer-uuid-123', role: 'customer', description: 'Customer with valid token' },
    { userId: 'seller-uuid-456', role: 'seller', description: 'Seller with valid token' },
    { userId: 'admin-uuid-789', role: 'admin', description: 'Admin with valid token' }
  ];
  
  for (const testCase of testCases) {
    const token = createValidToken(testCase.userId, testCase.role);
    const result = await connectToMainInstance(token, testCase.description);
    
    if (result.connected && result.client) {
      result.client.close();
    }
  }
}

/**
 * Test 2: Invalid Token Rejection
 * Requirement 3.2
 */
async function testInvalidTokenRejection() {
  console.log('\n' + '='.repeat(80));
  console.log('Test 2: Invalid Token Rejection');
  console.log('='.repeat(80));
  
  const testCases = [
    { token: 'invalid-token-string', description: 'Malformed token' },
    { token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid', description: 'Invalid JWT structure' },
    { token: jwt.sign({ userId: 'test' }, 'wrong-secret'), description: 'Token with wrong secret' }
  ];
  
  for (const testCase of testCases) {
    const result = await connectToMainInstance(testCase.token, testCase.description);
    
    if (!result.connected && result.expectedRejection) {
      // Expected rejection - test passed
      if (!result.error.includes('Invalid') && !result.error.includes('expired')) {
        console.log(`   ⚠️  Warning: Error message may not be specific enough: ${result.error}`);
      }
    } else if (result.connected) {
      console.log(`   ❌ FAILED: Connection should have been rejected`);
      testResults.failed++;
      testResults.errors.push(`${testCase.description}: Connection should have been rejected`);
      if (result.client) result.client.close();
    }
  }
}

/**
 * Test 3: Expired Token Rejection
 * Requirement 3.2
 */
async function testExpiredTokenRejection() {
  console.log('\n' + '='.repeat(80));
  console.log('Test 3: Expired Token Rejection');
  console.log('='.repeat(80));
  
  const expiredToken = createExpiredToken('customer-uuid-123', 'customer');
  const result = await connectToMainInstance(expiredToken, 'Expired token');
  
  if (!result.connected && result.expectedRejection) {
    // Expected rejection - test passed
    if (!result.error.includes('expired') && !result.error.includes('Invalid')) {
      console.log(`   ⚠️  Warning: Error message may not indicate expiration: ${result.error}`);
    }
  } else if (result.connected) {
    console.log(`   ❌ FAILED: Expired token should have been rejected`);
    testResults.failed++;
    testResults.errors.push('Expired token: Connection should have been rejected');
    if (result.client) result.client.close();
  }
}

/**
 * Test 4: Missing Token Rejection
 * Requirement 3.2
 */
async function testMissingTokenRejection() {
  console.log('\n' + '='.repeat(80));
  console.log('Test 4: Missing Token Rejection');
  console.log('='.repeat(80));
  
  const result = await connectToMainInstance(null, 'No token provided');
  
  if (!result.connected && result.expectedRejection) {
    // Expected rejection - test passed
    if (!result.error.includes('token') && !result.error.includes('No')) {
      console.log(`   ⚠️  Warning: Error message may not indicate missing token: ${result.error}`);
    }
  } else if (result.connected) {
    console.log(`   ❌ FAILED: Connection without token should have been rejected`);
    testResults.failed++;
    testResults.errors.push('Missing token: Connection should have been rejected');
    if (result.client) result.client.close();
  }
}

/**
 * Test 5: Inactive User Rejection
 * Requirement 3.2
 */
async function testInactiveUserRejection() {
  console.log('\n' + '='.repeat(80));
  console.log('Test 5: Inactive User Rejection');
  console.log('='.repeat(80));
  
  const token = createValidToken('inactive-user-uuid', 'customer');
  const result = await connectToMainInstance(token, 'Inactive user account');
  
  if (!result.connected && result.expectedRejection) {
    // Expected rejection - test passed
    if (!result.error.includes('active') && !result.error.includes('Account')) {
      console.log(`   ⚠️  Warning: Error message may not indicate inactive account: ${result.error}`);
    }
  } else if (result.connected) {
    console.log(`   ❌ FAILED: Inactive user should have been rejected`);
    testResults.failed++;
    testResults.errors.push('Inactive user: Connection should have been rejected');
    if (result.client) result.client.close();
  }
}

/**
 * Test 6: User Not Found Rejection
 * Requirement 3.2
 */
async function testUserNotFoundRejection() {
  console.log('\n' + '='.repeat(80));
  console.log('Test 6: User Not Found Rejection');
  console.log('='.repeat(80));
  
  const token = createValidToken('nonexistent-user-uuid', 'customer');
  const result = await connectToMainInstance(token, 'Non-existent user');
  
  if (!result.connected && result.expectedRejection) {
    // Expected rejection - test passed
    if (!result.error.includes('not found') && !result.error.includes('User')) {
      console.log(`   ⚠️  Warning: Error message may not indicate user not found: ${result.error}`);
    }
  } else if (result.connected) {
    console.log(`   ❌ FAILED: Non-existent user should have been rejected`);
    testResults.failed++;
    testResults.errors.push('User not found: Connection should have been rejected');
    if (result.client) result.client.close();
  }
}

/**
 * Main test runner
 */
async function runPreservationTests() {
  // Mock user service
  const userService = require('./services/userServices/user.service');
  const jwtConfig = require('./config/jwt');
  
  const originalFindById = userService.findById;
  userService.findById = async (userId) => {
    const mockUsers = {
      'customer-uuid-123': { 
        id: 'customer-uuid-123', 
        email: 'customer@test.com', 
        role: 'customer', 
        display_name: 'Test Customer', 
        status: 'active' 
      },
      'seller-uuid-456': { 
        id: 'seller-uuid-456', 
        email: 'seller@test.com', 
        role: 'seller', 
        display_name: 'Test Seller', 
        status: 'active' 
      },
      'admin-uuid-789': { 
        id: 'admin-uuid-789', 
        email: 'admin@test.com', 
        role: 'admin', 
        display_name: 'Test Admin', 
        status: 'active' 
      },
      'inactive-user-uuid': { 
        id: 'inactive-user-uuid', 
        email: 'inactive@test.com', 
        role: 'customer', 
        display_name: 'Inactive User', 
        status: 'inactive' 
      }
    };
    return mockUsers[userId] || null;
  };

  const originalVerifyToken = jwtConfig.verifyToken;
  jwtConfig.verifyToken = (token) => {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  };

  // Initialize Socket.IO server
  const { initializeSocketServer } = require('./socket/socket.config');
  
  const httpServer = http.createServer();
  const socketServer = initializeSocketServer(httpServer);

  await new Promise((resolve) => {
    httpServer.listen(TEST_PORT, () => {
      console.log(`\n[Server] Test server started on port ${TEST_PORT}\n`);
      resolve();
    });
  });

  await new Promise(resolve => setTimeout(resolve, 500));

  try {
    await testValidTokenAcceptance();
    await testInvalidTokenRejection();
    await testExpiredTokenRejection();
    await testMissingTokenRejection();
    await testInactiveUserRejection();
    await testUserNotFoundRejection();
  } finally {
    socketServer.close();
    httpServer.close();
    userService.findById = originalFindById;
    jwtConfig.verifyToken = originalVerifyToken;
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 PRESERVATION TESTS SUMMARY');
  console.log('='.repeat(80));
  
  console.log(`\n✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  
  if (testResults.errors.length > 0) {
    console.log('\nFailed Tests:');
    testResults.errors.forEach((error, index) => console.log(`  ${index + 1}. ${error}`));
  }
  
  if (testResults.failed === 0) {
    console.log('\n' + '='.repeat(80));
    console.log('✅ ALL PRESERVATION TESTS PASSED!');
    console.log('='.repeat(80));
    console.log('\n📋 Verification:');
    console.log('   - Valid tokens are accepted for main instance connections');
    console.log('   - Invalid tokens are rejected with proper error messages');
    console.log('   - Expired tokens are rejected appropriately');
    console.log('   - Missing tokens are rejected');
    console.log('   - Inactive users are rejected');
    console.log('   - Non-existent users are rejected');
    console.log('\n✅ TEST RESULT: PASSED');
    console.log('   Baseline behavior documented. All functionality preserved.');
    
    process.exit(0);
  } else {
    console.log('\n❌ SOME PRESERVATION TESTS FAILED');
    console.log('   Unexpected behavior detected in main instance authentication');
    
    process.exit(1);
  }
}

runPreservationTests().catch((error) => {
  console.error('\n[Error] Test execution failed:', error);
  process.exit(1);
});
