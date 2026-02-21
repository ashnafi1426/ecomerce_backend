/**
 * Fix Order Product Images
 * 
 * This script updates existing orders to include product image URLs in the basket
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixOrderProductImages() {
  try {
    console.log('🔧 Fixing order product images...\n');

    // Get all orders
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (ordersError) {
      console.error('❌ Error fetching orders:', ordersError);
      return;
    }

    if (!orders || orders.length === 0) {
      console.log('ℹ️ No orders found in database');
      return;
    }

    console.log(`✅ Found ${orders.length} orders to process\n`);

    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const order of orders) {
      console.log(`\n📦 Processing Order ID: ${order.id.substring(0, 8)}...`);

      // Get basket items
      let basketItems = [];
      if (Array.isArray(order.basket)) {
        basketItems = order.basket;
      } else if (order.basket && order.basket.items) {
        basketItems = order.basket.items;
      }

      if (basketItems.length === 0) {
        console.log('   ⏭️ Skipped: No items in basket');
        skippedCount++;
        continue;
      }

      let needsUpdate = false;
      const updatedBasket = [];

      // Check each product and update image_url if missing
      for (const item of basketItems) {
        const updatedItem = { ...item };

        // Check if image_url is missing or null
        if (!item.image_url) {
          // Fetch product from database
          const { data: product, error: productError } = await supabase
            .from('products')
            .select('image_url')
            .eq('id', item.product_id)
            .single();

          if (productError) {
            console.log(`   ⚠️ Error fetching product ${item.product_id}: ${productError.message}`);
            errorCount++;
          } else if (product && product.image_url) {
            updatedItem.image_url = product.image_url;
            needsUpdate = true;
            console.log(`   ✅ Updated image for: ${item.title}`);
          } else {
            console.log(`   ⚠️ No image found for: ${item.title}`);
          }
        }

        updatedBasket.push(updatedItem);
      }

      // Update order if needed
      if (needsUpdate) {
        const { error: updateError } = await supabase
          .from('orders')
          .update({ basket: updatedBasket })
          .eq('id', order.id);

        if (updateError) {
          console.log(`   ❌ Error updating order: ${updateError.message}`);
          errorCount++;
        } else {
          console.log(`   ✅ Order updated successfully`);
          updatedCount++;
        }
      } else {
        console.log('   ⏭️ Skipped: All images already present');
        skippedCount++;
      }
    }

    console.log('\n\n📊 Summary:');
    console.log(`   ✅ Updated: ${updatedCount} orders`);
    console.log(`   ⏭️ Skipped: ${skippedCount} orders`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log('\n✨ Done! Product images have been added to order baskets.');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

fixOrderProductImages();
