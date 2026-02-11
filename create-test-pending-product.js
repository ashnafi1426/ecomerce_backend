/**
 * Create Test Product with Pending Status via API
 * 
 * This script creates a product that needs manager approval using the backend API
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

// Test credentials
const SELLER_CREDENTIALS = {
  email: 'seller1@test.com',
  password: 'Test123!@#'
};

async function createTestPendingProduct() {
  console.log('🚀 Creating test product with pending status via API...\n');

  try {
    // Step 1: Login as seller to get auth token
    console.log('📝 Step 1: Logging in as seller...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, SELLER_CREDENTIALS);
    
    if (!loginResponse.data || !loginResponse.data.data) {
      throw new Error('Login failed: Invalid response structure');
    }

    const token = loginResponse.data.data.token;
    const seller = loginResponse.data.data.user;
    
    if (!token) {
      throw new Error('Login failed: No token received');
    }
    
    console.log(`✅ Logged in as: ${seller.email}`);

    // Step 2: Create product with pending status
    console.log('\n📝 Step 2: Creating product...');
    const productData = {
      name: 'Test Product - Needs Manager Approval',
      description: 'This is a test product that requires manager approval before going live. It demonstrates the complete approval workflow from seller to manager to customer.',
      price: 99.99,
      category_id: 1,
      stock_quantity: 10,
      sku: `TEST-PENDING-${Date.now()}`,
      status: 'draft',
      approval_status: 'pending',
      images: JSON.stringify(['https://via.placeholder.com/400x400?text=Test+Product']),
      brand: 'Test Brand',
      weight: 1.5,
      dimensions: JSON.stringify({ length: 10, width: 10, height: 10 })
    };

    const createResponse = await axios.post(
      `${API_BASE_URL}/seller/products`,
      productData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!createResponse.data || !createResponse.data.data) {
      throw new Error('Product creation failed: Invalid response structure');
    }

    const product = createResponse.data.data;

    console.log('\n✅ Test product created successfully!');
    console.log('━'.repeat(60));
    console.log('📦 Product Details:');
    console.log(`   ID: ${product.id}`);
    console.log(`   Name: ${product.name}`);
    console.log(`   Price: $${product.price}`);
    console.log(`   Seller: ${seller.display_name || seller.email}`);
    console.log(`   Status: ${product.status}`);
    console.log(`   Approval Status: ${product.approval_status}`);
    console.log(`   SKU: ${product.sku}`);
    console.log('━'.repeat(60));

    console.log('\n📝 Next Steps - Test the Complete Workflow:');
    console.log('━'.repeat(60));
    console.log('\n1️⃣  MANAGER APPROVAL:');
    console.log('   • Login as manager: manager@test.com / Test123!@#');
    console.log('   • Go to: http://localhost:5173/manager/product-approvals');
    console.log('   • You should see this product in the pending list');
    console.log('   • Click "Approve" to approve the product');
    
    console.log('\n2️⃣  VERIFY PRODUCT IS LIVE:');
    console.log('   • Logout from manager account');
    console.log('   • Go to: http://localhost:5173/');
    console.log('   • Product should now be visible on homepage');
    console.log('   • Customers can now purchase this product');
    
    console.log('\n3️⃣  TEST PURCHASE FLOW:');
    console.log('   • Add product to cart');
    console.log('   • Proceed to checkout');
    console.log('   • Complete purchase');
    console.log('   • Verify order appears in seller dashboard\n');

    console.log('━'.repeat(60));
    console.log('🎉 Ready to test the complete approval workflow!');
    console.log('━'.repeat(60));

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', error.response.data);
    }
    
    console.log('\n💡 Troubleshooting:');
    console.log('1. Make sure backend server is running: node server.js');
    console.log('2. Verify seller account exists: seller1@test.com');
    console.log('3. Check if port 5000 is accessible');
    console.log('4. Review backend logs for errors\n');
  }
}

// Run the script
createTestPendingProduct();
