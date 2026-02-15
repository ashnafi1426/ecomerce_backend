const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Check if recent orders have earnings created
 */

async function checkRecentOrderEarnings() {
  console.log('🔍 CHECKING RECENT ORDER EARNINGS\n');
  console.log('=' .repeat(60));

  try {
    // Get the most recent orders
    const { data: recentOrders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(3);

    if (ordersError) {
      console.error('❌ Error fetching orders:', ordersError.message);
      return;
    }

    console.log(`\nFound ${recentOrders?.length || 0} recent orders\n`);

    for (const order of recentOrders) {
      console.log('─'.repeat(60));
      console.log(`\n📦 Order: ${order.id}`);
      console.log(`   Amount: $${(order.amount / 100).toFixed(2)}`);
      console.log(`   Status: ${order.status}`);
      console.log(`   Created: ${order.created_at}`);
      console.log(`   Payment Intent: ${order.payment_intent_id}`);

      // Check for earnings for this order
      const { data: earnings, error: earningsError } = await supabase
        .from('seller_earnings')
        .select('*')
        .eq('order_id', order.id);

      if (earningsError) {
        console.error(`   ❌ Error fetching earnings:`, earningsError.message);
      } else if (!earnings || earnings.length === 0) {
        console.log(`   ⚠️  NO EARNINGS FOUND FOR THIS ORDER`);
        
        // Check the order basket to see what products were ordered
        if (order.basket && Array.isArray(order.basket)) {
          console.log(`\n   📋 Order Items (${order.basket.length}):`);
          order.basket.forEach((item, i) => {
            console.log(`      ${i + 1}. ${item.title || 'Unknown'}`);
            console.log(`         - Product ID: ${item.product_id}`);
            console.log(`         - Seller ID: ${item.seller_id || 'NULL ⚠️'}`);
            console.log(`         - Price: $${item.price}`);
            console.log(`         - Quantity: ${item.quantity}`);
            console.log(`         - Total: $${item.total}`);
          });

          // Check if any items have NULL seller_id
          const itemsWithoutSeller = order.basket.filter(item => !item.seller_id);
          if (itemsWithoutSeller.length > 0) {
            console.log(`\n   ❌ ISSUE: ${itemsWithoutSeller.length} items have NULL seller_id`);
            console.log(`   This prevents earnings from being created!`);
          }
        }
      } else {
        console.log(`   ✅ Found ${earnings.length} earnings record(s):`);
        earnings.forEach((earning, i) => {
          console.log(`\n      Earning ${i + 1}:`);
          console.log(`      - Seller ID: ${earning.seller_id}`);
          console.log(`      - Gross: $${(earning.gross_amount / 100).toFixed(2)}`);
          console.log(`      - Commission: $${(earning.commission_amount / 100).toFixed(2)} (${earning.commission_rate}%)`);
          console.log(`      - Net: $${(earning.net_amount / 100).toFixed(2)}`);
          console.log(`      - Status: ${earning.status}`);
          console.log(`      - Available: ${earning.available_date}`);
        });
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n💡 SUMMARY:');
    console.log('   - If orders show "NO EARNINGS FOUND", the splitOrderBySellers');
    console.log('     function may not be executing properly');
    console.log('   - If items have NULL seller_id, products need to be updated');
    console.log('   - Check backend logs for errors during order creation');
    console.log('\n' + '='.repeat(60));

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
  }
}

// Run check
checkRecentOrderEarnings()
  .then(() => {
    console.log('\n✅ Check complete');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
