/**
 * INVENTORY MANAGEMENT TESTS
 * 
 * Comprehensive tests for inventory operations.
 * Tests each requirement individually:
 * 1. Track product stock levels
 * 2. Update inventory quantities (ADMIN)
 * 3. Prevent checkout if stock is insufficient
 * 4. Generate low-stock alerts
 * 5. Create inventory reports
 */

const supabase = require('./config/supabase');
const { hashPassword } = require('./utils/hash');

// Test configuration
const TEST_CONFIG = {
  adminEmail: 'admin-inventory@test.com',
  adminPassword: 'AdminPass123',
  customerEmail: 'customer-inventory@test.com',
  customerPassword: 'CustomerPass123'
};

let adminToken = null;
let customerToken = null;
let testProductId1 = null;
let testProductId2 = null;
let testProductId3 = null;
let testCategoryId = null;

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

// Setup: Create test users and products
async function setupTestData() {
  console.log('\n=== SETUP: Create Test Data ===');

  try {
    // Hash passwords
    const adminPasswordHash = await hashPassword(TEST_CONFIG.adminPassword);
    const customerPasswordHash = await hashPassword(TEST_CONFIG.customerPassword);

    // Create admin user
    const { error: adminError } = await supabase
      .from('users')
      .insert([{
        email: TEST_CONFIG.adminEmail,
        password_hash: adminPasswordHash,
        role: 'admin',
        display_name: 'Test Admin Inventory',
        status: 'active'
      }]);

    if (adminError && adminError.code !== '23505') {
      console.error('❌ Admin user creation failed:', adminError.message);
    } else {
      console.log('✅ Admin user created or already exists');
    }

    // Create customer user
    const { error: customerError } = await supabase
      .from('users')
      .insert([{
        email: TEST_CONFIG.customerEmail,
        password_hash: customerPasswordHash,
        role: 'customer',
        display_name: 'Test Customer Inventory',
        status: 'active'
      }]);

    if (customerError && customerError.code !== '23505') {
      console.error('❌ Customer user creation failed:', customerError.message);
    } else {
      console.log('✅ Customer user created or already exists');
    }

    // Get auth tokens
    const adminResponse = await apiRequest('POST', '/api/auth/login', {
      email: TEST_CONFIG.adminEmail,
      password: TEST_CONFIG.adminPassword
    });

    if (adminResponse.status === 200) {
      adminToken = adminResponse.data.token;
      console.log('✅ Admin token obtained');
    }

    const customerResponse = await apiRequest('POST', '/api/auth/login', {
      email: TEST_CONFIG.customerEmail,
      password: TEST_CONFIG.customerPassword
    });

    if (customerResponse.status === 200) {
      customerToken = customerResponse.data.token;
      console.log('✅ Customer token obtained');
    }

    // Create test category
    const { data: categoryData } = await supabase
      .from('categories')
      .insert([{
        name: 'Test Inventory Category',
        description: 'Category for inventory testing'
      }])
      .select()
      .single();

    testCategoryId = categoryData?.id;
    console.log('✅ Test category created');

    // Create test products with different stock levels
    const { data: product1 } = await supabase
      .from('products')
      .insert([{
        title: 'High Stock Product',
        description: 'Product with high stock',
        price: 99.99,
        category_id: testCategoryId,
        status: 'active'
      }])
      .select()
      .single();

    testProductId1 = product1?.id;

    const { data: product2 } = await supabase
      .from('products')
      .insert([{
        title: 'Low Stock Product',
        description: 'Product with low stock',
        price: 149.99,
        category_id: testCategoryId,
        status: 'active'
      }])
      .select()
      .single();

    testProductId2 = product2?.id;

    const { data: product3 } = await supabase
      .from('products')
      .insert([{
        title: 'Out of Stock Product',
        description: 'Product with no stock',
        price: 199.99,
        category_id: testCategoryId,
        status: 'active'
      }])
      .select()
      .single();

    testProductId3 = product3?.id;

    // Create inventory records
    await supabase.from('inventory').insert([
      {
        product_id: testProductId1,
        quantity: 100,
        reserved_quantity: 0,
        low_stock_threshold: 10
      },
      {
        product_id: testProductId2,
        quantity: 5,
        reserved_quantity: 0,
        low_stock_threshold: 10
      },
      {
        product_id: testProductId3,
        quantity: 0,
        reserved_quantity: 0,
        low_stock_threshold: 10
      }
    ]);

    console.log('✅ Test products and inventory created');
    console.log(`   Product 1 (High Stock): ${testProductId1}`);
    console.log(`   Product 2 (Low Stock): ${testProductId2}`);
    console.log(`   Product 3 (Out of Stock): ${testProductId3}`);

    return true;
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    return false;
  }
}

