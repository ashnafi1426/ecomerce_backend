/**
 * Complete Test Script: Advanced Search & Filtering System
 * 
 * Tests all search endpoints one by one
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test configuration
const tests = {
  passed: 0,
  failed: 0,
  total: 0
};

// Helper function to log test results
function logTest(name, passed, details = '') {
  tests.total++;
  if (passed) {
    tests.passed++;
    console.log(`✅ ${name}`);
    if (details) console.log(`   ${details}`);
  } else {
    tests.failed++;
    console.log(`❌ ${name}`);
    if (details) console.log(`   ${details}`);
  }
}

// Helper function to make API requests
async function makeRequest(method, endpoint, data = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (data) {
      if (method === 'GET') {
        config.params = data;
      } else {
        config.data = data;
      }
    }

    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status
    };
  }
}

async function runTests() {
  console.log('\n🔍 TESTING ADVANCED SEARCH & FILTERING SYSTEM');
  console.log('='.repeat(60));

  // Test 1: Get all brands
  console.log('\n📦 Test 1: Get All Brands');
  console.log('-'.repeat(60));
  const brandsResult = await makeRequest('GET', '/brands');
  logTest(
    'GET /api/brands',
    brandsResult.success && brandsResult.data.success,
    brandsResult.success
      ? `Found ${brandsResult.data.data.brands.length} brands`
      : `Error: ${brandsResult.error.message || brandsResult.error}`
  );

  // Test 2: Basic search (no filters)
  console.log('\n🔎 Test 2: Basic Search (No Filters)');
  console.log('-'.repeat(60));
  const basicSearchResult = await makeRequest('GET', '/search', { q: 'laptop' });
  logTest(
    'GET /api/search?q=laptop',
    basicSearchResult.success && basicSearchResult.data.success,
    basicSearchResult.success
      ? `Found ${basicSearchResult.data.data.products.length} products`
      : `Error: ${basicSearchResult.error.message || basicSearchResult.error}`
  );

  // Test 3: Search with price filter
  console.log('\n💰 Test 3: Search with Price Filter');
  console.log('-'.repeat(60));
  const priceFilterResult = await makeRequest('GET', '/search', {
    q: 'laptop',
    minPrice: 500,
    maxPrice: 2000
  });
  logTest(
    'GET /api/search?q=laptop&minPrice=500&maxPrice=2000',
    priceFilterResult.success && priceFilterResult.data.success,
    priceFilterResult.success
      ? `Found ${priceFilterResult.data.data.products.length} products in price range`
      : `Error: ${priceFilterResult.error.message || priceFilterResult.error}`
  );

  // Test 4: Search with rating filter
  console.log('\n⭐ Test 4: Search with Rating Filter');
  console.log('-'.repeat(60));
  const ratingFilterResult = await makeRequest('GET', '/search', {
    q: 'laptop',
    minRating: 4
  });
  logTest(
    'GET /api/search?q=laptop&minRating=4',
    ratingFilterResult.success && ratingFilterResult.data.success,
    ratingFilterResult.success
      ? `Found ${ratingFilterResult.data.data.products.length} products with 4+ rating`
      : `Error: ${ratingFilterResult.error.message || ratingFilterResult.error}`
  );

  // Test 5: Search with sorting
  console.log('\n📊 Test 5: Search with Sorting');
  console.log('-'.repeat(60));
  const sortResult = await makeRequest('GET', '/search', {
    q: 'laptop',
    sortBy: 'price-low'
  });
  logTest(
    'GET /api/search?q=laptop&sortBy=price-low',
    sortResult.success && sortResult.data.success,
    sortResult.success
      ? `Found ${sortResult.data.data.products.length} products sorted by price (low to high)`
      : `Error: ${sortResult.error.message || sortResult.error}`
  );

  // Test 6: Search with pagination
  console.log('\n📄 Test 6: Search with Pagination');
  console.log('-'.repeat(60));
  const paginationResult = await makeRequest('GET', '/search', {
    q: 'laptop',
    page: 1,
    limit: 5
  });
  logTest(
    'GET /api/search?q=laptop&page=1&limit=5',
    paginationResult.success && paginationResult.data.success,
    paginationResult.success
      ? `Page 1 with ${paginationResult.data.data.products.length} products (limit: 5)`
      : `Error: ${paginationResult.error.message || paginationResult.error}`
  );

  // Test 7: Get search suggestions
  console.log('\n💡 Test 7: Get Search Suggestions');
  console.log('-'.repeat(60));
  const suggestionsResult = await makeRequest('GET', '/search/suggestions', {
    q: 'lap',
    limit: 5
  });
  logTest(
    'GET /api/search/suggestions?q=lap&limit=5',
    suggestionsResult.success && suggestionsResult.data.success,
    suggestionsResult.success
      ? `Found ${suggestionsResult.data.data.suggestions.length} suggestions`
      : `Error: ${suggestionsResult.error.message || suggestionsResult.error}`
  );

  // Test 8: Get filter options
  console.log('\n🎛️  Test 8: Get Filter Options');
  console.log('-'.repeat(60));
  const filterOptionsResult = await makeRequest('GET', '/search/filters', {
    q: 'laptop'
  });
  logTest(
    'GET /api/search/filters?q=laptop',
    filterOptionsResult.success && filterOptionsResult.data.success,
    filterOptionsResult.success
      ? `Price range: $${filterOptionsResult.data.data.priceRange.min}-$${filterOptionsResult.data.data.priceRange.max}, ${filterOptionsResult.data.data.brands.length} brands, ${filterOptionsResult.data.data.categories.length} categories`
      : `Error: ${filterOptionsResult.error.message || filterOptionsResult.error}`
  );

  // Test 9: Get price ranges
  console.log('\n💵 Test 9: Get Price Ranges');
  console.log('-'.repeat(60));
  const priceRangesResult = await makeRequest('GET', '/search/price-ranges');
  logTest(
    'GET /api/search/price-ranges',
    priceRangesResult.success && priceRangesResult.data.success,
    priceRangesResult.success
      ? `Found ${priceRangesResult.data.data.ranges.length} predefined price ranges`
      : `Error: ${priceRangesResult.error.message || priceRangesResult.error}`
  );

  // Test 10: Get rating options
  console.log('\n⭐ Test 10: Get Rating Options');
  console.log('-'.repeat(60));
  const ratingOptionsResult = await makeRequest('GET', '/search/rating-options');
  logTest(
    'GET /api/search/rating-options',
    ratingOptionsResult.success && ratingOptionsResult.data.success,
    ratingOptionsResult.success
      ? `Found ${ratingOptionsResult.data.data.options.length} rating filter options`
      : `Error: ${ratingOptionsResult.error.message || ratingOptionsResult.error}`
  );

  // Test 11: Get popular searches
  console.log('\n🔥 Test 11: Get Popular Searches');
  console.log('-'.repeat(60));
  const popularSearchesResult = await makeRequest('GET', '/search/popular', {
    limit: 5
  });
  logTest(
    'GET /api/search/popular?limit=5',
    popularSearchesResult.success && popularSearchesResult.data.success,
    popularSearchesResult.success
      ? `Found ${popularSearchesResult.data.data.popularSearches.length} popular searches`
      : `Error: ${popularSearchesResult.error.message || popularSearchesResult.error}`
  );

  // Test 12: Combined filters
  console.log('\n🎯 Test 12: Combined Filters (Price + Rating + Sort)');
  console.log('-'.repeat(60));
  const combinedResult = await makeRequest('GET', '/search', {
    q: 'laptop',
    minPrice: 500,
    maxPrice: 2000,
    minRating: 3,
    sortBy: 'rating',
    page: 1,
    limit: 10
  });
  logTest(
    'GET /api/search with multiple filters',
    combinedResult.success && combinedResult.data.success,
    combinedResult.success
      ? `Found ${combinedResult.data.data.products.length} products matching all filters`
      : `Error: ${combinedResult.error.message || combinedResult.error}`
  );

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${tests.total}`);
  console.log(`✅ Passed: ${tests.passed}`);
  console.log(`❌ Failed: ${tests.failed}`);
  console.log(`Success Rate: ${((tests.passed / tests.total) * 100).toFixed(1)}%`);

  if (tests.failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('\n✅ Phase 1 Backend Implementation Complete!');
    console.log('\n📝 Next Steps:');
    console.log('   1. Test each endpoint in browser or Postman');
    console.log('   2. Proceed to Phase 2: Frontend Implementation');
    console.log('   3. Create search page and components\n');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the errors above.\n');
  }
}

// Run tests
console.log('Starting backend server test...');
console.log('Make sure the backend is running on http://localhost:5000\n');

runTests().catch(error => {
  console.error('Test execution error:', error);
  process.exit(1);
});
