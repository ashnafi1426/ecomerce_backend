/**
 * PHASE 3 TESTING SCRIPT
 * Product Management & Approval Workflow Testing
 * 
 * Tests:
 * 1. Seller Creates Product (Pending Status)
 * 2. Seller Views Own Products
 * 3. Manager Views Approval Queue
 * 4. Manager Approves Product
 * 5. Customer Browses Approved Products
 * 6. Seller Updates Product (Re-approval Trigger)
 * 7. Manager Rejects Product
 * 8. Seller Deletes Product
 * 9. Role-Based Product Visibility
 * 10. Product Search with Role Filtering
 */

const supabase = require('./config/supabase');

// Test configuration
const TEST_CONFIG = {
  adminEmail: 'admin@ecommerce.com',
  adminPassword: 'Admin123!@#',
  testSellerEmail: 'productseller@example.com',
  testSellerPassword: 'Seller123!',
  testManagerEmail: 'productmanager@example.com',
  testManagerPassword: 'Manager123!',
  testCustomerEmail: 'customer@example.com',
  testCustomerPassword: 'Customer123!',
};

// Store test data
const testData = {
  adminToken: null,
  sellerId: null,
  sellerToken: null,
  managerId: null,
  managerToken: null,
  customerId: null,
  customerToken: null,
  productId: null,
  productId2: null,
  categoryId: null,
};

// Helper function to make API requests
async function makeRequest(method, endpoint, data = null, token = null) {
  const baseURL = 'http://localhost:5000';
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = {
    method,
    headers,
  };

  if (data && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(`${baseURL}${endpoint}`, options);
    const responseData = await response.json();
    return { status: response.status, data: responseData };
  } catch (error) {
    return { status: 500, error: error.message };
  }
}

// Setup function - Create test users
async function setup() {
  console.log('\n🔧 Setting up test environment...');
  
  // Pre-cleanup: Delete any existing test users from previous failed runs
  try {
    await supabase.from('users').delete().eq('email', TEST_CONFIG.testSellerEmail);
    await supabase.from('users').delete().eq('email', TEST_CONFIG.testManagerEmail);
    await supabase.from('users').delete().eq('email', TEST_CONFIG.testCustomerEmail);
  } catch (err) {
    // Ignore cleanup errors
  }
  
  // Login as admin
  const adminLogin = await makeRequest('POST', '/api/auth/login', {
    email: TEST_CONFIG.adminEmail,
    password: TEST_CONFIG.adminPassword,
  });
  
  if (adminLogin.status === 200) {
    testData.adminToken = adminLogin.data.token;
    console.log('✅ Admin logged in');
  } else {
    throw new Error('Admin login failed');
  }

  // Create and approve seller
  const sellerReg = await makeRequest('POST', '/api/auth/register/seller', {
    email: TEST_CONFIG.testSellerEmail,
    password: TEST_CONFIG.testSellerPassword,
    displayName: 'Product Test Seller',
    businessName: 'Test Product Store',
    businessInfo: {
      description: 'Test store for product testing',
      address: '123 Test St',
      taxId: '12-3456789',
    },
    phone: '+1234567890',
  });

  if (sellerReg.status === 201 && sellerReg.data.seller && sellerReg.data.token) {
    testData.sellerId = sellerReg.data.seller.id;
    testData.sellerToken = sellerReg.data.token;
    console.log('✅ Seller created');

    // Approve seller
    const approveResult = await makeRequest('POST', `/api/admin/sellers/${testData.sellerId}/approve`, null, testData.adminToken);
    if (approveResult.status === 200) {
      console.log('✅ Seller approved');
    } else {
      console.log('⚠️  Seller approval failed:', approveResult.status, approveResult.data);
    }
  } else {
    console.log('❌ Seller registration failed:', sellerReg.status, sellerReg.data);
    throw new Error('Seller registration failed');
  }

  // Create manager
  const managerCreate = await makeRequest('POST', '/api/admin/users/manager', {
    email: TEST_CONFIG.testManagerEmail,
    password: TEST_CONFIG.testManagerPassword,
    displayName: 'Product Test Manager',
    phone: '+1234567891',
  }, testData.adminToken);

  if (managerCreate.status === 201) {
    testData.managerId = managerCreate.data.manager.id;
    
    // Login as manager
    const managerLogin = await makeRequest('POST', '/api/auth/login', {
      email: TEST_CONFIG.testManagerEmail,
      password: TEST_CONFIG.testManagerPassword,
    });
    
    testData.managerToken = managerLogin.data.token;
    console.log('✅ Manager created and logged in');
  }

  // Register customer
  const customerReg = await makeRequest('POST', '/api/auth/register', {
    email: TEST_CONFIG.testCustomerEmail,
    password: TEST_CONFIG.testCustomerPassword,
    displayName: 'Test Customer',
  });

  if (customerReg.status === 201) {
    testData.customerId = customerReg.data.user.id;
    testData.customerToken = customerReg.data.token;
    console.log('✅ Customer created');
  }

  // Get a category ID
  const categories = await makeRequest('GET', '/api/categories');
  if (categories.data && categories.data.length > 0) {
    testData.categoryId = categories.data[0].id;
    console.log('✅ Category ID obtained');
  }

  console.log('✅ Setup complete\n');
}

