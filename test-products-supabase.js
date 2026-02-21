const supabase = require('./config/supabase');

async function testProducts() {
  console.log('🔍 Testing Products in Supabase...\n');

  try {
    // Test 1: Check total products
    console.log('📦 Test 1: Checking all products...');
    const { data: allProducts, error: allError, count: totalCount } = await supabase
      .from('products')
      .select('*', { count: 'exact' });
    
    if (allError) {
      console.error('❌ Error fetching products:', allError.message);
      return;
    }

    console.log(`Total products in database: ${totalCount}`);

    // Test 2: Check approved products
    console.log('\n✅ Test 2: Checking approved products...');
    const { count: approvedCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('approval_status', 'approved');
    
    console.log(`Approved products: ${approvedCount}`);

    // Test 3: Check active products
    console.log('\n🟢 Test 3: Checking active products...');
    const { count: activeCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');
    
    console.log(`Active products: ${activeCount}`);

    // Test 4: Check approved AND active products (what homepage shows)
    console.log('\n🎯 Test 4: Checking approved AND active products...');
    const { data: displayableProducts, count: displayableCount } = await supabase
      .from('products')
      .select('*', { count: 'exact' })
      .eq('approval_status', 'approved')
      .eq('status', 'active');
    
    console.log(`Approved AND Active products: ${displayableCount}`);

    // Test 5: Get sample products with details
    console.log('\n📋 Test 5: Sample products (first 5)...');
    const { data: sampleProducts } = await supabase
      .from('products')
      .select('id, title, price, approval_status, status, image_url, category_id')
      .limit(5);
    
    if (sampleProducts && sampleProducts.length > 0) {
      console.log('\nSample products:');
      sampleProducts.forEach((product, index) => {
        console.log(`\n${index + 1}. ${product.title}`);
        console.log(`   ID: ${product.id}`);
        console.log(`   Price: $${product.price}`);
        console.log(`   Approval Status: ${product.approval_status}`);
        console.log(`   Status: ${product.status}`);
        console.log(`   Has Image: ${product.image_url ? 'Yes' : 'No'}`);
        console.log(`   Category ID: ${product.category_id}`);
      });
    }

    // Test 6: Status breakdown
    console.log('\n📊 Test 6: Status breakdown...');
    if (allProducts && allProducts.length > 0) {
      const statusBreakdown = {};
      allProducts.forEach(product => {
        const key = `${product.approval_status} + ${product.status}`;
        statusBreakdown[key] = (statusBreakdown[key] || 0) + 1;
      });
      
      console.log('\nStatus combinations:');
      Object.entries(statusBreakdown).forEach(([key, count]) => {
        console.log(`  ${key}: ${count} products`);
      });
    }

    // Test 7: Check categories
    console.log('\n📂 Test 7: Checking categories...');
    const { data: categories, count: categoryCount } = await supabase
      .from('categories')
      .select('id, name', { count: 'exact' });
    
    console.log(`Total categories: ${categoryCount}`);
    
    if (categories && categories.length > 0) {
      console.log('\nCategories with product counts:');
      for (const category of categories) {
        const { count: productCount } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('category_id', category.id)
          .eq('approval_status', 'approved')
          .eq('status', 'active');
        
        console.log(`  ${category.name}: ${productCount} products`);
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📋 SUMMARY');
    console.log('='.repeat(60));
    
    if (displayableCount === 0) {
      console.log('❌ ISSUE FOUND: No products are both approved AND active!');
      console.log('');
      console.log('🔧 POSSIBLE FIXES:');
      console.log('');
      console.log('Option 1: Update existing products to be approved and active');
      console.log('  Go to Supabase Dashboard → SQL Editor → Run:');
      console.log('  UPDATE products SET approval_status = \'approved\', status = \'active\';');
      console.log('');
      console.log('Option 2: Check if products need manager/admin approval');
      console.log('  - Login as admin/manager');
      console.log('  - Go to product approvals page');
      console.log('  - Approve pending products');
      console.log('');
      console.log('Option 3: Create a quick fix script');
      console.log('  I can create a script to approve all products automatically');
    } else {
      console.log(`✅ ${displayableCount} products should display on homepage`);
      console.log('');
      console.log('If products still don\'t show:');
      console.log('1. Check frontend API URL in .env (REACT_APP_API_URL)');
      console.log('2. Check backend is running on correct port');
      console.log('3. Check browser console for errors');
      console.log('4. Clear browser cache and reload');
      console.log('5. Check CORS settings in backend');
    }

    console.log('\n✅ Test completed successfully');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\n🔧 TROUBLESHOOTING:');
    console.error('1. Check SUPABASE_URL in .env file');
    console.error('2. Check SUPABASE_SERVICE_ROLE_KEY in .env file');
    console.error('3. Ensure Supabase project is active');
    console.error('4. Check database tables exist');
  }
}

testProducts();
