/**
 * Quick test to verify sub-order retrieval fix
 */

const axios = require('axios');
const supabase = require('./config/supabase');

const API_BASE_URL = 'http://localhost:5000';

async function testSubOrderFix() {
  console.log('\n=== Testing Sub-Order 404 Fix ===\n');
  
  // 1. Get a sub-order from database
  console.log('1. Fetching sub-orders from database...');
  const { data: subOrders, error: subOrderError } = await supabase
    .from('sub_orders')
    .select('id, parent_order_id, seller_id, items, total_amount, fulfillment_status')
    .limit(1);
  
  if (subOrderError) {
    console.error('Error fetching sub-orders:', subOrderError);
    return;
  }
  
  if (!subOrders || subOrders.length === 0) {
    console.log('No sub-orders found in database');
    return;
  }
  
  const subOrder = subOrders[0];
  console.log(`Found sub-order: ${subOrder.id}`);
  console.log(`Parent order: ${subOrder.parent_order_id}`);
  
  // 2. Get parent order to find user
  console.log('\n2. Fetching parent order...');
  const { data: parentOrder, error: parentError } = await supabase
    .from('orders')
    .select('user_id')
    .eq('id', subOrder.parent_order_id)
    .single();
  
  if (parentError) {
    console.error('Error fetching parent order:', parentError);
    return;
  }
  
  console.log(`Parent order user_id: ${parentOrder.user_id}`);
  
  // 3. Get user credentials
  console.log('\n3. Fetching user credentials...');
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('email, role')
    .eq('id', parentOrder.user_id)
    .single();
  
  if (userError) {
    console.error('Error fetching user:', userError);
    return;
  }
  
  console.log(`User email: ${user.email}`);
  console.log(`User role: ${user.role}`);
  
  // 4. Login to get token
  console.log('\n4. Logging in...');
  try {
    const loginResponse = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      email: user.email,
      password: 'password123' // Default test password
    });
    
    const token = loginResponse.data.token;
    console.log('✓ Login successful');
    
    // 5. Test sub-order retrieval
    console.log('\n5. Testing sub-order retrieval...');
    console.log(`GET /api/orders/${subOrder.id}`);
    
    const orderResponse = await axios.get(`${API_BASE_URL}/api/orders/${subOrder.id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log(`\n✓ SUCCESS! Status: ${orderResponse.status}`);
    console.log('Response data:');
    console.log(JSON.stringify(orderResponse.data, null, 2));
    
    // Verify response structure
    if (orderResponse.data.success && orderResponse.data.data) {
      const orderData = orderResponse.data.data;
      console.log('\n=== Verification ===');
      console.log(`✓ Order ID matches: ${orderData.id === subOrder.id}`);
      console.log(`✓ Has items: ${Array.isArray(orderData.items) && orderData.items.length > 0}`);
      console.log(`✓ Has total: ${orderData.total !== undefined}`);
      console.log(`✓ Source: ${orderData.source}`);
      console.log('\n✅ Sub-order retrieval fix is working!');
    }
    
  } catch (error) {
    if (error.response) {
      console.error(`\n✗ FAILED! Status: ${error.response.status}`);
      console.error('Error:', error.response.data);
    } else {
      console.error('\n✗ FAILED!', error.message);
    }
  }
}

testSubOrderFix().catch(console.error);
