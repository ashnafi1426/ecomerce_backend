/**
 * PRODUCT VARIANTS SYSTEM - COMPREHENSIVE TEST
 * 
 * Tests all variant functionality including:
 * - Variant creation and management
 * - Inventory tracking
 * - Cart integration
 * - Price calculations
 * - Availability checks
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test data storage
let testData = {
  adminToken: null,
  sellerToken: null,
  customerToken: null,
  sellerId: null,
  customerId: null,
  productId: null,
  variantIds: [],
  cartItemId: null
};

// Color codes for console output
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

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60) + '\n');
}

function logTest(testName) {
  log(`\n▶ ${testName}`, 'blue');
}

function logSuccess(message) {
  log(`  ✓ ${message}`, 'green');
}

function logError(message) {
  log(`  ✗ ${message}`, 'red');
}

function logWarning(message) {
  log(`  ⚠ ${message}`, 'yellow');
}

// ============================================================================
// AUTHENTICATION HELPERS
// ============================================================================

async function loginAdmin() {
  logTest('Login as Admin');
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@fastshop.com',
      password: 'Admin123!@#'
    });
    testData.adminToken = response.data.token;
    logSuccess('Admin logged in successfully');
    return true;
  } catch (error) {
    logError(`Admin login failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function createAndLoginSeller() {
  logTest('Create and Login Seller');
  try {
    // Register seller
    const registerResponse = await axios.post(`${BASE_URL}/auth/register`, {
      email: `seller_${Date.now()}@test.com`,
      password: 'Test123!@#',
      displayName: 'Test Seller',
      role: 'seller',
      businessName: 'Test Business',
      businessAddress: '123 Test St'
    });
    
    testData.sellerId = registerResponse.data.user.id;
    testData.sellerToken = registerResponse.data.token;
    logSuccess('Seller created and logged in');
    return true;
  } catch (error) {
    logError(`Seller creation failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function createAndLoginCustomer() {
  logTest('Create and Login Customer');
  try {
    const registerResponse = await axios.post(`${BASE_URL}/auth/register`, {
      email: `customer_${Date.now()}@test.com`,
      password: 'Test123!@#',
      displayName: 'Test Customer',
      role: 'customer'
    });
    
    testData.customerId = registerResponse.data.user.id;
    testData.customerToken = registerResponse.data.token;
    logSuccess('Customer created and logged in');
    return true;
  } catch (error) {
    logError(`Customer creation failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// ============================================================================
// PRODUCT SETUP
// ============================================================================

async function createTestProduct() {
  logTest('Create Test Product');
  try {
    const response = await axios.post(
      `${BASE_URL}/products`,
      {
        title: 'Test T-Shirt',
        description: 'A test t-shirt with multiple variants',
        price: 29.99,
        imageUrl: 'https://example.com/tshirt.jpg',
        categoryId: null,
        initialQuantity: 100
      },
      {
        headers: { Authorization: `Bearer ${testData.sellerToken}` }
      }
    );
    
    testData.productId = response.data.product.id;
    logSuccess(`Product created: ${testData.productId}`);
    return true;
  } catch (error) {
    logError(`Product creation failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// ============================================================================
// VARIANT TESTS
// ============================================================================

async function testCreateVariant() {
  logTest('Create Product Variant - Size Small');
  try {
    const response = await axios.post(
      `${BASE_URL}/products/${testData.productId}/variants`,
      {
        variant_name: 'Size: Small',
        sku: `SKU-SMALL-${Date.now()}`,
        price_adjustment: -5.00,
        attributes: { size: 'S' },
        initial_quantity: 50,
        low_stock_threshold: 10
      },
      {
        headers: { Authorization: `Bearer ${testData.sellerToken}` }
      }
    );
    
    testData.variantIds.push(response.data.data.id);
    logSuccess(`Variant created: ${response.data.data.variant_name}`);
    logSuccess(`SKU: ${response.data.data.sku}`);
    logSuccess(`Price adjustment: $${response.data.data.price_adjustment}`);
    return true;
  } catch (error) {
    logError(`Variant creation failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testBulkCreateVariants() {
  logTest('Bulk Create Variants');
  try {
    const timestamp = Date.now();
    const response = await axios.post(
      `${BASE_URL}/products/${testData.productId}/variants/bulk`,
      {
        variants: [
          {
            variant_name: 'Size: Medium',
            sku: `SKU-MEDIUM-${timestamp}`,
            price_adjustment: 0,
            attributes: { size: 'M' },
            initial_quantity: 75
          },
          {
            variant_name: 'Size: Large',
            sku: `SKU-LARGE-${timestamp}`,
            price_adjustment: 5.00,
            attributes: { size: 'L' },
            initial_quantity: 60
          },
          {
            variant_name: 'Size: XL',
            sku: `SKU-XL-${timestamp}`,
            price_adjustment: 10.00,
            attributes: { size: 'XL' },
            initial_quantity: 40
          }
        ]
      },
      {
        headers: { Authorization: `Bearer ${testData.sellerToken}` }
      }
    );
    
    response.data.data.forEach(variant => {
      testData.variantIds.push(variant.id);
      logSuccess(`Created: ${variant.variant_name} (${variant.sku})`);
    });
    
    logSuccess(`Total variants created: ${response.data.count}`);
    return true;
  } catch (error) {
    logError(`Bulk variant creation failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testGetProductVariants() {
  logTest('Get All Product Variants');
  try {
    const response = await axios.get(
      `${BASE_URL}/products/${testData.productId}/variants`
    );
    
    logSuccess(`Found ${response.data.count} variants`);
    response.data.data.forEach(variant => {
      logSuccess(`  - ${variant.variant_name}: $${variant.price_adjustment} adjustment`);
    });
    return true;
  } catch (error) {
    logError(`Get variants failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testGetVariantById() {
  logTest('Get Variant by ID');
  try {
    const variantId = testData.variantIds[0];
    const response = await axios.get(`${BASE_URL}/variants/${variantId}`);
    
    logSuccess(`Variant: ${response.data.data.variant_name}`);
    logSuccess(`SKU: ${response.data.data.sku}`);
    logSuccess(`Attributes: ${JSON.stringify(response.data.data.attributes)}`);
    logSuccess(`Product: ${response.data.data.product.title}`);
    return true;
  } catch (error) {
    logError(`Get variant failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testUpdateVariant() {
  logTest('Update Variant');
  try {
    const variantId = testData.variantIds[0];
    const response = await axios.put(
      `${BASE_URL}/variants/${variantId}`,
      {
        price_adjustment: -3.00,
        attributes: { size: 'S', color: 'Blue' }
      },
      {
        headers: { Authorization: `Bearer ${testData.sellerToken}` }
      }
    );
    
    logSuccess(`Updated price adjustment: $${response.data.data.price_adjustment}`);
    logSuccess(`Updated attributes: ${JSON.stringify(response.data.data.attributes)}`);
    return true;
  } catch (error) {
    logError(`Update variant failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// ============================================================================
// INVENTORY TESTS
// ============================================================================

async function testGetVariantInventory() {
  logTest('Get Variant Inventory');
  try {
    const variantId = testData.variantIds[0];
    const response = await axios.get(`${BASE_URL}/variants/${variantId}/inventory`);
    
    logSuccess(`Quantity: ${response.data.data.quantity}`);
    logSuccess(`Reserved: ${response.data.data.reserved_quantity}`);
    logSuccess(`Available: ${response.data.data.available}`);
    logSuccess(`Low stock threshold: ${response.data.data.low_stock_threshold}`);
    return true;
  } catch (error) {
    logError(`Get inventory failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testUpdateVariantInventory() {
  logTest('Update Variant Inventory');
  try {
    const variantId = testData.variantIds[0];
    const response = await axios.put(
      `${BASE_URL}/variants/${variantId}/inventory`,
      {
        quantity: 100
      },
      {
        headers: { Authorization: `Bearer ${testData.sellerToken}` }
      }
    );
    
    logSuccess(`New quantity: ${response.data.data.quantity}`);
    logSuccess(`Available: ${response.data.data.available}`);
    return true;
  } catch (error) {
    logError(`Update inventory failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testAdjustVariantInventory() {
  logTest('Adjust Variant Inventory (Add 25)');
  try {
    const variantId = testData.variantIds[0];
    const response = await axios.put(
      `${BASE_URL}/variants/${variantId}/inventory`,
      {
        adjustment: 25
      },
      {
        headers: { Authorization: `Bearer ${testData.sellerToken}` }
      }
    );
    
    logSuccess(`New quantity: ${response.data.data.quantity}`);
    return true;
  } catch (error) {
    logError(`Adjust inventory failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testCheckAvailability() {
  logTest('Check Variant Availability');
  try {
    const variantId = testData.variantIds[0];
    const response = await axios.get(
      `${BASE_URL}/variants/${variantId}/availability?quantity=10`
    );
    
    logSuccess(`Requested: ${response.data.data.requested_quantity}`);
    logSuccess(`Available: ${response.data.data.available_quantity}`);
    logSuccess(`Is available: ${response.data.data.is_available}`);
    return true;
  } catch (error) {
    logError(`Check availability failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testGetVariantPrice() {
  logTest('Get Variant Price');
  try {
    const variantId = testData.variantIds[0];
    const response = await axios.get(`${BASE_URL}/variants/${variantId}/price`);
    
    logSuccess(`Final price: $${response.data.data.price}`);
    return true;
  } catch (error) {
    logError(`Get price failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// ============================================================================
// CART INTEGRATION TESTS
// ============================================================================

async function testAddVariantToCart() {
  logTest('Add Variant to Cart');
  try {
    const variantId = testData.variantIds[1]; // Use Medium size
    const response = await axios.post(
      `${BASE_URL}/cart/items`,
      {
        productId: testData.productId,
        variantId: variantId,
        quantity: 2
      },
      {
        headers: { Authorization: `Bearer ${testData.customerToken}` }
      }
    );
    
    logSuccess('Variant added to cart');
    logSuccess(`Product: ${testData.productId}`);
    logSuccess(`Variant: ${variantId}`);
    logSuccess(`Quantity: 2`);
    return true;
  } catch (error) {
    logError(`Add to cart failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testGetCartWithVariants() {
  logTest('Get Cart with Variants');
  try {
    const response = await axios.get(
      `${BASE_URL}/cart`,
      {
        headers: { Authorization: `Bearer ${testData.customerToken}` }
      }
    );
    
    logSuccess(`Cart items: ${response.data.length}`);
    response.data.forEach(item => {
      if (item.variant) {
        logSuccess(`  - ${item.product.title} (${item.variant.variant_name})`);
        logSuccess(`    Quantity: ${item.quantity}`);
        logSuccess(`    Base price: $${item.product.price}`);
        logSuccess(`    Adjustment: $${item.variant.price_adjustment}`);
      }
    });
    return true;
  } catch (error) {
    logError(`Get cart failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testCartSummaryWithVariants() {
  logTest('Get Cart Summary with Variants');
  try {
    const response = await axios.get(
      `${BASE_URL}/cart/summary`,
      {
        headers: { Authorization: `Bearer ${testData.customerToken}` }
      }
    );
    
    logSuccess(`Total items: ${response.data.totalItems}`);
    logSuccess(`Total price: $${response.data.totalPrice}`);
    logSuccess(`Item count: ${response.data.itemCount}`);
    return true;
  } catch (error) {
    logError(`Get cart summary failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// ============================================================================
// SEARCH AND FILTER TESTS
// ============================================================================

async function testSearchVariantsByAttributes() {
  logTest('Search Variants by Attributes');
  try {
    const response = await axios.post(
      `${BASE_URL}/products/${testData.productId}/variants/search`,
      {
        attributes: { size: 'L' }
      }
    );
    
    logSuccess(`Found ${response.data.count} matching variants`);
    response.data.data.forEach(variant => {
      logSuccess(`  - ${variant.variant_name}`);
    });
    return true;
  } catch (error) {
    logError(`Search variants failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testGetLowStockVariants() {
  logTest('Get Low Stock Variants');
  try {
    // First, set a variant to low stock
    const variantId = testData.variantIds[2];
    await axios.put(
      `${BASE_URL}/variants/${variantId}/inventory`,
      { quantity: 5 },
      { headers: { Authorization: `Bearer ${testData.sellerToken}` } }
    );
    
    const response = await axios.get(
      `${BASE_URL}/products/${testData.productId}/variants/low-stock`,
      {
        headers: { Authorization: `Bearer ${testData.sellerToken}` }
      }
    );
    
    logSuccess(`Low stock variants: ${response.data.count}`);
    response.data.data.forEach(variant => {
      const inv = variant.inventory[0];
      logSuccess(`  - ${variant.variant_name}: ${inv.quantity - inv.reserved_quantity} available`);
    });
    return true;
  } catch (error) {
    logError(`Get low stock failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================

async function runAllTests() {
  logSection('PRODUCT VARIANTS SYSTEM - COMPREHENSIVE TEST');
  
  let passedTests = 0;
  let failedTests = 0;
  
  const tests = [
    // Setup
    { name: 'Authentication', fn: async () => {
      const admin = await loginAdmin();
      const seller = await createAndLoginSeller();
      const customer = await createAndLoginCustomer();
      return admin && seller && customer;
    }},
    { name: 'Product Setup', fn: createTestProduct },
    
    // Variant Management
    { name: 'Create Variant', fn: testCreateVariant },
    { name: 'Bulk Create Variants', fn: testBulkCreateVariants },
    { name: 'Get Product Variants', fn: testGetProductVariants },
    { name: 'Get Variant by ID', fn: testGetVariantById },
    { name: 'Update Variant', fn: testUpdateVariant },
    
    // Inventory Management
    { name: 'Get Variant Inventory', fn: testGetVariantInventory },
    { name: 'Update Variant Inventory', fn: testUpdateVariantInventory },
    { name: 'Adjust Variant Inventory', fn: testAdjustVariantInventory },
    { name: 'Check Availability', fn: testCheckAvailability },
    { name: 'Get Variant Price', fn: testGetVariantPrice },
    
    // Cart Integration
    { name: 'Add Variant to Cart', fn: testAddVariantToCart },
    { name: 'Get Cart with Variants', fn: testGetCartWithVariants },
    { name: 'Cart Summary with Variants', fn: testCartSummaryWithVariants },
    
    // Search and Filter
    { name: 'Search Variants by Attributes', fn: testSearchVariantsByAttributes },
    { name: 'Get Low Stock Variants', fn: testGetLowStockVariants }
  ];
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passedTests++;
      } else {
        failedTests++;
      }
    } catch (error) {
      logError(`Test "${test.name}" threw an error: ${error.message}`);
      failedTests++;
    }
  }
  
  // Summary
  logSection('TEST SUMMARY');
  log(`Total Tests: ${tests.length}`, 'cyan');
  log(`Passed: ${passedTests}`, 'green');
  log(`Failed: ${failedTests}`, 'red');
  log(`Success Rate: ${((passedTests / tests.length) * 100).toFixed(1)}%`, 'yellow');
  
  if (failedTests === 0) {
    log('\n🎉 All tests passed!', 'green');
  } else {
    log(`\n⚠️  ${failedTests} test(s) failed`, 'red');
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
}

// Run tests
runAllTests()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    logError(`Test runner error: ${error.message}`);
    process.exit(1);
  });
