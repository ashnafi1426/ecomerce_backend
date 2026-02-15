const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function checkNotificationURLs() {
  try {
    console.log('🔍 Checking notification URLs in database...\n');
    
    // Get customer ID
    const { data: user } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', 'ashenafisileshi7@gmail.com')
      .single();

    console.log('Customer:', user.email);
    console.log('Customer ID:', user.id);

    // Get all notifications for this customer
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching notifications:', error);
      return;
    }

    console.log(`\n📬 Found ${notifications.length} notifications\n`);

    // Check each notification's order ID
    for (const notif of notifications) {
      if (notif.action_url && notif.action_url.includes('/orders/')) {
        const orderIdFromUrl = notif.action_url.split('/orders/')[1];
        
        console.log(`\n📋 Notification: ${notif.type}`);
        console.log(`   Message: ${notif.message}`);
        console.log(`   URL: ${notif.action_url}`);
        console.log(`   Order ID from URL: ${orderIdFromUrl}`);
        
        // Check if this order exists
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .select('id, status, user_id')
          .eq('id', orderIdFromUrl)
          .single();

        if (orderError || !order) {
          console.log(`   ❌ ORDER NOT FOUND!`);
          
          // Try to find similar order IDs
          const { data: similarOrders } = await supabase
            .from('orders')
            .select('id, status')
            .eq('user_id', user.id)
            .limit(5);
          
          console.log(`   \n   Looking for similar orders:`);
          similarOrders?.forEach(o => {
            console.log(`   - ${o.id} (${o.status})`);
          });
        } else {
          console.log(`   ✅ Order exists: ${order.status}`);
        }
      }
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkNotificationURLs();
