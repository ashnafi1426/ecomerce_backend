const { createClient } = require('@supabase/supabase-js');

// Read environment variables
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createSellerOrdersDirectly() {
  try {
    console.log('🔄 Creating seller orders test data directly...\n');
    
    // Test connection
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('❌ Supabase connection failed:', testError.message);
      return;
    }
    
    console.log('✅ Supabase connection successful\n');
    
    // Step 1: Create test customer (or check if exists)
    console.log('1. Creating test customer...');
    
    // First check if user exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('id', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890')
      .single();
    
    if (checkError && checkError.code === 'PGRST116') {
      // User doesn't exist, create it
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert({
          id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          email: 'test-customer-orders@test.com',
          password_hash: '$2b$10$dummy.hash.for.testing',
          role: 'customer',
          display_name: 'Test Customer for Orders',
          status: 'active'
        });
      
      if (userError) {
        console.error('❌ Error creating user:', userError.message);
        return;
      }
      console.log('✅ Test customer created');
    } else {
      console.log('✅ Test customer already exists');
    }
    
    // Step 2: Create parent orders
    console.log('\n2. Creating parent orders...');
    const ordersToCreate = [
      {
        id: 'b1c2d3e4-f5a6-7890-abcd-ef1234567890',
        user_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        status: 'pending_payment', // Use valid status
        payment_intent_id: 'pi_test_1234567890abcdef',
        amount: 19999, // $199.99 in cents
        basket: JSON.stringify([{"product_id": "test-product-1", "quantity": 1, "price": 19999}]),
        shipping_address: JSON.stringify({"name": "Test Customer for Orders", "address": "123 Test St", "city": "Test City", "zip": "12345"}),
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days ago
      },
      {
        id: 'c2d3e4f5-a6b7-8901-bcde-f12345678901',
        user_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        status: 'pending_payment', // Use valid status
        payment_intent_id: 'pi_test_0987654321fedcba',
        amount: 9999, // $99.99 in cents
        basket: JSON.stringify([{"product_id": "test-product-2", "quantity": 1, "price": 9999}]),
        shipping_address: JSON.stringify({"name": "Test Customer for Orders", "address": "123 Test St", "city": "Test City", "zip": "12345"}),
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() // 1 day ago
      },
      {
        id: 'd3e4f5a6-b7c8-9012-cdef-123456789012',
        user_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        status: 'pending_payment', // Use valid status
        payment_intent_id: 'pi_test_abcdef1234567890',
        amount: 4998, // $49.98 in cents
        basket: JSON.stringify([{"product_id": "test-product-3", "quantity": 2, "price": 2499}]),
        shipping_address: JSON.stringify({"name": "Test Customer for Orders", "address": "123 Test St", "city": "Test City", "zip": "12345"}),
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days ago
      }
    ];
    
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .upsert(ordersToCreate, {
        onConflict: 'id',
        ignoreDuplicates: false
      });
    
    if (ordersError) {
      console.error('❌ Error creating orders:', ordersError.message);
      return;
    }
    console.log('✅ Parent orders created/updated');
    
    // Step 3: Create sub_orders
    console.log('\n3. Creating sub_orders...');
    const subOrdersToCreate = [
      {
        id: 'e4f5a6b7-c8d9-0123-def0-123456789abc',
        parent_order_id: 'b1c2d3e4-f5a6-7890-abcd-ef1234567890',
        seller_id: '08659266-babb-4323-b750-b1977c825e24',
        items: JSON.stringify([{"product_id": "test-product-1", "quantity": 1, "price": 19999, "name": "Test Product A"}]),
        subtotal: 19999,
        total_amount: 19999,
        fulfillment_status: 'delivered', // Use valid status
        status: 'pending_fulfillment', // Use valid status
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'f5a6b7c8-d9e0-1234-ef01-23456789abcd',
        parent_order_id: 'c2d3e4f5-a6b7-8901-bcde-f12345678901',
        seller_id: '08659266-babb-4323-b750-b1977c825e24',
        items: JSON.stringify([{"product_id": "test-product-2", "quantity": 1, "price": 9999, "name": "Test Product B"}]),
        subtotal: 9999,
        total_amount: 9999,
        fulfillment_status: 'delivered', // Use valid status
        status: 'pending_fulfillment', // Use valid status
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'a6b7c8d9-e0f1-2345-f012-3456789abcde',
        parent_order_id: 'd3e4f5a6-b7c8-9012-cdef-123456789012',
        seller_id: '08659266-babb-4323-b750-b1977c825e24',
        items: JSON.stringify([{"product_id": "test-product-3", "quantity": 2, "price": 2499, "name": "Test Product C"}]),
        subtotal: 4998,
        total_amount: 4998,
        fulfillment_status: 'delivered', // Use valid status
        status: 'pending_fulfillment', // Use valid status
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
    
    const { data: subOrdersData, error: subOrdersError } = await supabase
      .from('sub_orders')
      .upsert(subOrdersToCreate, {
        onConflict: 'id',
        ignoreDuplicates: false
      });
    
    if (subOrdersError) {
      console.error('❌ Error creating sub_orders:', subOrdersError.message);
      return;
    }
    console.log('✅ Sub_orders created/updated');
    
    // Step 4: Verify the data was created
    console.log('\n4. 🔍 Verifying created data...');
    
    const { data: subOrders, error: queryError } = await supabase
      .from('sub_orders')
      .select(`
        *,
        orders!inner (
          id,
          created_at,
          shipping_address,
          status
        )
      `)
      .eq('seller_id', '08659266-babb-4323-b750-b1977c825e24')
      .order('created_at', { ascending: false });
    
    if (queryError) {
      console.error('❌ Error querying sub_orders:', queryError.message);
      return;
    }
    
    console.log(`✅ Found ${subOrders?.length || 0} sub_orders for seller`);
    
    if (subOrders && subOrders.length > 0) {
      console.log('\n📦 CREATED ORDERS:');
      console.log('==================\n');
      
      subOrders.forEach((order, index) => {
        console.log(`${index + 1}. Order ID: ${order.id}`);
        console.log(`   Status: ${order.fulfillment_status}`);
        console.log(`   Amount: $${(order.total_amount / 100).toFixed(2)}`);
        console.log(`   Created: ${new Date(order.created_at).toLocaleDateString()}`);
        console.log('');
      });
      
      // Calculate statistics
      const stats = {
        total: subOrders.length,
        pending: subOrders.filter(o => o.fulfillment_status === 'pending').length,
        processing: subOrders.filter(o => o.fulfillment_status === 'processing').length,
        shipped: subOrders.filter(o => o.fulfillment_status === 'shipped').length,
        delivered: subOrders.filter(o => o.fulfillment_status === 'delivered').length,
        totalRevenue: subOrders.reduce((sum, o) => sum + o.total_amount, 0)
      };
      
      console.log('📊 EXPECTED STATISTICS:');
      console.log('=======================');
      console.log(`Total Orders: ${stats.total}`);
      console.log(`Pending: ${stats.pending}`);
      console.log(`Processing: ${stats.processing}`);
      console.log(`Shipped: ${stats.shipped}`);
      console.log(`Delivered: ${stats.delivered}`);
      console.log(`Total Revenue: $${(stats.totalRevenue / 100).toFixed(2)}`);
      
      console.log('\n🎉 SUCCESS: Test data created successfully!');
      console.log('\n📋 NEXT STEPS:');
      console.log('==============');
      console.log('1. Run: node ../../../../test-seller-orders-final.js');
      console.log('2. Test the frontend seller orders page');
      console.log('3. Login as seller: ashu@gmail.com / 14263208@Aa');
      console.log('4. Navigate to Seller Dashboard → Orders');
      console.log('5. You should see 3 orders with the statistics above');
      
    } else {
      console.log('⚠️  No orders found after creation - something went wrong');
    }
    
  } catch (error) {
    console.error('❌ Failed to create test data:', error.message);
    console.error('Stack:', error.stack);
  }
}

createSellerOrdersDirectly();