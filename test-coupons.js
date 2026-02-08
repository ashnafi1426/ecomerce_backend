/**
 * COUPON SYSTEM TEST SUITE
 * 
 * Tests all coupon functionality including:
 * - Coupon creation
 * - Coupon validation
 * - Coupon application
 * - Usage tracking
 */

const supabase = require('./config/supabase');
const couponService = require('./services/couponServices/coupon.service');

// Test configuration
const TEST_CONFIG = {
  adminEmail: 'admin@ecommerce.com',
  testUserEmail: 'test-coupon-user@example.com',
  testUserPassword: 'TestPassword123!'
};

let testData = {
  adminId: null,
  testUserId: null,
  testCouponId: null,
  testOrderId: null
};

// Helper function to create test user
async function createTestUser() {
  console.log('📝 Creating test user...');
  
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('email', TEST_CONFIG.testUserEmail)
    .single();

  if (existingUser) {
    console.log('✅ Test user already exists');
    return existingUser.id;
  }

  const bcrypt = require('bcrypt');
  const hashedPassword = await bcrypt.hash(TEST_CONFIG.testUserPassword, 10);

  const { data, error } = await supabase
    .from('users')
    .insert([{
      email: TEST_CONFIG.testUserEmail,
      password_hash: hashedPassword,
      role: 'customer',
      display_name: 'Test Coupon User',
      status: 'active'
    }])
    .select()
    .single();

  if (error) throw error;
  console.log('✅ Test user created');
  return data.id;
}

// Helper function to create test order
async function createTestOrder(userId) {
  console.log('📝 Creating test order...');
  
  const { data, error } = await supabase
    .from('orders')
    .insert([{
      user_id: userId,
      payment_intent_id: `test_pi_${Date.now()}`,
      amount: 10000, // $100.00
      basket: JSON.stringify([{ product_id: 'test', quantity: 1, price: 100 }]),
      status: 'pending_payment'
    }])
    .select()
    .single();

  if (error) throw error;
  console.log('✅ Test order created');
  return data.id;
}

