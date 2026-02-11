/**
 * Fix guest orders by linking them to a user account
 */

const supabase = require('./config/supabase');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function fixGuestOrders() {
  console.log('\n🔧 Fix Guest Orders Tool\n');
  
  try {
    // Get guest orders
    const { data: guestOrders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .is('user_id', null)
      .order('created_at', { ascending: false });
    
    if (ordersError) {
      console.error('❌ Error:', ordersError.message);
      process.exit(1);
    }
    
    if (!guestOrders || guestOrders.length === 0) {
      console.log('✅ No guest orders found. All orders are linked to users!');
      process.exit(0);
    }
    
    console.log(`Found ${guestOrders.length} guest orders:\n`);
    guestOrders.forEach((order, index) => {
      console.log(`${index + 1}. Order ID: ${order.id.substring(0, 8)}...`);
      console.log(`   Amount: $${(order.amount / 100).toFixed(2)}`);
      console.log(`   Status: ${order.status}`);
      console.log(`   Created: ${new Date(order.created_at).toLocaleString()}`);
      console.log('');
    });
    
    // Get users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, display_name, role')
      .eq('role', 'customer')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (usersError) {
      console.error('❌ Error:', usersError.message);
      process.exit(1);
    }
    
    console.log('Available customer users:\n');
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (${user.display_name || 'No name'})`);
      console.log(`   ID: ${user.id}`);
      console.log('');
    });
    
    const answer = await question('\nDo you want to link all guest orders to a user? (yes/no): ');
    
    if (answer.toLowerCase() !== 'yes' && answer.toLowerCase() !== 'y') {
      console.log('Cancelled.');
      process.exit(0);
    }
    
    const userIndex = await question('\nEnter user number (1-' + users.length + '): ');
    const selectedUser = users[parseInt(userIndex) - 1];
    
    if (!selectedUser) {
      console.log('❌ Invalid user number');
      process.exit(1);
    }
    
    console.log(`\n✅ Selected user: ${selectedUser.email}`);
    console.log(`   Linking ${guestOrders.length} orders...\n`);
    
    // Update all guest orders
    const { data: updated, error: updateError } = await supabase
      .from('orders')
      .update({ user_id: selectedUser.id })
      .is('user_id', null)
      .select();
    
    if (updateError) {
      console.error('❌ Error updating orders:', updateError.message);
      process.exit(1);
    }
    
    console.log(`✅ Successfully linked ${updated.length} orders to ${selectedUser.email}`);
    console.log('\n🎉 Done! Now login as this user to see the orders.\n');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    rl.close();
    process.exit(0);
  }
}

fixGuestOrders();
