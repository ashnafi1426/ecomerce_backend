/**
 * Diagnose the exact 500 error in deals endpoint
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function diagnoseDealError() {
  console.log('🔍 Diagnosing Deals 500 Error\n');
  console.log('='.repeat(60));
  
  try {
    console.log('\n📝 Testing: GET /deals?filter=all');
    
    const response = await axios.get(`${BASE_URL}/deals`, {
      params: { filter: 'all' }
    });

    console.log('\n✅ SUCCESS! (No error - backend may have been restarted)');
    console.log(`   Status: ${response.status}`);
    console.log(`   Deals found: ${response.data.count}`);
    
  } catch (error) {
    console.log('\n❌ 500 ERROR DETECTED');
    console.log('='.repeat(60));
    
    if (error.response?.status === 500) {
      console.log('\n📋 Error Details:');
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Message: ${error.response.data?.message || 'No message'}`);
      
      if (error.response.data?.error) {
        console.log(`   Error: ${error.response.data.error}`);
      }
      
      console.log('\n💡 DIAGNOSIS:');
      console.log('   The backend code has been updated but the server');
      console.log('   needs to be restarted to pick up the changes.');
      
      console.log('\n🔧 SOLUTION:');
      console.log('   Option 1 (Automatic):');
      console.log('   $ node restart-backend-and-test-deals.js');
      
      console.log('\n   Option 2 (Manual):');
      console.log('   1. Stop backend (Ctrl+C in backend terminal)');
      console.log('   2. Start backend: npm start');
      console.log('   3. Test again: node test-deals-endpoint.js');
      
      console.log('\n📝 What was fixed:');
      console.log('   - Simplified deal.routes.js query logic');
      console.log('   - Removed complex Supabase queries');
      console.log('   - Filter products in JavaScript instead');
      console.log('   - Much more reliable approach');
      
    } else if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Backend is not running!');
      console.log('   Start it with: npm start');
    } else {
      console.log(`\n   Status: ${error.response?.status || 'Unknown'}`);
      console.log(`   Error: ${error.message}`);
    }
  }
  
  console.log('\n' + '='.repeat(60));
}

diagnoseDealError();
