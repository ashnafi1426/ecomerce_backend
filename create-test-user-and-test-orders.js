/**
 * CREATE TEST USER AND TEST ORDERS
 * 
 * This script:
 * 1. Creates a test user with known credentials
 * 2. Tests the orders display issue
 */

const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const bcrypt = require('bcrypt');

// Load environment variables
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const API_BASE = 'http://localhost:5000/api';

async function createTestUserAndTestOrders() {
  try {
    console.log('🔧 Creating test user with known credentials...\n');

    // Create test user with known password
    const testEmail = 'orders-test@example.com';
    const testPassword = 'password123';
    const hashedPassword = await bcrypt.hash(testPassword, 10);

    // Delete existing test user if exists
    await supabase
      .from('users')
      .delete()
      .eq('email', testEmail);

    // Create new test user
    const { data: testUser, error: createError } = await supabase
      .from('users')
      .insert([{
        email: testEmail,
        password_hash: hashedPassword,
        display_name: 'Orders Test User',
        role: 'customer',
        status: 'active'
      }])
      .select()
      .single();

    if (createError) {
      console.error('❌ Error creating test user:', createError);
      return;
    }

    console.log('✅ Test user created:', testUser.email);
    console.log('   User ID:', testUser.id);

    // Test login
    console.log('\n1. Testing login...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: testEmail,
      password: testPassword
    });

    if (!loginResponse.data.token) {
      console.log('❌ Login failed:', loginResponse.data);
      return;
    }

    const authToken = loginResponse.data.token;
    console.log('✅ Login successful');

    // Check existing orders (should be empty)
    console.log('\n2. Checking existing orders (should be empty)...');
    const ordersResponse = await axios.get(`${API_BASE}/orders`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    console.log('📊 Orders API Response:');
    console.log('   Status:', ordersResponse.status);
    console.log('   Response type:', typeof ordersResponse.data);
    console.log('   Response structure:', Object.keys(ordersResponse.data || {}));
    
    if (ordersResponse.data.orders) {
      console.log('   Orders count:', ordersResponse.data.orders.length);
    } else {
      console.log('   No orders array found');
    }

    // Create a test order
    console.log('\n3. Creating test order...');
    
    // Create payment intent
    const paymentIntentResponse = await axios.post(`${API_BASE}/stripe/create-intent`, {
      cartItems: [
        {
          id: '66666666-6666-6666-6666-666666666666',
          quantity: 1
        }
      ],
      shippingAddress: {
        fullName: 'Orders Test User',
        email: testEmail,
        address: '123 Test St',
        city: 'Test City',
        state: 'NY',
        zipCode: '12345',
        country: 'US'
      }
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (!paymentIntentResponse.data.success) {
      console.log('❌ Payment intent creation failed:', paymentIntentResponse.data);
      return;
    }

    console.log('✅ Payment intent created:', paymentIntentResponse.data.payment_intent_id);
    
    // Create order
    const orderResponse = await axios.post(`${API_BASE}/stripe/create-order`, {
      payment_intent_id: paymentIntentResponse.data.payment_intent_id
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (!orderResponse.data.success) {
      console.log('❌ Order creation failed:', orderResponse.data);
      return;
    }

    console.log('✅ Test order created:', orderResponse.data.order_id);
    
    // Check orders API again
    console.log('\n4. Checking orders API after creation...');
    const newOrdersResponse = await axios.get(`${API_BASE}/orders`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    console.log('📊 Updated Orders API Response:');
    console.log('   Status:', newOrdersResponse.status);
    console.log('   Response type:', typeof newOrdersResponse.data);
    console.log('   Response structure:', Object.keys(newOrdersResponse.data || {}));
    console.log('   Orders count:', newOrdersResponse.data.orders?.length || 0);
    
    if (newOrdersResponse.data.orders && newOrdersResponse.data.orders.length > 0) {
      console.log('✅ Orders are now visible in API!');
      
      const order = newOrdersResponse.data.orders[0];
      console.log('   Order details:', {
        id: order.id,
        status: order.status,
        amount: order.amount,
        created_at: order.created_at,
        has_basket: !!order.basket,
        basket_items: order.basket?.length || 0
      });

      // Check if order structure matches frontend expectations
      console.log('\n5. Frontend compatibility check...');
      console.log('   Required fields:');
      console.log('   - id:', !!order.id);
      console.log('   - total (amount):', !!order.amount);
      console.log('   - status:', !!order.status);
      console.log('   - created_at:', !!order.created_at);
      console.log('   - items (basket):', !!order.basket);
      console.log('   - shipping_address:', !!order.shipping_address);

      // The frontend expects 'items' but backend provides 'basket'
      if (order.basket && !order.items) {
        console.log('⚠️  ISSUE FOUND: Frontend expects "items" but backend provides "basket"');
      }

      // The frontend expects 'total' but backend provides 'amount'
      if (order.amount && !order.total) {
        console.log('⚠️  ISSUE FOUND: Frontend expects "total" but backend provides "amount"');
      }

    } else {
      console.log('❌ Orders still not visible in API - this is the bug!');
      
      // Direct database check
      console.log('\n   Direct database check...');
      const { data: dbOrders, error: dbError } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', testUser.id)
        .order('created_at', { ascending: false });

      if (dbError) {
        console.log('   ❌ Database query error:', dbError);
      } else {
        console.log('   📊 Direct database results:');
        console.log('   Orders found in DB:', dbOrders.length);
        
        if (dbOrders.length > 0) {
          console.log('   ✅ Order exists in database but not returned by API!');
          console.log('   Sample order from DB:', {
            id: dbOrders[0].id,
            user_id: dbOrders[0].user_id,
            status: dbOrders[0].status,
            amount: dbOrders[0].amount,
            created_at: dbOrders[0].created_at
          });
        }
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
    console.error('   Stack:', error.stack);
  }
}

// Run the test
createTestUserAndTestOrders();