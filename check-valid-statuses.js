const { createClient } = require('@supabase/supabase-js');

// Read environment variables
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkValidStatuses() {
  try {
    console.log('🔍 Checking valid status values...\n');
    
    // Check existing order statuses
    console.log('📋 EXISTING ORDER STATUSES:');
    const { data: orderStatuses, error: orderError } = await supabase
      .from('orders')
      .select('status')
      .limit(10);
    
    if (orderError) {
      console.error('❌ Error getting order statuses:', orderError.message);
    } else {
      const uniqueOrderStatuses = [...new Set(orderStatuses.map(o => o.status))];
      console.log('Valid order statuses:', uniqueOrderStatuses);
    }
    
    // Check existing sub_order fulfillment statuses
    console.log('\n📋 EXISTING SUB_ORDER FULFILLMENT STATUSES:');
    const { data: subOrderStatuses, error: subOrderError } = await supabase
      .from('sub_orders')
      .select('fulfillment_status')
      .limit(10);
    
    if (subOrderError) {
      console.error('❌ Error getting sub_order statuses:', subOrderError.message);
    } else {
      const uniqueSubOrderStatuses = [...new Set(subOrderStatuses.map(o => o.fulfillment_status))];
      console.log('Valid fulfillment statuses:', uniqueSubOrderStatuses);
    }
    
    // Check existing sub_order statuses (if there's a status column)
    console.log('\n📋 EXISTING SUB_ORDER STATUSES:');
    const { data: subOrderStatusColumn, error: subOrderStatusError } = await supabase
      .from('sub_orders')
      .select('status')
      .limit(10);
    
    if (subOrderStatusError) {
      console.log('No status column in sub_orders or error:', subOrderStatusError.message);
    } else {
      const uniqueSubOrderStatusColumn = [...new Set(subOrderStatusColumn.map(o => o.status))];
      console.log('Valid sub_order status values:', uniqueSubOrderStatusColumn);
    }
    
  } catch (error) {
    console.error('❌ Failed to check statuses:', error.message);
  }
}

checkValidStatuses();