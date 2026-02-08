/**
 * List Actual Audit Log Columns
 * Get all columns that actually exist in the table
 */

require('dotenv').config();
const supabase = require('./config/supabase');

async function listAuditLogColumns() {
  console.log('🔍 Listing actual audit_log columns...\n');

  try {
    // Select all columns with a limit of 1 to see structure
    const { data, error } = await supabase
      .from('audit_log')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Error:', error.message);
      return;
    }

    if (data && data.length > 0) {
      console.log('✅ Found existing record. Columns:');
      Object.keys(data[0]).forEach((col, index) => {
        console.log(`  ${(index + 1).toString().padStart(2)}. ${col}`);
      });
      console.log('\n📄 Sample record:');
      console.log(JSON.stringify(data[0], null, 2));
    } else {
      console.log('⚠️  No records found in audit_log table');
      console.log('Attempting to insert a minimal test record to discover schema...\n');
      
      // Try inserting with minimal data
      const { data: insertData, error: insertError } = await supabase
        .from('audit_log')
        .insert([{
          table_name: 'test_table',
          action: 'test'
        }])
        .select();

      if (insertError) {
        console.log('❌ Insert failed:', insertError.message);
        console.log('This reveals required columns');
      } else if (insertData && insertData.length > 0) {
        console.log('✅ Insert succeeded. Columns:');
        Object.keys(insertData[0]).forEach((col, index) => {
          console.log(`  ${(index + 1).toString().padStart(2)}. ${col}`);
        });
        console.log('\n📄 Inserted record:');
        console.log(JSON.stringify(insertData[0], null, 2));
        
        // Clean up
        await supabase
          .from('audit_log')
          .delete()
          .eq('id', insertData[0].id);
        console.log('\n🧹 Test record cleaned up');
      }
    }

  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
  }
}

listAuditLogColumns()
  .then(() => {
    console.log('\n✅ Complete');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Fatal error:', err);
    process.exit(1);
  });
