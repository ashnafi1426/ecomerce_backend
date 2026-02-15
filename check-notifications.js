/**
 * Quick check for customer order notifications
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkNotifications() {
  console.log('🔍 Checking Customer Order Notifications\n');

  try {
    // Get recent orders
    const { data: orders } = await supabase
      .from('orders')
      .select('id, user_id, guest_email, amount, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    console.log(`📦 Recent Orders: ${orders?.length || 0}`);
    orders?.forEach(o => {
      console.log(`   - Order ${o.id.substring(0, 8)}: ${o.user_id ? 'User ' + o.user_id.substring(0, 8) : 'Guest ' + o.guest_email}`);
    });

    // Get order_placed notifications
    const { data: notifications } = await supabase
      .from('notifications')
      .select('*')
      .eq('type', 'order_placed')
      .order('created_at', { ascending: false })
      .limit(10);

    console.log(`\n🔔 Order Placed Notifications: ${notifications?.length || 0}`);
    
    if (notifications && notifications.length > 0) {
      notifications.forEach(n => {
        console.log(`   ✅ ${n.title} - User ${n.user_id.substring(0, 8)} - ${n.created_at}`);
      });
    } else {
      console.log('   ❌ NO order_placed notifications found!');
      console.log('\n💡 This means:');
      console.log('   1. Backend server was NOT restarted after code changes');
      console.log('   2. OR all orders were placed as guests');
      console.log('\n🔧 Solution: Restart backend server and place a new order as registered user');
    }

    // Check for registered user orders without notifications
    const ordersWithUser = orders?.filter(o => o.user_id) || [];
    if (ordersWithUser.length > 0 && (!notifications || notifications.length === 0)) {
      console.log('\n⚠️  PROBLEM: Orders exist with user_id but NO notifications!');
      console.log('   → Backend needs restart to load new notification code');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkNotifications();
