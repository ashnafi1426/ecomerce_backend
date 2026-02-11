/**
 * Diagnose User Orders - Find out which user is logged in and their orders
 * 
 * This script helps identify:
 * 1. Which user you're currently logged in as
 * 2. How many orders that user has
 * 3. All users with orders
 * 4. Guest orders that can be linked
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

async function diagnoseUserOrders() {
  console.log('\n🔍 FastShop Order Diagnosis Tool\n');
  console.log('='.repeat(60));
  
  try {
    // 1. Get all orders with user info
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, user_id, guest_email, amount, status, created_at')
      .order('created_at', { ascending: false });
    
    if (ordersError) {
      console.error('❌ Error fetching orders:', ordersError.message);
      process.exit(1);
    }
    
    console.log(`\n📊 Total Orders in Database: ${orders.length}\n`);
    
    // 2. Separate guest and user orders
    const guestOrders = orders.filter(o => !o.user_id);
    const userOrders = orders.filter(o => o.user_id);
    
    console.log(`   👤 User Orders: ${userOrders.length}`);
    console.log(`   👻 Guest Orders: ${guestOrders.length}\n`);
    
    // 3. Group orders by user
    const ordersByUser = {};
    userOrders.forEach(order => {
      if (!ordersByUser[order.user_id]) {
        ordersByUser[order.user_id] = [];
      }
      ordersByUser[order.user_id].push(order);
    });
    
    // 4. Get user details for users with orders
    const userIds = Object.keys(ordersByUser);
    
    if (userIds.length > 0) {
      console.log('👥 Users with Orders:\n');
      console.log('='.repeat(60));
      
      for (const userId of userIds) {
        const { data: user } = await supabase
          .from('users')
          .select('id, email, display_name, role')
          .eq('id', userId)
          .single();
        
        if (user) {
          const userOrdersList = ordersByUser[userId];
          const totalAmount = userOrdersList.reduce((sum, o) => sum + (o.amount / 100), 0);
          
          console.log(`\n📧 Email: ${user.email}`);
          console.log(`   Name: ${user.display_name || 'Not set'}`);
          console.log(`   Role: ${user.role}`);
          console.log(`   User ID: ${userId}`);
          console.log(`   Orders: ${userOrdersList.length}`);
          console.log(`   Total Spent: $${totalAmount.toFixed(2)}`);
          console.log(`   Latest Order: ${new Date(userOrdersList[0].created_at).toLocaleString()}`);
        }
      }
    } else {
      console.log('⚠️  No users have orders yet.\n');
    }
    
    // 5. Show guest orders
    if (guestOrders.length > 0) {
      console.log('\n\n👻 Guest Orders (Not Linked to Any User):\n');
      console.log('='.repeat(60));
      
      guestOrders.forEach((order, index) => {
        console.log(`\n${index + 1}. Order ID: ${order.id.substring(0, 8)}...`);
        console.log(`   Email: ${order.guest_email || 'Not provided'}`);
        console.log(`   Amount: $${(order.amount / 100).toFixed(2)}`);
        console.log(`   Status: ${order.status}`);
        console.log(`   Created: ${new Date(order.created_at).toLocaleString()}`);
      });
      
      console.log('\n\n💡 These guest orders can be linked to a user account.');
      console.log('   Run: node fix-guest-orders.js\n');
    }
    
    // 6. Get all customer users
    const { data: allCustomers } = await supabase
      .from('users')
      .select('id, email, display_name, role, created_at')
      .eq('role', 'customer')
      .order('created_at', { ascending: false });
    
    if (allCustomers && allCustomers.length > 0) {
      console.log('\n\n👥 All Customer Accounts:\n');
      console.log('='.repeat(60));
      
      allCustomers.forEach((customer, index) => {
        const orderCount = ordersByUser[customer.id]?.length || 0;
        console.log(`\n${index + 1}. ${customer.email}`);
        console.log(`   Name: ${customer.display_name || 'Not set'}`);
        console.log(`   User ID: ${customer.id}`);
        console.log(`   Orders: ${orderCount}`);
        console.log(`   Registered: ${new Date(customer.created_at).toLocaleDateString()}`);
      });
    }
    
    // 7. Provide recommendations
    console.log('\n\n📋 Recommendations:\n');
    console.log('='.repeat(60));
    
    if (guestOrders.length > 0) {
      console.log('\n1️⃣  Link Guest Orders to User Account:');
      console.log('   Run: node fix-guest-orders.js');
      console.log('   This will link all guest orders to a user account.\n');
    }
    
    if (userIds.length > 0) {
      console.log('2️⃣  Login as User with Orders:');
      console.log('   Login with one of the emails listed above to see orders.\n');
    }
    
    console.log('3️⃣  Create New Order:');
    console.log('   - Login to your account');
    console.log('   - Add items to cart');
    console.log('   - Complete checkout with test card: 4242 4242 4242 4242\n');
    
    console.log('='.repeat(60));
    console.log('\n✅ Diagnosis Complete!\n');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    rl.close();
    process.exit(0);
  }
}

diagnoseUserOrders();
