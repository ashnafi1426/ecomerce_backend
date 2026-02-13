const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read environment variables
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runFixedSQL() {
  try {
    console.log('🔄 Running FIXED SQL script for seller orders...\n');
    
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
    
    // Execute the SQL statements one by one
    const sqlStatements = [
      // Step 1: Create test customer
      `INSERT INTO users (id, email, password_hash, role, display_name, status)
       VALUES (
         'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
         'test-customer-orders@test.com',
         '$2b$10$dummy.hash.for.testing',
         'customer',
         'Test Customer for Orders',
         'active'
       ) ON CONFLICT (email) DO UPDATE SET display_name = 'Test Customer for Orders'`,
      
      // Step 2: Create parent orders with correct data types
      `INSERT INTO orders (id, user_id, status, payment_intent_id, amount, basket, shipping_address, created_at)
       VALUES 
       (
         'b1c2d3e4-f5a6-7890-abcd-ef1234567890',
         'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
         'confirmed',
         'pi_test_1234567890abcdef',
         19999,
         '[{"product_id": "test-product-1", "quantity": 1, "price": 19999}]',
         '{"name": "Test Customer for Orders", "address": "123 Test St", "city": "Test City", "zip": "12345"}',
         NOW() - INTERVAL '2 days'
       ),
       (
         'c2d3e4f5-a6b7-8901-bcde-f12345678901',
         'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
         'confirmed',
         'pi_test_0987654321fedcba',
         9999,
         '[{"product_id": "test-product-2", "quantity": 1, "price": 9999}]',
         '{"name": "Test Customer for Orders", "address": "123 Test St", "city": "Test City", "zip": "12345"}',
         NOW() - INTERVAL '1 day'
       ),
       (
         'd3e4f5a6-b7c8-9012-cdef-123456789012',
         'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
         'confirmed',
         'pi_test_abcdef1234567890',
         4998,
         '[{"product_id": "test-product-3", "quantity": 2, "price": 2499}]',
         '{"name": "Test Customer for Orders", "address": "123 Test St", "city": "Test City", "zip": "12345"}',
         NOW() - INTERVAL '3 days'
       )
       ON CONFLICT (id) DO NOTHING`,
      
      // Step 3: Create sub_orders
      `INSERT INTO sub_orders (
         id,
         parent_order_id,
         seller_id,
         items,
         subtotal,
         total_amount,
         fulfillment_status,
         created_at
       ) VALUES
       (
         'e4f5a6b7-c8d9-0123-def0-123456789abc',
         'b1c2d3e4-f5a6-7890-abcd-ef1234567890',
         '08659266-babb-4323-b750-b1977c825e24',
         '[{"product_id": "test-product-1", "quantity": 1, "price": 19999, "name": "Test Product A"}]',
         19999,
         19999,
         'pending',
         NOW() - INTERVAL '2 days'
       ),
       (
         'f5a6b7c8-d9e0-1234-ef01-23456789abcd',
         'c2d3e4f5-a6b7-8901-bcde-f12345678901',
         '08659266-babb-4323-b750-b1977c825e24',
         '[{"product_id": "test-product-2", "quantity": 1, "price": 9999, "name": "Test Product B"}]',
         9999,
         9999,
         'processing',
         NOW() - INTERVAL '1 day'
       ),
       (
         'a6b7c8d9-e0f1-2345-f012-3456789abcde',
         'd3e4f5a6-b7c8-9012-cdef-123456789012',
         '08659266-babb-4323-b750-b1977c825e24',
         '[{"product_id": "test-product-3", "quantity": 2, "price": 2499, "name": "Test Product C"}]',
         4998,
         4998,
         'shipped',
         NOW() - INTERVAL '3 days'
       )
       ON CONFLICT (id) DO NOTHING`
    ];
    
    // Execute each statement
    for (let i = 0; i < sqlStatements.length; i++) {
      console.log(`Executing step ${i + 1}...`);
      
      const { data, error } = await supabase.rpc('exec_sql', { 
        sql_query: sqlStatements[i] 
      });
      
      if (error) {
        console.error(`❌ Error in step ${i + 1}:`, error.message);
        return;
      } else {
        console.log(`✅ Step ${i + 1} completed successfully`);
      }
    }
    
    // Verify the data was created
    console.log('\n🔍 Verifying created data...');
    
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
      .eq('seller_id', '08659266-babb-4323-b750-b1977c825e24');
    
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
      
    } else {
      console.log('⚠️  No orders found after creation - something went wrong');
    }
    
  } catch (error) {
    console.error('❌ Failed to run SQL script:', error.message);
  }
}

runFixedSQL();