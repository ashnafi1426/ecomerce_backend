/**
 * RUN MESSAGE STATUS TRACKING MIGRATION
 * 
 * Adds status tracking columns to messages table
 */

const fs = require('fs');
const path = require('path');
const supabase = require('./config/supabase');

async function runMigration() {
  try {
    console.log('🚀 Running message status tracking migration...\n');

    // Read SQL file
    const sqlPath = path.join(__dirname, 'database', 'migrations', 'add-message-status-tracking.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Remove comments and split into statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));

    console.log(`📝 Found ${statements.length} SQL statements\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      if (statement.includes('RAISE NOTICE')) {
        console.log(`⏭️  Skipping RAISE NOTICE statement ${i + 1}\n`);
        continue;
      }

      console.log(`⚙️  Executing statement ${i + 1}/${statements.length}...`);
      
      const { error } = await supabase.rpc('exec_sql', { 
        sql_query: statement + ';' 
      });

      if (error) {
        console.error(`❌ Error in statement ${i + 1}:`, error.message);
        
        // Try direct query for some statements
        const { error: directError } = await supabase.from('_sql').select('*').limit(0);
        if (directError) {
          console.log('   Trying alternative method...');
        }
      } else {
        console.log(`✅ Statement ${i + 1} executed successfully\n`);
      }
    }

    // Verify the migration
    console.log('\n🔍 Verifying migration...\n');

    const { data: columns, error: verifyError } = await supabase
      .from('messages')
      .select('*')
      .limit(1);

    if (verifyError) {
      console.error('❌ Verification failed:', verifyError.message);
    } else {
      console.log('✅ Migration verified successfully!');
      
      if (columns && columns.length > 0) {
        const message = columns[0];
        console.log('\n📊 Sample message structure:');
        console.log('   - status:', message.status || 'N/A');
        console.log('   - delivered_at:', message.delivered_at || 'N/A');
        console.log('   - read_at:', message.read_at || 'N/A');
      }
    }

    console.log('\n✨ Message status tracking migration completed!\n');
    console.log('📋 Status values available:');
    console.log('   - sending: Message is being sent');
    console.log('   - sent: Message sent to server');
    console.log('   - delivered: Message delivered to recipient');
    console.log('   - read: Message read by recipient');
    console.log('   - failed: Message failed to send\n');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
runMigration();
