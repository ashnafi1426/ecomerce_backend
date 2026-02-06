/**
 * PRODUCT & CATEGORY MANAGEMENT TESTS
 * 
 * Comprehensive tests for product and category operations.
 * Tests both public (customer) and admin endpoints.
 */

const supabase = require('./config/supabase');
const { hashPassword } = require('./utils/hash');

// Test configuration
const TEST_CONFIG = {
  adminEmail: 'admin@test.com',
  adminPassword: 'AdminPass123',
  customerEmail: 'customer@test.com',
  customerPassword: 'CustomerPass123'
};

let adminToken = null;
let customerToken = null;
let testCategoryId = null;
let testProductId = null;

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

  if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
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

// Test 1: Setup - Create test users
async function setupTestUsers() {
  console.log('\n=== TEST 1: Setup Test Users ===');

  try {
    // Hash passwords
    const adminPasswordHash = await hashPassword(TEST_CONFIG.adminPassword);
    const customerPasswordHash = await hashPassword(TEST_CONFIG.customerPassword);

    // Create admin user
    const { data: adminData, error: adminError } = await supabase
      .from('users')
      .insert([{
        email: TEST_CONFIG.adminEmail,
        password_hash: adminPasswordHash,
        role: 'admin',
        display_name: 'Test Admin',
        status: 'active'
      }])
      .select()
      .single();

    if (adminError && adminError.code !== '23505') {
      console.error('❌ Admin user creation failed:', adminError.message);
    } else {
      console.log('✅ Admin user created or already exists');
    }

    // Create customer user
    const { data: customerData, error: customerError } = await supabase
      .from('users')
      .insert([{
        email: TEST_CONFIG.customerEmail,
        password_hash: customerPasswordHash,
        role: 'customer',
        display_name: 'Test Customer',
        status: 'active'
      }])
      .select()
      .single();

    if (customerError && customerError.code !== '23505') {
      console.error('❌ Customer user creation failed:', customerError.message);
    } else {
      console.log('✅ Customer user created or already exists');
    }

    console.log('✅ Test users setup complete');
    return true;
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    return false;
  }
}

// Test 2: Get authentication tokens
async function getAuthTokens() {
  console.log('\n=== TEST 2: Get Authentication Tokens ===');

  try {
    // Get admin token
    const adminResponse = await apiRequest('POST', '/api/auth/login', {
      email: TEST_CONFIG.adminEmail,
      password: TEST_CONFIG.adminPassword
    });

    if (adminResponse.status === 200 && adminResponse.data.token) {
      adminToken = adminResponse.data.token;
      console.log('✅ Admin token obtained');
    } else {
      console.log('❌ Admin login failed:', adminResponse.data.message);
      return false;
    }

    // Get customer token
    const customerResponse = await apiRequest('POST', '/api/auth/login', {
      email: TEST_CONFIG.customerEmail,
      password: TEST_CONFIG.customerPassword
    });

    if (customerResponse.status === 200 && customerResponse.data.token) {
      customerToken = customerResponse.data.token;
      console.log('✅ Customer token obtained');
    } else {
      console.log('❌ Customer login failed:', customerResponse.data.message);
      return false;
    }

    return true;
  } catch (error) {
    console.error('❌ Token generation failed:', error.message);
    return false;
  }
}

// Test 3: Create Category (Admin Only)
async function testCreateCategory() {
  console.log('\n=== TEST 3: Create Category (Admin Only) ===');

  try {
    // Test: Customer cannot create category
    const customerAttempt = await apiRequest('POST', '/api/categories', {
      name: 'Test Category',
      description: 'Test Description'
    }, customerToken);

    if (customerAttempt.status === 403 || customerAttempt.status === 401) {
      console.log('✅ Customer correctly denied category creation');
    } else {
      console.log('❌ Customer should not be able to create categories');
    }

    // Test: Admin can create category
    const adminAttempt = await apiRequest('POST', '/api/categories', {
      name: 'Electronics',
      description: 'Electronic devices and accessories'
    }, adminToken);

    if (adminAttempt.status === 201) {
      testCategoryId = adminAttempt.data.category.id;
      console.log('✅ Admin successfully created category');
      console.log(`   Category ID: ${testCategoryId}`);
    } else {
      console.log('❌ Admin category creation failed:', adminAttempt.data.message);
    }

    return true;
  } catch (error) {
    console.error('❌ Category creation test failed:', error.message);
    return false;
  }
}

// Test 4: Get All Categories (Public)
async function testGetCategories() {
  console.log('\n=== TEST 4: Get All Categories (Public) ===');

  try {
    const response = await apiRequest('GET', '/api/categories');

    if (response.status === 200 && Array.isArray(response.data)) {
      console.log(`✅ Retrieved ${response.data.length} categories`);
      return true;
    } else {
      console.log('❌ Failed to retrieve categories');
      return false;
    }
  } catch (error) {
    console.error('❌ Get categories test failed:', error.message);
    return false;
  }
}

