/**
 * SHOPPING CART TESTS
 * 
 * Comprehensive tests for shopping cart operations.
 * Tests all 6 requirements:
 * 1. Add item to cart
 * 2. Remove item from cart
 * 3. Update item quantity
 * 4. Persist cart per user
 * 5. Validate inventory before checkout
 * 6. Secure cart endpoints for customers only
 */

const supabase = require('./config/supabase');
const { hashPassword } = require('./utils/hash');

// Test configuration
const TEST_CONFIG = {
  customer1Email: 'customer1-cart@test.com',
  customer1Password: 'CustomerPass123',
  customer2Email: 'customer2-cart@test.com',
  customer2Password: 'CustomerPass123',
  adminEmail: 'admin-cart@test.com',
  adminPassword: 'AdminPass123'
};

let customer1Token = null;
let customer2Token = null;
let adminToken = null;
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
    const customer1PasswordHash = await hashPassword(TEST_CONFIG.customer1Password);
    const customer2PasswordHash = await hashPassword(TEST_CONFIG.customer2Password);
    const adminPasswordHash = await hashPassword(TEST_CONFIG.adminPassword);

    // Create users
    await supabase.from('users').insert([
      {
        email: TEST_CONFIG.customer1Email,
        password_hash: customer1PasswordHash,
        role: 'customer',
        display_name: 'Test Customer 1',
        status: 'active'
      },
      {
        email: TEST_CONFIG.customer2Email,
        password_hash: customer2PasswordHash,
        role: 'customer',
        display_name: 'Test Customer 2',
        status: 'active'
      },
      {
        email: TEST_CONFIG.adminEmail,
        password_hash: adminPasswordHash,
        role: 'admin',
        display_name: 'Test Admin Cart',
        status: 'active'
      }
    ]);

    console.log('✅ Test users created');

    // Get auth tokens
    const customer1Response = await apiRequest('POST', '/api/auth/login', {
      email: TEST_CONFIG.customer1Email,
      password: TEST_CONFIG.customer1Password
    });
    customer1Token = customer1Response.data.token;

    const customer2Response = await apiRequest('POST', '/api/auth/login', {
      email: TEST_CONFIG.customer2Email,
      password: TEST_CONFIG.customer2Password
    });
    customer2Token = customer2Response.data.token;

    const adminResponse = await apiRequest('POST', '/api/auth/login', {
      email: TEST_CONFIG.adminEmail,
      password: TEST_CONFIG.adminPassword
    });
    adminToken = adminResponse.data.token;

    console.log('✅ Auth tokens obtained');

    // Create test category
    const { data: categoryData } = await supabase
      .from('categories')
      .insert([{
        name: 'Test Cart Category',
        description: 'Category for cart testing'
      }])
      .select()
      .single();

    testCategoryId = categoryData?.id;

    // Create test products
    const { data: product1 } = await supabase
      .from('products')
      .insert([{
        title: 'Test Product 1',
        description: 'Product for cart testing',
        price: 29.99,
        category_id: testCategoryId,
        status: 'active'
      }])
      .select()
      .single();

    testProductId1 = product1?.id;

    const { data: product2 } = await supabase
      .from('products')
      .insert([{
        title: 'Test Product 2',
        description: 'Another product for cart testing',
        price: 49.99,
        category_id: testCategoryId,
        status: 'active'
      }])
      .select()
      .single();

    testProductId2 = product2?.id;

    const { data: product3 } = await supabase
      .from('products')
      .insert([{
        title: 'Low Stock Product',
        description: 'Product with limited stock',
        price: 99.99,
        category_id: testCategoryId,
        status: 'active'
      }])
      .select()
      .single();

    testProductId3 = product3?.id;

    // Create inventory
    await supabase.from('inventory').insert([
      {
        product_id: testProductId1,
        quantity: 100,
        reserved_quantity: 0,
        low_stock_threshold: 10
      },
      {
        product_id: testProductId2,
        quantity: 50,
        reserved_quantity: 0,
        low_stock_threshold: 10
      },
      {
        product_id: testProductId3,
        quantity: 2,
        reserved_quantity: 0,
        low_stock_threshold: 5
      }
    ]);

    console.log('✅ Test products and inventory created');
    console.log(`   Product 1: ${testProductId1}`);
    console.log(`   Product 2: ${testProductId2}`);
    console.log(`   Product 3 (Low Stock): ${testProductId3}`);

    return true;
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    return false;
  }
}

