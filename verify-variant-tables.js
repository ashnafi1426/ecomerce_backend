/**
 * VERIFY VARIANT TABLES
 * 
 * Checks if all variant tables and columns are properly created
 */

const supabase = require('./config/supabase');

async function verifyTables() {
  console.log('🔍 Verifying Product Variants System Tables...\n');

  try {
    // Check product_variants table
    console.log('1. Checking product_variants table...');
    const { data: variants, error: variantsError } = await supabase
      .from('product_variants')
      .select('*')
      .limit(1);
    
    if (variantsError) {
      console.log('   ❌ product_variants: ERROR -', variantsError.message);
    } else {
      console.log('   ✅ product_variants: EXISTS');
    }

    // Check variant_inventory table
    console.log('\n2. Checking variant_inventory table...');
    const { data: inventory, error: inventoryError } = await supabase
      .from('variant_inventory')
      .select('*')
      .limit(1);
    
    if (inventoryError) {
      console.log('   ❌ variant_inventory: ERROR -', inventoryError.message);
    } else {
      console.log('   ✅ variant_inventory: EXISTS');
    }

    // Check cart_items.variant_id column
    console.log('\n3. Checking cart_items.variant_id column...');
    const { data: cartItems, error: cartError } = await supabase
      .from('cart_items')
      .select('id, product_id, variant_id')
      .limit(1);
    
    if (cartError) {
      if (cartError.message.includes('variant_id')) {
        console.log('   ❌ cart_items.variant_id: COLUMN NOT FOUND');
        console.log('   💡 Need to add variant_id column to cart_items table');
      } else {
        console.log('   ❌ cart_items: ERROR -', cartError.message);
      }
    } else {
      console.log('   ✅ cart_items.variant_id: COLUMN EXISTS');
    }

    // Try to create a test variant (if we have products)
    console.log('\n4. Testing variant creation...');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id')
      .limit(1);
    
    if (productsError || !products || products.length === 0) {
      console.log('   ⚠️  No products found to test variant creation');
    } else {
      const testProductId = products[0].id;
      const testSKU = `TEST-SKU-${Date.now()}`;
      
      const { data: testVariant, error: testError } = await supabase
        .from('product_variants')
        .insert([{
          product_id: testProductId,
          variant_name: 'Test Variant',
          sku: testSKU,
          price_adjustment: 0,
          attributes: { test: true }
        }])
        .select()
        .single();
      
      if (testError) {
        console.log('   ❌ Variant creation test: FAILED -', testError.message);
      } else {
        console.log('   ✅ Variant creation test: SUCCESS');
        console.log('   📝 Test variant ID:', testVariant.id);
        
        // Clean up test variant
        await supabase
          .from('product_variants')
          .delete()
          .eq('id', testVariant.id);
        console.log('   🧹 Test variant cleaned up');
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('VERIFICATION COMPLETE');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Verification error:', error.message);
  }
}

verifyTables()
  .then(() => {
    console.log('\n✅ Verification script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Verification script failed:', error);
    process.exit(1);
  });
