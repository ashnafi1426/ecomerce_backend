const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkConstraint() {
  // Try to get constraint info
  const { data, error } = await supabase
    .from('orders')
    .select('status')
    .limit(5);
  
  console.log('Sample orders:', data);
  console.log('Error:', error);
  
  // Try different status values to see which ones work
  const testStatuses = [
    'pending_payment',
    'paid',
    'confirmed',
    'processing',
    'shipped',
    'delivered',
    'cancelled'
  ];
  
  console.log('\nTesting valid status values...');
  for (const status of testStatuses) {
    try {
      const { error } = await supabase
        .from('orders')
        .select('id')
        .eq('status', status)
        .limit(1);
      
      if (!error) {
        console.log(`✅ ${status} - valid`);
      } else {
        console.log(`❌ ${status} - invalid:`, error.message);
      }
    } catch (e) {
      console.log(`❌ ${status} - error:`, e.message);
    }
  }
}

checkConstraint();