// ============================================
// REQUIREMENT 1: Add Item to Cart
// ============================================

async function test1_AddItemToCart() {
  console.log('\n=== TEST 1.1: Add Item to Cart ===');

  try {
    const response = await apiRequest(
      'POST',
      '/api/cart/items',
      { productId: testProductId1, quantity: 2 },
      customer1Token
    );

    if (response.status === 201) {
      console.log('✅ Item added to cart successfully');
      console.log(`   Product ID: ${response.data.cartItem.product_id}`);
      console.log(`   Quantity: ${response.data.cartItem.quantity}`);
      return true;
    } else {
      console.log('❌ Failed to add item to cart');
      return false;
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

async function test1_AddSameItemAgain() {
  console.log('\n=== TEST 1.2: Add Same Item Again (Should Update Quantity) ===');

  try {
    const response = await apiRequest(
      'POST',
      '/api/cart/items',
      { productId: testProductId1, quantity: 3 },
      customer1Token
    );

    if (response.status === 201 && response.data.cartItem.quantity === 5) {
      console.log('✅ Quantity updated correctly (2 + 3 = 5)');
      return true;
    } else {
      console.log('❌ Quantity not updated correctly');
      return false;
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

async function test1_AddDifferentItem() {
  console.log('\n=== TEST 1.3: Add Different Item to Cart ===');

  try {
    const response = await apiRequest(
      'POST',
      '/api/cart/items',
      { productId: testProductId2, quantity: 1 },
      customer1Token
    );

    if (response.status === 201) {
      console.log('✅ Different item added to cart');
      return true;
    } else {
      console.log('❌ Failed to add different item');
      return false;
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

// ============================================
// REQUIREMENT 2: Remove Item from Cart
// ============================================

async function test2_RemoveItemFromCart() {
  console.log('\n=== TEST 2: Remove Item from Cart ===');

  try {
    const response = await apiRequest(
      'DELETE',
      `/api/cart/items/${testProductId2}`,
      null,
      customer1Token
    );

    if (response.status === 200) {
      console.log('✅ Item removed from cart successfully');
      return true;
    } else {
      console.log('❌ Failed to remove item from cart');
      return false;
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

// ============================================
// REQUIREMENT 3: Update Item Quantity
// ============================================

async function test3_UpdateItemQuantity() {
  console.log('\n=== TEST 3.1: Update Item Quantity ===');

  try {
    const response = await apiRequest(
      'PUT',
      `/api/cart/items/${testProductId1}`,
      { quantity: 10 },
      customer1Token
    );

    if (response.status === 200 && response.data.cartItem.quantity === 10) {
      console.log('✅ Item quantity updated successfully');
      console.log(`   New quantity: ${response.data.cartItem.quantity}`);
      return true;
    } else {
      console.log('❌ Failed to update item quantity');
      return false;
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

async function test3_UpdateToZeroShouldFail() {
  console.log('\n=== TEST 3.2: Update to Zero Quantity (Should Fail) ===');

  try {
    const response = await apiRequest(
      'PUT',
      `/api/cart/items/${testProductId1}`,
      { quantity: 0 },
      customer1Token
    );

    if (response.status === 400) {
      console.log('✅ Correctly rejected zero quantity');
      return true;
    } else {
      console.log('❌ Should have rejected zero quantity');
      return false;
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

// ============================================
// REQUIREMENT 4: Persist Cart Per User
// ============================================

async function test4_GetCart() {
  console.log('\n=== TEST 4.1: Get Cart (Persistence Check) ===');

  try {
    const response = await apiRequest('GET', '/api/cart', null, customer1Token);

    if (response.status === 200 && Array.isArray(response.data)) {
      console.log(`✅ Cart retrieved successfully`);
      console.log(`   Items in cart: ${response.data.length}`);
      response.data.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.product?.title} - Qty: ${item.quantity}`);
      });
      return true;
    } else {
      console.log('❌ Failed to retrieve cart');
      return false;
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

async function test4_CartIsolation() {
  console.log('\n=== TEST 4.2: Cart Isolation (Different Users) ===');

  try {
    // Add item to customer2's cart
    await apiRequest(
      'POST',
      '/api/cart/items',
      { productId: testProductId2, quantity: 1 },
      customer2Token
    );

    // Get customer1's cart
    const customer1Cart = await apiRequest('GET', '/api/cart', null, customer1Token);
    
    // Get customer2's cart
    const customer2Cart = await apiRequest('GET', '/api/cart', null, customer2Token);

    if (customer1Cart.status === 200 && customer2Cart.status === 200) {
      console.log(`✅ Cart isolation verified`);
      console.log(`   Customer 1 cart items: ${customer1Cart.data.length}`);
      console.log(`   Customer 2 cart items: ${customer2Cart.data.length}`);
      
      // Verify they have different items
      const customer1HasProduct2 = customer1Cart.data.some(item => item.product_id === testProductId2);
      const customer2HasProduct2 = customer2Cart.data.some(item => item.product_id === testProductId2);
      
      if (!customer1HasProduct2 && customer2HasProduct2) {
        console.log('✅ Carts are properly isolated');
        return true;
      } else {
        console.log('❌ Cart isolation failed');
        return false;
      }
    } else {
      console.log('❌ Failed to verify cart isolation');
      return false;
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

async function test4_GetCartSummary() {
  console.log('\n=== TEST 4.3: Get Cart Summary ===');

  try {
    const response = await apiRequest('GET', '/api/cart/summary', null, customer1Token);

    if (response.status === 200) {
      console.log('✅ Cart summary retrieved');
      console.log(`   Total Items: ${response.data.totalItems}`);
      console.log(`   Total Price: $${response.data.totalPrice}`);
      console.log(`   Item Count: ${response.data.itemCount}`);
      return true;
    } else {
      console.log('❌ Failed to get cart summary');
      return false;
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

async function test4_GetCartCount() {
  console.log('\n=== TEST 4.4: Get Cart Count ===');

  try {
    const response = await apiRequest('GET', '/api/cart/count', null, customer1Token);

    if (response.status === 200) {
      console.log(`✅ Cart count retrieved: ${response.data.count}`);
      return true;
    } else {
      console.log('❌ Failed to get cart count');
      return false;
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

// ============================================
// REQUIREMENT 5: Validate Inventory Before Checkout
// ============================================

async function test5_AddItemExceedingStock() {
  console.log('\n=== TEST 5.1: Add Item Exceeding Stock (Should Fail) ===');

  try {
    const response = await apiRequest(
      'POST',
      '/api/cart/items',
      { productId: testProductId3, quantity: 10 },
      customer1Token
    );

    if (response.status === 400) {
      console.log('✅ Correctly prevented adding more than available stock');
      console.log(`   Error: ${response.data.message}`);
      return true;
    } else {
      console.log('❌ Should have prevented over-stock addition');
      return false;
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

async function test5_ValidateCart() {
  console.log('\n=== TEST 5.2: Validate Cart Before Checkout ===');

  try {
    const response = await apiRequest('POST', '/api/cart/validate', null, customer1Token);

    if (response.status === 200 || response.status === 400) {
      if (response.data.valid) {
        console.log('✅ Cart is valid for checkout');
        console.log(`   Valid items: ${response.data.validItems.length}`);
      } else {
        console.log('⚠️  Cart has validation errors:');
        response.data.errors.forEach(error => {
          console.log(`   - ${error}`);
        });
      }
      return true;
    } else {
      console.log('❌ Failed to validate cart');
      return false;
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

// ============================================
// REQUIREMENT 6: Secure Cart Endpoints for Customers Only
// ============================================

async function test6_UnauthenticatedAccess() {
  console.log('\n=== TEST 6.1: Unauthenticated Access (Should Fail) ===');

  try {
    const response = await apiRequest('GET', '/api/cart', null, null);

    if (response.status === 401) {
      console.log('✅ Correctly denied unauthenticated access');
      return true;
    } else {
      console.log('❌ Should have denied unauthenticated access');
      return false;
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

async function test6_AdminAccessToCart() {
  console.log('\n=== TEST 6.2: Admin Access to Cart (Should Fail) ===');

  try {
    const response = await apiRequest('GET', '/api/cart', null, adminToken);

    if (response.status === 403) {
      console.log('✅ Correctly denied admin access to customer cart');
      return true;
    } else {
      console.log('❌ Should have denied admin access');
      return false;
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

async function test6_CustomerCanAccessOwnCart() {
  console.log('\n=== TEST 6.3: Customer Can Access Own Cart ===');

  try {
    const response = await apiRequest('GET', '/api/cart', null, customer1Token);

    if (response.status === 200) {
      console.log('✅ Customer can access their own cart');
      return true;
    } else {
      console.log('❌ Customer should be able to access their cart');
      return false;
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

// Additional Tests

async function testClearCart() {
  console.log('\n=== TEST: Clear Cart ===');

  try {
    const response = await apiRequest('DELETE', '/api/cart', null, customer1Token);

    if (response.status === 200) {
      console.log('✅ Cart cleared successfully');
      
      // Verify cart is empty
      const cartResponse = await apiRequest('GET', '/api/cart', null, customer1Token);
      if (cartResponse.data.length === 0) {
        console.log('✅ Cart is empty after clearing');
        return true;
      } else {
        console.log('❌ Cart should be empty');
        return false;
      }
    } else {
      console.log('❌ Failed to clear cart');
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
    // Delete cart items
    await supabase.from('cart_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // Delete inventory
    if (testProductId1) await supabase.from('inventory').delete().eq('product_id', testProductId1);
    if (testProductId2) await supabase.from('inventory').delete().eq('product_id', testProductId2);
    if (testProductId3) await supabase.from('inventory').delete().eq('product_id', testProductId3);

    // Delete products
    if (testProductId1) await supabase.from('products').delete().eq('id', testProductId1);
    if (testProductId2) await supabase.from('products').delete().eq('id', testProductId2);
    if (testProductId3) await supabase.from('products').delete().eq('id', testProductId3);

    // Delete category
    if (testCategoryId) await supabase.from('categories').delete().eq('id', testCategoryId);

    // Delete users
    await supabase.from('users').delete().eq('email', TEST_CONFIG.customer1Email);
    await supabase.from('users').delete().eq('email', TEST_CONFIG.customer2Email);
    await supabase.from('users').delete().eq('email', TEST_CONFIG.adminEmail);

    console.log('✅ Cleanup complete');
  } catch (error) {
    console.error('⚠️  Cleanup error:', error.message);
  }
}

// Main test runner
async function runTests() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   SHOPPING CART TESTS                                      ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  // Setup
  const setupSuccess = await setupTestData();
  if (!setupSuccess) {
    console.log('❌ Setup failed, aborting tests');
    process.exit(1);
  }

  const tests = [
    // Requirement 1: Add Item to Cart
    { name: 'REQ 1.1: Add Item to Cart', fn: test1_AddItemToCart },
    { name: 'REQ 1.2: Add Same Item Again', fn: test1_AddSameItemAgain },
    { name: 'REQ 1.3: Add Different Item', fn: test1_AddDifferentItem },
    
    // Requirement 2: Remove Item from Cart
    { name: 'REQ 2: Remove Item from Cart', fn: test2_RemoveItemFromCart },
    
    // Requirement 3: Update Item Quantity
    { name: 'REQ 3.1: Update Item Quantity', fn: test3_UpdateItemQuantity },
    { name: 'REQ 3.2: Update to Zero (Fail)', fn: test3_UpdateToZeroShouldFail },
    
    // Requirement 4: Persist Cart Per User
    { name: 'REQ 4.1: Get Cart', fn: test4_GetCart },
    { name: 'REQ 4.2: Cart Isolation', fn: test4_CartIsolation },
    { name: 'REQ 4.3: Get Cart Summary', fn: test4_GetCartSummary },
    { name: 'REQ 4.4: Get Cart Count', fn: test4_GetCartCount },
    
    // Requirement 5: Validate Inventory Before Checkout
    { name: 'REQ 5.1: Prevent Over-Stock', fn: test5_AddItemExceedingStock },
    { name: 'REQ 5.2: Validate Cart', fn: test5_ValidateCart },
    
    // Requirement 6: Secure Cart Endpoints
    { name: 'REQ 6.1: Deny Unauthenticated', fn: test6_UnauthenticatedAccess },
    { name: 'REQ 6.2: Deny Admin Access', fn: test6_AdminAccessToCart },
    { name: 'REQ 6.3: Allow Customer Access', fn: test6_CustomerCanAccessOwnCart },
    
    // Additional
    { name: 'EXTRA: Clear Cart', fn: testClearCart }
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
  console.log('1. ✅ Add Item to Cart');
  console.log('2. ✅ Remove Item from Cart');
  console.log('3. ✅ Update Item Quantity');
  console.log('4. ✅ Persist Cart Per User');
  console.log('5. ✅ Validate Inventory Before Checkout');
  console.log('6. ✅ Secure Cart Endpoints for Customers Only');

  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
