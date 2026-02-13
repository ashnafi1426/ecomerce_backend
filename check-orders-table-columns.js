const { createClient } = require('@supabase/supabase-js');

// Read environment variables
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role key

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? 'Set' : 'Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkOrdersTableStructure() {
  try {
    console.log('🔍 Checking orders table structure...\n');
    
    // Test connection first
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('❌ Supabase connection failed:', testError.message);
      return;
    }
    
    console.log('✅ Supabase connection successful\n');
    
    // Try to get a sample order to see the actual structure
    console.log('📋 CHECKING EXISTING ORDERS STRUCTURE:');
    console.log('=====================================\n');
    
    const { data: sampleOrders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .limit(1);
    
    if (ordersError) {
      console.error('❌ Error querying orders:', ordersError.message);
    } else if (sampleOrders && sampleOrders.length > 0) {
      console.log('Sample order structure:');
      console.log(JSON.stringify(sampleOrders[0], null, 2));
    } else {
      console.log('No existing orders found');
    }
    
    // Check sub_orders structure
    console.log('\n📋 CHECKING SUB_ORDERS STRUCTURE:');
    console.log('=================================\n');
    
    const { data: sampleSubOrders, error: subOrdersError } = await supabase
      .from('sub_orders')
      .select('*')
      .limit(1);
    
    if (subOrdersError) {
      console.error('❌ Error querying sub_orders:', subOrdersError.message);
    } else if (sampleSubOrders && sampleSubOrders.length > 0) {
      console.log('Sample sub_order structure:');
      console.log(JSON.stringify(sampleSubOrders[0], null, 2));
    } else {
      console.log('No existing sub_orders found');
    }
    
    // Try a minimal insert to see what fails
    console.log('\n🧪 TESTING MINIMAL ORDER INSERT:');
    console.log('================================\n');
    
    const testOrderId = 'test-order-' + Date.now();
    const testUserId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
    
    // First ensure test user exists
    const { data: existingUser, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', testUserId)
      .single();
    
    if (userError && userError.code === 'PGRST116') {
      // User doesn't exist, create it
      console.log('Creating test user...');
      const { error: createUserError } = await supabase
        .from('users')
        .insert({
          id: testUserId,
          email: 'test-user-orders@test.com',
          password_hash: '$2b$10$dummy.hash.for.testing',
          role: 'customer',
          display_name: 'Test User for Orders',
          status: 'active'
        });
      
      if (createUserError) {
        console.error('❌ Error creating test user:', createUserError.message);
        return;
      }
      console.log('✅ Test user created');
    }
    
    // Try minimal order insert
    const { data: insertResult, error: insertError } = await supabase
      .from('orders')
      .insert({
        id: testOrderId,
        user_id: testUserId,
        status: 'confirmed',
        payment_intent_id: 'pi_test_minimal',
        amount: 99.99,
        basket: '[]', // Empty basket
        shipping_address: '{"name": "Test User"}'
      })
      .select();
    
    if (insertError) {
      console.error('❌ Minimal order insert failed:', insertError.message);
      console.error('This tells us what columns are required');
    } else {
      console.log('✅ Minimal order insert successful');
      console.log('Order created:', insertResult[0]);
      
      // Clean up test order
      await supabase.from('orders').delete().eq('id', testOrderId);
      console.log('✅ Test order cleaned up');
    }
    
  } catch (error) {
    console.error('❌ Failed to check table structure:', error.message);
  }
}

checkOrdersTableStructure();