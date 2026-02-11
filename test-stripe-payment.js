/**
 * Stripe Payment System Test
 * 
 * Tests the complete payment flow without webhooks
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

// Test configuration
const testConfig = {
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
};

// Test data
const testCartItems = [
  {
    id: '0dc305d8-d5ec-49e6-a5ce-c5f688e4d048', // Replace with actual product ID from your database
    quantity: 2
  }
];

const testShippingAddress = {
  fullName: 'John Doe',
  address: '123 Main Street',
  city: 'New York',
  state: 'NY',
  zipCode: '10001',
  country: 'United States',
  phone: '555-0123'
};

const testBillingAddress = {
  fullName: 'John Doe',
  address: '123 Main Street',
  city: 'New York',
  state: 'NY',
  zipCode: '10001',
  country: 'United States',
  phone: '555-0123'
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'cyan');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logSection(message) {
  log(`\n${'='.repeat(60)}`, 'blue');
  log(`  ${message}`, 'blue');
  log(`${'='.repeat(60)}`, 'blue');
}

// Test functions
async function testServerHealth() {
  logSection('TEST 1: Server Health Check');
  
  try {
    const response = await axios.get(`${API_BASE_URL}/v1/health`, testConfig);
    
    if (response.status === 200) {
      logSuccess('Server is running');
      logInfo(`Response: ${JSON.stringify(response.data, null, 2)}`);
      return true;
    } else {
      logError(`Unexpected status code: ${response.status}`);
      return false;
    }
  } catch (error) {
    logError(`Server health check failed: ${error.message}`);
    logWarning('Make sure the backend server is running on port 5000');
    return false;
  }
}

async function testCreatePaymentIntent() {
  logSection('TEST 2: Create Payment Intent');
  
  try {
    const requestData = {
      cartItems: testCartItems,
      shippingAddress: testShippingAddress,
      billingAddress: testBillingAddress
    };
    
    logInfo('Sending request to create payment intent...');
    logInfo(`Cart items: ${JSON.stringify(testCartItems, null, 2)}`);
    
    const response = await axios.post(
      `${API_BASE_URL}/payments/create-intent`,
      requestData,
      testConfig
    );
    
    if (response.status === 200 && response.data.clientSecret) {
      logSuccess('Payment intent created successfully');
      logInfo(`Payment Intent ID: ${response.data.paymentIntentId}`);
      logInfo(`Amount: $${response.data.amount.toFixed(2)}`);
      logInfo(`Breakdown:`);
      logInfo(`  - Subtotal: $${response.data.breakdown.subtotal.toFixed(2)}`);
      logInfo(`  - Tax: $${response.data.breakdown.tax.toFixed(2)}`);
      logInfo(`  - Shipping: $${response.data.breakdown.shipping.toFixed(2)}`);
      logInfo(`  - Total: $${response.data.breakdown.total.toFixed(2)}`);
      
      return {
        success: true,
        paymentIntentId: response.data.paymentIntentId,
        clientSecret: response.data.clientSecret,
        amount: response.data.amount
      };
    } else {
      logError('Payment intent creation failed');
      logInfo(`Response: ${JSON.stringify(response.data, null, 2)}`);
      return { success: false };
    }
  } catch (error) {
    logError(`Create payment intent failed: ${error.message}`);
    
    if (error.response) {
      logError(`Status: ${error.response.status}`);
      logError(`Error: ${JSON.stringify(error.response.data, null, 2)}`);
      
      if (error.response.status === 400 && error.response.data.error?.includes('not found')) {
        logWarning('Product not found in database');
        logWarning('Please update testCartItems with a valid product ID from your database');
        logInfo('You can get a product ID by running:');
        logInfo('  SELECT id, title FROM products LIMIT 1;');
      }
    }
    
    return { success: false };
  }
}

async function testGetPaymentStatus(paymentIntentId) {
  logSection('TEST 3: Get Payment Status');
  
  if (!paymentIntentId) {
    logWarning('Skipping - no payment intent ID available');
    return { success: false };
  }
  
  try {
    logInfo(`Checking status for payment: ${paymentIntentId}`);
    
    const response = await axios.get(
      `${API_BASE_URL}/payments/${paymentIntentId}`,
      testConfig
    );
    
    if (response.status === 200) {
      logSuccess('Payment status retrieved successfully');
      logInfo(`Database Status: ${response.data.payment.status}`);
      logInfo(`Stripe Status: ${response.data.stripeStatus}`);
      logInfo(`Order ID: ${response.data.order_id || 'Not created yet'}`);
      
      return {
        success: true,
        status: response.data.stripeStatus
      };
    } else {
      logError('Failed to get payment status');
      return { success: false };
    }
  } catch (error) {
    logError(`Get payment status failed: ${error.message}`);
    
    if (error.response) {
      logError(`Status: ${error.response.status}`);
      logError(`Error: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    
    return { success: false };
  }
}

async function testCreateOrderWithoutPayment(paymentIntentId) {
  logSection('TEST 4: Create Order (Should Fail - Payment Not Completed)');
  
  if (!paymentIntentId) {
    logWarning('Skipping - no payment intent ID available');
    return { success: false };
  }
  
  try {
    logInfo('Attempting to create order without completing payment...');
    
    const response = await axios.post(
      `${API_BASE_URL}/payments/create-order`,
      { paymentIntentId },
      testConfig
    );
    
    // This should fail because payment hasn't been completed
    logWarning('Order creation succeeded (unexpected - payment not completed)');
    logInfo(`Response: ${JSON.stringify(response.data, null, 2)}`);
    
    return { success: false };
  } catch (error) {
    if (error.response && error.response.status === 400) {
      if (error.response.data.error?.includes('not successful')) {
        logSuccess('Correctly rejected order creation - payment not completed');
        logInfo('This is expected behavior - payment must be completed first');
        return { success: true };
      }
    }
    
    logError(`Unexpected error: ${error.message}`);
    if (error.response) {
      logError(`Error: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    
    return { success: false };
  }
}

async function testDatabaseConnection() {
  logSection('TEST 5: Database Connection');
  
  try {
    // Try to fetch products to verify database connection
    const response = await axios.get(`${API_BASE_URL}/products?limit=1`, testConfig);
    
    if (response.status === 200) {
      logSuccess('Database connection working');
      
      if (response.data.products && response.data.products.length > 0) {
        const product = response.data.products[0];
        logInfo(`Sample product found: ${product.title}`);
        logInfo(`Product ID: ${product.id}`);
        logInfo(`Price: $${product.price}`);
        logWarning('\nUpdate testCartItems in this script with this product ID:');
        logInfo(`  id: '${product.id}'`);
      }
      
      return { success: true };
    }
  } catch (error) {
    logError(`Database connection test failed: ${error.message}`);
    
    if (error.response) {
      logError(`Status: ${error.response.status}`);
    }
    
    return { success: false };
  }
}

// Main test runner
async function runTests() {
  log('\n╔════════════════════════════════════════════════════════════╗', 'blue');
  log('║         STRIPE PAYMENT SYSTEM TEST SUITE                  ║', 'blue');
  log('╚════════════════════════════════════════════════════════════╝', 'blue');
  
  const results = {
    total: 0,
    passed: 0,
    failed: 0
  };
  
  // Test 1: Server Health
  results.total++;
  const healthCheck = await testServerHealth();
  if (healthCheck) results.passed++;
  else {
    results.failed++;
    logError('\n❌ Server is not running. Please start the backend server first.');
    logInfo('Run: cd ecomerce_backend && npm start');
    return printResults(results);
  }
  
  // Test 5: Database Connection (moved up to get product ID)
  results.total++;
  const dbCheck = await testDatabaseConnection();
  if (dbCheck) results.passed++;
  else results.failed++;
  
  // Test 2: Create Payment Intent
  results.total++;
  const paymentIntent = await testCreatePaymentIntent();
  if (paymentIntent.success) results.passed++;
  else {
    results.failed++;
    logWarning('\n⚠️  Cannot continue with remaining tests without payment intent');
    return printResults(results);
  }
  
  // Test 3: Get Payment Status
  results.total++;
  const statusCheck = await testGetPaymentStatus(paymentIntent.paymentIntentId);
  if (statusCheck.success) results.passed++;
  else results.failed++;
  
  // Test 4: Create Order Without Payment
  results.total++;
  const orderCheck = await testCreateOrderWithoutPayment(paymentIntent.paymentIntentId);
  if (orderCheck.success) results.passed++;
  else results.failed++;
  
  // Print results
  printResults(results);
  
  // Print next steps
  printNextSteps(paymentIntent);
}

function printResults(results) {
  logSection('TEST RESULTS');
  
  log(`\nTotal Tests: ${results.total}`, 'cyan');
  log(`Passed: ${results.passed}`, 'green');
  log(`Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'green');
  
  const percentage = ((results.passed / results.total) * 100).toFixed(1);
  log(`\nSuccess Rate: ${percentage}%`, percentage === '100.0' ? 'green' : 'yellow');
  
  if (results.passed === results.total) {
    log('\n🎉 All tests passed!', 'green');
  } else {
    log('\n⚠️  Some tests failed. Check the output above for details.', 'yellow');
  }
}

function printNextSteps(paymentIntent) {
  logSection('NEXT STEPS - MANUAL TESTING');
  
  log('\n📝 To complete the payment flow, you need to:', 'cyan');
  log('\n1. Start the frontend:', 'yellow');
  log('   cd ecommerce_client', 'white');
  log('   npm run dev', 'white');
  
  log('\n2. Open browser and go to:', 'yellow');
  log('   http://localhost:5173', 'white');
  
  log('\n3. Test the checkout flow:', 'yellow');
  log('   - Add a product to cart', 'white');
  log('   - Go to checkout', 'white');
  log('   - Fill shipping address', 'white');
  log('   - Enter test card: 4242 4242 4242 4242', 'white');
  log('   - Expiry: 12/34, CVC: 123', 'white');
  log('   - Click "Pay"', 'white');
  
  log('\n4. Verify in Stripe Dashboard:', 'yellow');
  log('   https://dashboard.stripe.com/test/payments', 'white');
  
  if (paymentIntent && paymentIntent.paymentIntentId) {
    log('\n💡 Payment Intent Created:', 'cyan');
    log(`   ID: ${paymentIntent.paymentIntentId}`, 'white');
    log(`   Amount: $${paymentIntent.amount.toFixed(2)}`, 'white');
    log('\n   You can check this payment in Stripe Dashboard', 'white');
  }
  
  log('\n📚 Documentation:', 'cyan');
  log('   - STRIPE-TESTING-GUIDE.md - Detailed testing steps', 'white');
  log('   - STRIPE-QUICK-START.md - Quick start guide', 'white');
  log('   - STRIPE-FIX-COMPLETE.md - Implementation details', 'white');
  
  log('\n');
}

// Run tests
runTests().catch(error => {
  logError(`\n❌ Test suite failed: ${error.message}`);
  console.error(error);
  process.exit(1);
});
