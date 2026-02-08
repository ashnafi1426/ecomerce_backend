/**
 * Check Audit Log Table Schema
 * Verifies what columns exist in the audit_log table
 */

require('dotenv').config();
const supabase = require('./config/supabase');

async function checkAuditLogSchema() {
  console.log('🔍 Checking audit_log table schema...\n');

  try {
    // Query to get column information
    const { data, error } = await supabase
      .rpc('exec_sql', {
        query: `
          SELECT 
            column_name,
            data_type,
            is_nullable,
            column_default
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'audit_log'
          ORDER BY ordinal_position;
        `
      });

    if (error) {
      // If RPC doesn't exist, try direct query
      console.log('⚠️  RPC method not available, trying direct query...\n');
      
      // Try to insert a test record to see what columns are expected
      const { data: testData, error: testError } = await supabase
        .from('audit_log')
        .select('*')
        .limit(1);
      
      if (testError) {
        console.error('❌ Error querying audit_log:', testError.message);
        return;
      }
      
      if (testData && testData.length > 0) {
        console.log('✅ Sample audit_log record structure:');
        console.log(JSON.stringify(testData[0], null, 2));
        console.log('\n📋 Available columns:');
        Object.keys(testData[0]).forEach(col => {
          console.log(`  - ${col}`);
        });
      } else {
        console.log('⚠️  No records in audit_log table');
        
        // Try to get schema from error message
        const { error: insertError } = await supabase
          .from('audit_log')
          .insert([{
            table_name: 'test',
            operation: 'TEST'
          }]);
        
        if (insertError) {
          console.log('\n❌ Insert test error:', insertError.message);
          console.log('This error message should reveal which columns are missing or invalid');
        }
      }
      return;
    }

    console.log('✅ Audit Log Table Columns:\n');
    data.forEach(col => {
      console.log(`  ${col.column_name.padEnd(25)} ${col.data_type.padEnd(20)} ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

checkAuditLogSchema()
  .then(() => {
    console.log('\n✅ Schema check complete');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Fatal error:', err);
    process.exit(1);
  });
