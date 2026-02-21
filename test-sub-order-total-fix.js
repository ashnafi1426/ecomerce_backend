const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testSubOrderTotalFix() {
  console.log('🧪 Testing sub-order total field fix...\n');
  
  // Get a customer token first
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'customer@example.com',
    password: 'password123'
  });
  
  if (authError) {
    console.error('❌ Auth error:', authError);
    return;
  }
  
  const token = authData.session.access_token;
  console.log('✅ Authenticated as customer\n');
  
  // Get a sub-order ID
  const { data: subOrders } = await supabase
    .from('sub_orders')
    .select('id, parent_order_id, total_amount, items')
    .limit(1)
    .single();
  
  if (!subOrders) {
    console.log('❌ No sub-orders found');
    return;
  }
  
  console.log(`📦 Testing with sub-order: ${subOrders.id}`);
  console.log(`   Total amount in DB: ${subOrders.total_amount}`);
  console.log(`   Items:`, JSON.stringify(subOrders.items, null, 2));
  
  // Call the API endpoint
  const response = await fetch(`http://localhost:5000/api/orders/${subOrders.id}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const result = await response.json();
  
  console.log('\n📊 API Response:');
  console.log(`   Status: ${response.status}`);
  console.log(`   Success: ${result.success}`);
  
  if (result.data) {
    console.log(`   Order ID: ${result.data.id}`);
    console.log(`   Total Amount: ${result.data.totalAmount}`);
    console.log(`   Total (dollars): ${result.data.total}`);
    console.log(`   Items count: ${result.data.items?.length || 0}`);
    
    if (result.data.total !== undefined && result.data.total !== null) {
      console.log('\n✅ SUCCESS: Total field is present in response!');
      console.log(`   Total value: $${result.data.total}`);
    } else {
      console.log('\n❌ FAILED: Total field is missing or undefined!');
    }
  } else {
    console.log('\n❌ FAILED: No data in response');
    console.log('Response:', JSON.stringify(result, null, 2));
  }
}

testSubOrderTotalFix().catch(console.error);
