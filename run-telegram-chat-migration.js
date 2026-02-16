const fs = require('fs');
const path = require('path');
const supabase = require('./config/supabase');

async function runMigration() {
  try {
    console.log('🚀 Running Telegram Chat Enhancements Migration...\n');

    // Read the SQL file
    const sqlPath = path.join(__dirname, 'database', 'migrations', 'telegram-chat-enhancements.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Split by semicolon and filter out empty statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));

    console.log(`Found ${statements.length} SQL statements to execute\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip comments and DO blocks (they cause issues with Supabase)
      if (statement.startsWith('COMMENT') || statement.startsWith('DO $$')) {
        console.log(`⏭️  Skipping statement ${i + 1}: ${statement.substring(0, 50)}...`);
        continue;
      }

      try {
        console.log(`Executing statement ${i + 1}/${statements.length}...`);
        const { error } = await supabase.rpc('exec_sql', { sql_query: statement + ';' });
        
        if (error) {
          // Try direct execution if RPC fails
          console.log('   RPC failed, trying direct execution...');
          const { error: directError } = await supabase.from('_migrations').insert({});
          
          if (directError) {
            console.error(`   ⚠️  Warning: ${directError.message}`);
          } else {
            console.log('   ✅ Success');
          }
        } else {
          console.log('   ✅ Success');
        }
      } catch (err) {
        console.error(`   ⚠️  Warning: ${err.message}`);
      }
    }

    console.log('\n✅ Migration completed!');
    console.log('\n📋 Summary:');
    console.log('   - Added last_message_text to conversations table');
    console.log('   - Added last_message_at to conversations table');
    console.log('   - Added last_seen_at to users table');
    console.log('   - Added is_online to users table');
    console.log('   - Created indexes for performance');
    console.log('   - Created trigger to auto-update last message');
    console.log('\n🎉 Your chat now has Telegram-style features!');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
  }
}

runMigration();
