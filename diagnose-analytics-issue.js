const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function diagnoseAnalyticsIssue() {
  console.log('🔍 DIAGNOSING ADMIN ANALYTICS ISSUE\n');
  console.log('='.repeat(80));
  
  try {
    // 1. Check if orders table exists and has data
    console.log('\n1️⃣ Checking orders table...');
    const { data: allOrders, error: allOrdersError } = await supabase
      .from('orders')
      .select('*')
      .limit(5);
    
    if (allOrdersError) {
      console.log('❌ Error querying orders:', allOrdersError.message);
    } else {
      console.log(`✅ Orders table exists`);
      console.log(`📊 Total orders found: ${allOrders?.length || 0}`);
      if (allOrders && allOrders.length > 0) {
        console.log('\n� Sample order:');
        console.log(JSON.stringify(allOrders[0], null, 2));
      }
    }
    
    // 2. Check column names in orders table
    console.log('\n2️⃣ Checking orders table columns...');
    if (allOrders && allOrders.length > 0) {
      const columns = Object.keys(allOrders[0]);
      console.log('📝 Available columns:', columns.join(', '));
      
      // Check for amount vs total_amount
      if (columns.includes('amount')) {
        console.log('✅ "amount" column exists');
      } else {
        console.log('❌ "amount" column NOT found');
      }
      
      if (columns.includes('total_amount')) {
        console.log('⚠️ "total_amount" column exists (should use "amount" instead)');
      }
      
      if (columns.includes('payment_status')) {
        console.log('✅ "payment_status" column exists');
      } else {
        console.log('❌ "payment_status" column NOT found');
      }
    }
    
    // 3. Check orders with payment_status = 'paid'
    console.log('\n3️⃣ Checking paid orders...');
    const { data: paidOrders, error: paidError } = await supabase
      .from('orders')
      .select('id, amount, payment_status, status, created_at')
      .eq('payment_status', 'paid');
    
    if (paidError) {
      console.log('❌ Error querying paid orders:', paidError.message);
    } else {
      console.log(`✅ Found ${paidOrders?.length || 0} paid orders`);
      if (paidOrders && paidOrders.length > 0) {
        const totalRevenue = paidOrders.reduce((sum, order) => sum + (order.amount || 0), 0);
        console.log(`💰 Total revenue from paid orders: $${totalRevenue.toLocaleString()}`);
        console.log('\n📋 Sample paid orders:');
        paidOrders.slice(0, 3).forEach((order, i) => {
          console.log(`  ${i + 1}. ID: ${order.id}, Amount: $${order.amount}, Status: ${order.status}, Payment: ${order.payment_status}`);
        });
      }
    }
    
    // 4. Check all payment_status values
    console.log('\n4️⃣ Checking all payment_status values...');
    const { data: allStatuses, error: statusError } = await supabase
      .from('orders')
      .select('payment_status, status');
    
    if (!statusError && allStatuses) {
      const paymentStatusCounts = {};
      const orderStatusCounts = {};
      
      allStatuses.forEach(order => {
        const ps = order.payment_status || 'null';
        const os = order.status || 'null';
        paymentStatusCounts[ps] = (paymentStatusCounts[ps] || 0) + 1;
        orderStatusCounts[os] = (orderStatusCounts[os] || 0) + 1;
      });
      
      console.log('📊 Payment Status Distribution:');
      Object.entries(paymentStatusCounts).forEach(([status, count]) => {
        console.log(`   ${status}: ${count} orders`);
      });
      
      console.log('\n📊 Order Status Distribution:');
      Object.entries(orderStatusCounts).forEach(([status, count]) => {
        console.log(`   ${status}: ${count} orders`);
      });
    }
    
    // 5. Test the exact query from getDashboardData
    console.log('\n5️⃣ Testing getDashboardData query...');
    const { data: dashboardOrders, error: dashboardError } = await supabase
      .from('orders')
      .select('id, amount, status, created_at, payment_status')
      .eq('payment_status', 'paid');
    
    if (dashboardError) {
      console.log('❌ getDashboardData query failed:', dashboardError.message);
    } else {
      console.log(`✅ getDashboardData query successful`);
      console.log(`📊 Orders returned: ${dashboardOrders?.length || 0}`);
      if (dashboardOrders && dashboardOrders.length > 0) {
        const revenue = dashboardOrders.reduce((sum, order) => sum + (order.amount || 0), 0);
        console.log(`💰 Calculated revenue: $${revenue.toLocaleString()}`);
      }
    }
    
    // 6. Check users table
    console.log('\n6️⃣ Checking users table...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, role, created_at')
      .limit(5);
    
    if (usersError) {
      console.log('❌ Error querying users:', usersError.message);
    } else {
      console.log(`✅ Users table exists`);
      console.log(`👥 Total users found: ${users?.length || 0}`);
    }
    
    // 7. Check products table
    console.log('\n7️⃣ Checking products table...');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, price, approval_status')
      .eq('approval_status', 'approved')
      .limit(5);
    
    if (productsError) {
      console.log('❌ Error querying products:', productsError.message);
    } else {
      console.log(`✅ Products table exists`);
      console.log(`� Approved products found: ${products?.length || 0}`);
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('🎯 DIAGNOSIS COMPLETE\n');
    
    // Summary
    console.log('📋 SUMMARY:');
    if (paidOrders && paidOrders.length > 0) {
      console.log('✅ Database has paid orders');
      console.log('✅ Analytics should work correctly');
      console.log('\n💡 If frontend still shows $0, the issue is likely:');
      console.log('   1. Backend server not restarted after code changes');
      console.log('   2. Frontend not accessing response.data correctly');
      console.log('   3. Authentication/authorization issue');
    } else {
      console.log('⚠️ No paid orders found in database');
      console.log('\n💡 Possible reasons:');
      console.log('   1. No orders have payment_status = "paid"');
      console.log('   2. Orders exist but with different payment_status values');
      console.log('   3. Need to update existing orders to set payment_status');
    }
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

diagnoseAnalyticsIssue();
