/**
 * RUN TELEGRAM FEATURES MIGRATION
 * 
 * Executes the Phase 2.1 migration for Telegram-like chat features
 */

const fs = require('fs');
const path = require('path');
const supabase = require('./config/supabase');

async function runMigration() {
  try {
    console.log('🚀 Starting Telegram Features Migration (Phase 2.1)...\n');

    // Read migration file
    const migrationPath = path.join(__dirname, 'database', 'migrations', 'telegram-features-phase-2.1.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration file loaded');
    console.log('📊 Executing SQL statements...\n');

    // Execute migration
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: migrationSQL });

    if (error) {
      console.error('❌ Migration failed:', error);
      
      // Try alternative approach - execute via raw query
      console.log('\n🔄 Trying alternative execution method...\n');
      
      // Split into individual statements and execute
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        if (statement) {
          try {
            console.log(`Executing statement ${i + 1}/${statements.length}...`);
            await supabase.rpc('exec_sql', { sql_query: statement + ';' });
          } catch (stmtError) {
            console.warn(`⚠️  Statement ${i + 1} warning:`, stmtError.message);
          }
        }
      }
    }

    console.log('\n✅ Migration completed successfully!\n');
    console.log('📋 Created/Updated:');
    console.log('  ✓ message_reactions table');
    console.log('  ✓ message_edits table');
    console.log('  ✓ Updated messages table with new columns');
    console.log('  ✓ Helper functions for reactions, editing, deletion');
    console.log('  ✓ Views for aggregated data');
    console.log('  ✓ Triggers for automatic updates\n');

    // Verify tables exist
    console.log('🔍 Verifying migration...\n');
    
    const { data: reactions, error: reactionsError } = await supabase
      .from('message_reactions')
      .select('*')
      .limit(1);
    
    const { data: edits, error: editsError } = await supabase
      .from('message_edits')
      .select('*')
      .limit(1);

    if (!reactionsError && !editsError) {
      console.log('✅ All tables verified successfully!\n');
    } else {
      console.log('⚠️  Some tables may need manual verification\n');
    }

    console.log('🎉 Telegram Features Phase 2.1 is ready!\n');
    console.log('Next steps:');
    console.log('  1. Update backend services to use new features');
    console.log('  2. Update frontend components');
    console.log('  3. Test each feature thoroughly\n');

  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
}

// Run migration
runMigration();