// Test functions
async function test1_SellerCreatesProduct() {
  console.log('\n📝 Test 1: Seller Creates Product (Pending Status)');
  console.log('=====================================');
  
  const result = await makeRequest('POST', '/api/seller/products', {
    title: 'Test Wireless Headphones',
    description: 'High-quality wireless headphones with noise cancellation',
    price: 99.99,
    imageUrl: 'https://example.com/headphones.jpg',
    categoryId: testData.categoryId,
    initialQuantity: 50,
    lowStockThreshold: 10,
  }, testData.sellerToken);

  if (result.status === 201 && result.data.product) {
    testData.productId = result.data.product.id;
    console.log('✅ PASS: Product created successfully');
    console.log(`   Product ID: ${result.data.product.id}`);
    console.log(`   Title: ${result.data.product.title}`);
    console.log(`   Approval Status: ${result.data.product.approval_status}`);
    
    if (result.data.product.approval_status === 'pending') {
      console.log('✅ PASS: Product status correctly set to pending');
      return true;
    } else {
      console.log('❌ FAIL: Product status should be pending');
      return false;
    }
  } else {
    console.log('❌ FAIL: Product creation failed');
    console.log(`   Status: ${result.status}`);
    console.log(`   Error: ${JSON.stringify(result.data)}`);
    return false;
  }
}

async function test2_SellerViewsOwnProducts() {
  console.log('\n📝 Test 2: Seller Views Own Products');
  console.log('=====================================');
  
  const result = await makeRequest('GET', '/api/seller/products', null, testData.sellerToken);

  if (result.status === 200 && result.data.products) {
    console.log('✅ PASS: Seller can view own products');
    console.log(`   Count: ${result.data.count}`);
    
    const hasOwnProduct = result.data.products.some(p => p.id === testData.productId);
    if (hasOwnProduct) {
      console.log('✅ PASS: Created product appears in seller\'s list');
      return true;
    } else {
      console.log('❌ FAIL: Created product not found in seller\'s list');
      return false;
    }
  } else {
    console.log('❌ FAIL: Seller cannot view own products');
    console.log(`   Status: ${result.status}`);
    return false;
  }
}

async function test3_CustomerCannotSeePendingProduct() {
  console.log('\n📝 Test 3: Customer Cannot See Pending Product');
  console.log('=====================================');
  
  // Try to get all products as customer
  const result = await makeRequest('GET', '/api/products', null, testData.customerToken);

  if (result.status === 200) {
    const hasPendingProduct = result.data.products.some(p => p.id === testData.productId);
    
    if (!hasPendingProduct) {
      console.log('✅ PASS: Pending product correctly hidden from customer');
      return true;
    } else {
      console.log('❌ FAIL: Pending product should not be visible to customer');
      return false;
    }
  } else {
    console.log('❌ FAIL: Customer product browsing failed');
    return false;
  }
}

async function test4_ManagerViewsApprovalQueue() {
  console.log('\n📝 Test 4: Manager Views Approval Queue');
  console.log('=====================================');
  
  const result = await makeRequest('GET', '/api/manager/products/pending', null, testData.managerToken);

  if (result.status === 200 && result.data.products) {
    console.log('✅ PASS: Manager can view approval queue');
    console.log(`   Pending Products: ${result.data.count}`);
    
    const hasPendingProduct = result.data.products.some(p => p.id === testData.productId);
    if (hasPendingProduct) {
      console.log('✅ PASS: Created product appears in approval queue');
      return true;
    } else {
      console.log('❌ FAIL: Created product not found in approval queue');
      return false;
    }
  } else {
    console.log('❌ FAIL: Manager cannot view approval queue');
    console.log(`   Status: ${result.status}`);
    return false;
  }
}

