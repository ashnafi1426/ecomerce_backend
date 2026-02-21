const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSubOrderTotal() {
  console.log('🔍 Checking sub-order d03d330a-986f-477a-9968-f14c54029611...\n');
  
  // Fetch the sub-order
  const { data: subOrder, error } = await supabase
    .from('sub_orders')
    .select('*')
    .eq('id', 'd03d330a-986f-477a-9968-f14c54029611')
    .single();
  
  if (error) {
    console.error('❌ Error fetching sub-order:', error);
    return;
  }
  
  console.log('📦 Sub-order data:');
  console.log('  ID:', subOrder.id);
  console.log('  Total Amount:', subOrder.total_amount);
  console.log('  Items:', JSON.stringify(subOrder.items, null, 2));
  
  // Calculate total from items
  let calculatedTotal = 0;
  if (subOrder.items && Array.isArray(subOrder.items)) {
    calculatedTotal = subOrder.items.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);
  }
  
  console.log('\n💰 Calculated total from items:', calculatedTotal);
  console.log('💰 Stored total_amount:', subOrder.total_amount);
  console.log('💰 Total in dollars (if in cents):', subOrder.total_amount ? subOrder.total_amount / 100 : 0);
  
  if (!subOrder.total_amount || subOrder.total_amount === null) {
    console.log('\n⚠️  WARNING: total_amount is NULL!');
    console.log('✅ Should be:', calculatedTotal);
  }
}

checkSubOrderTotal().catch(console.error);
