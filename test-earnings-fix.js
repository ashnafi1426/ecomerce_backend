const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * TEST EARNINGS FIX
 * =================
 * This script tests if the earnings fix is working by checking recent orders
 */

async function testEarningsFix() {
  console.log('🧪 TESTING SELLER EARNINGS FIX\n');
  console.log('=' .repeat(60));

  try {
    // Get the most recent order
    const { data: recentOrders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);

    if (ordersError || !recentOrders || recentOrders.length === 0) {
      console.log('❌ No orders found or error:', ordersError?.message);
      return;
    }

    const order = recentOrders[0];
    console.log(`\n📦 Testing with Order: ${order.id}`);
    console.log(`   Amount: $${(order.amount / 100).toFixed(2)}`);
    console.log(`   Status: ${order.status}`);
    console.log(`   Created: ${order.created_at}`);

    // Check if this order has earnings
    const { data: earnings, error: earningsError } = await supabase
      .from('seller_earnings')
      .select('*')
      .eq('parent_order_id', order.id);

    if (earningsError) {
      console.error('\n❌ Error fetching earnings:', earningsError.message);
      return;
    }

    console.log(`\n📊 Earnings Status:`);
    if (!earnings || earnings.length === 0) {
      console.log('   ❌ NO EARNINGS FOUND');
      console.log('\n💡 This means the fix needs to be applied or tested with a new purchase');
    } else {
      console.log(`   ✅ Found ${earnings.length} earnings record(s)`);
      earnings.forEach((earning, i) => {
        console.log(`\n   Earning ${i + 1}:`);
        console.log(`   - ID: ${earning.id}`);
        console.log(`   - Seller: ${earning.seller_id}`);
        console.log(`   - Sub-Order: ${earning.sub_order_id || 'NULL ⚠️'}`);
        console.log(`   - Gross: $${(earning.gross_amount / 100).toFixed(2)}`);
        console.log(`   - Commission: $${(earning.commission_amount / 100).toFixed(2)} (${earning.commission_rate}%)`);
        console.log(`   - Net: $${(earning.net_amount / 100).toFixed(2)}`);
        console.log(`   - Status: ${earning.status}`);
        console.log(`   - Available: ${earning.available_date}`);
      });
    }

    // Check sub-orders
    const { data: subOrders, error: subOrdersError } = await supabase
      .from('sub_orders')
      .select('*')
      .eq('parent_order_id', order.id);

    console.log(`\n📦 Sub-Orders Status:`);
    if (subOrdersError) {
      console.error('   ❌ Error fetching sub-orders:', subOrdersError.message);
    } else if (!subOrders || subOrders.length === 0) {
      console.log('   ❌ NO SUB-ORDERS FOUND');
    } else {
      console.log(`   ✅ Found ${subOrders.length} sub-order(s)`);
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📋 TEST SUMMARY\n');

    if (earnings && earnings.length > 0 && subOrders && subOrders.length > 0) {
      console.log('✅ FIX IS WORKING!');
      console.log('   - Sub-orders are being created');
      console.log('   - Earnings are being created');
      console.log('   - System is functioning correctly');
    } else if (!earnings || earnings.length === 0) {
      console.log('⚠️  FIX NOT YET APPLIED OR NEEDS TESTING');
      console.log('   - Make a new purchase to test the fix');
      console.log('   - Or apply the fix from stripe-payment-fixed.controller.js');
    }

    console.log('\n' + '='.repeat(60));

  } catch (error) {
    console.error('\n❌ Test error:', error.message);
    console.error(error.stack);
  }
}

// Run test
testEarningsFix()
  .then(() => {
    console.log('\n✅ Test complete');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