// Test 1: Create Percentage Discount Coupon
async function testCreatePercentageCoupon() {
  console.log('\n🧪 Test 1: Create Percentage Discount Coupon');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    const couponData = {
      code: 'TEST10',
      description: 'Test 10% discount',
      discount_type: 'percentage',
      discount_value: 10,
      min_order_amount: 50,
      max_discount_amount: 20,
      usage_limit: 100,
      per_user_limit: 1,
      valid_from: new Date().toISOString(),
      valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      is_active: true,
      applicable_to: 'all',
      applicable_ids: [],
      created_by: testData.adminId
    };

    const coupon = await couponService.createCoupon(couponData);
    testData.testCouponId = coupon.id;

    console.log('✅ Percentage coupon created successfully');
    console.log('   Code:', coupon.code);
    console.log('   Discount:', `${coupon.discount_value}%`);
    console.log('   Min Order:', `$${coupon.min_order_amount}`);
    console.log('   Max Discount:', `$${coupon.max_discount_amount}`);
    return true;
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

// Test 2: Create Fixed Amount Coupon
async function testCreateFixedCoupon() {
  console.log('\n🧪 Test 2: Create Fixed Amount Coupon');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    const couponData = {
      code: 'SAVE25',
      description: 'Save $25 on your order',
      discount_type: 'fixed',
      discount_value: 25,
      min_order_amount: 100,
      usage_limit: 50,
      per_user_limit: 2,
      valid_from: new Date().toISOString(),
      valid_until: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      is_active: true,
      applicable_to: 'all',
      applicable_ids: [],
      created_by: testData.adminId
    };

    const coupon = await couponService.createCoupon(couponData);

    console.log('✅ Fixed amount coupon created successfully');
    console.log('   Code:', coupon.code);
    console.log('   Discount:', `$${coupon.discount_value}`);
    console.log('   Min Order:', `$${coupon.min_order_amount}`);
    return true;
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

// Test 3: Create Free Shipping Coupon
async function testCreateFreeShippingCoupon() {
  console.log('\n🧪 Test 3: Create Free Shipping Coupon');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    const couponData = {
      code: 'SHIPFREE',
      description: 'Free shipping on all orders',
      discount_type: 'free_shipping',
      discount_value: 0,
      min_order_amount: 75,
      usage_limit: null,
      per_user_limit: 5,
      valid_from: new Date().toISOString(),
      valid_until: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      is_active: true,
      applicable_to: 'all',
      applicable_ids: [],
      created_by: testData.adminId
    };

    const coupon = await couponService.createCoupon(couponData);

    console.log('✅ Free shipping coupon created successfully');
    console.log('   Code:', coupon.code);
    console.log('   Type:', coupon.discount_type);
    console.log('   Min Order:', `$${coupon.min_order_amount}`);
    return true;
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

// Test 4: Validate Coupon - Valid Case
async function testValidateCouponValid() {
  console.log('\n🧪 Test 4: Validate Coupon - Valid Case');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    const validation = await couponService.validateCoupon(
      'TEST10',
      testData.testUserId,
      100, // $100 cart total
      []
    );

    console.log('✅ Coupon validation successful');
    console.log('   Is Valid:', validation.isValid);
    console.log('   Message:', validation.message);
    console.log('   Discount Amount:', `$${validation.discountAmount}`);
    
    if (!validation.isValid) {
      throw new Error('Expected coupon to be valid');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

// Test 5: Validate Coupon - Below Minimum Order
async function testValidateCouponBelowMinimum() {
  console.log('\n🧪 Test 5: Validate Coupon - Below Minimum Order');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    const validation = await couponService.validateCoupon(
      'TEST10',
      testData.testUserId,
      30, // $30 cart total (below $50 minimum)
      []
    );

    console.log('✅ Validation correctly rejected low order amount');
    console.log('   Is Valid:', validation.isValid);
    console.log('   Message:', validation.message);
    
    if (validation.isValid) {
      throw new Error('Expected coupon to be invalid for low order amount');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

// Test 6: Apply Coupon to Order
async function testApplyCoupon() {
  console.log('\n🧪 Test 6: Apply Coupon to Order');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    const usage = await couponService.applyCoupon(
      testData.testCouponId,
      testData.testUserId,
      testData.testOrderId,
      10.00
    );

    console.log('✅ Coupon applied successfully');
    console.log('   Usage ID:', usage.id);
    console.log('   Discount Amount:', `$${usage.discount_amount}`);
    return true;
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

// Test 7: Validate Coupon - Already Used
async function testValidateCouponAlreadyUsed() {
  console.log('\n🧪 Test 7: Validate Coupon - Already Used');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    const validation = await couponService.validateCoupon(
      'TEST10',
      testData.testUserId,
      100,
      []
    );

    console.log('✅ Validation correctly rejected already used coupon');
    console.log('   Is Valid:', validation.isValid);
    console.log('   Message:', validation.message);
    
    if (validation.isValid) {
      throw new Error('Expected coupon to be invalid (already used)');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

// Test 8: Get Coupon Usage Statistics
async function testGetCouponUsage() {
  console.log('\n🧪 Test 8: Get Coupon Usage Statistics');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    const usageData = await couponService.getCouponUsage(testData.testCouponId);

    console.log('✅ Usage statistics retrieved successfully');
    console.log('   Total Usage:', usageData.statistics.totalUsage);
    console.log('   Total Discount:', `$${usageData.statistics.totalDiscount}`);
    console.log('   Unique Users:', usageData.statistics.uniqueUsers);
    return true;
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

// Test 9: Get Active Coupons
async function testGetActiveCoupons() {
  console.log('\n🧪 Test 9: Get Active Coupons');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    const coupons = await couponService.getActiveCoupons();

    console.log('✅ Active coupons retrieved successfully');
    console.log('   Count:', coupons.length);
    coupons.forEach(coupon => {
      console.log(`   - ${coupon.code}: ${coupon.description}`);
    });
    return true;
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

// Test 10: Get User Available Coupons
async function testGetUserAvailableCoupons() {
  console.log('\n🧪 Test 10: Get User Available Coupons');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    const coupons = await couponService.getUserAvailableCoupons(testData.testUserId);

    console.log('✅ User available coupons retrieved successfully');
    console.log('   Count:', coupons.length);
    coupons.forEach(coupon => {
      console.log(`   - ${coupon.code}: ${coupon.description}`);
    });
    return true;
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

// Test 11: Update Coupon
async function testUpdateCoupon() {
  console.log('\n🧪 Test 11: Update Coupon');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    const updated = await couponService.updateCoupon(testData.testCouponId, {
      description: 'Updated test coupon description',
      discount_value: 15
    });

    console.log('✅ Coupon updated successfully');
    console.log('   New Description:', updated.description);
    console.log('   New Discount:', `${updated.discount_value}%`);
    return true;
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('\n╔════════════════════════════════════════════════════╗');
  console.log('║     COUPON SYSTEM TEST SUITE                       ║');
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

    // Create test user
    testData.testUserId = await createTestUser();

    // Create test order
    testData.testOrderId = await createTestOrder(testData.testUserId);

    // Run tests
    const tests = [
      testCreatePercentageCoupon,
      testCreateFixedCoupon,
      testCreateFreeShippingCoupon,
      testValidateCouponValid,
      testValidateCouponBelowMinimum,
      testApplyCoupon,
      testValidateCouponAlreadyUsed,
      testGetCouponUsage,
      testGetActiveCoupons,
      testGetUserAvailableCoupons,
      testUpdateCoupon
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
      console.log('🎉 All tests passed! Coupon system is working correctly.\n');
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
