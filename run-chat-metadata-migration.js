/**
 * RUN CHAT METADATA MIGRATION
 * 
 * Adds the missing metadata column to conversations table
 */

const fs = require('fs');
const path = require('path');
const supabase = require('./config/supabase');

async function runMigration() {
  try {
    console.log('🔧 Running chat metadata migration...\n');

    // Read migration file
    const migrationPath = path.join(__dirname, 'database/migrations/add-chat-metadata-column.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration SQL:');
    console.log(migrationSQL);
    console.log('\n');

    // Execute migration
    console.log('⚙️  Executing migration...');
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

    if (error) {
      console.error('❌ Migration failed:', error);
      
      // Try direct execution as fallback
      console.log('\n🔄 Trying direct execution...');
      const { error: directError } = await supabase.from('conversations').select('metadata').limit(1);
      
      if (directError && directError.message.includes('metadata')) {
        console.error('❌ Column still missing. Manual execution required.');
        console.log('\n📋 Please run this SQL manually in Supabase SQL Editor:');
        console.log('---');
        console.log(migrationSQL);
        console.log('---');
        process.exit(1);
      } else {
        console.log('✅ Column already exists or was added successfully!');
      }
    } else {
      console.log('✅ Migration executed successfully!');
    }

    // Verify the column exists
    console.log('\n🔍 Verifying metadata column...');
    const { data: testData, error: testError } = await supabase
      .from('conversations')
      .select('id, metadata')
      .limit(1);

    if (testError) {
      console.error('❌ Verification failed:', testError.message);
      console.log('\n📋 Please run this SQL manually in Supabase SQL Editor:');
      console.log('---');
      console.log(migrationSQL);
      console.log('---');
      process.exit(1);
    }

    console.log('✅ Metadata column verified successfully!');
    console.log('\n🎉 Migration complete! Chat system should now work.');
    console.log('\n📝 Next steps:');
    console.log('   1. Restart the backend server');
    console.log('   2. Test Socket.IO connection from frontend');
    console.log('   3. Try creating a chat conversation');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

// Run migration
runMigration();
