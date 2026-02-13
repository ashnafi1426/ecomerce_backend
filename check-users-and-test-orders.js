/**
 * CHECK USERS AND TEST ORDERS
 * 
 * This script:
 * 1. Checks existing users
 * 2. Creates a test user if needed
 * 3. Tests the orders display issue
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

async function checkUsersAndTestOrders() {
  try {
    console.log('🔍 Checking existing users...\n');

    // Check existing users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, role, status')
      .limit(10);

    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      return;
    }

    console.log('📊 Existing users:');
    users.forEach(user => {
      console.log(`   - ${user.email} (${user.role}) - ${user.status}`);
    });

    // Find or create a test customer
    let testUser = users.find(u => u.role === 'customer' && u.status === 'active');
    
    if (!testUser) {
      console.log('\n🔧 Creating test customer...');
      
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert([{
          email: 'testcustomer@example.com',
          password: hashedPassword,
          full_name: 'Test Customer',
          role: 'customer',
          status: 'active'
        }])
        .select()
        .single();

      if (createError) {
        console.error('❌ Error creating test user:', createError);
        return;
      }

      testUser = newUser;
      console.log('✅ Test customer created:', testUser.email);
    }

    console.log('\n🧪 Testing with user:', testUser.email);

    // Test login
    console.log('\n1. Testing login...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: testUser.email,
      password: 'password123'
    });

    if (!loginResponse.data.success) {
      console.log('❌ Login failed:', loginResponse.data);
      return;
    }

    const authToken = loginResponse.data.token;
    console.log('✅ Login successful');

    // Check existing orders
    console.log('\n2. Checking existing orders...');
    const ordersResponse = await axios.get(`${API_BASE}/orders`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    console.log('📊 Orders API Response:');
    console.log('   Status:', ordersResponse.status);
    console.log('   Response structure:', Object.keys(ordersResponse.data || {}));
    
    if (ordersResponse.data.orders) {
      console.log('   Orders count:', ordersResponse.data.orders.length);
    } else {
      console.log('   No orders array found');
    }

    // Direct database check
    console.log('\n3. Direct database check...');
    const { data: dbOrders, error: dbError } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', testUser.id)
      .order('created_at', { ascending: false });

    if (dbError) {
      console.log('❌ Database query error:', dbError);
    } else {
      console.log('📊 Direct database results:');
      console.log('   Orders found in DB:', dbOrders.length);
      
      if (dbOrders.length > 0) {
        console.log('   Sample order from DB:', {
          id: dbOrders[0].id,
          user_id: dbOrders[0].user_id,
          status: dbOrders[0].status,
          amount: dbOrders[0].amount,
          created_at: dbOrders[0].created_at,
          has_basket: !!dbOrders[0].basket,
          basket_items: dbOrders[0].basket?.length || 0
        });
      }
    }

    // Create a test order if none exist
    if (dbOrders.length === 0) {
      console.log('\n4. Creating test order...');
      
      // Create payment intent
      const paymentIntentResponse = await axios.post(`${API_BASE}/stripe/create-intent`, {
        cartItems: [
          {
            id: '66666666-6666-6666-6666-666666666666',
            quantity: 1
          }
        ],
        shippingAddress: {
          fullName: 'Test Customer',
          email: testUser.email,
          address: '123 Test St',
          city: 'Test City',
          state: 'NY',
          zipCode: '12345',
          country: 'US'
        }
      }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      if (paymentIntentResponse.data.success) {
        console.log('✅ Payment intent created');
        
        // Create order
        const orderResponse = await axios.post(`${API_BASE}/stripe/create-order`, {
          payment_intent_id: paymentIntentResponse.data.payment_intent_id
        }, {
          headers: { Authorization: `Bearer ${authToken}` }
        });

        if (orderResponse.data.success) {
          console.log('✅ Test order created:', orderResponse.data.order_id);
          
          // Check orders API again
          console.log('\n5. Checking orders API after creation...');
          const newOrdersResponse = await axios.get(`${API_BASE}/orders`, {
            headers: { Authorization: `Bearer ${authToken}` }
          });

          console.log('📊 Updated Orders API Response:');
          console.log('   Status:', newOrdersResponse.status);
          console.log('   Orders count:', newOrdersResponse.data.orders?.length || 0);
          
          if (newOrdersResponse.data.orders && newOrdersResponse.data.orders.length > 0) {
            console.log('✅ Orders are now visible in API!');
            
            const order = newOrdersResponse.data.orders[0];
            console.log('   Order details:', {
              id: order.id,
              status: order.status,
              amount: order.amount,
              created_at: order.created_at,
              items: order.basket?.length || 0
            });
          } else {
            console.log('❌ Orders still not visible in API - this is the bug!');
          }
        } else {
          console.log('❌ Order creation failed:', orderResponse.data);
        }
      } else {
        console.log('❌ Payment intent creation failed:', paymentIntentResponse.data);
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
}

// Run the test
checkUsersAndTestOrders();