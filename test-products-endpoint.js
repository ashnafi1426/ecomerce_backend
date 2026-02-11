const axios = require('axios');

async function testProductsEndpoint() {
  try {
    // Login first
    console.log('1. Logging in...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'manager@test.com',
      password: 'Test123!@#'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful, token received');
    
    // Test products endpoint
    console.log('\n2. Testing /api/manager/products/pending...');
    const productsResponse = await axios.get('http://localhost:5000/api/manager/products/pending', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log('\n📦 Response:');
    console.log(JSON.stringify(productsResponse.data, null, 2));
    
    console.log('\n✅ Response fields:');
    console.log(`- success: ${productsResponse.data.success}`);
    console.log(`- count: ${productsResponse.data.count}`);
    console.log(`- products: ${Array.isArray(productsResponse.data.products) ? 'array' : 'not array'}`);
    
    if (productsResponse.data.success) {
      console.log('\n🎉 SUCCESS: Response has success field!');
    } else {
      console.log('\n❌ FAIL: Response missing success field or success is false');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testProductsEndpoint();
