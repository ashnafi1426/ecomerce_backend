/**
 * Check seller notifications for the recent order
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSellerNotifications() {
  console.log('🔍 Checking Seller Notifications\n');

  try {
    // Get the most recent order
    const { data: recentOrder } = await supabase
      .from('orders')
      .select('id, created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    console.log(`📦 Most Recent Order: ${recentOrder.id.substring(0, 8)}`);
    console.log(`   Created: ${recentOrder.created_at}\n`);

    // Get sub-orders for this order
    const { data: subOrders } = await supabase
      .from('sub_orders')
      .select('id, seller_id, items')
      .eq('parent_order_id', recentOrder.id);

    console.log(`📋 Sub-Orders: ${subOrders?.length || 0}`);
    if (subOrders && subOrders.length > 0) {
      subOrders.forEach(so => {
        console.log(`   - Sub-order ${so.id.substring(0, 8)} for seller ${so.seller_id.substring(0, 8)}`);
      });
    }

    // Get new_order notifications
    const { data: sellerNotifications } = await supabase
      .from('notifications')
      .select('*')
      .eq('type', 'new_order')
      .order('created_at', { ascending: false })
      .limit(10);

    console.log(`\n🔔 Seller "new_order" Notifications: ${sellerNotifications?.length || 0}`);
    
    if (sellerNotifications && sellerNotifications.length > 0) {
      sellerNotifications.forEach(n => {
        console.log(`   ✅ ${n.title}`);
        console.log(`      Seller: ${n.user_id.substring(0, 8)}`);
        console.log(`      Message: ${n.message}`);
        console.log(`      Created: ${n.created_at}\n`);
      });
    } else {
      console.log('   ❌ NO seller notifications found!');
    }

    // Get order_placed notifications (customer)
    const { data: customerNotifications } = await supabase
      .from('notifications')
      .select('*')
      .eq('type', 'order_placed')
      .order('created_at', { ascending: false })
      .limit(5);

    console.log(`🔔 Customer "order_placed" Notifications: ${customerNotifications?.length || 0}`);
    if (customerNotifications && customerNotifications.length > 0) {
      customerNotifications.forEach(n => {
        console.log(`   ✅ ${n.title} - User ${n.user_id.substring(0, 8)}`);
      });
    }

    console.log('\n' + '='.repeat(70));
    console.log('📊 SUMMARY');
    console.log('='.repeat(70));
    console.log(`Customer notifications: ${customerNotifications?.length || 0} ✅`);
    console.log(`Seller notifications: ${sellerNotifications?.length || 0} ${sellerNotifications?.length > 0 ? '✅' : '❌'}`);
    console.log(`Sub-orders created: ${subOrders?.length || 0}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkSellerNotifications();
