/**
 * PROMOTIONAL PRICING TEST SUITE
 * 
 * Tests all promotional pricing functionality including:
 * - Promotion creation
 * - Active promotion retrieval
 * - Promotional price calculation
 * - Promotion management
 */

const supabase = require('./config/supabase');
const promotionService = require('./services/promotionServices/promotion.service');

// Test configuration
const TEST_CONFIG = {
  adminEmail: 'admin@ecommerce.com'
};

let testData = {
  adminId: null,
  testProductId: null,
  testPromotionId: null
};

// Helper function to create test product
async function createTestProduct(adminId) {
  console.log('📝 Creating test product...');
  
  // Get a category
  const { data: category } = await supabase
    .from('categories')
    .select('id')
    .limit(1)
    .single();

  const { data, error } = await supabase
    .from('products')
    .insert([{
      title: 'Test Product for Promotions',
      description: 'Test product description',
      price: 99.99,
      status: 'active',
      category_id: category?.id,
      seller_id: adminId,
      approval_status: 'approved'
    }])
    .select()
    .single();

  if (error) throw error;
  console.log('✅ Test product created');
  return data.id;
}

// Test 1: Create Promotional Pricing
async function testCreatePromotion() {
  console.log('\n🧪 Test 1: Create Promotional Pricing');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    const promotionData = {
      product_id: testData.testProductId,
      promotional_price: 79.99,
      valid_from: new Date().toISOString(),
      valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      is_active: true,
      created_by: testData.adminId
    };

    const promotion = await promotionService.createPromotion(promotionData);
    testData.testPromotionId = promotion.id;

    console.log('✅ Promotion created successfully');
    console.log('   Product ID:', promotion.product_id);
    console.log('   Promotional Price:', `$${promotion.promotional_price}`);
    console.log('   Valid Until:', new Date(promotion.valid_until).toLocaleDateString());
    return true;
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

// Test 2: Get Active Promotions
async function testGetActivePromotions() {
  console.log('\n🧪 Test 2: Get Active Promotions');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    const promotions = await promotionService.getActivePromotions(testData.testProductId);

    console.log('✅ Active promotions retrieved successfully');
    console.log('   Count:', promotions.length);
    promotions.forEach(promo => {
      console.log(`   - Price: $${promo.promotional_price}, Valid until: ${new Date(promo.valid_until).toLocaleDateString()}`);
    });
    
    if (promotions.length === 0) {
      throw new Error('Expected at least one active promotion');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

// Test 3: Get Promotional Price
async function testGetPromotionalPrice() {
  console.log('\n🧪 Test 3: Get Promotional Price');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    const promotionalPrice = await promotionService.getPromotionalPrice(testData.testProductId);

    console.log('✅ Promotional price retrieved successfully');
    console.log('   Promotional Price:', promotionalPrice ? `$${promotionalPrice}` : 'None');
    
    if (!promotionalPrice) {
      throw new Error('Expected promotional price to be set');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

// Test 4: Get Promotion by ID
async function testGetPromotionById() {
  console.log('\n🧪 Test 4: Get Promotion by ID');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    const promotion = await promotionService.getPromotionById(testData.testPromotionId);

    console.log('✅ Promotion retrieved successfully');
    console.log('   ID:', promotion.id);
    console.log('   Product:', promotion.products?.title);
    console.log('   Price:', `$${promotion.promotional_price}`);
    return true;
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

// Test 5: Get Promotions by Product
async function testGetPromotionsByProduct() {
  console.log('\n🧪 Test 5: Get Promotions by Product');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    const promotions = await promotionService.getPromotionsByProduct(testData.testProductId);

    console.log('✅ Product promotions retrieved successfully');
    console.log('   Count:', promotions.length);
    promotions.forEach(promo => {
      console.log(`   - ${promo.is_active ? '✓' : '✗'} $${promo.promotional_price}`);
    });
    return true;
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

// Test 6: Update Promotion
async function testUpdatePromotion() {
  console.log('\n🧪 Test 6: Update Promotion');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    const updated = await promotionService.updatePromotion(testData.testPromotionId, {
      promotional_price: 74.99
    });

    console.log('✅ Promotion updated successfully');
    console.log('   New Price:', `$${updated.promotional_price}`);
    return true;
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

// Test 7: Get Products with Promotions
async function testGetProductsWithPromotions() {
  console.log('\n🧪 Test 7: Get Products with Promotions');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    const products = await promotionService.getProductsWithPromotions(5);

    console.log('✅ Products with promotions retrieved successfully');
    console.log('   Count:', products.length);
    products.forEach(product => {
      console.log(`   - ${product.title}: $${product.price} → $${product.promotional_price} (${product.discount_percentage}% off)`);
    });
    return true;
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

// Test 8: Get All Promotions with Filters
async function testGetAllPromotions() {
  console.log('\n🧪 Test 8: Get All Promotions with Filters');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    const result = await promotionService.getAllPromotions(1, 10, { active_only: true });

    console.log('✅ All promotions retrieved successfully');
    console.log('   Count:', result.promotions.length);
    console.log('   Total:', result.pagination.total);
    console.log('   Pages:', result.pagination.totalPages);
    return true;
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

// Test 9: Deactivate Promotion
async function testDeactivatePromotion() {
  console.log('\n🧪 Test 9: Deactivate Promotion');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    const updated = await promotionService.updatePromotion(testData.testPromotionId, {
      is_active: false
    });

    console.log('✅ Promotion deactivated successfully');
    console.log('   Is Active:', updated.is_active);
    
    if (updated.is_active) {
      throw new Error('Expected promotion to be inactive');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

// Test 10: Verify Deactivated Promotion Not in Active List
async function testDeactivatedNotInActiveList() {
  console.log('\n🧪 Test 10: Verify Deactivated Promotion Not in Active List');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    const promotions = await promotionService.getActivePromotions(testData.testProductId);

    console.log('✅ Active promotions check successful');
    console.log('   Active Count:', promotions.length);
    
    const hasDeactivated = promotions.some(p => p.id === testData.testPromotionId);
    if (hasDeactivated) {
      throw new Error('Deactivated promotion should not appear in active list');
    }
    
    console.log('   ✓ Deactivated promotion correctly excluded');
    return true;
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

// Test 11: Bulk Create Promotions
async function testBulkCreatePromotions() {
  console.log('\n🧪 Test 11: Bulk Create Promotions');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    // Create additional test products
    const product2Id = await createTestProduct(testData.adminId);
    const product3Id = await createTestProduct(testData.adminId);

    const promotions = [
      {
        product_id: product2Id,
        promotional_price: 49.99,
        valid_from: new Date().toISOString(),
        valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        is_active: true,
        created_by: testData.adminId
      },
      {
        product_id: product3Id,
        promotional_price: 39.99,
        valid_from: new Date().toISOString(),
        valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        is_active: true,
        created_by: testData.adminId
      }
    ];

    const created = await promotionService.bulkCreatePromotions(promotions);

    console.log('✅ Bulk promotions created successfully');
    console.log('   Count:', created.length);
    return true;
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

// Test 12: Validation - Price Must Be Less Than Regular Price
async function testValidationPriceTooHigh() {
  console.log('\n🧪 Test 12: Validation - Price Must Be Less Than Regular Price');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    const promotionData = {
      product_id: testData.testProductId,
      promotional_price: 150.00, // Higher than regular price
      valid_from: new Date().toISOString(),
      valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      is_active: true,
      created_by: testData.adminId
    };

    try {
      await promotionService.createPromotion(promotionData);
      throw new Error('Expected validation to fail');
    } catch (validationError) {
      console.log('✅ Validation correctly rejected high promotional price');
      console.log('   Error:', validationError.message);
      return true;
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('\n╔════════════════════════════════════════════════════╗');
  console.log('║     PROMOTIONAL PRICING TEST SUITE                 ║');
  console.log('╚════════════════════════════════════════════════════╝\n');

  const results = {
    passed: 0,
    failed: 0,
    total: 0
  };

  try {
    // Setup
    console.log('🔧 Setting up test environment...\n');
    
    // Get admin ID
    const { data: admin } = await supabase
      .from('users')
      .select('id')
      .eq('email', TEST_CONFIG.adminEmail)
      .single();

    if (!admin) {
      throw new Error('Admin user not found. Please run create-admin-account.js first');
    }
    testData.adminId = admin.id;
    console.log('✅ Admin user found');

    // Create test product
    testData.testProductId = await createTestProduct(testData.adminId);

    // Run tests
    const tests = [
      testCreatePromotion,
      testGetActivePromotions,
      testGetPromotionalPrice,
      testGetPromotionById,
      testGetPromotionsByProduct,
      testUpdatePromotion,
      testGetProductsWithPromotions,
      testGetAllPromotions,
      testDeactivatePromotion,
      testDeactivatedNotInActiveList,
      testBulkCreatePromotions,
      testValidationPriceTooHigh
    ];

    for (const test of tests) {
      results.total++;
      const passed = await test();
      if (passed) {
        results.passed++;
      } else {
        results.failed++;
      }
    }

    // Summary
    console.log('\n╔════════════════════════════════════════════════════╗');
    console.log('║     TEST SUMMARY                                   ║');
    console.log('╚════════════════════════════════════════════════════╝\n');
    console.log(`Total Tests: ${results.total}`);
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%\n`);

    if (results.failed === 0) {
      console.log('🎉 All tests passed! Promotional pricing system is working correctly.\n');
    } else {
      console.log('⚠️  Some tests failed. Please review the errors above.\n');
    }

  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
    console.error(error);
  }
}

// Run the tests
runTests();
