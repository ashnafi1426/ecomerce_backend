const supabase = require('./config/supabase');

async function checkOrdersSchema() {
  console.log('Checking orders table schema...\n');
  
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .limit(1);
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  if (data && data.length > 0) {
    console.log('Sample order columns:');
    console.log(Object.keys(data[0]));
    console.log('\nSample order data:');
    console.log(JSON.stringify(data[0], null, 2));
  } else {
    console.log('No orders found');
  }
}

checkOrdersSchema().then(() => process.exit(0));
