/**
 * Test Product Approval Filter
 * This script checks if unapproved products are showing on homepage
 */

const axios = require('axios');

const API_URL = 'http://localhost:5000';

async function testProductApprovalFilter() {
  console.log('\n========================================');
  console.log('TESTING PRODUCT APPROVAL FILTER');
  console.log('========================================\n');

  try {
    // Test 1: Get products without authentication (public access)
    console.log('Test 1: Fetching products without authentication (public)...');
    const publicResponse = await axios.get(`${API_URL}/api/products`);
    
    console.log(`✅ Found ${publicResponse.data.products.length} products`);
    
    // Check if any unapproved products are returned
    const unapprovedProducts = publicResponse.data.products.filter(
      p => p.approval_status !== 'approved'
    );
    
    if (unapprovedProducts.length > 0) {
      console.log(`\n❌ ERROR: Found ${unapprovedProducts.length} unapproved products in public view!`);
      console.log('\nUnapproved products:');
      unapprovedProducts.forEach(p => {
        console.log(`  - ${p.title} (Status: ${p.approval_status})`);
      });
    } else {
      console.log('✅ All products are approved');
    }
    
    // Show approval status breakdown
    const statusBreakdown = publicResponse.data.products.reduce((acc, p) => {
      acc[p.approval_status] = (acc[p.approval_status] || 0) + 1;
      return acc;
    }, {});
    
    console.log('\nApproval Status Breakdown:');
    Object.entries(statusBreakdown).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });
    
    // Test 2: Check database directly for all products
    console.log('\n\nTest 2: Checking all products in database...');
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    const { data: allProducts, error } = await supabase
      .from('products')
      .select('id, title, approval_status, status')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.log('❌ Error fetching from database:', error.message);
    } else {
      console.log(`\nTotal products in database: ${allProducts.length}`);
      
      const dbStatusBreakdown = allProducts.reduce((acc, p) => {
        acc[p.approval_status] = (acc[p.approval_status] || 0) + 1;
        return acc;
      }, {});
      
      console.log('\nDatabase Approval Status Breakdown:');
      Object.entries(dbStatusBreakdown).forEach(([status, count]) => {
        console.log(`  ${status}: ${count}`);
      });
      
      // Show pending products
      const pendingProducts = allProducts.filter(p => p.approval_status === 'pending');
      if (pendingProducts.length > 0) {
        console.log(`\n📋 Pending products (should NOT appear on homepage):`);
        pendingProducts.forEach(p => {
          console.log(`  - ${p.title} (ID: ${p.id})`);
        });
      }
    }
    
    console.log('\n========================================');
    console.log('TEST COMPLETE');
    console.log('========================================\n');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

// Load environment variables
require('dotenv').config({ path: '.kiro/specs/fastshop-ecommerce-platform/ecomerce_backend/.env' });

testProductApprovalFilter();
