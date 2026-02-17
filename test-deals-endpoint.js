/**
 * Test deals endpoint to diagnose 500 error
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testDealsEndpoint() {
  console.log('🧪 Testing Deals Endpoint\n');
  console.log('='.repeat(60));
  
  try {
    console.log('\n📝 Testing: GET /deals?filter=all');
    console.log(`   URL: ${BASE_URL}/deals?filter=all`);
    
    const response = await axios.get(`${BASE_URL}/deals`, {
      params: { filter: 'all' }
    });

    console.log('\n✅ SUCCESS!');
    console.log(`   Status: ${response.status}`);
    console.log(`   Deals found: ${response.data.count}`);
    
    if (response.data.deals && response.data.deals.length > 0) {
      console.log(`\n   Sample deal:`);
      const deal = response.data.deals[0];
      console.log(`   - Title: ${deal.title || deal.name}`);
      console.log(`   - Price: $${deal.price}`);
      console.log(`   - Original: $${deal.original_price}`);
      const discount = Math.round(((deal.original_price - deal.price) / deal.original_price) * 100);
      console.log(`   - Discount: ${discount}%`);
    } else {
      console.log('\n   ℹ️  No deals available (this is OK if no products have discounts)');
    }
    
  } catch (error) {
    console.log('\n❌ FAILED');
    console.log(`   Status: ${error.response?.status || 'No response'}`);
    console.log(`   Error: ${error.response?.data?.message || error.message}`);
    
    if (error.response?.data) {
      console.log('\n   Response data:');
      console.log(JSON.stringify(error.response.data, null, 2));
    }
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Backend server is not running!');
      console.log('   Start it with: npm start');
    } else if (error.response?.status === 500) {
      console.log('\n💡 Server error - check backend console for details');
      console.log('   The error is likely in the deal.routes.js file');
    }
  }
  
  console.log('\n' + '='.repeat(60));
}

testDealsEndpoint();
