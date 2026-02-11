const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

// Test colors
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  section: (msg) => console.log(`\n${colors.cyan}${'='.repeat(60)}${colors.reset}\n${colors.cyan}${msg}${colors.reset}\n${colors.cyan}${'='.repeat(60)}${colors.reset}\n`)
};

let testResults = {
  passed: 0,
  failed: 0,
  total: 0
};

async function runTest(name, testFn) {
  testResults.total++;
  try {
    await testFn();
    log.success(name);
    testResults.passed++;
    return true;
  } catch (error) {
    log.error(`${name}: ${error.message}`);
    testResults.failed++;
    return false;
  }
}

async function testGuestCart() {
  log.section('GUEST CART FUNCTIONALITY TEST');
  
  let guestSessionId = null;
  let productId = null;
  
  // Test 1: Get products to use in cart
  await runTest('Get products list', async () => {
    const response = await axios.get(`${API_BASE}/products`);
    if (!response.data.products || response.data.products.length === 0) {
      throw new Error('No products available');
    }
    productId = response.data.products[0].id;
    log.info(`Using product ID: ${productId}`);
  });
  
  // Test 2: Create guest cart session
  await runTest('Create guest cart session', async () => {
    const response = await axios.post(`${API_BASE}/guest/cart/create`);
    if (!response.data.data || !response.data.data.sessionId) {
      throw new Error('No session ID returned');
    }
    guestSessionId = response.data.data.sessionId;
    log.info(`Guest session ID: ${guestSessionId}`);
  });
  
  // Test 3: Add product to guest cart
  await runTest('Add product to guest cart', async () => {
    if (!guestSessionId || !productId) {
      throw new Error('Missing session ID or product ID');
    }
    const response = await axios.post(`${API_BASE}/guest/cart/${guestSessionId}/add`, {
      productId: productId,
      quantity: 2
    });
    if (!response.data.success) {
      throw new Error('Failed to add to cart');
    }
    log.info('Added 2 units to cart');
  });
  
  // Test 4: Get guest cart
  await runTest('Get guest cart', async () => {
    const response = await axios.get(`${API_BASE}/guest/cart/${guestSessionId}`);
    if (!response.data.data || !response.data.data.items) {
      throw new Error('No cart items returned');
    }
    if (response.data.data.items.length === 0) {
      throw new Error('Cart is empty');
    }
    log.info(`Cart has ${response.data.data.items.length} item(s)`);
  });
  
  // Test 5: Update cart item quantity
  await runTest('Update cart item quantity', async () => {
    const response = await axios.patch(`${API_BASE}/guest/cart/${guestSessionId}/update`, {
      productId: productId,
      quantity: 5
    });
    if (!response.data.success) {
      throw new Error('Failed to update quantity');
    }
    log.info('Updated quantity to 5');
  });
  
  // Test 6: Remove item from cart
  await runTest('Remove item from guest cart', async () => {
    const response = await axios.delete(`${API_BASE}/guest/cart/${guestSessionId}/remove/${productId}`);
    if (!response.data.success) {
      throw new Error('Failed to remove item');
    }
    log.info('Item removed from cart');
  });
  
  // Test 7: Verify cart is empty
  await runTest('Verify cart is empty after removal', async () => {
    const response = await axios.get(`${API_BASE}/guest/cart/${guestSessionId}`);
    if (response.data.data.items.length !== 0) {
      throw new Error('Cart should be empty');
    }
    log.info('Cart is empty as expected');
  });
}

async function testRegisteredUserCart() {
  log.section('REGISTERED USER CART FUNCTIONALITY TEST');
  
  let token = null;
  let productId = null;
  
  // Test 1: Login as customer
  await runTest('Login as customer', async () => {
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email: 'customer@test.com',
      password: 'password123'
    });
    if (!response.data.token) {
      throw new Error('No token returned');
    }
    token = response.data.token;
    log.info('Logged in successfully');
  });
  
  // Test 2: Get products
  await runTest('Get products for cart', async () => {
    const response = await axios.get(`${API_BASE}/products`);
    if (!response.data.products || response.data.products.length === 0) {
      throw new Error('No products available');
    }
    productId = response.data.products[0].id;
    log.info(`Using product ID: ${productId}`);
  });
  
  // Test 3: Add to cart (authenticated)
  await runTest('Add product to cart (authenticated)', async () => {
    const response = await axios.post(
      `${API_BASE}/cart/items`,
      {
        product_id: productId,
        quantity: 3
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    if (!response.data.success && response.status !== 201) {
      throw new Error('Failed to add to cart');
    }
    log.info('Added 3 units to cart');
  });
  
  // Test 4: Get cart
  await runTest('Get cart (authenticated)', async () => {
    const response = await axios.get(`${API_BASE}/cart`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.data.items && !response.data.data) {
      throw new Error('No cart data returned');
    }
    const items = response.data.items || response.data.data?.items || [];
    log.info(`Cart has ${items.length} item(s)`);
  });
  
  // Test 5: Update cart item
  await runTest('Update cart item (authenticated)', async () => {
    const response = await axios.put(
      `${API_BASE}/cart/items/${productId}`,
      { quantity: 5 },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    if (!response.data.success && response.status !== 200) {
      throw new Error('Failed to update cart');
    }
    log.info('Updated quantity to 5');
  });
  
  // Test 6: Clear cart
  await runTest('Clear cart (authenticated)', async () => {
    const response = await axios.delete(`${API_BASE}/cart`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.data.success && response.status !== 200) {
      throw new Error('Failed to clear cart');
    }
    log.info('Cart cleared successfully');
  });
}

async function main() {
  console.log('\n');
  log.section('🛒 CART FUNCTIONALITY TEST SUITE');
  log.info('Testing both guest and registered user cart functionality');
  log.info('Backend: http://localhost:5000');
  
  try {
    // Test guest cart
    await testGuestCart();
    
    // Test registered user cart
    await testRegisteredUserCart();
    
    // Print summary
    log.section('TEST SUMMARY');
    console.log(`Total Tests: ${testResults.total}`);
    console.log(`${colors.green}Passed: ${testResults.passed}${colors.reset}`);
    console.log(`${colors.red}Failed: ${testResults.failed}${colors.reset}`);
    console.log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(2)}%\n`);
    
    if (testResults.failed === 0) {
      log.success('ALL TESTS PASSED! 🎉');
      log.info('Cart functionality is working correctly');
    } else {
      log.error('SOME TESTS FAILED');
      log.info('Check the errors above for details');
    }
    
  } catch (error) {
    log.error(`Test suite failed: ${error.message}`);
    console.error(error);
  }
}

main();
