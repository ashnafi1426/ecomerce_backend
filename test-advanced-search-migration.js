/**
 * Test Script: Verify Advanced Search System Migration
 * 
 * This script checks if the database migration for advanced search
 * has been applied successfully.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testMigration() {
  console.log('🔍 Testing Advanced Search System Migration...\n');

  try {
    // Test 1: Check if brands table exists
    console.log('✅ Test 1: Checking brands table...');
    const { data: brands, error: brandsError } = await supabase
      .from('brands')
      .select('*')
      .limit(5);

    if (brandsError) {
      console.log('❌ Brands table not found or error:', brandsError.message);
      console.log('⚠️  Please run the migration SQL in Supabase Dashboard first!\n');
      return false;
    }

    console.log(`✅ Brands table exists with ${brands.length} sample brands`);
    console.log('   Sample brands:', brands.map(b => b.name).join(', '));

    // Test 2: Check if products have brand_id column
    console.log('\n✅ Test 2: Checking products.brand_id column...');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, title, brand_id')
      .not('brand_id', 'is', null)
      .limit(5);

    if (productsError) {
      console.log('❌ Error checking products:', productsError.message);
      return false;
    }

    console.log(`✅ Products have brand_id column (${products.length} products with brands)`);

    // Test 3: Check if search_history table exists
    console.log('\n✅ Test 3: Checking search_history table...');
    const { data: searchHistory, error: searchError } = await supabase
      .from('search_history')
      .select('*')
      .limit(1);

    if (searchError) {
      console.log('❌ Search history table not found:', searchError.message);
      return false;
    }

    console.log('✅ Search history table exists');

    // Test 4: Test search function
    console.log('\n✅ Test 4: Testing search_products function...');
    const { data: searchResults, error: searchFuncError } = await supabase
      .rpc('search_products', {
        search_term: 'laptop',
        page_limit: 5,
        page_offset: 0
      });

    if (searchFuncError) {
      console.log('❌ Search function error:', searchFuncError.message);
      return false;
    }

    console.log(`✅ Search function works (found ${searchResults?.length || 0} results)`);

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL TESTS PASSED!');
    console.log('='.repeat(60));
    console.log('\n📊 Migration Summary:');
    console.log(`   - Brands table: ✅ Created with ${brands.length} brands`);
    console.log(`   - Products.brand_id: ✅ Added`);
    console.log(`   - Search history: ✅ Created`);
    console.log(`   - Search function: ✅ Working`);
    console.log('\n🎉 Ready to proceed with backend implementation!\n');

    return true;

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    return false;
  }
}

// Run the test
testMigration().then(success => {
  if (!success) {
    console.log('\n⚠️  MIGRATION NOT APPLIED YET');
    console.log('\n📝 To apply the migration:');
    console.log('   1. Open Supabase Dashboard');
    console.log('   2. Go to SQL Editor');
    console.log('   3. Run: database/migrations/advanced-search-system.sql');
    console.log('\n   Then run this test again!\n');
    process.exit(1);
  }
  process.exit(0);
});
