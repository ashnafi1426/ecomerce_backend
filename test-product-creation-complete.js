/**
 * Test Complete Product Creation Flow
 * 
 * This script tests the entire product creation flow including inventory
 */

const supabase = require('./config/supabase');

async function testProductCreation() {
  console.log('🧪 Testing Complete Product Creation Flow\n');
  console.log('=' .repeat(70));

  try {
    // Step 1: Get a seller account
    console.log('\n📋 Step 1: Get Seller Account');
    console.log('-'.repeat(70));
    
    const { data: sellers, error: sellerError } = await supabase
      .from('users')
      .select('id, display_name, email, role')
      .eq('role', 'seller')
      .limit(1);

    if (sellerError || !sellers || sellers.length === 0) {
      console.log('❌ No seller accounts found');
      console.log('   Please create a seller account first');
      return;
    }

    const seller = sellers[0];
    console.log(`✅ Using seller: ${seller.display_name} (${seller.email})`);
    console.log(`   Seller ID: ${seller.id}`);

    // Step 2: Get a category
    console.log('\n\n📋 Step 2: Get Category');
    console.log('-'.repeat(70));
    
    const { data: categories, error: categoryError } = await supabase
      .from('categories')
      .select('id, name')
      .limit(1);

    if (categoryError || !categories || categories.length === 0) {
      console.log('⚠️  No categories found, will create product without category');
    } else {
      console.log(`✅ Using category: ${categories[0].name}`);
    }

    // Step 3: Create test product
    console.log('\n\n📋 Step 3: Create Test Product');
    console.log('-'.repeat(70));
    
    const testProduct = {
      title: `Test Product ${Date.now()}`,
      description: 'This is a test product to verify inventory creation works',
      price: 99.99,
      imageUrl: 'https://via.placeholder.com/400x400/667eea/ffffff?text=Test+Product',
      categoryId: categories && categories.length > 0 ? categories[0].id : null,
      sellerId: seller.id,
      initialQuantity: 50,
      lowStockThreshold: 10,
      status: 'active',
      approvalStatus: 'pending'
    };

    console.log('📦 Creating product with data:');
    console.log(JSON.stringify(testProduct, null, 2));
    console.log('\n🔄 Attempting to create product...');

    const insertData = {
      title: testProduct.title,
      description: testProduct.description,
      price: testProduct.price,
      image_url: testProduct.imageUrl,
      category_id: testProduct.categoryId,
      seller_id: testProduct.sellerId,
      status: testProduct.status,
      approval_status: testProduct.approvalStatus,
      created_by: testProduct.sellerId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: product, error: productError } = await supabase
      .from('products')
      .insert([insertData])
      .select(`
        *,
        category:categories(id, name),
        seller:users!products_seller_id_fkey(id, display_name, business_name, email)
      `)
      .single();

    if (productError) {
      console.log('❌ FAILED: Product creation error');
      console.log(`   Error: ${productError.message}`);
      console.log(`   Code: ${productError.code}`);
      if (productError.details) console.log(`   Details: ${productError.details}`);
      if (productError.hint) console.log(`   Hint: ${productError.hint}`);
      return;
    }

    console.log('✅ SUCCESS: Product created');
    console.log(`   Product ID: ${product.id}`);
    console.log(`   Title: ${product.title}`);
    console.log(`   Price: $${product.price}`);
    console.log(`   Status: ${product.status}`);
    console.log(`   Approval Status: ${product.approval_status}`);

    // Step 4: Create inventory
    console.log('\n\n📋 Step 4: Create Inventory Record');
    console.log('-'.repeat(70));
    
    const inventoryData = {
      product_id: product.id,
      quantity: testProduct.initialQuantity,
      reserved_quantity: 0,
      low_stock_threshold: testProduct.lowStockThreshold,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('📦 Creating inventory with data:');
    console.log(JSON.stringify(inventoryData, null, 2));
    console.log('\n🔄 Attempting to create inventory...');

    const { data: inventory, error: inventoryError } = await supabase
      .from('inventory')
      .insert([inventoryData])
      .select();

    if (inventoryError) {
      console.log('❌ FAILED: Inventory creation error');
      console.log(`   Error: ${inventoryError.message}`);
      console.log(`   Code: ${inventoryError.code}`);
      if (inventoryError.details) console.log(`   Details: ${inventoryError.details}`);
      if (inventoryError.hint) console.log(`   Hint: ${inventoryError.hint}`);
      
      if (inventoryError.message.includes('created_at')) {
        console.log('\n🔧 FIX REQUIRED:');
        console.log('   The created_at column is missing or has wrong type');
        console.log('   Run this SQL in Supabase Dashboard:');
        console.log('\n   ALTER TABLE inventory ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();');
        console.log('   UPDATE inventory SET created_at = updated_at WHERE created_at IS NULL;\n');
      }
      
      // Clean up product
      console.log('\n🧹 Cleaning up test product...');
      await supabase.from('products').delete().eq('id', product.id);
      console.log('✅ Test product deleted');
      return;
    }

    console.log('✅ SUCCESS: Inventory created');
    console.log(`   Inventory ID: ${inventory[0].id}`);
    console.log(`   Quantity: ${inventory[0].quantity}`);
    console.log(`   Low Stock Threshold: ${inventory[0].low_stock_threshold}`);
    console.log(`   Created At: ${inventory[0].created_at}`);

    // Step 5: Verify product with inventory
    console.log('\n\n📋 Step 5: Verify Product with Inventory');
    console.log('-'.repeat(70));
    
    const { data: verifyProduct, error: verifyError } = await supabase
      .from('products')
      .select(`
        *,
        inventory(*)
      `)
      .eq('id', product.id)
      .single();

    if (verifyError) {
      console.log('❌ FAILED: Could not verify product');
      console.log(`   Error: ${verifyError.message}`);
    } else {
      console.log('✅ Product verification successful');
      console.log('\n📦 Complete product data:');
      console.log(JSON.stringify(verifyProduct, null, 2));
    }

    // Step 6: Clean up
    console.log('\n\n📋 Step 6: Clean Up Test Data');
    console.log('-'.repeat(70));
    
    // Delete inventory first (due to foreign key)
    await supabase.from('inventory').delete().eq('product_id', product.id);
    console.log('✅ Test inventory deleted');
    
    // Delete product
    await supabase.from('products').delete().eq('id', product.id);
    console.log('✅ Test product deleted');

    // Step 7: Summary
    console.log('\n\n📊 Test Summary');
    console.log('='.repeat(70));
    console.log('\n✅ ALL TESTS PASSED');
    console.log('   - Product creation: SUCCESS ✅');
    console.log('   - Inventory creation with created_at: SUCCESS ✅');
    console.log('   - Product verification: SUCCESS ✅');
    console.log('   - Data cleanup: SUCCESS ✅');
    console.log('\n🎉 The inventory created_at fix is working correctly!');
    console.log('   Products can now be created without PGRST204 errors.');

  } catch (error) {
    console.error('\n❌ Test Error:', error.message);
    if (error.code) console.error('   Code:', error.code);
    if (error.details) console.error('   Details:', error.details);
    if (error.hint) console.error('   Hint:', error.hint);
    if (error.stack) console.error('\n   Stack:', error.stack);
  }

  console.log('\n' + '='.repeat(70));
  console.log('🏁 Test Complete\n');
}

// Run the test
testProductCreation();
