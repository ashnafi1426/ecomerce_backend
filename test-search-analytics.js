/**
 * Test Search Analytics System
 * Tests all analytics endpoints
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test configuration
const tests = [];
let passedTests = 0;
let failedTests = 0;

// Helper function to run tests
async function runTest(name, testFn) {
  try {
    console.log(`\n🧪 Testing: ${name}`);
    await testFn();
    console.log(`✅ PASSED: ${name}`);
    passedTests++;
    tests.push({ name, status: 'PASSED' });
  } catch (error) {
    console.log(`❌ FAILED: ${name}`);
    console.log(`   Error: ${error.message}`);
    failedTests++;
    tests.push({ name, status: 'FAILED', error: error.message });
  }
}

// Test 1: Get Trending Products
async function testTrendingProducts() {
  const response = await axios.get(`${BASE_URL}/search/trending?limit=5&days=7`);
  
  if (response.status !== 200) {
    throw new Error(`Expected status 200, got ${response.status}`);
  }
  
  if (!response.data.success) {
    throw new Error('Response success should be true');
  }
  
  if (!response.data.data.products) {
    throw new Error('Response should contain products array');
  }
  
  console.log(`   Found ${response.data.data.products.length} trending products`);
}

// Test 2: Get Popular Search Terms
async function testPopularSearchTerms() {
  const response = await axios.get(`${BASE_URL}/search/popular-terms?limit=10&days=30`);
  
  if (response.status !== 200) {
    throw new Error(`Expected status 200, got ${response.status}`);
  }
  
  if (!response.data.success) {
    throw new Error('Response success should be true');
  }
  
  if (!response.data.data.popularSearches) {
    throw new Error('Response should contain popularSearches array');
  }
  
  console.log(`   Found ${response.data.data.popularSearches.length} popular search terms`);
  if (response.data.data.popularSearches.length > 0) {
    console.log(`   Top search: "${response.data.data.popularSearches[0].query}" (${response.data.data.popularSearches[0].searchCount} searches)`);
  }
}

// Test 3: Get No-Result Searches
async function testNoResultSearches() {
  const response = await axios.get(`${BASE_URL}/search/no-results?limit=10&days=30`);
  
  if (response.status !== 200) {
    throw new Error(`Expected status 200, got ${response.status}`);
  }
  
  if (!response.data.success) {
    throw new Error('Response success should be true');
  }
  
  if (!response.data.data.noResultSearches) {
    throw new Error('Response should contain noResultSearches array');
  }
  
  console.log(`   Found ${response.data.data.noResultSearches.length} no-result searches`);
}

// Test 4: Get Search Analytics Summary
async function testSearchAnalytics() {
  const response = await axios.get(`${BASE_URL}/search/analytics?days=30`);
  
  if (response.status !== 200) {
    throw new Error(`Expected status 200, got ${response.status}`);
  }
  
  if (!response.data.success) {
    throw new Error('Response success should be true');
  }
  
  if (!response.data.data.summary) {
    throw new Error('Response should contain summary object');
  }
  
  const summary = response.data.data.summary;
  console.log(`   Total searches: ${summary.totalSearches}`);
  console.log(`   Unique queries: ${summary.uniqueQueries}`);
  console.log(`   No-result rate: ${summary.noResultRate}%`);
  console.log(`   Avg results per search: ${summary.avgResultsPerSearch}`);
}

// Test 5: Get Related Searches
async function testRelatedSearches() {
  const response = await axios.get(`${BASE_URL}/search/related?q=laptop&limit=5`);
  
  if (response.status !== 200) {
    throw new Error(`Expected status 200, got ${response.status}`);
  }
  
  if (!response.data.success) {
    throw new Error('Response success should be true');
  }
  
  if (!response.data.data.relatedSearches) {
    throw new Error('Response should contain relatedSearches array');
  }
  
  console.log(`   Found ${response.data.data.relatedSearches.length} related searches`);
  if (response.data.data.relatedSearches.length > 0) {
    console.log(`   Related: "${response.data.data.relatedSearches[0].query}"`);
  }
}

// Test 6: Create Some Search History (for testing)
async function testCreateSearchHistory() {
  // Perform some searches to create history
  const searchQueries = ['laptop', 'smartphone', 'headphones', 'laptop bag', 'wireless mouse'];
  
  for (const query of searchQueries) {
    await axios.get(`${BASE_URL}/search?q=${query}`);
  }
  
  console.log(`   Created ${searchQueries.length} search history entries`);
}

// Test 7: Verify Analytics After Search History
async function testAnalyticsAfterHistory() {
  const response = await axios.get(`${BASE_URL}/search/analytics?days=1`);
  
  if (response.status !== 200) {
    throw new Error(`Expected status 200, got ${response.status}`);
  }
  
  const summary = response.data.data.summary;
  
  if (summary.totalSearches === 0) {
    throw new Error('Should have search history after creating searches');
  }
  
  console.log(`   Verified: ${summary.totalSearches} searches in history`);
}

// Test 8: Test Trending Products After Searches
async function testTrendingAfterSearches() {
  const response = await axios.get(`${BASE_URL}/search/trending?limit=5&days=1`);
  
  if (response.status !== 200) {
    throw new Error(`Expected status 200, got ${response.status}`);
  }
  
  if (!response.data.data.products) {
    throw new Error('Should return products');
  }
  
  console.log(`   Found ${response.data.data.products.length} trending products`);
  if (response.data.data.topQueries) {
    console.log(`   Top queries: ${response.data.data.topQueries.join(', ')}`);
  }
}

// Main test runner
async function runAllTests() {
  console.log('🔍 TESTING SEARCH ANALYTICS SYSTEM');
  console.log('============================================================\n');
  
  console.log('📊 Phase 1: Basic Analytics Tests');
  await runTest('Test 1: Get Trending Products', testTrendingProducts);
  await runTest('Test 2: Get Popular Search Terms', testPopularSearchTerms);
  await runTest('Test 3: Get No-Result Searches', testNoResultSearches);
  await runTest('Test 4: Get Search Analytics Summary', testSearchAnalytics);
  await runTest('Test 5: Get Related Searches', testRelatedSearches);
  
  console.log('\n📊 Phase 2: Create Test Data');
  await runTest('Test 6: Create Search History', testCreateSearchHistory);
  
  console.log('\n📊 Phase 3: Verify Analytics with Data');
  await runTest('Test 7: Verify Analytics After History', testAnalyticsAfterHistory);
  await runTest('Test 8: Test Trending After Searches', testTrendingAfterSearches);
  
  // Print summary
  console.log('\n============================================================');
  console.log('📊 TEST SUMMARY');
  console.log('============================================================');
  console.log(`Total Tests: ${passedTests + failedTests}`);
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  console.log(`Success Rate: ${((passedTests / (passedTests + failedTests)) * 100).toFixed(1)}%`);
  
  if (failedTests === 0) {
    console.log('\n🎉 All analytics tests passed!');
    console.log('\n✅ Phase 3 Step 1: Search Analytics Backend - COMPLETE');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the errors above.');
  }
  
  console.log('\n📋 New Analytics Endpoints Available:');
  console.log('   GET /api/search/trending - Get trending products');
  console.log('   GET /api/search/popular-terms - Get popular search terms');
  console.log('   GET /api/search/no-results - Get no-result searches');
  console.log('   GET /api/search/analytics - Get analytics summary');
  console.log('   GET /api/search/related - Get related searches');
}

// Run tests
runAllTests().catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});