async function test5_ManagerApprovesProduct() {
  console.log('\n📝 Test 5: Manager Approves Product');
  console.log('=====================================');
  
  const result = await makeRequest('POST', `/api/manager/products/${testData.productId}/approve`, null, testData.managerToken);

  if (result.status === 200 && result.data.product) {
    console.log('✅ PASS: Product approved successfully');
    console.log(`   Approval Status: ${result.data.product.approval_status}`);
    console.log(`   Approved By: ${result.data.product.approved_by}`);
    
    if (result.data.product.approval_status === 'approved') {
      console.log('✅ PASS: Product status correctly set to approved');
      return true;
    } else {
      console.log('❌ FAIL: Product status should be approved');
      return false;
    }
  } else {
    console.log('❌ FAIL: Product approval failed');
    console.log(`   Status: ${result.status}`);
    console.log(`   Error: ${JSON.stringify(result.data)}`);
    return false;
  }
}

async function test6_CustomerCanSeeApprovedProduct() {
  console.log('\n📝 Test 6: Customer Can See Approved Product');
  console.log('=====================================');
  
  const result = await makeRequest('GET', '/api/products', null, testData.customerToken);

  if (result.status === 200) {
    const hasApprovedProduct = result.data.products.some(p => p.id === testData.productId);
    
    if (hasApprovedProduct) {
      console.log('✅ PASS: Approved product correctly visible to customer');
      return true;
    } else {
      console.log('❌ FAIL: Approved product should be visible to customer');
      return false;
    }
  } else {
    console.log('❌ FAIL: Customer product browsing failed');
    return false;
  }
}

async function test7_SellerUpdatesProductTriggersReapproval() {
  console.log('\n📝 Test 7: Seller Updates Product (Triggers Re-approval)');
  console.log('=====================================');
  
  const result = await makeRequest('PUT', `/api/seller/products/${testData.productId}`, {
    price: 89.99,
    description: 'Updated description with more details',
  }, testData.sellerToken);

  if (result.status === 200 && result.data.product) {
    console.log('✅ PASS: Product updated successfully');
    console.log(`   New Price: ${result.data.product.price}`);
    console.log(`   Approval Status: ${result.data.product.approval_status}`);
    
    if (result.data.product.approval_status === 'pending') {
      console.log('✅ PASS: Product status correctly reset to pending after update');
      return true;
    } else {
      console.log('❌ FAIL: Product status should be pending after update');
      return false;
    }
  } else {
    console.log('❌ FAIL: Product update failed');
    console.log(`   Status: ${result.status}`);
    return false;
  }
}

async function test8_ManagerRejectsProduct() {
  console.log('\n📝 Test 8: Manager Rejects Product');
  console.log('=====================================');
  
  // Create another product to reject
  const createResult = await makeRequest('POST', '/api/seller/products', {
    title: 'Test Product to Reject',
    description: 'This product will be rejected',
    price: 49.99,
    imageUrl: 'https://example.com/product.jpg',
    categoryId: testData.categoryId,
    initialQuantity: 10,
  }, testData.sellerToken);

  if (createResult.status === 201) {
    testData.productId2 = createResult.data.product.id;
    
    const result = await makeRequest('POST', `/api/manager/products/${testData.productId2}/reject`, {
      reason: 'Product description is incomplete. Please add more details about specifications.',
    }, testData.managerToken);

    if (result.status === 200 && result.data.product) {
      console.log('✅ PASS: Product rejected successfully');
      console.log(`   Approval Status: ${result.data.product.approval_status}`);
      console.log(`   Rejection Reason: ${result.data.product.rejection_reason}`);
      
      if (result.data.product.approval_status === 'rejected') {
        console.log('✅ PASS: Product status correctly set to rejected');
        return true;
      } else {
        console.log('❌ FAIL: Product status should be rejected');
        return false;
      }
    } else {
      console.log('❌ FAIL: Product rejection failed');
      console.log(`   Status: ${result.status}`);
      return false;
    }
  } else {
    console.log('❌ FAIL: Could not create product for rejection test');
    return false;
  }
}

async function test9_SellerCannotViewOtherSellerProducts() {
  console.log('\n📝 Test 9: Seller Cannot View Other Seller Products');
  console.log('=====================================');
  
  // Get all products as seller
  const result = await makeRequest('GET', '/api/seller/products', null, testData.sellerToken);

  if (result.status === 200) {
    // Check that all products belong to this seller
    const allOwnProducts = result.data.products.every(p => p.seller_id === testData.sellerId);
    
    if (allOwnProducts) {
      console.log('✅ PASS: Seller can only see own products');
      return true;
    } else {
      console.log('❌ FAIL: Seller should only see own products');
      return false;
    }
  } else {
    console.log('❌ FAIL: Seller product listing failed');
    return false;
  }
}

async function test10_SellerDeletesProduct() {
  console.log('\n📝 Test 10: Seller Deletes Own Product');
  console.log('=====================================');
  
  if (!testData.productId2) {
    console.log('⚠️  SKIP: No product to delete');
    return true;
  }

  const result = await makeRequest('DELETE', `/api/seller/products/${testData.productId2}`, null, testData.sellerToken);

  if (result.status === 200) {
    console.log('✅ PASS: Product deleted successfully');
    return true;
  } else {
    console.log('❌ FAIL: Product deletion failed');
    console.log(`   Status: ${result.status}`);
    return false;
  }
}

