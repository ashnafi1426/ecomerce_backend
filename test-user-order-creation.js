/**
 * Test User Order Creation
 * 
 * This script verifies that orders are created with proper user_id
 * for logged-in users vs guest_email for guest users.
 */

const supabase = require('./config/supabase');

async function testUserOrderCreation() {
  console.log('\n🧪 Testing User Order Creation\n');
  console.log('='.repeat(60));
  
  try {
    // Get all orders
    const { data: orders, error } = await supabase
      .from('orders')
      .select('id, user_id, guest_email, amount, status, created_at')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) {
      console.error('❌ Error fetching orders:', error.message);
      process.exit(1);
    }
    
    console.log(`\n📊 Recent Orders (Last 10):\n`);
    
    if (!orders || orders.length === 0) {
      console.log('⚠️  No orders found in database.\n');
      console.log('Create a test order by:');
      console.log('1. Login to the frontend');
      console.log('2. Add items to cart');
      console.log('3. Complete checkout with test card: 4242 4242 4242 4242\n');
      process.exit(0);
    }
    
    let registeredUserOrders = 0;
    let guestOrders = 0;
    let invalidOrders = 0;
    
    orders.forEach((order, index) => {
      const hasUserId = !!order.user_id;
      const hasGuestEmail = !!order.guest_email;
      
      let orderType = '';
      let status = '';
      
      if (hasUserId && !hasGuestEmail) {
        orderType = '👤 Registered User';
        status = '✅';
        registeredUserOrders++;
      } else if (!hasUserId && hasGuestEmail) {
        orderType = '👻 Guest User';
        status = '✅';
        guestOrders++;
      } else if (hasUserId && hasGuestEmail) {
        orderType = '⚠️  BOTH (Invalid)';
        status = '❌';
        invalidOrders++;
      } else {
        orderType = '⚠️  NEITHER (Invalid)';
        status = '❌';
        invalidOrders++;
      }
      
      console.log(`${index + 1}. ${status} ${orderType}`);
      console.log(`   Order ID: ${order.id.substring(0, 8)}...`);
      console.log(`   User ID: ${order.user_id ? order.user_id.substring(0, 8) + '...' : 'null'}`);
      console.log(`   Guest Email: ${order.guest_email || 'null'}`);
      console.log(`   Amount: $${(order.amount / 100).toFixed(2)}`);
      console.log(`   Status: ${order.status}`);
      console.log(`   Created: ${new Date(order.created_at).toLocaleString()}`);
      console.log('');
    });
    
    console.log('='.repeat(60));
    console.log('\n📈 Summary:\n');
    console.log(`   ✅ Registered User Orders: ${registeredUserOrders}`);
    console.log(`   ✅ Guest Orders: ${guestOrders}`);
    console.log(`   ❌ Invalid Orders: ${invalidOrders}`);
    console.log('');
    
    if (invalidOrders > 0) {
      console.log('⚠️  WARNING: Found invalid orders!');
      console.log('   Orders should have EITHER user_id OR guest_email, not both or neither.\n');
    } else {
      console.log('✅ All orders are valid!\n');
    }
    
    // Check if recent orders have user_id
    const recentOrders = orders.slice(0, 3);
    const recentWithUserId = recentOrders.filter(o => o.user_id).length;
    
    if (recentWithUserId === 0 && recentOrders.length > 0) {
      console.log('⚠️  ISSUE DETECTED:');
      console.log('   Recent orders do not have user_id set.');
      console.log('   This suggests logged-in users are creating guest orders.\n');
      console.log('💡 FIX APPLIED:');
      console.log('   - Added optionalAuthenticate middleware to payment routes');
      console.log('   - This will attach req.user for logged-in users');
      console.log('   - Orders will now have user_id for registered users\n');
      console.log('🧪 TEST:');
      console.log('   1. Restart backend server');
      console.log('   2. Login to frontend');
      console.log('   3. Create a new order');
      console.log('   4. Run this script again to verify user_id is set\n');
    } else if (recentWithUserId > 0) {
      console.log('✅ Recent orders have user_id set correctly!');
      console.log('   The fix is working as expected.\n');
    }
    
    console.log('='.repeat(60));
    console.log('');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
  
  process.exit(0);
}

testUserOrderCreation();
