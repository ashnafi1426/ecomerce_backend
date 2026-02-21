/**
 * Debug script to investigate test data issues
 */

const supabase = require('./config/supabase');

async function debugTestData() {
  console.log('Debugging test data...\n');
  
  // Find a delivered order
  const { data: orders, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('status', 'delivered')
    .limit(1);
  
  if (orderError) {
    console.error('Error fetching orders:', orderError);
    return;
  }
  
  if (!orders || orders.length === 0) {
    console.log('No delivered orders found');
    return;
  }
  
  const order = orders[0];
  console.log('Found delivered order:');
  console.log('ID:', order.id);
  console.log('User ID:', order.user_id);
  console.log('Seller ID:', order.seller_id);
  console.log('Status:', order.status);
  console.log('Basket:', JSON.stringify(order.basket, null, 2));
  console.log('Amount:', order.amount);
  console.log('Shipping cost:', order.shipping_cost);
  console.log('');
  
  // Check if products exist
  if (order.basket && Array.isArray(order.basket)) {
    for (const item of order.basket) {
      console.log(`Checking product: ${item.product_id}`);
      
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', item.product_id)
        .single();
      
      if (productError) {
        console.log(`  ✗ Product not found: ${productError.message}`);
      } else if (product) {
        console.log(`  ✓ Product found: ${product.title}`);
        console.log(`    Seller ID: ${product.seller_id}`);
        console.log(`    Price: ${product.price}`);
        console.log(`    Category ID: ${product.category_id}`);
      }
      console.log('');
    }
  }
  
  // Check refund_requests table
  console.log('Checking refund_requests table...');
  const { data: refunds, error: refundError } = await supabase
    .from('refund_requests')
    .select('*')
    .limit(5);
  
  if (refundError) {
    console.log(`✗ Error accessing refund_requests table: ${refundError.message}`);
  } else {
    console.log(`✓ refund_requests table exists`);
    console.log(`  Found ${refunds.length} refund requests`);
  }
}

debugTestData().catch(console.error);
