/**
 * Check payments table constraint
 */

const supabase = require('./config/supabase');

async function checkConstraint() {
  console.log('Checking payments table...\n');
  
  // Try to query existing payments
  const { data: payments, error: queryError } = await supabase
    .from('payments')
    .select('*')
    .limit(5);
  
  if (queryError) {
    console.error('Query error:', queryError);
  } else {
    console.log(`Found ${payments.length} existing payments`);
    if (payments.length > 0) {
      console.log('Sample payment:', payments[0]);
    }
  }
  
  // Try to insert a test payment with each status
  const testStatuses = ['SUCCESS', 'PENDING', 'FAILED', 'REFUNDED', 'pending', 'success', 'succeeded', 'paid', 'completed'];
  
  for (const status of testStatuses) {
    console.log(`\nTrying status: "${status}"`);
    const { data, error } = await supabase
      .from('payments')
      .insert([{
        order_id: '00000000-0000-0000-0000-000000000001',
        payment_intent_id: `test_${Date.now()}_${status}`,
        amount: 1000,
        payment_method: 'card',
        status: status
      }])
      .select();
    
    if (error) {
      console.log(`  ❌ Failed: ${error.message}`);
    } else {
      console.log(`  ✅ Success!`);
      // Delete the test payment
      await supabase.from('payments').delete().eq('id', data[0].id);
    }
  }
  
  process.exit(0);
}

checkConstraint().catch(console.error);
