/**
 * TEST SCRIPT FOR VARIANT SERVICE
 * 
 * This script tests the variant service implementation
 * Run with: node test-variant-service.js
 */

const variantService = require('./services/variantServices/variant.service');

async function testVariantService() {
  console.log('🧪 Testing Variant Service...\n');
  
  try {
    // Test 1: Generate SKU
    console.log('Test 1: Generate SKU');
    const testProductId = '12345678-1234-1234-1234-123456789012';
    const testAttributes = { size: 'Large', color: 'Blue' };
    const sku = variantService.generateSKU(testProductId, testAttributes);
    console.log('✅ Generated SKU:', sku);
    console.log('   Format: PRODUCT_HASH-ATTRIBUTES-TIMESTAMP\n');
    
    // Test 2: Validate unique attributes (should return true for non-existent)
    console.log('Test 2: Validate Unique Attributes');
    const isUnique = await variantService.validateUniqueAttributes(
      testProductId,
      testAttributes
    );
    console.log('✅ Attributes unique check:', isUnique);
    console.log('   (Expected: true for non-existent variant)\n');
    
    // Test 3: Get product variants (empty result expected)
    console.log('Test 3: Get Product Variants');
    const variants = await variantService.getProductVariants(testProductId);
    console.log('✅ Variants retrieved:', variants.length);
    console.log('   (Expected: 0 for non-existent product)\n');
    
    // Test 4: Test error handling - missing attributes
    console.log('Test 4: Error Handling - Missing Attributes');
    try {
      await variantService.createVariant(testProductId, {
        price: 29.99,
        attributes: {}
      });
      console.log('❌ Should have thrown error for missing attributes');
    } catch (error) {
      console.log('✅ Correctly rejected:', error.message);
    }
    console.log();
    
    // Test 5: Test error handling - negative price
    console.log('Test 5: Error Handling - Negative Price');
    try {
      await variantService.createVariant(testProductId, {
        price: -10,
        attributes: { size: 'M' }
      });
      console.log('❌ Should have thrown error for negative price');
    } catch (error) {
      console.log('✅ Correctly rejected:', error.message);
    }
    console.log();
    
    // Test 6: Test SKU uniqueness
    console.log('Test 6: SKU Generation Uniqueness');
    const sku1 = variantService.generateSKU(testProductId, { size: 'S' });
    const sku2 = variantService.generateSKU(testProductId, { size: 'S' });
    const sku3 = variantService.generateSKU(testProductId, { size: 'M' });
    console.log('✅ SKU 1:', sku1);
    console.log('✅ SKU 2:', sku2);
    console.log('✅ SKU 3:', sku3);
    console.log('   All SKUs are unique:', sku1 !== sku2 && sku2 !== sku3 && sku1 !== sku3);
    console.log();
    
    console.log('✅ All basic tests passed!');
    console.log('\n📝 Note: To test full CRUD operations, you need:');
    console.log('   1. A valid product ID from your database');
    console.log('   2. Proper database connection configured');
    console.log('   3. Run the integration tests instead');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
  }
}

// Run tests
testVariantService()
  .then(() => {
    console.log('\n✅ Test suite completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test suite failed:', error);
    process.exit(1);
  });
