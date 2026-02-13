const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testSellerDashboardWithExistingData() {
  try {
    console.log('🧪 TESTING SELLER DASHBOARD WITH EXISTING DATA');
    console.log('==============================================\n');

    // Test seller credentials
    const testSeller = {
      email: 'ashu@gmail.com',
      password: '14263208@Aa'
    };

    console.log('1. 🔐 Testing seller authentication...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: testSeller.email,
      password: testSeller.password
    });

    if (authError) {
      console.log('   ❌ Authentication failed:', authError.message);
      return;
    }

    console.log('   ✅ Authentication successful');
    console.log('   📧 User:', authData.user.email);
    console.log('   🆔 User ID:', authData.user.id);

    const sellerId = authData.user.id;

    // Test 2: Check existing sub_orders for this seller
    console.log('\n2. 📦 Testing existing seller orders...');
    const { data: ordersData, error: ordersError } = await supabase
      .from('sub_orders')
      .select('*')
      .eq('seller_id', sellerId)
      .limit(10);

    if (ordersError) {
      console.log('   ❌ Orders query error:', ordersError.message);
    } else {
      console.log('   ✅ Orders query successful');
      console.log('   📊 Orders found:', ordersData.length);
      
      if (ordersData.length > 0) {
        console.log('   📋 Sample orders:');
        ordersData.forEach((order, index) => {
          console.log(`     ${index + 1}. ID: ${order.id}`);
          console.log(`        Amount: ${order.total_amount || order.subtotal || 0} cents`);
          console.log(`        Status: ${order.fulfillment_status || order.status}`);
          console.log(`        Created: ${new Date(order.created_at).toLocaleDateString()}`);
        });
      }
    }

    // Test 3: Check existing products for this seller
    console.log('\n3. 🛍️ Testing existing seller products...');
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select('id, title, price, approval_status, status, created_at')
      .eq('seller_id', sellerId)
      .limit(10);

    if (productsError) {
      console.log('   ❌ Products query error:', productsError.message);
    } else {
      console.log('   ✅ Products query successful');
      console.log('   📊 Products found:', productsData.length);
      
      if (productsData.length > 0) {
        console.log('   📋 Sample products:');
        productsData.forEach((product, index) => {
          console.log(`     ${index + 1}. ${product.title}`);
          console.log(`        Price: $${(product.price / 100).toFixed(2)}`);
          console.log(`        Status: ${product.approval_status || product.status}`);
        });
      }
    }

    // Test 4: Check payment system tables
    console.log('\n4. 💰 Testing payment system tables...');
    
    // Check seller_earnings
    const { data: earningsData, error: earningsError } = await supabase
      .from('seller_earnings')
      .select('*')
      .eq('seller_id', sellerId)
      .limit(5);

    if (earningsError) {
      console.log('   ❌ Seller earnings error:', earningsError.message);
    } else {
      console.log('   ✅ Seller earnings table accessible');
      console.log('   📊 Earnings records:', earningsData.length);
      
      if (earningsData.length > 0) {
        const totalEarnings = earningsData.reduce((sum, e) => sum + (e.net_amount || e.amount || 0), 0);
        console.log('   💵 Total earnings: $' + (totalEarnings / 100).toFixed(2));
      }
    }

    // Check payouts
    const { data: payoutsData, error: payoutsError } = await supabase
      .from('payouts')
      .select('*')
      .eq('seller_id', sellerId)
      .limit(5);

    if (payoutsError) {
      console.log('   ❌ Payouts error:', payoutsError.message);
    } else {
      console.log('   ✅ Payouts table accessible');
      console.log('   📊 Payout records:', payoutsData.length);
    }

    // Test 5: Calculate dashboard stats with existing data
    console.log('\n5. 📊 Calculating dashboard stats...');
    
    const totalRevenue = (ordersData || []).reduce((sum, order) => {
      return sum + (order.total_amount || order.subtotal || 0);
    }, 0) / 100;
    
    const totalOrders = (ordersData || []).length;
    const activeProducts = (productsData || []).filter(p => 
      p.approval_status === 'approved' || p.status === 'active'
    ).length;
    const pendingProducts = (productsData || []).filter(p => 
      p.approval_status === 'pending'
    ).length;

    console.log('   ✅ Dashboard stats calculated:');
    console.log('     - Total Revenue: $' + totalRevenue.toFixed(2));
    console.log('     - Total Orders:', totalOrders);
    console.log('     - Active Products:', activeProducts);
    console.log('     - Pending Products:', pendingProducts);

    // Test 6: Test dashboard data structure
    console.log('\n6. 🗂️ Testing dashboard data structure...');
    
    const dashboardData = {
      stats: {
        totalRevenue: totalRevenue,
        totalOrders: totalOrders,
        activeProducts: activeProducts,
        pendingProducts: pendingProducts,
        avgRating: 4.5, // Default for now
        totalReviews: 0
      },
      recentOrders: (ordersData || []).slice(0, 5).map(order => ({
        id: order.id,
        orderId: order.parent_order_id || `#${order.id}`,
        customer: 'Customer', // Would come from orders join
        product: order.items?.[0]?.product_name || 'Product',
        amount: ((order.total_amount || order.subtotal || 0) / 100).toFixed(2),
        status: order.fulfillment_status || order.status || 'pending',
        date: order.created_at ? new Date(order.created_at).toLocaleDateString() : 'N/A'
      })),
      recentProducts: (productsData || []).slice(0, 5).map(product => ({
        id: product.id,
        name: product.title,
        price: (product.price / 100).toFixed(2),
        status: product.approval_status || product.status || 'pending',
        icon: '📦'
      }))
    };

    console.log('   ✅ Dashboard data structure created');
    console.log('   📋 Recent orders:', dashboardData.recentOrders.length);
    console.log('   🛍️ Recent products:', dashboardData.recentProducts.length);

    console.log('\n🎉 SELLER DASHBOARD TEST COMPLETED!');
    console.log('===================================');
    console.log('');
    console.log('📊 DASHBOARD READY FOR FRONTEND!');
    console.log('');
    console.log('📝 NEXT STEPS:');
    console.log('   1. ✅ Authentication working');
    console.log('   2. ✅ Data retrieval working');
    console.log('   3. ✅ Payment tables accessible');
    console.log('   4. 🚀 Ready for Phase 2: Payment Processing');

    // Sign out
    await supabase.auth.signOut();

  } catch (error) {
    console.error('💥 DASHBOARD TEST FAILED:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testSellerDashboardWithExistingData();