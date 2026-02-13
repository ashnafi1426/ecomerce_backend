const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testSellerDashboardDirect() {
  try {
    console.log('🧪 TESTING SELLER DASHBOARD DIRECT (NO AUTH)');
    console.log('==============================================\n');

    // Use the known seller ID for ashu@gmail.com
    const sellerId = '08659266-babb-4323-b750-b1977c825e24';
    console.log('🆔 Testing with seller ID:', sellerId);
    console.log('📧 Seller email: ashu@gmail.com\n');

    // Test 1: Check seller orders (sub_orders)
    console.log('1. 📦 Testing seller orders data...');
    const { data: ordersData, error: ordersError } = await supabase
      .from('sub_orders')
      .select(`
        id,
        parent_order_id,
        seller_id,
        items,
        subtotal,
        total_amount,
        commission_amount,
        commission_rate,
        seller_payout_amount,
        fulfillment_status,
        tracking_number,
        carrier,
        shipped_at,
        delivered_at,
        payout_status,
        payout_released_at,
        created_at,
        updated_at,
        status,
        orders!inner(
          id,
          user_id,
          shipping_address,
          created_at
        )
      `)
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (ordersError) {
      console.log('   ❌ Orders query error:', ordersError.message);
    } else {
      console.log('   ✅ Orders query successful');
      console.log('   📊 Orders found:', ordersData.length);
      
      if (ordersData.length > 0) {
        console.log('   📋 Sample orders:');
        ordersData.slice(0, 3).forEach((order, index) => {
          console.log(`     ${index + 1}. Order ID: ${order.id}`);
          console.log(`        - Total Amount: $${(order.total_amount / 100).toFixed(2)}`);
          console.log(`        - Status: ${order.fulfillment_status}`);
          console.log(`        - Created: ${new Date(order.created_at).toLocaleDateString()}`);
          console.log(`        - Items: ${JSON.stringify(order.items).substring(0, 80)}...`);
        });
      } else {
        console.log('   ⚠️ No orders found for this seller');
      }
    }

    // Test 2: Check seller products
    console.log('\n2. 🛍️ Testing seller products data...');
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select(`
        id,
        title,
        name,
        sku,
        price,
        approval_status,
        status,
        average_rating,
        total_reviews,
        created_at,
        inventory(quantity)
      `)
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (productsError) {
      console.log('   ❌ Products query error:', productsError.message);
    } else {
      console.log('   ✅ Products query successful');
      console.log('   📊 Products found:', productsData.length);
      
      if (productsData.length > 0) {
        console.log('   📋 Sample products:');
        productsData.slice(0, 3).forEach((product, index) => {
          console.log(`     ${index + 1}. Product: ${product.title || product.name}`);
          console.log(`        - Price: $${product.price}`);
          console.log(`        - Status: ${product.approval_status || product.status}`);
          console.log(`        - Inventory: ${product.inventory?.quantity || 'N/A'}`);
        });
      } else {
        console.log('   ⚠️ No products found for this seller');
      }
    }

    // Test 3: Calculate dashboard stats
    console.log('\n3. 📊 Testing dashboard stats calculation...');
    
    const totalRevenue = ordersData.reduce((sum, order) => sum + (order.total_amount || 0), 0) / 100;
    const totalOrders = ordersData.length;
    const activeProducts = productsData.filter(p => p.approval_status === 'approved' || p.status === 'active').length;
    const pendingProducts = productsData.filter(p => p.approval_status === 'pending').length;
    const avgRating = productsData.reduce((sum, p) => sum + (p.average_rating || 0), 0) / productsData.length || 0;
    const totalReviews = productsData.reduce((sum, p) => sum + (p.total_reviews || 0), 0);

    console.log('   ✅ Dashboard stats calculated:');
    console.log('     - Total Revenue: $' + totalRevenue.toFixed(2));
    console.log('     - Total Orders:', totalOrders);
    console.log('     - Active Products:', activeProducts);
    console.log('     - Pending Products:', pendingProducts);
    console.log('     - Average Rating:', avgRating.toFixed(1));
    console.log('     - Total Reviews:', totalReviews);

    // Test 4: Test order mapping for dashboard display
    console.log('\n4. 🗂️ Testing order mapping for dashboard...');
    
    const mappedOrders = ordersData.map(order => ({
      id: order.id,
      orderId: order.parent_order_id || `#${order.id}`,
      customer: order.orders?.shipping_address?.name || 'Customer',
      product: order.items?.[0]?.product_name || order.items?.[0]?.name || 'Product',
      amount: order.total_amount ? (order.total_amount / 100).toFixed(2) : '0.00',
      status: order.fulfillment_status || 'pending',
      date: order.created_at ? new Date(order.created_at).toLocaleDateString() : 'N/A',
      createdAt: order.created_at
    }));

    console.log('   ✅ Orders mapped for dashboard display:');
    if (mappedOrders.length > 0) {
      mappedOrders.slice(0, 5).forEach((order, index) => {
        console.log(`     ${index + 1}. ${order.orderId} - $${order.amount} - ${order.status} - ${order.date}`);
      });
    } else {
      console.log('     No orders to display');
    }

    // Test 5: Test product mapping for dashboard display
    console.log('\n5. 🛍️ Testing product mapping for dashboard...');
    
    const mappedProducts = productsData.map(product => ({
      id: product.id,
      name: product.title || product.name,
      sku: product.sku || 'N/A',
      price: product.price || 0,
      stock: product.inventory?.quantity || 0,
      status: product.approval_status || product.status || 'pending',
      icon: '📦'
    }));

    console.log('   ✅ Products mapped for dashboard display:');
    if (mappedProducts.length > 0) {
      mappedProducts.slice(0, 5).forEach((product, index) => {
        console.log(`     ${index + 1}. ${product.name} - $${product.price} - ${product.status} - Stock: ${product.stock}`);
      });
    } else {
      console.log('     No products to display');
    }

    // Test 6: Check if we need to create test data
    if (ordersData.length === 0 && productsData.length === 0) {
      console.log('\n⚠️ NO DATA FOUND - CREATING TEST DATA...');
      
      // Create a test product for this seller
      const testProduct = {
        seller_id: sellerId,
        title: 'Test Product for Dashboard',
        description: 'A test product to verify dashboard functionality',
        price: 2999, // $29.99
        sku: 'TEST-DASH-001',
        approval_status: 'approved',
        status: 'active',
        category_id: 1,
        images: ['https://via.placeholder.com/300x300?text=Test+Product']
      };

      const { data: newProduct, error: productError } = await supabase
        .from('products')
        .insert(testProduct)
        .select()
        .single();

      if (productError) {
        console.log('   ❌ Failed to create test product:', productError.message);
      } else {
        console.log('   ✅ Test product created:', newProduct.title);
      }

      // Create test order data
      const testOrder = {
        user_id: sellerId, // Using seller as customer for test
        amount: 2999,
        status: 'paid',
        basket: [{ product_id: newProduct?.id, quantity: 1, price: 2999 }],
        shipping_address: { name: 'Test Customer', address: '123 Test St' }
      };

      const { data: newOrder, error: orderError } = await supabase
        .from('orders')
        .insert(testOrder)
        .select()
        .single();

      if (!orderError && newOrder) {
        // Create sub-order
        const testSubOrder = {
          parent_order_id: newOrder.id,
          seller_id: sellerId,
          items: [{ product_id: newProduct?.id, product_name: 'Test Product for Dashboard', quantity: 1, price: 2999 }],
          subtotal: 2999,
          total_amount: 2999,
          commission_rate: 15.00,
          commission_amount: 450, // 15% of 2999
          seller_payout_amount: 2549, // 2999 - 450
          fulfillment_status: 'pending',
          payout_status: 'pending'
        };

        const { data: newSubOrder, error: subOrderError } = await supabase
          .from('sub_orders')
          .insert(testSubOrder)
          .select()
          .single();

        if (subOrderError) {
          console.log('   ❌ Failed to create test sub-order:', subOrderError.message);
        } else {
          console.log('   ✅ Test sub-order created for dashboard testing');
        }
      }
    }

    console.log('\n🎉 SELLER DASHBOARD DIRECT TEST COMPLETED!');
    console.log('==========================================');
    console.log('');
    console.log('📊 TEST RESULTS SUMMARY:');
    console.log('   ✅ Seller data retrieval working');
    console.log('   ✅ Orders data query working');
    console.log('   ✅ Products data query working');
    console.log('   ✅ Dashboard stats calculation working');
    console.log('   ✅ Data mapping for display working');
    console.log('');
    console.log('🚀 SELLER DASHBOARD DATA LAYER IS READY!');
    console.log('');
    console.log('📝 NEXT STEPS:');
    console.log('   1. Fix authentication issue (password/auth method)');
    console.log('   2. Test frontend dashboard with this data');
    console.log('   3. Verify dashboard displays correctly');

  } catch (error) {
    console.error('💥 DASHBOARD TEST FAILED:', error.message);
    console.error('');
    console.error('🔧 TROUBLESHOOTING:');
    console.error('   1. Check database connection');
    console.error('   2. Verify seller ID exists');
    console.error('   3. Ensure table permissions');
    process.exit(1);
  }
}

// Run the test
testSellerDashboardDirect();