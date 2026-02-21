/**
 * Check refund_requests table structure
 */

require('dotenv').config();
const supabase = require('./config/supabase');

async function checkTable() {
  console.log('Checking refund_requests table...\n');
  
  try {
    // Try to query the table
    const { data, error } = await supabase
      .from('refund_requests')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Error querying refund_requests table:');
      console.error('Code:', error.code);
      console.error('Message:', error.message);
      console.error('Details:', error.details);
      
      if (error.code === '42P01') {
        console.log('\n⚠️  Table does not exist. Need to run migration.');
      }
    } else {
      console.log('✅ Table exists and is accessible');
      console.log('Columns:', data && data.length > 0 ? Object.keys(data[0]) : 'No data to show columns');
      console.log('Row count:', data ? data.length : 0);
    }
    
    // Try to get table info from information_schema
    const { data: columns, error: colError } = await supabase
      .rpc('get_table_columns', { table_name: 'refund_requests' })
      .catch(() => null);
    
    if (columns) {
      console.log('\nTable columns from information_schema:');
      console.log(columns);
    }
    
  } catch (error) {
    console.error('Fatal error:', error.message);
  }
}

checkTable();
