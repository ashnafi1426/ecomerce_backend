/**
 * Test Homepage Products - Verify Approval Status Filtering
 * 
 * This script tests if unapproved products are appearing on the homepage
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testHomepageProducts() {
  console.log('🧪 Testing Homepage Products - Approval Status Filtering\n');
  console.log('=' .repeat(60));

  try {
    // Test 1: Get all products as public user (no authentication)
    console.log('\n📋 Test 1: Public Homepage Products (No Auth)');
    console.log('-'.repeat(60));
    
    const publicResponse = await axios.get(`${BASE_URL}/api/products`);
    
    console.log(`✅ Status: ${publicResponse.status}`);
    console.log(`📦 Total products returned: ${publicResponse.data.count}`);
    
    // Check approval status of all products
    const products = publicResponse.data.products;
    const approvalBreakdown = {
      approved: 0,
      pending: 0,
      rejected: 0
    };
    
    products.forEach(product => {
      const status = product.approval_status;
      if (status === 'approved') approvalBreakdown.approved++;
      else if (status === 'pending') approvalBreakdown.pending++;
      else if (status === 'rejected') approvalBreakdown.rejected++;
    });
    
    console.log('\n📊 Approval Status Breakdown:');
    console.log(`   ✅ Approved: ${approvalBreakdown.approved}`);
    console.log(`   ⏳ Pending: ${approvalBreakdown.pending}`);
    console.log(`   ❌ Rejected: ${approvalBreakdown.rejected}`);
    
    // Test result
    if (approvalBreakdown.pending > 0 || approvalBreakdown.rejected > 0) {
      console.log('\n❌ FAIL: Unapproved products are appearing on homepage!');
      console.log('\n🔍 Unapproved products found:');
      products
        .filter(p => p.approval_status !== 'approved')
        .forEach(p => {
          console.log(`   - ${p.title} (ID: ${p.id}, Status: ${p.approval_status})`);
        });
    } else {
      console.log('\n✅ PASS: Only approved products are showing on homepage');
    }
    
    // Test 2: Check database directly for all products
    console.log('\n\n📋 Test 2: Database Product Count by Status');
    console.log('-'.repeat(60));
    
    // We'll need to query with different filters to see what's in the database
    console.log('Note: This test requires database access or admin credentials');
    
  } catch (error) {
    console.error('\n❌ Error during test:');
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Message: ${error.response.data.message || error.response.data.error}`);
    } else {
      console.error(`   ${error.message}`);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('🏁 Test Complete\n');
}

// Run the test
testHomepageProducts();
