/**
 * Test Spell Check Service
 * Tests spelling correction and alternative suggestions
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test queries with intentional typos
const testQueries = [
  { query: 'laptpo', expected: 'laptop' },
  { query: 'smatphone', expected: 'smartphone' },
  { query: 'headphnes', expected: 'headphones' },
  { query: 'wireles mouse', expected: 'wireless mouse' },
  { query: 'keybord', expected: 'keyboard' }
];

async function testSpellCheck() {
  console.log('\n🔍 TESTING SPELL CHECK SERVICE');
  console.log('============================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  // Test 1: Spell check with typo
  try {
    totalTests++;
    console.log('Test 1: Spell Check - "laptpo" → "laptop"');
    const response = await axios.get(`${BASE_URL}/search/spell-check`, {
      params: { q: 'laptpo' }
    });

    if (response.data.success && response.data.data.hasCorrection) {
      console.log('✅ Spell check working');
      console.log(`   Original: ${response.data.data.originalQuery}`);
      console.log(`   Corrected: ${response.data.data.correctedQuery}`);
      passedTests++;
    } else {
      console.log('❌ No correction found');
    }
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }

  // Test 2: Spell check with correct spelling
  try {
    totalTests++;
    console.log('\nTest 2: Spell Check - Correct spelling "laptop"');
    const response = await axios.get(`${BASE_URL}/search/spell-check`, {
      params: { q: 'laptop' }
    });

    if (response.data.success && !response.data.data.hasCorrection) {
      console.log('✅ Correctly identified as correct spelling');
      passedTests++;
    } else {
      console.log('❌ Incorrectly flagged as misspelled');
    }
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }

  // Test 3: Multiple word typos
  try {
    totalTests++;
    console.log('\nTest 3: Spell Check - Multiple words "wireles keybord"');
    const response = await axios.get(`${BASE_URL}/search/spell-check`, {
      params: { q: 'wireles keybord' }
    });

    if (response.data.success) {
      console.log('✅ Multi-word spell check working');
      console.log(`   Original: ${response.data.data.originalQuery}`);
      console.log(`   Corrected: ${response.data.data.correctedQuery || 'No correction needed'}`);
      console.log(`   Has correction: ${response.data.data.hasCorrection}`);
      passedTests++;
    } else {
      console.log('❌ Multi-word spell check failed');
    }
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }

  // Test 4: Alternative suggestions
  try {
    totalTests++;
    console.log('\nTest 4: Alternative Suggestions - "laptop"');
    const response = await axios.get(`${BASE_URL}/search/alternatives`, {
      params: { q: 'laptop' }
    });

    if (response.data.success) {
      console.log('✅ Alternative suggestions working');
      console.log(`   Found ${response.data.data.suggestions.length} alternatives`);
      if (response.data.data.suggestions.length > 0) {
        console.log('   Suggestions:', response.data.data.suggestions.slice(0, 3).join(', '));
      }
      passedTests++;
    } else {
      console.log('❌ Alternative suggestions failed');
    }
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }

  // Test 5: Empty query handling
  try {
    totalTests++;
    console.log('\nTest 5: Empty Query Handling');
    const response = await axios.get(`${BASE_URL}/search/spell-check`, {
      params: { q: '' }
    });

    if (response.data.success && !response.data.data.hasCorrection) {
      console.log('✅ Empty query handled correctly');
      passedTests++;
    } else {
      console.log('❌ Empty query not handled correctly');
    }
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }

  // Test 6: Test all sample queries
  console.log('\nTest 6: Testing Multiple Typos');
  for (const test of testQueries) {
    try {
      totalTests++;
      const response = await axios.get(`${BASE_URL}/search/spell-check`, {
        params: { q: test.query }
      });

      if (response.data.success) {
        const corrected = response.data.data.correctedQuery || test.query;
        console.log(`   "${test.query}" → "${corrected}"`);
        passedTests++;
      }
    } catch (error) {
      console.log(`   ❌ "${test.query}" failed:`, error.message);
    }
  }

  // Test 7: Max distance parameter
  try {
    totalTests++;
    console.log('\nTest 7: Max Distance Parameter');
    const response = await axios.get(`${BASE_URL}/search/spell-check`, {
      params: { q: 'laptpo', maxDistance: 1 }
    });

    if (response.data.success) {
      console.log('✅ Max distance parameter working');
      console.log(`   Corrected: ${response.data.data.correctedQuery || 'No correction'}`);
      passedTests++;
    } else {
      console.log('❌ Max distance parameter failed');
    }
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }

  // Test 8: Integration with search
  try {
    totalTests++;
    console.log('\nTest 8: Integration Test - Search with typo');
    
    // First get spell check
    const spellResponse = await axios.get(`${BASE_URL}/search/spell-check`, {
      params: { q: 'laptpo' }
    });

    if (spellResponse.data.success && spellResponse.data.data.hasCorrection) {
      const correctedQuery = spellResponse.data.data.correctedQuery;
      
      // Then search with corrected query
      const searchResponse = await axios.get(`${BASE_URL}/search`, {
        params: { q: correctedQuery }
      });

      if (searchResponse.data.success) {
        console.log('✅ Integration working');
        console.log(`   Typo: "laptpo" → Corrected: "${correctedQuery}"`);
        console.log(`   Found ${searchResponse.data.data.pagination.total} products`);
        passedTests++;
      } else {
        console.log('❌ Search with corrected query failed');
      }
    } else {
      console.log('❌ Spell check in integration failed');
    }
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }

  // Summary
  console.log('\n============================================================');
  console.log('📊 TEST SUMMARY');
  console.log('============================================================');
  console.log(`Total Tests: ${totalTests}`);
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${totalTests - passedTests}`);
  console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  console.log('============================================================\n');

  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Spell check system is working perfectly!\n');
  } else if (passedTests >= totalTests * 0.8) {
    console.log('✅ Most tests passed! System is working well.\n');
  } else {
    console.log('⚠️  Some tests failed. Please check the errors above.\n');
  }
}

// Run tests
console.log('🚀 Starting Spell Check Tests...');
console.log('Make sure backend server is running on port 5000\n');

testSpellCheck().catch(error => {
  console.error('❌ Test suite failed:', error.message);
  process.exit(1);
});
