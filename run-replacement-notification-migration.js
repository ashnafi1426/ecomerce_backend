const fs = require('fs');
const path = require('path');
const supabase = require('./config/supabase');

async function runMigration() {
  console.log('Running replacement notification types migration...\n');

  try {
    const migrationPath = path.join(__dirname, 'database', 'migrations', 'add-replacement-notification-types.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    // Split by semicolon and execute each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));

    for (const statement of statements) {
      console.log(`Executing: ${statement.substring(0, 80)}...`);
      
      const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
      
      if (error) {
        // Check if it's a "value already exists" error (which is fine)
        if (error.message && error.message.includes('already exists')) {
          console.log('  ⚠️  Value already exists (skipping)');
        } else {
          console.error('  ❌ Error:', error);
          throw error;
        }
      } else {
        console.log('  ✅ Success');
      }
    }

    console.log('\n✅ Migration completed successfully!');
    console.log('\nAdded notification types:');
    console.log('  - replacement_request_created');
    console.log('  - replacement_request_received');
    console.log('  - replacement_request_approved');
    console.log('  - replacement_request_rejected');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    console.log('\n📝 Manual migration required:');
    console.log('   Run the SQL file manually in your database:');
    console.log('   database/migrations/add-replacement-notification-types.sql');
    process.exit(1);
  }
}

runMigration()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
