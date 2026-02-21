/**
 * ORDER TRACKING WEBSOCKET INTEGRATION TEST
 * 
 * Tests the complete WebSocket functionality for order tracking
 * including connection, authentication, subscription, and event emission
 */

const io = require('socket.io-client');
const { generateToken } = require('./config/jwt');

// Test configuration
const SERVER_URL = 'http://localhost:5000';
const NAMESPACE = '/order-tracking';

// Test data
const testCustomer = {
  userId: '123e4567-e89b-12d3-a456-426614174000',
  role: 'customer',
  email: 'test@example.com'
};

const testOrder = {
  orderId: '223e4567-e89b-12d3-a456-426614174000'
};

/**
 * Test WebSocket connection and authentication
 */
async function testWebSocketConnection() {
  console.log('\n=== Testing WebSocket Connection ===\n');

  return new Promise((resolve, reject) => {
    // Generate JWT token for authentication
    const token = generateToken(testCustomer.userId);

    // Connect to WebSocket server
    const socket = io(`${SERVER_URL}${NAMESPACE}`, {
      auth: {
        token: token
      },
      transports: ['websocket']
    });

    // Connection successful
    socket.on('connect', () => {
      console.log('✅ Connected to WebSocket server');
      console.log(`   Socket ID: ${socket.id}`);
      
      // Clean up and resolve
      socket.disconnect();
      resolve(true);
    });

    // Connection error
    socket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error.message);
      reject(error);
    });

    // Timeout after 5 seconds
    setTimeout(() => {
      socket.disconnect();
      reject(new Error('Connection timeout'));
    }, 5000);
  });
}

/**
 * Test order subscription
 */
async function testOrderSubscription() {
  console.log('\n=== Testing Order Subscription ===\n');

  return new Promise((resolve, reject) => {
    const token = generateToken(testCustomer.userId);

    const socket = io(`${SERVER_URL}${NAMESPACE}`, {
      auth: {
        token: token
      },
      transports: ['websocket']
    });

    socket.on('connect', () => {
      console.log('✅ Connected to WebSocket server');

      // Subscribe to order
      socket.emit('subscribe_order', {
        orderId: testOrder.orderId
      });
    });

    // Subscription successful
    socket.on('subscribed', (data) => {
      console.log('✅ Successfully subscribed to order');
      console.log('   Order ID:', data.orderId);
      console.log('   Timestamp:', data.timestamp);
      
      socket.disconnect();
      resolve(true);
    });

    // Subscription error
    socket.on('error', (error) => {
      console.error('❌ Subscription error:', error.message);
      socket.disconnect();
      reject(new Error(error.message));
    });

    // Connection error
    socket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error.message);
      reject(error);
    });

    // Timeout after 5 seconds
    setTimeout(() => {
      socket.disconnect();
      reject(new Error('Subscription timeout'));
    }, 5000);
  });
}

/**
 * Test status update event reception
 */
async function testStatusUpdateEvent() {
  console.log('\n=== Testing Status Update Event ===\n');

  return new Promise((resolve, reject) => {
    const token = generateToken(testCustomer.userId);

    const socket = io(`${SERVER_URL}${NAMESPACE}`, {
      auth: {
        token: token
      },
      transports: ['websocket']
    });

    socket.on('connect', () => {
      console.log('✅ Connected to WebSocket server');

      // Subscribe to order
      socket.emit('subscribe_order', {
        orderId: testOrder.orderId
      });
    });

    socket.on('subscribed', () => {
      console.log('✅ Subscribed to order, waiting for status updates...');
      console.log('   (This test requires manual status update or will timeout)');
    });

    // Listen for status updates
    socket.on('status_update', (data) => {
      console.log('✅ Received status update event:');
      console.log('   Order ID:', data.orderId);
      console.log('   Status:', data.status);
      console.log('   Previous Status:', data.previousStatus);
      console.log('   Timestamp:', data.timestamp);
      console.log('   Message:', data.message);
      
      socket.disconnect();
      resolve(true);
    });

    socket.on('error', (error) => {
      console.error('❌ Error:', error.message);
      socket.disconnect();
      reject(new Error(error.message));
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error.message);
      reject(error);
    });

    // Timeout after 30 seconds
    setTimeout(() => {
      console.log('⚠️  No status update received (this is expected if no updates were made)');
      socket.disconnect();
      resolve(false);
    }, 30000);
  });
}

/**
 * Test tracking update event reception
 */
