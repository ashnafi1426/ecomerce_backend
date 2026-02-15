/**
 * ONE-TIME FIX: Create Missing Seller Earnings
 * 
 * This script finds all completed orders that don't have
 * seller_earnings records and creates them retroactively.
 */

const supabase = require('./config/supabase');

async function fixMissingEarnings() {
  try {
    console.log('🔧 Starting missing earnings fix...\n');

    // Get all orders
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .in('status', ['completed', 'delivered', 'processing', 'paid', 'confirmed', 'packed', 'shipped']);

    if (ordersError) {
      console.error('❌ Error fetching orders:', ordersError);
      return;
    }

    console.log(`📦 Found ${orders.length} orders to check\n`);

    let fixed = 0;
    let skipped = 0;
    let errors = 0;

    for (const order of orders) {
      // Check if earnings already exist for this order
      const { data: existingEarnings } = await supabase
        .from('seller_earnings')
        .select('id')
        .eq('order_id', order.id);

      if (existingEarnings && existingEarnings.length > 0) {
        skipped++;
        continue;
      }

      // Get order items from basket
      let basketItems = [];
      if (Array.isArray(order.basket)) {
        basketItems = order.basket;
      } else if (order.basket && order.basket.items) {
        basketItems = order.basket.items;
      }

      if (basketItems.length === 0) {
        console.log(`⚠️  Order ${order.id} has no items, skipping`);
        skipped++;
        continue;
      }

      // Group items by seller
      const sellerItems = {};
      for (const item of basketItems) {
        const sellerId = item.seller_id;
        if (!sellerId) continue;
        
        if (!sellerItems[sellerId]) {
          sellerItems[sellerId] = [];
        }
        sellerItems[sellerId].push(item);
      }

      if (Object.keys(sellerItems).length === 0) {
        console.log(`⚠️  Order ${order.id} has no items with seller_id, skipping`);
        skipped++;
        continue;
      }

      // Get commission settings
      const { data: commissionSettings } = await supabase
        .from('commission_settings')
        .select('*')
        .single();

      const defaultRate = commissionSettings?.default_rate || 10;

      // Create earnings for each seller
      for (const [sellerId, items] of Object.entries(sellerItems)) {
        let grossAmount = 0;
        for (const item of items) {
          grossAmount += item.price * item.quantity;
        }

        // Convert to cents
        const grossAmountCents = Math.round(grossAmount * 100);

        const commissionRate = defaultRate;
        const commissionAmountCents = Math.round(grossAmountCents * (commissionRate / 100));
        const netAmountCents = grossAmountCents - commissionAmountCents;

        // Set available_date to now (since order is already old)
        const availableDate = new Date().toISOString();

        const { error: earningError } = await supabase
          .from('seller_earnings')
          .insert({
            seller_id: sellerId,
            order_id: order.id,
            gross_amount: grossAmountCents,
            commission_amount: commissionAmountCents,
            commission_rate: commissionRate,
            net_amount: netAmountCents,
            status: 'available', // Make immediately available
            available_date: availableDate
          });

        if (earningError) {
          console.error(`❌ Error creating earning for order ${order.id}:`, earningError.message);
          errors++;
        } else {
          console.log(`✅ Created earning for seller ${sellerId}, order ${order.id} ($${(grossAmountCents / 100).toFixed(2)})`);
          fixed++;
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 FIX SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total orders checked: ${orders.length}`);
    console.log(`Earnings created: ${fixed}`);
    console.log(`Orders skipped (already had earnings): ${skipped}`);
    console.log(`Errors: ${errors}`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error in fixMissingEarnings:', error);
  }
}

// Run the fix
fixMissingEarnings()
  .then(() => {
    console.log('\n✅ Fix completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fix failed:', error);
    process.exit(1);
  });
