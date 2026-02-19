/**
 * Complete Product Approval Workflow Test
 * 
 * This script tests the entire product approval workflow from creation to homepage display
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

// Test credentials (update these with actual test accounts)
const SELLER_CREDENTIALS = {
  email: 'seller@example.com',
  password: 'password123'
};

const MANAGER_CREDENTIALS = {
  email: 'manager@example.com',
  password: 'password123'
};

let sellerToken = null;
let managerToken = null;
let testProductId = null;

async function runWorkflowTest() {
  console.log('🧪 Complete Product Approval Workflow Test\n');
  console.log('=' .repeat(70));

  try {
    // Step 1: Check homepage before creating product
    await step1_checkHomepageBefore();
    
    // Step 2: Login as seller
    await step2_loginAsSeller();
    
    // Step 3: Create product as seller
    await step3_createProduct();
    
    // Step 4: Verify product NOT on homepage
    await step4_verifyNotOnHomepage();
    
    // Step 5: Login as manager
    await step5_loginAsManager();
    
    // Step 6: View pending products
    await step6_viewPendingProducts();
    
    // Step 7: Approve product
    await step7_approveProduct();
    
    // Step 8: Verify product NOW on homepage
    await step8_verifyOnHomepage();
    
    console.log('\n' + '='.repeat(70));
    console.log('✅ ALL TESTS PASSED - Approval workflow working correctly!');
    console.log('='.repeat(70));
    
  } catch (error) {
    console.log('\n' + '='.repeat(70));
    console.log('❌ TEST FAILED');
    console.log('='.repeat(70));
    console.error('\nError:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

async function step1_checkHomepageBefore() {
  console.log('\n📋 Step 1: Check Homepage (Before Product Creation)');
  console.log('-'.repeat(70));
  
  const response = await axios.get(`${BASE_URL}/api/products`);
  const productCount = response.data.count || response.data.products.length;
  
  console.log(`✅ Homepage shows ${productCount} approved products`);
  console.log('   (This is the baseline count)');
}

async function step2_loginAsSeller() {
  console.log('\n📋 Step 2: Login as Seller');
  console.log('-'.repeat(70));
  
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, SELLER_CREDENTIALS);
    sellerToken = response.data.token || response.data.accessToken;
    
    if (!sellerToken) {
      throw new Error('No token received from login');
    }
    
    console.log('✅ Seller logged in successfully');
    console.log(`   Token: ${sellerToken.substring(0, 20)}...`);
  } catch (error) {
    console.log('⚠️  Seller login failed - using test mode');
    console.log('   Note: Create a seller account first or update credentials');
    throw error;
  }
}

async function step3_createProduct() {
  console.log('\n📋 Step 3: Create Product as Seller');
  console.log('-'.repeat(70));
  
  const testProduct = {
    title: `Approval Test Product ${Date.now()}`,
    description: 'This product is created to test the approval workflow',
    price: 99.99,
    categoryId: null, // Will use default category
    initialQuantity: 10
  };
  
  const response = await axios.post(
    `${BASE_URL}/api/seller/products`,
    testProduct,
    {
      headers: {
        'Authorization': `Bearer ${sellerToken}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  testProductId = response.data.product.id;
  const approvalStatus = response.data.product.approval_status;
  
  console.log('✅ Product created successfully');
  console.log(`   Product ID: ${testProductId}`);
  console.log(`   Title: ${testProduct.title}`);
  console.log(`   Approval Status: ${approvalStatus}`);
  
  if (approvalStatus !== 'pending') {
    throw new Error(`Expected approval_status to be 'pending', got '${approvalStatus}'`);
  }
  
  console.log('   ✅ Approval status is correctly set to "pending"');
}

async function step4_verifyNotOnHomepage() {
  console.log('\n📋 Step 4: Verify Product NOT on Homepage');
  console.log('-'.repeat(70));
  
  const response = await axios.get(`${BASE_URL}/api/products`);
  const products = response.data.products;
  
  const foundProduct = products.find(p => p.id === testProductId);
  
  if (foundProduct) {
    console.log('❌ FAIL: Pending product is visible on homepage!');
    console.log(`   Product: ${foundProduct.title}`);
    console.log(`   Status: ${foundProduct.approval_status}`);
    throw new Error('Pending product should NOT be visible on homepage');
  }
  
  console.log('✅ PASS: Pending product is NOT visible on homepage');
  console.log('   (As expected - only approved products should show)');
}

async function step5_loginAsManager() {
  console.log('\n📋 Step 5: Login as Manager');
  console.log('-'.repeat(70));
  
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, MANAGER_CREDENTIALS);
    managerToken = response.data.token || response.data.accessToken;
    
    if (!managerToken) {
      throw new Error('No token received from login');
    }
    
    console.log('✅ Manager logged in successfully');
    console.log(`   Token: ${managerToken.substring(0, 20)}...`);
  } catch (error) {
    console.log('⚠️  Manager login failed - using test mode');
    console.log('   Note: Create a manager account first or update credentials');
    throw error;
  }
}

async function step6_viewPendingProducts() {
  console.log('\n📋 Step 6: View Pending Products (Manager)');
  console.log('-'.repeat(70));
  
  const response = await axios.get(
    `${BASE_URL}/api/products?approvalStatus=pending`,
    {
      headers: {
        'Authorization': `Bearer ${managerToken}`
      }
    }
  );
  
  const pendingProducts = response.data.products;
  const foundProduct = pendingProducts.find(p => p.id === testProductId);
  
  console.log(`✅ Manager can see ${pendingProducts.length} pending products`);
  
  if (!foundProduct) {
    throw new Error('Test product not found in pending products list');
  }
  
  console.log('✅ Test product found in pending products list');
  console.log(`   Product: ${foundProduct.title}`);
  console.log(`   Status: ${foundProduct.approval_status}`);
}

async function step7_approveProduct() {
  console.log('\n📋 Step 7: Approve Product (Manager)');
  console.log('-'.repeat(70));
  
  const response = await axios.post(
    `${BASE_URL}/api/approvals/${testProductId}/approve`,
    {},
    {
      headers: {
        'Authorization': `Bearer ${managerToken}`
      }
    }
  );
  
  const approvedProduct = response.data.product;
  
  console.log('✅ Product approved successfully');
  console.log(`   Product: ${approvedProduct.title}`);
  console.log(`   New Status: ${approvedProduct.approval_status}`);
  
  if (approvedProduct.approval_status !== 'approved') {
    throw new Error(`Expected approval_status to be 'approved', got '${approvedProduct.approval_status}'`);
  }
  
  console.log('   ✅ Approval status is correctly set to "approved"');
}

async function step8_verifyOnHomepage() {
  console.log('\n📋 Step 8: Verify Product NOW on Homepage');
  console.log('-'.repeat(70));
  
  // Wait a moment for database to update
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const response = await axios.get(`${BASE_URL}/api/products`);
  const products = response.data.products;
  
  const foundProduct = products.find(p => p.id === testProductId);
  
  if (!foundProduct) {
    console.log('❌ FAIL: Approved product is NOT visible on homepage!');
    throw new Error('Approved product should be visible on homepage');
  }
  
  console.log('✅ PASS: Approved product is NOW visible on homepage');
  console.log(`   Product: ${foundProduct.title}`);
  console.log(`   Status: ${foundProduct.approval_status}`);
  console.log('   (As expected - approved products should show)');
}

// Run the test
console.log('\n⚠️  NOTE: This test requires:');
console.log('   1. Backend server running on http://localhost:5000');
console.log('   2. Valid seller account (seller@example.com / password123)');
console.log('   3. Valid manager account (manager@example.com / password123)');
console.log('\n   Update credentials in the script if needed.\n');

runWorkflowTest();
