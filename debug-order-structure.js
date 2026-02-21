/**
 * DEBUG ORDER STRUCTURE
 * 
 * This script checks the exact structure of order data
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugOrderStructure() {
  console.log('🔍 Debugging Order Structure...\n');

  try {
    // Get one recent order
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('❌ Error fetching order:', error);
      return;
    }

    if (!orders || orders.length === 0) {
      console.log('❌ No orders found');
      return;
    }

    const order = orders[0];
    console.log('📦 Order ID:', order.id);
    console.log('\n📋 Raw Order Data:');
    console.log(JSON.stringify(order, null, 2));

    console.log('\n🛒 Basket Structure:');
    console.log('Type:', typeof order.basket);
    console.log('Is Array:', Array.isArray(order.basket));
    
    if (Array.isArray(order.basket)) {
      console.log('Basket Length:', order.basket.length);
      if (order.basket.length > 0) {
        console.log('\n📦 First Basket Item:');
        console.log(JSON.stringify(order.basket[0], null, 2));
        
        const item = order.basket[0];
        console.log('\n🔍 Item Properties:');
        console.log('- product_id:', item.product_id);
        console.log('- image_url:', item.image_url);
        console.log('- name:', item.name);
        console.log('- title:', item.title);
        
        // Now fetch the product to see what the service would return
        if (item.product_id) {
          const { data: product } = await supabase
            .from('products')
            .select('id, title, image_url, price')
            .eq('id', item.product_id)
            .single();
          
          console.log('\n🏷️  Product from Database:');
          console.log(JSON.stringify(product, null, 2));
        }
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

debugOrderStructure();
