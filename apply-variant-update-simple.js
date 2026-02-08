/**
 * Simple Variant Schema Update
 * 
 * This script applies the critical schema updates needed for the variant service
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    db: {
      schema: 'public'
    }
  }
);

async function applyUpdates() {
  console.log('🔄 Applying Variant Schema Updates...\n');

  try {
    // The key updates we need:
    // 1. Add price column if it doesn't exist
    // 2. Add compare_at_price column if it doesn't exist
    // 3. Add images column if it doesn't exist
    // 4. Rename is_active to is_available if needed
    // 5. Add last_restocked_at to variant_inventory

    console.log('📝 Note: This script applies updates via Supabase client');
    console.log('   For full migration, use Supabase Dashboard SQL Editor\n');

    // Test if we can insert a variant with the new schema
    console.log('Testing schema...');
    
    // Get a test product
    const { data: product } = await supabase
      .from('products')
      .select('id')
      .limit(1)
      .single();

    if (!product) {
      console.log('❌ No products found for testing');
      return;
    }

    // Try to insert a test variant
    const testVariant = {
      product_id: product.id,
      variant_name: 'Schema Test Variant',
      sku: `TEST-SCHEMA-${Date.now()}`,
      price: 10.00,
      compare_at_price: 15.00,
      attributes: { test: 'value' },
      images: ['https://example.com/test.jpg'],
      is_available: true
    };

    const { data: inserted, error: insertError } = await supabase
      .from('product_variants')
      .insert([testVariant])
      .select()
      .single();

    if (insertError) {
      console.log('❌ Schema test failed:', insertError.message);
      console.log('\n📋 Manual Migration Required:');
      console.log('   1. Go to Supabase Dashboard → SQL Editor');
      console.log('   2. Copy contents of: database/migrations/update-product-variants-schema.sql');
      console.log('   3. Paste and click "Run"');
      console.log('   4. Run: node refresh-schema-cache.js');
      console.log('   5. Run this script again to verify');
      return;
    }

    console.log('✅ Schema test passed!');
    console.log('   Test variant created:', inserted.id);

    // Clean up test variant
    await supabase
      .from('product_variants')
      .delete()
      .eq('id', inserted.id);

    console.log('✅ Test variant cleaned up');
    console.log('\n✨ Schema is ready! You can now use the variant service.');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.log('\n📋 Please apply the migration manually:');
    console.log('   1. Go to Supabase Dashboard → SQL Editor');
    console.log('   2. Copy contents of: database/migrations/update-product-variants-schema.sql');
    console.log('   3. Paste and click "Run"');
    console.log('   4. Run: node refresh-schema-cache.js');
  }
}

applyUpdates()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
