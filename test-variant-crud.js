/**
 * INTEGRATION TEST FOR VARIANT SERVICE
 * 
 * This script tests full CRUD operations with real database
 * Run with: node test-variant-crud.js
 */

const variantService = require('./services/variantServices/variant.service');
const supabase = require('./config/supabase');

async function testVariantCRUD() {
  console.log('🧪 Testing Variant Service CRUD Operations...\n');
  
  let createdVariantId = null;
  let testProductId = null;
  
  try {
    // Step 1: Get a real product from database
    console.log('Step 1: Finding a test product...');
    const { data: products, error: productError } = await supabase
      .from('products')
      .select('id, title, seller_id')
      .eq('status', 'active')
      .limit(1)
      .single();
    
    if (productError || !products) {
      console.log('❌ No active products found. Please create a product first.');
      return;
    }
    
    testProductId = products.id;
    console.log('✅ Found product:', products.title);
    console.log('   Product ID:', testProductId);
    console.log();
    
    // Step 2: Create a variant
    console.log('Step 2: Creating a variant...');
    const variantData = {
      attributes: { size: 'Large', color: 'Blue' },
      price: 29.99,
      compareAtPrice: 39.99,
      images: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
      initialQuantity: 100,
      lowStockThreshold: 10,
      isAvailable: true
    };
    
    const createdVariant = await variantService.createVariant(testProductId, variantData);
    createdVariantId = createdVariant.id;
    
    console.log('✅ Variant created successfully!');
    console.log('   Variant ID:', createdVariant.id);
    console.log('   SKU:', createdVariant.sku);
    console.log('   Variant Name:', createdVariant.variant_name);
    console.log('   Price:', createdVariant.price);
    console.log('   Inventory Quantity:', createdVariant.inventory.quantity);
    console.log();
    
    // Step 3: Get variant by ID
    console.log('Step 3: Retrieving variant by ID...');
    const retrievedVariant = await variantService.getVariantById(createdVariantId);
    console.log('✅ Variant retrieved:', retrievedVariant.variant_name);
    console.log('   Available Quantity:', retrievedVariant.availableQuantity);
    console.log();
    
    // Step 4: Get all variants for product
    console.log('Step 4: Getting all variants for product...');
    const allVariants = await variantService.getProductVariants(testProductId);
    console.log('✅ Total variants for product:', allVariants.length);
    console.log();
    
    // Step 5: Update variant
    console.log('Step 5: Updating variant...');
    const updatedVariant = await variantService.updateVariant(createdVariantId, {
      price: 24.99,
      compareAtPrice: 34.99,
      isAvailable: true
    });
    console.log('✅ Variant updated!');
    console.log('   New Price:', updatedVariant.price);
    console.log('   New Compare At Price:', updatedVariant.compare_at_price);
    console.log();
    
    // Step 6: Test attribute filtering
    console.log('Step 6: Testing attribute filtering...');
    const filteredVariants = await variantService.getProductVariants(testProductId, {
      attributes: { size: 'Large' }
    });
    console.log('✅ Filtered variants (size=Large):', filteredVariants.length);
    console.log();
    
    // Step 7: Test duplicate attribute validation
    console.log('Step 7: Testing duplicate attribute validation...');
    try {
      await variantService.createVariant(testProductId, {
        attributes: { size: 'Large', color: 'Blue' }, // Same as existing
        price: 19.99
      });
      console.log('❌ Should have rejected duplicate attributes');
    } catch (error) {
      console.log('✅ Correctly rejected duplicate:', error.message);
    }
    console.log();
    
    // Step 8: Create another variant with different attributes
    console.log('Step 8: Creating variant with different attributes...');
    const variant2 = await variantService.createVariant(testProductId, {
      attributes: { size: 'Medium', color: 'Red' },
      price: 27.99,
      initialQuantity: 50
    });
    console.log('✅ Second variant created:', variant2.variant_name);
    console.log('   SKU:', variant2.sku);
    console.log();
    
    // Step 9: Get variant by SKU
    console.log('Step 9: Getting variant by SKU...');
    const variantBySKU = await variantService.getVariantBySKU(variant2.sku);
    console.log('✅ Variant found by SKU:', variantBySKU.variant_name);
    console.log();
    
    // Step 10: Check if product has variants
    console.log('Step 10: Checking if product has variants...');
    const hasVars = await variantService.hasVariants(testProductId);
    console.log('✅ Product has variants:', hasVars);
    console.log();
    
    // Cleanup: Delete created variants
    console.log('Cleanup: Deleting test variants...');
    await variantService.deleteVariant(createdVariantId);
    await variantService.deleteVariant(variant2.id);
    console.log('✅ Test variants deleted');
    console.log();
    
    console.log('✅ All CRUD tests passed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
    
    // Cleanup on error
    if (createdVariantId) {
      try {
        await variantService.deleteVariant(createdVariantId);
        console.log('✅ Cleaned up test variant');
      } catch (cleanupError) {
        console.error('Failed to cleanup:', cleanupError.message);
      }
    }
  }
}

// Run tests
testVariantCRUD()
  .then(() => {
    console.log('\n✅ Integration test suite completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Integration test suite failed:', error);
    process.exit(1);
  });
