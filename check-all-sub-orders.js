const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAllSubOrders() {
  console.log('🔍 Checking all sub-orders...\n');
  
  // Fetch all sub-orders
  const { data: subOrders, error } = await supabase
    .from('sub_orders')
    .select('id, total_amount, items, parent_order_id')
    .limit(10);
  
  if (error) {
    console.error('❌ Error fetching sub-orders:', error);
    return;
  }
  
  console.log(`📦 Found ${subOrders.length} sub-orders\n`);
  
  subOrders.forEach((subOrder, index) => {
    console.log(`${index + 1}. Sub-order ID: ${subOrder.id}`);
    console.log(`   Parent Order: ${subOrder.parent_order_id}`);
    console.log(`   Total Amount: ${subOrder.total_amount}`);
    
    // Calculate total from items
    let calculatedTotal = 0;
    if (subOrder.items && Array.isArray(subOrder.items)) {
      calculatedTotal = subOrder.items.reduce((sum, item) => {
        return sum + (item.price * item.quantity);
      }, 0);
      console.log(`   Items count: ${subOrder.items.length}`);
      console.log(`   Calculated total: ${calculatedTotal}`);
    } else {
      console.log(`   Items: ${JSON.stringify(subOrder.items)}`);
    }
    
    if (!subOrder.total_amount || subOrder.total_amount === null) {
      console.log(`   ⚠️  WARNING: total_amount is NULL!`);
    }
    
    console.log('');
  });
}

checkAllSubOrders().catch(console.error);
