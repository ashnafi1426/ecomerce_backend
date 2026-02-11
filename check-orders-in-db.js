/**
 * Check if there are orders in the database
 */

const supabase = require('./config/supabase');

async function checkOrders() {
  console.log('\n🔍 Checking orders in database...\n');
  
  try {
    // Get all orders
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) {
      console.error('❌ Error querying orders:', error.message);
      return;
    }
    
    console.log(`📊 Total orders found: ${orders.length}\n`);
    
    if (orders.length === 0) {
      console.log('ℹ️  No orders in database yet.');
      console.log('   Create an order by:');
      console.log('   1. Adding items to cart');
      console.log('   2. Going to checkout');
      console.log('   3. Completing payment\n');
      return;
    }
    
    // Show order details
    orders.forEach((order, index) => {
      console.log(`Order ${index + 1}:`);
      console.log(`  ID: ${order.id}`);
      console.log(`  User ID: ${order.user_id}`);
      console.log(`  Status: ${order.status}`);
      console.log(`  Amount: $${(order.amount / 100).toFixed(2)}`);
      console.log(`  Items: ${order.basket ? order.basket.length : 0}`);
      console.log(`  Created: ${new Date(order.created_at).toLocaleString()}`);
      console.log('');
    });
    
    // Get user info for first order
    if (orders[0].user_id) {
      const { data: user } = await supabase
        .from('users')
        .select('email, display_name')
        .eq('id', orders[0].user_id)
        .single();
      
      if (user) {
        console.log(`💡 First order belongs to: ${user.email} (${user.display_name || 'No name'})`);
        console.log(`   Make sure you're logged in as this user to see the order\n`);
      }
    }
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
  
  process.exit(0);
}

checkOrders();
