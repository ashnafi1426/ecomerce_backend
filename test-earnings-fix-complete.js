const supabase = require('./config/supabase.js');

/**
 * TEST SELLER EARNINGS FIX
 * 
 * This script tests if the seller earnings auto-tracking fix is working
 * by checking the most recent order and verifying earnings were created.
 */

async function testEarningsFix() {
  console.log('\n🧪 TESTING SELLER EARNINGS FIX\n');
  console.log('============================================================\n');

  try {
    // Get the most recent order
    const { data: recentOrder, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('status', 'paid')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (orderError || !recentOrder) {
      console.log('❌ No recent orders found');
      return;
    }

    console.log('📦 Most Recent Order:');
    console.log(`   ID: ${recentOrder.id}`);
    console.log(`   Amount: $${(recentOrder.amount / 100).toFixed(2)}`);
    console.log(`   Status: ${recentOrder.status}`);
    console.log(`   Created: ${recentOrder.created_at}`);
    console.log(`   Payment Intent: ${recentOrder.payment_intent_id}\n`);

    // Check if order has items with seller_id
    const basket = recentOrder.basket || [];
    console.log(`📋 Order Items (${basket.length}):`);
    
    let hasValidSellers = false;
    basket.forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.title}`);
      console.log(`      - Product ID: ${item.product_id}`);
      console.log(`      - Seller ID: ${item.seller_id || 'NULL'}`);
      console.log(`      - Price: $${item.price}`);
      console.log(`      - Quantity: ${item.quantity}`);
      console.log(`      - Total: $${item.total}`);
      
      if (item.seller_id && 
          item.seller_id !== 'placeholder-seller-id' && 
          item.seller_id !== 'default-seller') {
        hasValidSellers = true;
      }
    });

    if (!hasValidSellers) {
      console.log('\n⚠️  WARNING: Order has no valid seller IDs');
      console.log('   This order will not have earnings created');
      console.log('   (placeholder-seller-id and default-seller are skipped)\n');
      return;
    }

    console.log('\n');

    // Check for sub-orders
    const { data: subOrders, error: subOrderError } = await supabase
      .from('sub_orders')
      .select('*')
      .eq('parent_order_id', recentOrder.id);

    if (subOrderError) {
      console.log('❌ Error checking sub-orders:', subOrderError.message);
    } else if (!subOrders || subOrders.length === 0) {
      console.log('❌ NO SUB-ORDERS FOUND');
      console.log('   The splitOrderBySellers function did not execute\n');
    } else {
      console.log(`✅ Found ${subOrders.length} sub-order(s):`);
      subOrders.forEach((subOrder, index) => {
        console.log(`   ${index + 1}. Sub-Order ID: ${subOrder.id}`);
        console.log(`      - Seller: ${subOrder.seller_id}`);
        console.log(`      - Subtotal: $${(subOrder.subtotal / 100).toFixed(2)}`);
        console.log(`      - Commission: $${(subOrder.commission_amount / 100).toFixed(2)}`);
        console.log(`      - Seller Payout: $${(subOrder.seller_payout / 100).toFixed(2)}`);
      });
      console.log('');
    }

    // Check for earnings using order_id
    const { data: earnings, error: earningsError } = await supabase
      .from('seller_earnings')
      .select('*')
      .eq('order_id', recentOrder.id);

    if (earningsError) {
      console.log('❌ Error checking earnings:', earningsError.message);
    } else if (!earnings || earnings.length === 0) {
      console.log('❌ NO EARNINGS FOUND FOR THIS ORDER');
      console.log('\n🔍 DIAGNOSIS:');
      console.log('   The fix may not be working. Check:');
      console.log('   1. Backend server was restarted after applying fix');
      console.log('   2. Backend logs for errors during order creation');
      console.log('   3. Products have valid seller_id values\n');
    } else {
      console.log(`✅ Found ${earnings.length} earnings record(s):\n`);
      earnings.forEach((earning, index) => {
        console.log(`   ${index + 1}. Earning ID: ${earning.id}`);
        console.log(`      - Seller: ${earning.seller_id}`);
        console.log(`      - Sub-Order: ${earning.sub_order_id || 'NULL'}`);
        console.log(`      - Gross: $${(earning.gross_amount / 100).toFixed(2)}`);
        console.log(`      - Commission: $${(earning.commission_amount / 100).toFixed(2)} (${earning.commission_rate}%)`);
        console.log(`      - Net: $${(earning.net_amount / 100).toFixed(2)}`);
        console.log(`      - Status: ${earning.status}`);
        console.log(`      - Available: ${earning.available_date}`);
      });
      console.log('\n✅ FIX IS WORKING! Earnings were created automatically.\n');
    }

    console.log('============================================================\n');

    // Summary
    if (earnings && earnings.length > 0) {
      console.log('🎉 SUCCESS! The seller earnings auto-tracking fix is working!\n');
      console.log('Next steps:');
      console.log('1. Sellers can view earnings in their dashboard at /seller/payments');
      console.log('2. Earnings will become available after 7 days');
      console.log('3. Sellers can request payouts for available earnings\n');
    } else {
      console.log('⚠️  FIX VERIFICATION NEEDED\n');
      console.log('To test the fix:');
      console.log('1. Restart the backend server');
      console.log('2. Make a new purchase as a customer');
      console.log('3. Run this script again to verify earnings were created\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  }
}

testEarningsFix();
