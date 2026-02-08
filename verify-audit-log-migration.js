/**
 * Verify Audit Log Migration Status
 * Check if Phase 1 migration columns exist
 */

require('dotenv').config();
const supabase = require('./config/supabase');

async function verifyAuditLogMigration() {
  console.log('🔍 Verifying audit_log Phase 1 migration status...\n');

  try {
    // Try to select using Phase 1 columns
    console.log('Testing Phase 1 columns (action_type, entity_type, entity_id)...');
    const { data: phase1Test, error: phase1Error } = await supabase
      .from('audit_log')
      .select('action_type, entity_type, entity_id, user_role, user_email')
      .limit(1);

    if (phase1Error) {
      console.log('❌ Phase 1 columns NOT found:', phase1Error.message);
    } else {
      console.log('✅ Phase 1 columns exist');
    }

    // Try to select using original columns
    console.log('\nTesting original columns (operation, table_name)...');
    const { data: originalTest, error: originalError } = await supabase
      .from('audit_log')
      .select('operation, table_name, user_id, old_data, new_data, ip_address')
      .limit(1);

    if (originalError) {
      console.log('❌ Original columns NOT found:', originalError.message);
    } else {
      console.log('✅ Original columns exist');
    }

    // Try to insert a test record with original schema
    console.log('\nTesting insert with original schema...');
    const { data: insertOriginal, error: insertOriginalError } = await supabase
      .from('audit_log')
      .insert([{
        table_name: 'test_table',
        operation: 'INSERT',
        user_id: null,
        old_data: null,
        new_data: { test: 'data' },
        ip_address: '127.0.0.1'
      }])
      .select();

    if (insertOriginalError) {
      console.log('❌ Insert with original schema failed:', insertOriginalError.message);
    } else {
      console.log('✅ Insert with original schema succeeded');
      console.log('Inserted record:', insertOriginal[0]);
      
      // Clean up test record
      if (insertOriginal && insertOriginal[0]) {
        await supabase
          .from('audit_log')
          .delete()
          .eq('id', insertOriginal[0].id);
        console.log('🧹 Test record cleaned up');
      }
    }

    // Try to insert with Phase 1 schema
    console.log('\nTesting insert with Phase 1 schema...');
    const { data: insertPhase1, error: insertPhase1Error } = await supabase
      .from('audit_log')
      .insert([{
        table_name: 'test_table',
        operation: 'INSERT',
        action_type: 'create',
        entity_type: 'test_table',
        entity_id: '00000000-0000-0000-0000-000000000000',
        user_id: null,
        user_role: null,
        user_email: null,
        old_data: null,
        new_data: { test: 'data' },
        ip_address: '127.0.0.1'
      }])
      .select();

    if (insertPhase1Error) {
      console.log('❌ Insert with Phase 1 schema failed:', insertPhase1Error.message);
    } else {
      console.log('✅ Insert with Phase 1 schema succeeded');
      console.log('Inserted record:', insertPhase1[0]);
      
      // Clean up test record
      if (insertPhase1 && insertPhase1[0]) {
        await supabase
          .from('audit_log')
          .delete()
          .eq('id', insertPhase1[0].id);
        console.log('🧹 Test record cleaned up');
      }
    }

  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
  }
}

verifyAuditLogMigration()
  .then(() => {
    console.log('\n✅ Verification complete');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Fatal error:', err);
    process.exit(1);
  });