async function test11_ProductSearchRoleFiltering() {
  console.log('\n📝 Test 11: Product Search with Role Filtering');
  console.log('=====================================');
  
  // Search as customer (should only see approved)
  const customerSearch = await makeRequest('GET', '/api/products/search?q=Test', null, testData.customerToken);
  
  if (customerSearch.status === 200) {
    const hasOnlyApproved = customerSearch.data.products.every(p => p.approval_status === 'approved');
    
    if (hasOnlyApproved) {
      console.log('✅ PASS: Customer search returns only approved products');
    } else {
      console.log('❌ FAIL: Customer search should return only approved products');
      return false;
    }
  }

  // Search as seller (should see own products)
  const sellerSearch = await makeRequest('GET', '/api/products/search?q=Test', null, testData.sellerToken);
  
  if (sellerSearch.status === 200) {
    console.log(`   Seller search returned ${sellerSearch.data.count} products`);
    
    // Debug: Show which products were returned
    if (sellerSearch.data.products.length > 0) {
      console.log(`   Seller ID: ${testData.sellerId}`);
      sellerSearch.data.products.forEach((p, i) => {
        console.log(`   Product ${i + 1}: ${p.title} (seller_id: ${p.seller_id})`);
      });
    }
    
    const allOwnProducts = sellerSearch.data.products.every(p => p.seller_id === testData.sellerId);
    
    if (allOwnProducts) {
      console.log('✅ PASS: Seller search returns only own products');
      return true;
    } else {
      console.log('❌ FAIL: Seller search should return only own products');
      return false;
    }
  }

  return false;
}

// Cleanup function
async function cleanup() {
  console.log('\n🧹 Cleaning up test data...');
  
  try {
    // Delete test products
    if (testData.productId) {
      await supabase.from('products').delete().eq('id', testData.productId);
      console.log('✅ Test product 1 deleted');
    }
    
    if (testData.productId2) {
      await supabase.from('products').delete().eq('id', testData.productId2);
      console.log('✅ Test product 2 deleted');
    }

    // Delete test users
    if (testData.sellerId) {
      await supabase.from('users').delete().eq('id', testData.sellerId);
      console.log('✅ Test seller deleted');
    }

    if (testData.managerId) {
      await supabase.from('users').delete().eq('id', testData.managerId);
      console.log('✅ Test manager deleted');
    }

    if (testData.customerId) {
      await supabase.from('users').delete().eq('id', testData.customerId);
      console.log('✅ Test customer deleted');
    }

    console.log('✅ Cleanup complete');
  } catch (error) {
    console.log('⚠️  Cleanup error:', error.message);
  }
}

// Main test runner
async function runTests() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║       PHASE 3: PRODUCT MANAGEMENT & APPROVAL TESTS     ║');
  console.log('╚════════════════════════════════════════════════════════╝');

  try {
    await setup();
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }

  const tests = [
    { name: 'Seller Creates Product', fn: test1_SellerCreatesProduct },
    { name: 'Seller Views Own Products', fn: test2_SellerViewsOwnProducts },
    { name: 'Customer Cannot See Pending Product', fn: test3_CustomerCannotSeePendingProduct },
    { name: 'Manager Views Approval Queue', fn: test4_ManagerViewsApprovalQueue },
    { name: 'Manager Approves Product', fn: test5_ManagerApprovesProduct },
    { name: 'Customer Can See Approved Product', fn: test6_CustomerCanSeeApprovedProduct },
    { name: 'Seller Updates Product (Re-approval)', fn: test7_SellerUpdatesProductTriggersReapproval },
    { name: 'Manager Rejects Product', fn: test8_ManagerRejectsProduct },
    { name: 'Seller Cannot View Other Products', fn: test9_SellerCannotViewOtherSellerProducts },
    { name: 'Seller Deletes Product', fn: test10_SellerDeletesProduct },
    { name: 'Product Search Role Filtering', fn: test11_ProductSearchRoleFiltering },
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
      console.log(`❌ FAIL: ${test.name} - ${error.message}`);
      failed++;
    }
  }

  // Print summary
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║                     TEST SUMMARY                       ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log(`\n✅ Passed: ${passed}/${tests.length}`);
  console.log(`❌ Failed: ${failed}/${tests.length}`);
  console.log(`📊 Success Rate: ${((passed / tests.length) * 100).toFixed(1)}%\n`);

  // Cleanup
  await cleanup();

  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
