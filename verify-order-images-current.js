/**
 * VERIFY ORDER PRODUCT IMAGES - CURRENT STATE
 * 
 * This script checks if order basket items have valid image URLs
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyOrderImages() {
  console.log('🔍 Checking order product images...\n');

  try {
    // Get all orders with basket data
    const { data: orders, error } = await supabase
      .from('orders')
      .select('id, basket, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('❌ Error fetching orders:', error);
      return;
    }

    console.log(`Found ${orders.length} recent orders\n`);

    let ordersWithImages = 0;
    let ordersWithoutImages = 0;
    let totalItems = 0;
    let itemsWithImages = 0;
    let itemsWithoutImages = 0;

    for (const order of orders) {
      const basket = order.basket || [];
      let orderHasAllImages = true;

      console.log(`\n📦 Order ${order.id.substring(0, 8)}... (${basket.length} items)`);

      for (const item of basket) {
        totalItems++;
        
        if (item.image_url && item.image_url !== null && item.image_url !== '') {
          itemsWithImages++;
          console.log(`  ✅ ${item.name}: ${item.image_url.substring(0, 50)}...`);
        } else {
          itemsWithoutImages++;
          orderHasAllImages = false;
          console.log(`  ❌ ${item.name}: NO IMAGE (image_url: ${item.image_url})`);
          console.log(`     Product ID: ${item.product_id}`);
        }
      }

      if (orderHasAllImages && basket.length > 0) {
        ordersWithImages++;
      } else if (basket.length > 0) {
        ordersWithoutImages++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY:');
    console.log('='.repeat(60));
    console.log(`Total orders checked: ${orders.length}`);
    console.log(`Orders with all images: ${ordersWithImages}`);
    console.log(`Orders with missing images: ${ordersWithoutImages}`);
    console.log(`\nTotal items: ${totalItems}`);
    console.log(`Items with images: ${itemsWithImages}`);
    console.log(`Items without images: ${itemsWithoutImages}`);
    console.log('='.repeat(60));

    if (itemsWithoutImages > 0) {
      console.log('\n⚠️  ISSUE FOUND: Some order items are missing image URLs!');
      console.log('This is why placeholder icons are showing on the Orders page.');
    } else {
      console.log('\n✅ All order items have valid image URLs!');
      console.log('The issue might be in the frontend code.');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

verifyOrderImages();