async function testTrackingUpdateEvent() {
  console.log('\n=== Testing Tracking Update Event ===\n');

  return new Promise((resolve, reject) => {
    const token = generateToken(testCustomer.userId);

    const socket = io(`${SERVER_URL}${NAMESPACE}`, {
      auth: {
        token: token
      },
      transports: ['websocket']
    });

    socket.on('connect', () => {
      console.log('✅ Connected to WebSocket server');

      // Subscribe to order
      socket.emit('subscribe_order', {
        orderId: testOrder.orderId
      });
    });

    socket.on('subscribed', () => {
      console.log('✅ Subscribed to order, waiting for tracking updates...');
      console.log('   (This test requires manual tracking update or will timeout)');
    });

    // Listen for tracking updates
    socket.on('tracking_update', (data) => {
      console.log('✅ Received tracking update event:');
      console.log('   Order ID:', data.orderId);
      console.log('   Tracking Number:', data.trackingNumber);
      console.log('   Carrier:', data.carrier);
      console.log('   Timestamp:', data.timestamp);
      console.log('   Message:', data.message);
      
      socket.disconnect();
      resolve(true);
    });

    socket.on('error', (error) => {
      console.error('❌ Error:', error.message);
      socket.disconnect();
      reject(new Error(error.message));
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error.message);
      reject(error);
    });

    // Timeout after 30 seconds
    setTimeout(() => {
      console.log('⚠️  No tracking update received (this is expected if no updates were made)');
      socket.disconnect();
      resolve(false);
    }, 30000);
  });
}

/**
 * Test ping/pong for connection timeout reset
 */
async function testPingPong() {
  console.log('\n=== Testing Ping/Pong ===\n');

  return new Promise((resolve, reject) => {
    const token = generateToken(testCustomer.userId);

    const socket = io(`${SERVER_URL}${NAMESPACE}`, {
      auth: {
        token: token
      },
      transports: ['websocket']
    });

    socket.on('connect', () => {
      console.log('✅ Connected to WebSocket server');

      // Send ping
      socket.emit('ping');
    });

    // Listen for pong
    socket.on('pong', (data) => {
      console.log('✅ Received pong response');
      console.log('   Timestamp:', data.timestamp);
      
      socket.disconnect();
      resolve(true);
    });

    socket.on('error', (error) => {
      console.error('❌ Error:', error.message);
      socket.disconnect();
      reject(new Error(error.message));
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error.message);
      reject(error);
    });

    // Timeout after 5 seconds
    setTimeout(() => {
      socket.disconnect();
      reject(new Error('Ping/pong timeout'));
    }, 5000);
  });
}

/**
 * Test order unsubscription
 */
async function testOrderUnsubscription() {
  console.log('\n=== Testing Order Unsubscription ===\n');

  return new Promise((resolve, reject) => {
    const token = generateToken(testCustomer.userId);

    const socket = io(`${SERVER_URL}${NAMESPACE}`, {
      auth: {
        token: token
      },
      transports: ['websocket']
    });

    socket.on('connect', () => {
      console.log('✅ Connected to WebSocket server');

      // Subscribe to order
      socket.emit('subscribe_order', {
        orderId: testOrder.orderId
      });
    });

    socket.on('subscribed', () => {
      console.log('✅ Subscribed to order');

      // Unsubscribe from order
      socket.emit('unsubscribe_order', {
        orderId: testOrder.orderId
      });
    });

    // Unsubscription successful
    socket.on('unsubscribed', (data) => {
      console.log('✅ Successfully unsubscribed from order');
      console.log('   Order ID:', data.orderId);
      console.log('   Timestamp:', data.timestamp);
      
      socket.disconnect();
      resolve(true);
    });

    socket.on('error', (error) => {
      console.error('❌ Error:', error.message);
      socket.disconnect();
      reject(new Error(error.message));
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error.message);
      reject(error);
    });

    // Timeout after 5 seconds
    setTimeout(() => {
      socket.disconnect();
      reject(new Error('Unsubscription timeout'));
    }, 5000);
  });
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   ORDER TRACKING WEBSOCKET INTEGRATION TEST               ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  const results = {
    passed: 0,
    failed: 0,
    skipped: 0
  };

  try {
    // Test 1: WebSocket Connection
    try {
      await testWebSocketConnection();
      results.passed++;
    } catch (error) {
      console.error('❌ Test failed:', error.message);
      results.failed++;
    }

    // Test 2: Order Subscription
    try {
      await testOrderSubscription();
      results.passed++;
    } catch (error) {
      console.error('❌ Test failed:', error.message);
      results.failed++;
    }

    // Test 3: Ping/Pong
    try {
      await testPingPong();
      results.passed++;
    } catch (error) {
      console.error('❌ Test failed:', error.message);
      results.failed++;
    }

    // Test 4: Order Unsubscription
    try {
      await testOrderUnsubscription();
      results.passed++;
    } catch (error) {
      console.error('❌ Test failed:', error.message);
      results.failed++;
    }

    // Test 5: Status Update Event (optional - requires manual trigger)
    console.log('\n⚠️  Skipping status update event test (requires manual trigger)');
    results.skipped++;

    // Test 6: Tracking Update Event (optional - requires manual trigger)
    console.log('⚠️  Skipping tracking update event test (requires manual trigger)');
    results.skipped++;

  } catch (error) {
    console.error('\n❌ Test suite error:', error);
  }

  // Print summary
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║   TEST SUMMARY                                             ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`⚠️  Skipped: ${results.skipped}`);
  console.log(`📊 Total: ${results.passed + results.failed + results.skipped}`);

  if (results.failed === 0) {
    console.log('\n🎉 All tests passed!');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the errors above.');
  }

  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = {
  testWebSocketConnection,
  testOrderSubscription,
  testStatusUpdateEvent,
  testTrackingUpdateEvent,
  testPingPong,
  testOrderUnsubscription
};
