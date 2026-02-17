/**
 * Test category slug functionality
 * Verifies that categories can be accessed by slug
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Categories to test
const categoriesToTest = [
  { name: 'Electronics', slug: 'electronics' },
  { name: 'Fashion', slug: 'fashion' },
  { name: 'Home & Kitchen', slug: 'home-kitchen' },
  { name: 'Books', slug: 'books' },
  { name: 'Sports & Outdoors', slug: 'sports-outdoors' },
  { name: 'Beauty & Personal Care', slug: 'beauty-personal-care' },
  { name: 'Toys & Games', slug: 'toys-games' },
  { name: 'Automotive', slug: 'automotive' }
];

async function testCategorySlugs() {
  console.log('🧪 Testing Category Slug Functionality\n');
  console.log('='.repeat(60));
  
  let passedTests = 0;
  let failedTests = 0;

  for (const category of categoriesToTest) {
    try {
      console.log(`\n📝 Testing: ${category.name} (slug: ${category.slug})`);
      console.log(`   URL: ${BASE_URL}/categories/${category.slug}/products`);
      
      const response = await axios.get(`${BASE_URL}/categories/${category.slug}/products`, {
        params: {
          limit: 5,
          status: 'approved'
        }
      });

      if (response.data.success) {
        console.log(`   ✅ SUCCESS`);
        console.log(`   📊 Category: ${response.data.category.name}`);
        console.log(`   📦 Products found: ${response.data.count}`);
        
        if (response.data.products && response.data.products.length > 0) {
          console.log(`   🎯 Sample product: ${response.data.products[0].name}`);
        } else {
          console.log(`   ℹ️  No products in this category yet`);
        }
        
        passedTests++;
      } else {
        console.log(`   ❌ FAILED: ${response.data.message || 'Unknown error'}`);
        failedTests++;
      }
    } catch (error) {
      console.log(`   ❌ FAILED: ${error.response?.data?.message || error.message}`);
      
      if (error.response?.status === 404) {
        console.log(`   💡 Hint: Category "${category.slug}" not found in database`);
        console.log(`   💡 Make sure you ran: node run-category-slug-migration.js`);
      }
      
      failedTests++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Results Summary\n');
  console.log(`   ✅ Passed: ${passedTests}/${categoriesToTest.length}`);
  console.log(`   ❌ Failed: ${failedTests}/${categoriesToTest.length}`);
  
  if (failedTests === 0) {
    console.log('\n🎉 All category slug tests passed!');
    console.log('✨ Categories are working correctly in the header dropdown');
  } else {
    console.log('\n⚠️  Some tests failed. Please check:');
    console.log('   1. Backend server is running (npm start)');
    console.log('   2. Slug column was added to categories table');
    console.log('   3. Migration script was run (node run-category-slug-migration.js)');
  }
  
  console.log('\n📝 Next Steps:');
  console.log('   1. Start frontend: cd ../Ecomerce_client/ecommerce_client && npm run dev');
  console.log('   2. Open http://localhost:3001');
  console.log('   3. Click "All" dropdown in header');
  console.log('   4. Click any category to see products');
}

// Run tests
testCategorySlugs().catch(error => {
  console.error('❌ Test execution failed:', error.message);
  
  if (error.code === 'ECONNREFUSED') {
    console.log('\n💡 Backend server is not running!');
    console.log('   Start it with: npm start');
  }
});
