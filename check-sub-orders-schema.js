const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://yqigycicloyhasoqlcpn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxaWd5Y2ljbG95aGFzb3FsY3BuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTc3MzU2MiwiZXhwIjoyMDg1MzQ5NTYyfQ.XXwuOAHAODaJQuJfHiQxh-ysRYmP2RMb06MoI6lzwns'
);

async function checkSchema() {
  console.log('Checking sub_orders table schema...\n');
  
  // Get a sample sub-order to see its structure
  const { data, error } = await supabase
    .from('sub_orders')
    .select('*')
    .limit(1);
  
  if (error) {
    console.error('Error:', error);
  } else if (data && data.length > 0) {
    console.log('Sample sub-order structure:');
    console.log(JSON.stringify(data[0], null, 2));
    console.log('\n\nAvailable fields:');
    console.log(Object.keys(data[0]).join(', '));
  } else {
    console.log('No sub-orders found in database');
  }
}

checkSchema();
