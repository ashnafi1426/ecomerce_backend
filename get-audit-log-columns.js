/**
 * Get Audit Log Columns
 * Query the actual table structure from Supabase
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function getAuditLogColumns() {
  console.log('🔍 Querying audit_log table structure...\n');

  try {
    // Use raw SQL query to get column information
    const { data, error } = await supabase
      .from('audit_log')
      .select('*')
      .limit(0); // Get no rows, just structure

    if (error) {
      console.error('❌ Error:', error.message);
      console.error('Full error:', JSON.stringify(error, null, 2));
      
      // Try alternative approach - query information_schema
      console.log('\n🔄 Trying alternative query method...\n');
      
      const query = `
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'audit_log'
        ORDER BY ordinal_position
      `;
      
      console.log('SQL Query:', query);
      console.log('\n⚠️  Note: You may need to run this query directly in Supabase SQL Editor');
      return;
    }

    console.log('✅ Query successful');
    console.log('Response data:', data);

  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
  }
}

getAuditLogColumns()
  .then(() => {
    console.log('\n✅ Complete');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Fatal error:', err);
    process.exit(1);
  });
