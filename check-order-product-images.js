/**
 * Check Order Product Images
 * 
 * This script checks if products in orders have valid image URLs
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkOrderProductImages() {
  try {
    console.log('🔍 Checking order product images...\n');

    // Get a sample order
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .limit(5)
      .order('created_at', { ascending: false });

    if (ordersError) {
      console.error('❌ Error fetching orders:', ordersError);
      return;
    }

    if (!orders || orders.length === 0) {
      console.log('ℹ️ No orders found in database');
      return;
    }

    console.log(`✅ Found ${orders.length} orders\n`);

    for (const order of orders) {
      console.log(`\n📦 Order ID: ${order.id}`);
      console.log(`   Status: ${order.status}`);
      console.log(`   Created: ${order.created_at}`);

      // Get basket items
      let basketItems = [];
      if (Array.isArray(order.basket)) {
        basketItems = order.basket;
      } else if (order.basket && order.basket.items) {
        basketItems = order.basket.items;
      }

      console.log(`   Items in basket: ${basketItems.length}`);

      // Check each product
      for (let i = 0; i < basketItems.length; i++) {
        const item = basketItems[i];
        console.log(`\n   Item ${i + 1}:`);
        console.log(`     Product ID: ${item.product_id}`);
        console.log(`     Title: ${item.title}`);
        console.log(`     Image URL in basket: ${item.image_url || 'NULL'}`);

        // Fetch actual product from database
        const { data: product, error: productError } = await supabase
          .from('products')
          .select('id, title, image_url, status')
          .eq('id', item.product_id)
          .single();

        if (productError) {
          console.log(`     ❌ Error fetching product: ${productError.message}`);
        } else if (!product) {
          console.log(`     ⚠️ Product not found in database`);
        } else {
          console.log(`     Product in DB:`);
          console.log(`       Title: ${product.title}`);
          console.log(`       Image URL: ${product.image_url || 'NULL'}`);
          console.log(`       Status: ${product.status}`);
          
          if (!product.image_url) {
            console.log(`       ⚠️ ISSUE: Product has no image_url in database`);
          } else if (!product.image_url.startsWith('http')) {
            console.log(`       ⚠️ ISSUE: Image URL is not a valid HTTP URL`);
          } else {
            console.log(`       ✅ Product has valid image URL`);
          }
        }
      }
    }

    console.log('\n\n📊 Summary:');
    console.log('If you see "NULL" or invalid URLs above, that\'s why images are not showing.');
    console.log('The code is working correctly - the issue is missing data in the database.');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkOrderProductImages();
