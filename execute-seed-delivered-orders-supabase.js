/**
 * Execute Seed Delivered Orders SQL Script (Supabase Version)
 * 
 * This script creates test data with delivered orders for refund and replacement testing.
 * It updates existing sub-orders to 'delivered' status for the test customer account.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('✗ ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeSeedScript() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║  Execute Seed Delivered Orders Script (Supabase)              ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
  
  try {
    // Step 1: Verify test accounts exist
    console.log('Step 1: Verifying test accounts...\n');
    const { data: customerData, error: customerError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', 'customer@test.com')
      .single();
    
    const { data: sellerData, error: sellerError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', 'seller@test.com')
      .single();
    
    if (customerError || !customerData) {
      console.log('✗ WARNING: customer@test.com not found in database');
    } else {
      console.log(`✓ Found customer@test.com (ID: ${customerData.id})`);
    }
    
    if (sellerError || !sellerData) {
      console.log('✗ WARNING: seller@test.com not found in database');
    } else {
      console.log(`✓ Found seller@test.com (ID: ${sellerData.id})`);
    }
    
    if (!customerData) {
      console.log('\n✗ ERROR: Cannot proceed without customer@test.com account');
      process.exit(1);
    }
    
    const customerId = customerData.id;
    
    // Step 2: Check current order status distribution
    console.log('\nStep 2: Current order status distribution...\n');
    // Simple query to get all sub-orders for the customer
    const { data: allSubOrders } = await supabase
      .from('sub_orders')
      .select(`
        fulfillment_status,
        orders!inner(user_id)
      `)
      .eq('orders.user_id', customerId);
    
    if (allSubOrders && allSubOrders.length > 0) {
      const distribution = {};
      allSubOrders.forEach(so => {
        distribution[so.fulfillment_status] = (distribution[so.fulfillment_status] || 0) + 1;
      });
      console.log('Current status distribution:');
      Object.entries(distribution).forEach(([status, count]) => {
        console.log(`  ${status}: ${count}`);
      });
    } else {
      console.log('  No orders found for customer@test.com');
    }
    
    // Step 3: Find eligible orders to update
    console.log('\nStep 3: Finding eligible orders to update...\n');
    const { data: eligibleOrders, error: eligibleError } = await supabase
      .from('sub_orders')
      .select(`
        id,
        parent_order_id,
        fulfillment_status,
        orders!inner(user_id)
      `)
      .eq('orders.user_id', customerId)
      .in('fulfillment_status', ['shipped', 'processing', 'pending'])
      .is('delivered_at', null)
      .order('created_at', { ascending: false })
      .limit(3);
    
    if (eligibleError) {
      console.error('✗ ERROR finding eligible orders:', eligibleError.message);
      process.exit(1);
    }
    
    if (!eligibleOrders || eligibleOrders.length === 0) {
      console.log('⚠ No eligible orders found to update');
      console.log('  All orders may already be delivered or no orders exist');
    } else {
      console.log(`Found ${eligibleOrders.length} eligible orders to update:\n`);
      eligibleOrders.forEach((order, idx) => {
        console.log(`${idx + 1}. Sub-order ID: ${order.id}`);
        console.log(`   Parent Order ID: ${order.parent_order_id}`);
        console.log(`   Current status: ${order.fulfillment_status}\n`);
      });
      
      // Update the orders
      console.log('Updating orders to delivered status...\n');
      const orderIds = eligibleOrders.map(o => o.id);
      const deliveredAt = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(); // 2 days ago
      
      const { data: updateData, error: updateError } = await supabase
        .from('sub_orders')
        .update({
          fulfillment_status: 'delivered',
          delivered_at: deliveredAt,
          updated_at: new Date().toISOString()
        })
        .in('id', orderIds)
        .select();
      
      if (updateError) {
        console.error('✗ ERROR updating orders:', updateError.message);
        process.exit(1);
      }
      
      console.log(`✓ Successfully updated ${updateData?.length || 0} orders to delivered status\n`);
    }
    
    // Step 4: Verify delivered orders
    console.log('Step 4: Verifying delivered orders...\n');
    const { data: deliveredOrders, error: verifyError } = await supabase
      .from('sub_orders')
      .select(`
        id,
        parent_order_id,
        fulfillment_status,
        delivered_at,
        orders!inner(
          user_id
        )
      `)
      .eq('orders.user_id', customerId)
      .eq('fulfillment_status', 'delivered')
      .order('delivered_at', { ascending: false })
      .limit(5);
    
    if (verifyError) {
      console.error('✗ ERROR verifying delivered orders:', verifyError.message);
    } else if (deliveredOrders && deliveredOrders.length > 0) {
      console.log(`✓ Found ${deliveredOrders.length} delivered orders:\n`);
      deliveredOrders.forEach((order, idx) => {
        console.log(`${idx + 1}. Sub-order ID: ${order.id}`);
        console.log(`   Parent Order ID: ${order.parent_order_id}`);
        console.log(`   Status: ${order.fulfillment_status}`);
        console.log(`   Delivered: ${order.delivered_at}\n`);
      });
    } else {
      console.log('⚠ WARNING: No delivered orders found after script execution');
    }
    
    // Step 5: Summary
    console.log('Step 5: Summary...\n');
    const { count: deliveredCount } = await supabase
      .from('sub_orders')
      .select('id', { count: 'exact', head: true })
      .eq('fulfillment_status', 'delivered');
    
    console.log(`Total delivered orders in database: ${deliveredCount || 0}\n`);
    
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║  ✓ SUCCESS: Test data created                                  ║');
    console.log('║  Delivered orders are ready for refund/replacement testing     ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n✗ ERROR executing script:');
    console.error(error.message);
    console.error('\nDetails:', error);
    process.exit(1);
  }
}

// Run the script
executeSeedScript();
