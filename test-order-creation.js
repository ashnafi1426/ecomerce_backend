/**
 * Test Order Creation Flow
 * Run with: node test-order-creation.js
 */

import supabase from './config/supabase.js';

async function testOrderCreation() {
  console.log('🧪 Testing Order Creation Flow...\n');

  try {
    // 1. Test: Fetch a test user (any role)
    console.log('1️⃣ Fetching test user...');
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, email, role')
      .limit(1);

    if (userError || !users || users.length === 0) {
      console.error('❌ No test user found:', userError);
      return;
    }

    const testUser = users[0];
    console.log(`✅ Found user: ${testUser.email} (${testUser.id}) - Role: ${testUser.role}\n`);

    // 2. Test: Fetch a test product
    console.log('2️⃣ Fetching test product...');
    const { data: products, error: productError } = await supabase
      .from('products')
      .select('id, title, price, seller_id')
      .eq('status', 'active')
      .limit(1);

    if (productError || !products || products.length === 0) {
      console.error('❌ No test product found');
      return;
    }

    const testProduct = products[0];
    console.log(`✅ Found product: ${testProduct.title} ($${testProduct.price})\n`);

    // 3. Test: Create a test order
    console.log('3️⃣ Creating test order...');
    const orderData = {
      user_id: testUser.id,
      payment_intent_id: `test_pi_${Date.now()}`,
      amount: Math.round(testProduct.price * 100), // Convert to cents
      basket: {
        items: [{
          product_id: testProduct.id,
          quantity: 1,
          price: testProduct.price,
          title: testProduct.title
        }]
      },
      shipping_address: {
        name: testUser.email,
        street: '123 Test St',
        city: 'Test City',
        state: 'TS',
        zip: '12345',
        country: 'US'
      },
      status: 'paid',
      order_items: [{
        product_id: testProduct.id,
        quantity: 1,
        price: testProduct.price,
        title: testProduct.title
      }]
    };

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert(orderData)
      .select()
      .single();

    if (orderError) {
      console.error('❌ Order creation failed:', orderError);
      return;
    }

    console.log(`✅ Order created: ${order.id}\n`);

    // 4. Test: Create order item with subtotal
    console.log('4️⃣ Creating order item...');
    const itemSubtotal = testProduct.price * 1;
    const { data: orderItem, error: itemError } = await supabase
      .from('order_items')
      .insert({
        order_id: order.id,
        product_id: testProduct.id,
        quantity: 1,
        price: testProduct.price,
        subtotal: itemSubtotal
      })
      .select()
      .single();

    if (itemError) {
      console.error('❌ Order item creation failed:', itemError);
      // Clean up order
      await supabase.from('orders').delete().eq('id', order.id);
      return;
    }

    console.log(`✅ Order item created with subtotal: $${orderItem.subtotal}\n`);

    // 5. Clean up test data
    console.log('5️⃣ Cleaning up test data...');
    await supabase.from('order_items').delete().eq('id', orderItem.id);
    await supabase.from('orders').delete().eq('id', order.id);
    console.log('✅ Test data cleaned up\n');

    console.log('🎉 All tests passed! Order creation flow is working correctly.');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

testOrderCreation();
