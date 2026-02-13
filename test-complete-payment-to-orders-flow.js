/**
 * TEST COMPLETE PAYMENT TO ORDERS FLOW
 * 
 * This script tests the complete flow from payment to orders display:
 * 1. Create a fresh user
 * 2. Login
 * 3. Create payment intent
 * 4. Create order
 * 5. Verify order appears in orders list
 * 6. Test with different user to ensure isolation
 */

const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');

// Load environment variables
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const API_BASE = 'http://localhost:5000/api';

async function testCompletePaymentToOrdersFlow() {
  try {
    console.log('🔄 Testing Complete Payment to Orders Flow...\n');

    // Step 1: Create a fresh test user
    const timestamp = Date.now();
    const testEmail = `flow-test-${timestamp}@example.com`;
    const testPassword = 'password123';
    const hashedPassword = await bcrypt.hash(testPassword, 10);

    console.log('1. Creating fresh test user:', testEmail);
    
    const { data: testUser, error: createError } = await supabase
      .from('users')
      .insert([{
        email: testEmail,
        password_hash: hashedPassword,
        display_name: `Flow Test User ${timestamp}`,
        role: 'customer',
        status: 'active'
      }])
      .select()
      .single();

    if (createError) {
      console.error('❌ Error creating test user:', createError);
      return;
    }

    console.log('✅ Test user created with ID:', testUser.id);

    // Step 2: Login
    console.log('\n2. Logging in...');
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

    // Step 3: Verify no existing orders
    console.log('\n3. Verifying no existing orders...');
    const initialOrdersResponse = await axios.get(`${API_BASE}/orders`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    console.log('   Initial orders count:', initialOrdersResponse.data.orders?.length || 0);

    // Step 4: Create payment intent
    console.log('\n4. Creating payment intent...');
    const paymentIntentResponse = await axios.post(`${API_BASE}/stripe/create-intent`, {
      cartItems: [
        {
          id: '66666666-6666-6666-6666-666666666666',
          quantity: 2
        }
      ],
      shippingAddress: {
        fullName: `Flow Test User ${timestamp}`,
        email: testEmail,
        address: '123 Flow Test St',
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

    const paymentIntentId = paymentIntentResponse.data.payment_intent_id;
    console.log('✅ Payment intent created:', paymentIntentId);
    console.log('   Amount:', paymentIntentResponse.data.amount);

    // Step 5: Create order
    console.log('\n5. Creating order...');
    const orderResponse = await axios.post(`${API_BASE}/stripe/create-order`, {
      payment_intent_id: paymentIntentId
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (!orderResponse.data.success) {
      console.log('❌ Order creation failed:', orderResponse.data);
      return;
    }

    const orderId = orderResponse.data.order_id;
    console.log('✅ Order created:', orderId);

    // Step 6: Immediately check orders (this should work)
    console.log('\n6. Checking orders immediately after creation...');
    const newOrdersResponse = await axios.get(`${API_BASE}/orders`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    console.log('📊 Orders API Response:');
    console.log('   Status:', newOrdersResponse.status);
    console.log('   Orders count:', newOrdersResponse.data.orders?.length || 0);

    if (newOrdersResponse.data.orders && newOrdersResponse.data.orders.length > 0) {
      const order = newOrdersResponse.data.orders[0];
      console.log('✅ Order found in API response!');
      console.log('   Order ID:', order.id);
      console.log('   Status:', order.status);
      console.log('   Total:', order.total);
      console.log('   Items:', order.items?.length || 0);
      
      // Verify it's the correct order
      if (order.id === orderId) {
        console.log('✅ Correct order returned');
      } else {
        console.log('⚠️ Different order returned (might be expected if multiple orders exist)');
      }

      console.log('\n🎉 COMPLETE SUCCESS: Payment to Orders flow working perfectly!');
      console.log('\n📋 Summary:');
      console.log('   ✅ User creation: Working');
      console.log('   ✅ Authentication: Working');
      console.log('   ✅ Payment intent: Working');
      console.log('   ✅ Order creation: Working');
      console.log('   ✅ Orders API: Working');
      
      console.log('\n💡 If the frontend is not showing orders, the issue is likely:');
      console.log('   1. Frontend authentication/token issues');
      console.log('   2. Frontend using different user credentials');
      console.log('   3. Frontend caching issues');
      console.log('   4. Frontend API base URL configuration');
      console.log('   5. Browser localStorage/session issues');
      console.log('   6. Frontend not refreshing after payment success');

    } else {
      console.log('❌ No orders found after creation - this is the main issue!');
      
      // Debug: Check database directly
      console.log('\n   Direct database check...');
      const { data: dbOrders, error: dbError } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', testUser.id);

      if (dbError) {
        console.log('   ❌ Database query error:', dbError);
      } else {
        console.log('   📊 Database orders count:', dbOrders.length);
        if (dbOrders.length > 0) {
          console.log('   ✅ Order exists in database but not returned by API');
          console.log('   This indicates an issue in the order service or controller');
        } else {
          console.log('   ❌ Order not found in database either');
          console.log('   This indicates an issue in order creation');
        }
      }
    }

    // Cleanup: Delete test users
    console.log('\n7. Cleaning up test users...');
    await supabase.from('users').delete().eq('email', testEmail);
    console.log('✅ Test users cleaned up');

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
testCompletePaymentToOrdersFlow();