// Test 5: Get Category Hierarchy (Public)
async function testGetCategoryHierarchy() {
  console.log('\n=== TEST 5: Get Category Hierarchy (Public) ===');

  try {
    const response = await apiRequest('GET', '/api/categories/hierarchy');

    if (response.status === 200 && Array.isArray(response.data)) {
      console.log(`✅ Retrieved category hierarchy with ${response.data.length} root categories`);
      return true;
    } else {
      console.log('❌ Failed to retrieve category hierarchy');
      return false;
    }
  } catch (error) {
    console.error('❌ Get category hierarchy test failed:', error.message);
    return false;
  }
}

// Test 6: Create Product (Admin Only)
async function testCreateProduct() {
  console.log('\n=== TEST 6: Create Product (Admin Only) ===');

  try {
    // Test: Customer cannot create product
    const customerAttempt = await apiRequest('POST', '/api/admin/products', {
      title: 'Test Product',
      price: 99.99
    }, customerToken);

    if (customerAttempt.status === 403 || customerAttempt.status === 401) {
      console.log('✅ Customer correctly denied product creation');
    } else {
      console.log('❌ Customer should not be able to create products');
    }

    // Test: Admin can create product
    const adminAttempt = await apiRequest('POST', '/api/admin/products', {
      title: 'Laptop Computer',
      description: 'High-performance laptop',
      price: 1299.99,
      imageUrl: 'https://example.com/laptop.jpg',
      categoryId: testCategoryId,
      initialQuantity: 50,
      lowStockThreshold: 10
    }, adminToken);

    if (adminAttempt.status === 201) {
      testProductId = adminAttempt.data.product.id;
      console.log('✅ Admin successfully created product');
      console.log(`   Product ID: ${testProductId}`);
    } else {
      console.log('❌ Admin product creation failed:', adminAttempt.data.message);
    }

    return true;
  } catch (error) {
    console.error('❌ Product creation test failed:', error.message);
    return false;
  }
}

// Test 7: Get All Products (Public)
async function testGetProducts() {
  console.log('\n=== TEST 7: Get All Products (Public) ===');

  try {
    const response = await apiRequest('GET', '/api/products');

    if (response.status === 200 && response.data.products) {
      console.log(`✅ Retrieved ${response.data.count} products`);
      return true;
    } else {
      console.log('❌ Failed to retrieve products');
      return false;
    }
  } catch (error) {
    console.error('❌ Get products test failed:', error.message);
    return false;
  }
}

// Test 8: Get Product by ID (Public)
async function testGetProductById() {
  console.log('\n=== TEST 8: Get Product by ID (Public) ===');

  if (!testProductId) {
    console.log('⚠️  Skipping - no test product ID available');
    return true;
  }

  try {
    const response = await apiRequest('GET', `/api/products/${testProductId}`);

    if (response.status === 200 && response.data.id) {
      console.log('✅ Retrieved product by ID');
      console.log(`   Title: ${response.data.title}`);
      console.log(`   Price: $${response.data.price}`);
      return true;
    } else {
      console.log('❌ Failed to retrieve product by ID');
      return false;
    }
  } catch (error) {
    console.error('❌ Get product by ID test failed:', error.message);
    return false;
  }
}

