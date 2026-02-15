/**
 * Check Customer Orders
 * Verify what orders exist for the customer and their IDs
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkCustomerOrders() {
  try {
    console.log('🔍 Checking customer orders...\n');

    // Get customer by email
    const customerEmail = 'ashenafisileshi7@gmail.com';
    const { data: customer, error: customerError } = await supabase
      .from('users')
      .select('id, email, display_name, role')
      .eq('email', customerEmail)
      .single();

    if (customerError) {
      console.error('❌ Error fetching customer:', customerError);
      return;
    }

    console.log('✅ Customer found:');
    console.log('   ID:', customer.id);
    console.log('   Email:', customer.email);
    console.log('   Name:', customer.display_name);
    console.log('   Role:', customer.role);
    console.log('');

    // Get all orders for this customer
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', customer.id)
      .order('created_at', { ascending: false });

    if (ordersError) {
      console.error('❌ Error fetching orders:', ordersError);
      return;
    }

    if (!orders || orders.length === 0) {
      console.log('⚠️  No orders found for this customer');
      return;
    }

    console.log(`✅ Found ${orders.length} order(s):\n`);

    orders.forEach((order, index) => {
      console.log(`Order ${index + 1}:`);
      console.log('   Full ID:', order.id);
      console.log('   Short ID:', order.id.substring(0, 8));
      console.log('   Status:', order.status);
      console.log('   Amount:', order.amount / 100, 'USD');
      console.log('   Created:', new Date(order.created_at).toLocaleString());
      console.log('   Items:', order.basket?.length || 0);
      console.log('');
    });

    // Check notifications for this customer
    console.log('📬 Checking notifications...\n');
    const { data: notifications, error: notifError } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', customer.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (notifError) {
      console.error('❌ Error fetching notifications:', notifError);
      return;
    }

    if (!notifications || notifications.length === 0) {
      console.log('⚠️  No notifications found');
      return;
    }

    console.log(`✅ Found ${notifications.length} notification(s):\n`);

    notifications.forEach((notif, index) => {
      console.log(`Notification ${index + 1}:`);
      console.log('   ID:', notif.id);
      console.log('   Title:', notif.title);
      console.log('   Type:', notif.type);
      console.log('   Read:', notif.is_read);
      console.log('   Metadata:', JSON.stringify(notif.metadata, null, 2));
      console.log('   Created:', new Date(notif.created_at).toLocaleString());
      console.log('');
    });

    // Check if notification order IDs match actual orders
    console.log('🔗 Matching notifications to orders...\n');
    
    notifications.forEach((notif) => {
      if (notif.metadata && notif.metadata.orderId) {
        const orderExists = orders.find(o => o.id === notif.metadata.orderId);
        if (orderExists) {
          console.log(`✅ Notification order ${notif.metadata.orderId.substring(0, 8)} EXISTS`);
        } else {
          console.log(`❌ Notification order ${notif.metadata.orderId.substring(0, 8)} NOT FOUND`);
        }
      }
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkCustomerOrders();
