/**
 * Fix guest orders by linking them to a user account
 * 
 * This script helps link guest orders (user_id = null) to registered user accounts.
 * It can automatically match by email or let you manually select a user.
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
  console.log('='.repeat(60));
  
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
      console.log('\n✅ No guest orders found. All orders are linked to users!\n');
      process.exit(0);
    }
    
    console.log(`\n📦 Found ${guestOrders.length} guest orders:\n`);
    
    // Group by email
    const ordersByEmail = {};
    guestOrders.forEach(order => {
      const email = order.guest_email || 'no-email';
      if (!ordersByEmail[email]) {
        ordersByEmail[email] = [];
      }
      ordersByEmail[email].push(order);
    });
    
    // Display grouped orders
    Object.entries(ordersByEmail).forEach(([email, orders]) => {
      const totalAmount = orders.reduce((sum, o) => sum + (o.amount / 100), 0);
      console.log(`📧 ${email}`);
      console.log(`   Orders: ${orders.length}`);
      console.log(`   Total: $${totalAmount.toFixed(2)}`);
      console.log(`   Latest: ${new Date(orders[0].created_at).toLocaleString()}`);
      console.log('');
    });
    
    // Get all customer users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, display_name, role, created_at')
      .eq('role', 'customer')
      .order('created_at', { ascending: false });
    
    if (usersError) {
      console.error('❌ Error:', usersError.message);
      process.exit(1);
    }
    
    if (!users || users.length === 0) {
      console.log('❌ No customer users found in database.');
      console.log('   Please create a customer account first.\n');
      process.exit(1);
    }
    
    console.log('\n👥 Available customer users:\n');
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}`);
      console.log(`   Name: ${user.display_name || 'Not set'}`);
      console.log(`   ID: ${user.id.substring(0, 8)}...`);
      console.log(`   Registered: ${new Date(user.created_at).toLocaleDateString()}`);
      console.log('');
    });
    
    // Try to auto-match by email
    console.log('🔍 Checking for automatic email matches...\n');
    const autoMatches = [];
    
    for (const [guestEmail, orders] of Object.entries(ordersByEmail)) {
      if (guestEmail !== 'no-email') {
        const matchingUser = users.find(u => u.email.toLowerCase() === guestEmail.toLowerCase());
        if (matchingUser) {
          autoMatches.push({
            email: guestEmail,
            user: matchingUser,
            orders: orders
          });
        }
      }
    }
    
    if (autoMatches.length > 0) {
      console.log(`✅ Found ${autoMatches.length} automatic email match(es):\n`);
      autoMatches.forEach(match => {
        console.log(`   ${match.email} → ${match.user.email} (${match.orders.length} orders)`);
      });
      console.log('');
      
      const autoLink = await question('Link these orders automatically? (yes/no): ');
      
      if (autoLink.toLowerCase() === 'yes' || autoLink.toLowerCase() === 'y') {
        for (const match of autoMatches) {
          const orderIds = match.orders.map(o => o.id);
          
          const { data: updated, error: updateError } = await supabase
            .from('orders')
            .update({ user_id: match.user.id })
            .in('id', orderIds)
            .select();
          
          if (updateError) {
            console.error(`❌ Error linking orders for ${match.email}:`, updateError.message);
          } else {
            console.log(`✅ Linked ${updated.length} orders to ${match.user.email}`);
          }
        }
        
        console.log('\n🎉 Auto-linking complete!\n');
        
        // Check if there are remaining guest orders
        const { data: remainingOrders } = await supabase
          .from('orders')
          .select('id')
          .is('user_id', null);
        
        if (!remainingOrders || remainingOrders.length === 0) {
          console.log('✅ All guest orders have been linked!\n');
          process.exit(0);
        } else {
          console.log(`⚠️  ${remainingOrders.length} guest orders remaining (no email match).\n`);
        }
      }
    } else {
      console.log('⚠️  No automatic email matches found.\n');
    }
    
    // Manual linking
    const manualLink = await question('Link remaining guest orders manually? (yes/no): ');
    
    if (manualLink.toLowerCase() !== 'yes' && manualLink.toLowerCase() !== 'y') {
      console.log('Cancelled.');
      process.exit(0);
    }
    
    const userIndex = await question(`\nEnter user number (1-${users.length}): `);
    const selectedUser = users[parseInt(userIndex) - 1];
    
    if (!selectedUser) {
      console.log('❌ Invalid user number');
      process.exit(1);
    }
    
    console.log(`\n✅ Selected user: ${selectedUser.email}`);
    
    // Get remaining guest orders
    const { data: remainingOrders } = await supabase
      .from('orders')
      .select('*')
      .is('user_id', null);
    
    if (!remainingOrders || remainingOrders.length === 0) {
      console.log('✅ No guest orders remaining to link.\n');
      process.exit(0);
    }
    
    console.log(`   Linking ${remainingOrders.length} orders...\n`);
    
    // Update all remaining guest orders
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
    console.log('='.repeat(60));
    console.log('');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    rl.close();
    process.exit(0);
  }
}

fixGuestOrders();