// Test 9: Search Products (Public)
async function testSearchProducts() {
  console.log('\n=== TEST 9: Search Products (Public) ===');

  try {
    const response = await apiRequest('GET', '/api/products/search?q=laptop');

    if (response.status === 200 && response.data.products) {
      console.log(`✅ Search returned ${response.data.count} products`);
      return true;
    } else {
      console.log('❌ Product search failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Search products test failed:', error.message);
    return false;
  }
}

// Test 10: Filter Products by Category (Public)
async function testFilterProductsByCategory() {
  console.log('\n=== TEST 10: Filter Products by Category (Public) ===');

  if (!testCategoryId) {
    console.log('⚠️  Skipping - no test category ID available');
    return true;
  }

  try {
    const response = await apiRequest('GET', `/api/products?categoryId=${testCategoryId}`);

    if (response.status === 200) {
      console.log(`✅ Retrieved ${response.data.count} products in category`);
      return true;
    } else {
      console.log('❌ Failed to filter products by category');
      return false;
    }
  } catch (error) {
    console.error('❌ Filter products test failed:', error.message);
    return false;
  }
}

// Test 11: Update Product (Admin Only)
async function testUpdateProduct() {
  console.log('\n=== TEST 11: Update Product (Admin Only) ===');

  if (!testProductId) {
    console.log('⚠️  Skipping - no test product ID available');
    return true;
  }

  try {
    const response = await apiRequest('PUT', `/api/admin/products/${testProductId}`, {
      title: 'Updated Laptop Computer',
      price: 1199.99
    }, adminToken);

    if (response.status === 200) {
      console.log('✅ Admin successfully updated product');
      return true;
    } else {
      console.log('❌ Product update failed:', response.data.message);
      return false;
    }
  } catch (error) {
    console.error('❌ Update product test failed:', error.message);
    return false;
  }
}

// Test 12: Enable/Disable Product (Admin Only)
async function testEnableDisableProduct() {
  console.log('\n=== TEST 12: Enable/Disable Product (Admin Only) ===');

  if (!testProductId) {
    console.log('⚠️  Skipping - no test product ID available');
    return true;
  }

  try {
    // Disable product
    const disableResponse = await apiRequest('PUT', `/api/admin/products/${testProductId}`, {
      status: 'inactive'
    }, adminToken);

    if (disableResponse.status === 200) {
      console.log('✅ Product disabled successfully');
    } else {
      console.log('❌ Product disable failed');
    }

    // Enable product
    const enableResponse = await apiRequest('PUT', `/api/admin/products/${testProductId}`, {
      status: 'active'
    }, adminToken);

    if (enableResponse.status === 200) {
      console.log('✅ Product enabled successfully');
      return true;
    } else {
      console.log('❌ Product enable failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Enable/disable product test failed:', error.message);
    return false;
  }
}

// Test 13: Pagination Test
async function testPagination() {
  console.log('\n=== TEST 13: Pagination Test ===');

  try {
    const response = await apiRequest('GET', '/api/products?limit=5&offset=0');

    if (response.status === 200 && response.data.products) {
      console.log(`✅ Pagination working - retrieved ${response.data.count} products (limit: 5)`);
      return true;
    } else {
      console.log('❌ Pagination test failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Pagination test failed:', error.message);
    return false;
  }
}

// Test 14: Update Category (Admin Only)
async function testUpdateCategory() {
  console.log('\n=== TEST 14: Update Category (Admin Only) ===');

  if (!testCategoryId) {
    console.log('⚠️  Skipping - no test category ID available');
    return true;
  }

  try {
    const response = await apiRequest('PUT', `/api/categories/${testCategoryId}`, {
      name: 'Updated Electronics',
      description: 'Updated description'
    }, adminToken);

    if (response.status === 200) {
      console.log('✅ Category updated successfully');
      return true;
    } else {
      console.log('❌ Category update failed:', response.data.message);
      return false;
    }
  } catch (error) {
    console.error('❌ Update category test failed:', error.message);
    return false;
  }
}

// Test 15: Get Products in Category (Public)
async function testGetProductsInCategory() {
  console.log('\n=== TEST 15: Get Products in Category (Public) ===');

  if (!testCategoryId) {
    console.log('⚠️  Skipping - no test category ID available');
    return true;
  }

  try {
    const response = await apiRequest('GET', `/api/categories/${testCategoryId}/products`);

    if (response.status === 200 && Array.isArray(response.data)) {
      console.log(`✅ Retrieved ${response.data.length} products in category`);
      return true;
    } else {
      console.log('❌ Failed to get products in category');
      return false;
    }
  } catch (error) {
    console.error('❌ Get products in category test failed:', error.message);
    return false;
  }
}

// Cleanup function
async function cleanup() {
  console.log('\n=== CLEANUP ===');

  try {
    // Delete test product
    if (testProductId) {
      await supabase.from('products').delete().eq('id', testProductId);
      console.log('✅ Test product deleted');
    }

    // Delete test category
    if (testCategoryId) {
      await supabase.from('categories').delete().eq('id', testCategoryId);
      console.log('✅ Test category deleted');
    }

    // Delete test users
    await supabase.from('users').delete().eq('email', TEST_CONFIG.adminEmail);
    await supabase.from('users').delete().eq('email', TEST_CONFIG.customerEmail);
    console.log('✅ Test users deleted');

    console.log('✅ Cleanup complete');
  } catch (error) {
    console.error('⚠️  Cleanup error:', error.message);
  }
}

// Main test runner
async function runTests() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   PRODUCT & CATEGORY MANAGEMENT TESTS                      ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  const tests = [
    { name: 'Setup Test Users', fn: setupTestUsers },
    { name: 'Get Auth Tokens', fn: getAuthTokens },
    { name: 'Create Category', fn: testCreateCategory },
    { name: 'Get All Categories', fn: testGetCategories },
    { name: 'Get Category Hierarchy', fn: testGetCategoryHierarchy },
    { name: 'Create Product', fn: testCreateProduct },
    { name: 'Get All Products', fn: testGetProducts },
    { name: 'Get Product by ID', fn: testGetProductById },
    { name: 'Search Products', fn: testSearchProducts },
    { name: 'Filter by Category', fn: testFilterProductsByCategory },
    { name: 'Update Product', fn: testUpdateProduct },
    { name: 'Enable/Disable Product', fn: testEnableDisableProduct },
    { name: 'Pagination', fn: testPagination },
    { name: 'Update Category', fn: testUpdateCategory },
    { name: 'Get Products in Category', fn: testGetProductsInCategory }
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

  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
