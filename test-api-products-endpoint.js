const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function testProductsAPI() {
  console.log('🔍 Testing Products API Endpoint...\n');
  console.log(`API URL: ${API_URL}\n`);

  try {
    // Test 1: GET /api/products (public endpoint)
    console.log('📦 Test 1: GET /api/products (public access)...');
    const response = await axios.get(`${API_URL}/products`, {
      params: { limit: 100 }
    });

    console.log(`Status: ${response.status}`);
    console.log(`Response type: ${typeof response.data}`);
    console.log(`Response structure:`, Object.keys(response.data));

    // Check if response has products
    let products = [];
    if (Array.isArray(response.data)) {
      products = response.data;
      console.log(`✅ Response is an array with ${products.length} products`);
    } else if (response.data.products && Array.isArray(response.data.products)) {
      products = response.data.products;
      console.log(`✅ Response has 'products' property with ${products.length} products`);
    } else if (response.data.data && Array.isArray(response.data.data)) {
      products = response.data.data;
      console.log(`✅ Response has 'data' property with ${products.length} products`);
    } else {
      console.log('❌ Response structure is unexpected:', response.data);
    }

    // Show sample products
    if (products.length > 0) {
      console.log('\n📋 Sample products from API:');
      products.slice(0, 5).forEach((product, index) => {
        console.log(`\n${index + 1}. ${product.title || product.name}`);
        console.log(`   ID: ${product.id}`);
        console.log(`   Price: $${product.price}`);
        console.log(`   Approval Status: ${product.approval_status}`);
        console.log(`   Status: ${product.status}`);
      });
    }

    // Test 2: Check response headers
    console.log('\n📋 Response Headers:');
    console.log(`Content-Type: ${response.headers['content-type']}`);
    console.log(`Access-Control-Allow-Origin: ${response.headers['access-control-allow-origin'] || 'Not set'}`);

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📋 SUMMARY');
    console.log('='.repeat(60));

    if (products.length === 0) {
      console.log('❌ API returned 0 products!');
      console.log('');
      console.log('🔧 POSSIBLE ISSUES:');
      console.log('1. Backend filtering is too strict');
      console.log('2. Database query is not returning products');
      console.log('3. Product service has a bug');
      console.log('');
      console.log('💡 Check backend logs for errors');
    } else {
      console.log(`✅ API is working! Returned ${products.length} products`);
      console.log('');
      console.log('If frontend still doesn\'t show products:');
      console.log('1. Check browser console for errors');
      console.log('2. Check Network tab in DevTools');
      console.log('3. Verify VITE_API_URL in frontend .env');
      console.log('4. Clear browser cache');
      console.log('5. Check if frontend is filtering products');
    }

  } catch (error) {
    console.error('❌ Error testing API:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n🔧 Backend server is not running!');
      console.error('Start the backend with: npm start');
    } else if (error.response) {
      console.error(`\nAPI returned error: ${error.response.status}`);
      console.error('Response:', error.response.data);
    } else {
      console.error('\nUnexpected error:', error);
    }
  }
}

testProductsAPI();