// ============================================
// REQUIREMENT 1: Track Product Stock Levels
// ============================================

async function test1_GetAllInventory() {
  console.log('\n=== TEST 1.1: Get All Inventory (Admin Only) ===');

  try {
    // Test: Customer cannot access
    const customerAttempt = await apiRequest('GET', '/api/inventory', null, customerToken);
    if (customerAttempt.status === 403 || customerAttempt.status === 401) {
      console.log('✅ Customer correctly denied access to inventory list');
    } else {
      console.log('❌ Customer should not access inventory list');
    }

    // Test: Admin can access
    const adminAttempt = await apiRequest('GET', '/api/inventory', null, adminToken);
    if (adminAttempt.status === 200 && Array.isArray(adminAttempt.data)) {
      console.log(`✅ Admin retrieved ${adminAttempt.data.length} inventory records`);
      return true;
    } else {
      console.log('❌ Failed to retrieve inventory');
      return false;
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

async function test1_GetInventoryByProduct() {
  console.log('\n=== TEST 1.2: Get Inventory by Product ID (Admin Only) ===');

  try {
    const response = await apiRequest(
      'GET',
      `/api/inventory/product/${testProductId1}`,
      null,
      adminToken
    );

    if (response.status === 200) {
      console.log('✅ Retrieved inventory for product');
      console.log(`   Quantity: ${response.data.quantity}`);
      console.log(`   Reserved: ${response.data.reserved_quantity}`);
      console.log(`   Available: ${response.data.quantity - response.data.reserved_quantity}`);
      return true;
    } else {
      console.log('❌ Failed to retrieve inventory by product');
      return false;
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

async function test1_GetAvailableQuantity() {
  console.log('\n=== TEST 1.3: Get Available Quantity (Public) ===');

  try {
    const response = await apiRequest(
      'GET',
      `/api/inventory/product/${testProductId1}/available`
    );

    if (response.status === 200) {
      console.log('✅ Retrieved available quantity');
      console.log(`   Product ID: ${response.data.productId}`);
      console.log(`   Available: ${response.data.available}`);
      return true;
    } else {
      console.log('❌ Failed to retrieve available quantity');
      return false;
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

async function test1_CheckStock() {
  console.log('\n=== TEST 1.4: Check Stock Availability (Public) ===');

  try {
    // Test: Check sufficient stock
    const response1 = await apiRequest(
      'GET',
      `/api/inventory/product/${testProductId1}/check?quantity=10`
    );

    if (response1.status === 200 && response1.data.hasStock === true) {
      console.log('✅ Stock check passed for sufficient quantity');
    } else {
      console.log('❌ Stock check failed for sufficient quantity');
    }

    // Test: Check insufficient stock
    const response2 = await apiRequest(
      'GET',
      `/api/inventory/product/${testProductId1}/check?quantity=200`
    );

    if (response2.status === 200 && response2.data.hasStock === false) {
      console.log('✅ Stock check correctly identified insufficient stock');
      return true;
    } else {
      console.log('❌ Stock check failed for insufficient quantity');
      return false;
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

// ============================================
// REQUIREMENT 2: Update Inventory Quantities (ADMIN)
// ============================================

async function test2_UpdateQuantity() {
  console.log('\n=== TEST 2.1: Update Inventory Quantity (Admin Only) ===');

  try {
    // Test: Customer cannot update
    const customerAttempt = await apiRequest(
      'PUT',
      `/api/inventory/product/${testProductId1}/quantity`,
      { quantity: 150 },
      customerToken
    );

    if (customerAttempt.status === 403 || customerAttempt.status === 401) {
      console.log('✅ Customer correctly denied inventory update');
    } else {
      console.log('❌ Customer should not update inventory');
    }

    // Test: Admin can update
    const adminAttempt = await apiRequest(
      'PUT',
      `/api/inventory/product/${testProductId1}/quantity`,
      { quantity: 150 },
      adminToken
    );

    if (adminAttempt.status === 200) {
      console.log('✅ Admin successfully updated inventory quantity');
      console.log(`   New quantity: ${adminAttempt.data.inventory.quantity}`);
      return true;
    } else {
      console.log('❌ Failed to update inventory quantity');
      return false;
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

async function test2_AdjustQuantity() {
  console.log('\n=== TEST 2.2: Adjust Inventory Quantity (Admin Only) ===');

  try {
    // Test: Add stock
    const addResponse = await apiRequest(
      'PATCH',
      `/api/inventory/product/${testProductId1}/adjust`,
      { adjustment: 50 },
      adminToken
    );

    if (addResponse.status === 200) {
      console.log('✅ Successfully added stock');
      console.log(`   New quantity: ${addResponse.data.inventory.quantity}`);
    } else {
      console.log('❌ Failed to add stock');
    }

    // Test: Subtract stock
    const subtractResponse = await apiRequest(
      'PATCH',
      `/api/inventory/product/${testProductId1}/adjust`,
      { adjustment: -30 },
      adminToken
    );

    if (subtractResponse.status === 200) {
      console.log('✅ Successfully subtracted stock');
      console.log(`   New quantity: ${subtractResponse.data.inventory.quantity}`);
      return true;
    } else {
      console.log('❌ Failed to subtract stock');
      return false;
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

async function test2_UpdateThreshold() {
  console.log('\n=== TEST 2.3: Update Low Stock Threshold (Admin Only) ===');

  try {
    const response = await apiRequest(
      'PATCH',
      `/api/inventory/product/${testProductId1}/threshold`,
      { threshold: 20 },
      adminToken
    );

    if (response.status === 200) {
      console.log('✅ Successfully updated low stock threshold');
      console.log(`   New threshold: ${response.data.inventory.low_stock_threshold}`);
      return true;
    } else {
      console.log('❌ Failed to update threshold');
      return false;
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

// ============================================
// REQUIREMENT 3: Prevent Checkout if Stock is Insufficient
// ============================================

async function test3_ReserveInventory() {
  console.log('\n=== TEST 3.1: Reserve Inventory for Order ===');

  try {
    // Test: Reserve available stock
    const response1 = await apiRequest(
      'POST',
      `/api/inventory/product/${testProductId1}/reserve`,
      { quantity: 10 },
      adminToken
    );

    if (response1.status === 200) {
      console.log('✅ Successfully reserved inventory');
      console.log(`   Reserved quantity: ${response1.data.inventory.reserved_quantity}`);
    } else {
      console.log('❌ Failed to reserve inventory');
    }

    // Test: Try to reserve more than available
    const response2 = await apiRequest(
      'POST',
      `/api/inventory/product/${testProductId1}/reserve`,
      { quantity: 500 },
      adminToken
    );

    if (response2.status === 500 || response2.status === 400) {
      console.log('✅ Correctly prevented reservation of insufficient stock');
      return true;
    } else {
      console.log('❌ Should have prevented over-reservation');
      return false;
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

async function test3_CheckInsufficientStock() {
  console.log('\n=== TEST 3.2: Check Insufficient Stock Prevention ===');

  try {
    // Check out of stock product
    const response = await apiRequest(
      'GET',
      `/api/inventory/product/${testProductId3}/check?quantity=1`
    );

    if (response.status === 200 && response.data.hasStock === false) {
      console.log('✅ Correctly identified out of stock product');
      console.log('   Checkout would be prevented for this product');
      return true;
    } else {
      console.log('❌ Failed to identify out of stock product');
      return false;
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

async function test3_ReleaseInventory() {
  console.log('\n=== TEST 3.3: Release Reserved Inventory ===');

  try {
    const response = await apiRequest(
      'POST',
      `/api/inventory/product/${testProductId1}/release`,
      { quantity: 5 },
      adminToken
    );

    if (response.status === 200) {
      console.log('✅ Successfully released reserved inventory');
      console.log(`   Reserved quantity: ${response.data.inventory.reserved_quantity}`);
      return true;
    } else {
      console.log('❌ Failed to release inventory');
      return false;
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

async function test3_FulfillInventory() {
  console.log('\n=== TEST 3.4: Fulfill Reserved Inventory ===');

  try {
    const response = await apiRequest(
      'POST',
      `/api/inventory/product/${testProductId1}/fulfill`,
      { quantity: 5 },
      adminToken
    );

    if (response.status === 200) {
      console.log('✅ Successfully fulfilled reserved inventory');
      console.log(`   Total quantity: ${response.data.inventory.quantity}`);
      console.log(`   Reserved quantity: ${response.data.inventory.reserved_quantity}`);
      return true;
    } else {
      console.log('❌ Failed to fulfill inventory');
      return false;
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

// ============================================
// REQUIREMENT 4: Generate Low-Stock Alerts
// ============================================

async function test4_GetLowStock() {
  console.log('\n=== TEST 4.1: Get Low Stock Products (Admin Only) ===');

  try {
    const response = await apiRequest('GET', '/api/inventory/low-stock', null, adminToken);

    if (response.status === 200 && Array.isArray(response.data)) {
      console.log(`✅ Retrieved ${response.data.length} low stock products`);
      
      response.data.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.product?.title || 'Unknown'}`);
        console.log(`      Quantity: ${item.quantity}, Threshold: ${item.low_stock_threshold}`);
      });
      
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

async function test4_GetOutOfStock() {
  console.log('\n=== TEST 4.2: Get Out of Stock Products (Admin Only) ===');

  try {
    const response = await apiRequest('GET', '/api/inventory/out-of-stock', null, adminToken);

    if (response.status === 200 && Array.isArray(response.data)) {
      console.log(`✅ Retrieved ${response.data.length} out of stock products`);
      
      response.data.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.product?.title || 'Unknown'}`);
        console.log(`      Quantity: ${item.quantity}`);
      });
      
      return true;
    } else {
      console.log('❌ Failed to retrieve out of stock products');
      return false;
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

// ============================================
// REQUIREMENT 5: Create Inventory Reports
// ============================================

async function test5_InventoryReport() {
  console.log('\n=== TEST 5: Generate Inventory Report (Admin Only) ===');

  try {
    // Get all inventory
    const allInventory = await apiRequest('GET', '/api/inventory', null, adminToken);
    
    // Get low stock
    const lowStock = await apiRequest('GET', '/api/inventory/low-stock', null, adminToken);
    
    // Get out of stock
    const outOfStock = await apiRequest('GET', '/api/inventory/out-of-stock', null, adminToken);

    if (allInventory.status === 200 && lowStock.status === 200 && outOfStock.status === 200) {
      console.log('✅ Successfully generated inventory report');
      console.log('\n📊 INVENTORY REPORT');
      console.log('═'.repeat(60));
      console.log(`Total Products: ${allInventory.data.length}`);
      console.log(`Low Stock Products: ${lowStock.data.length}`);
      console.log(`Out of Stock Products: ${outOfStock.data.length}`);
      
      // Calculate total inventory value and quantity
      let totalQuantity = 0;
      let totalReserved = 0;
      let totalAvailable = 0;

      allInventory.data.forEach(item => {
        totalQuantity += item.quantity || 0;
        totalReserved += item.reserved_quantity || 0;
        totalAvailable += (item.quantity - item.reserved_quantity) || 0;
      });

      console.log(`\nTotal Quantity: ${totalQuantity}`);
      console.log(`Total Reserved: ${totalReserved}`);
      console.log(`Total Available: ${totalAvailable}`);
      console.log('═'.repeat(60));
      
      return true;
    } else {
      console.log('❌ Failed to generate inventory report');
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
    // Delete test inventory
    if (testProductId1) {
      await supabase.from('inventory').delete().eq('product_id', testProductId1);
    }
    if (testProductId2) {
      await supabase.from('inventory').delete().eq('product_id', testProductId2);
    }
    if (testProductId3) {
      await supabase.from('inventory').delete().eq('product_id', testProductId3);
    }

    // Delete test products
    if (testProductId1) {
      await supabase.from('products').delete().eq('id', testProductId1);
    }
    if (testProductId2) {
      await supabase.from('products').delete().eq('id', testProductId2);
    }
    if (testProductId3) {
      await supabase.from('products').delete().eq('id', testProductId3);
    }

    // Delete test category
    if (testCategoryId) {
      await supabase.from('categories').delete().eq('id', testCategoryId);
    }

    // Delete test users
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
  console.log('║   INVENTORY MANAGEMENT TESTS                               ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  // Setup
  const setupSuccess = await setupTestData();
  if (!setupSuccess) {
    console.log('❌ Setup failed, aborting tests');
    process.exit(1);
  }

  const tests = [
    // Requirement 1: Track Product Stock Levels
    { name: 'REQ 1.1: Get All Inventory', fn: test1_GetAllInventory },
    { name: 'REQ 1.2: Get Inventory by Product', fn: test1_GetInventoryByProduct },
    { name: 'REQ 1.3: Get Available Quantity', fn: test1_GetAvailableQuantity },
    { name: 'REQ 1.4: Check Stock Availability', fn: test1_CheckStock },
    
    // Requirement 2: Update Inventory Quantities (ADMIN)
    { name: 'REQ 2.1: Update Quantity', fn: test2_UpdateQuantity },
    { name: 'REQ 2.2: Adjust Quantity', fn: test2_AdjustQuantity },
    { name: 'REQ 2.3: Update Threshold', fn: test2_UpdateThreshold },
    
    // Requirement 3: Prevent Checkout if Stock is Insufficient
    { name: 'REQ 3.1: Reserve Inventory', fn: test3_ReserveInventory },
    { name: 'REQ 3.2: Check Insufficient Stock', fn: test3_CheckInsufficientStock },
    { name: 'REQ 3.3: Release Inventory', fn: test3_ReleaseInventory },
    { name: 'REQ 3.4: Fulfill Inventory', fn: test3_FulfillInventory },
    
    // Requirement 4: Generate Low-Stock Alerts
    { name: 'REQ 4.1: Get Low Stock Products', fn: test4_GetLowStock },
    { name: 'REQ 4.2: Get Out of Stock Products', fn: test4_GetOutOfStock },
    
    // Requirement 5: Create Inventory Reports
    { name: 'REQ 5: Generate Inventory Report', fn: test5_InventoryReport }
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
  console.log('1. ✅ Track Product Stock Levels');
  console.log('2. ✅ Update Inventory Quantities (ADMIN)');
  console.log('3. ✅ Prevent Checkout if Stock is Insufficient');
  console.log('4. ✅ Generate Low-Stock Alerts');
  console.log('5. ✅ Create Inventory Reports');

  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
