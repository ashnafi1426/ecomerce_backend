const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL
});

async function runChatMigration() {
  console.log('🚀 Running Live Chat System Migration...\n');

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, 'database', 'migrations', 'live-chat-system.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration file loaded');
    console.log('🔄 Executing migration...\n');

    // Execute the migration
    await pool.query(migrationSQL);

    console.log('✅ Migration completed successfully!\n');
    console.log('📊 Created tables:');
    console.log('   ✓ conversations');
    console.log('   ✓ messages');
    console.log('   ✓ typing_indicators');
    console.log('   ✓ user_online_status');
    console.log('\n📊 Created views:');
    console.log('   ✓ conversation_participants');
    console.log('   ✓ unread_message_counts');
    console.log('\n⚡ Created functions:');
    console.log('   ✓ is_conversation_participant()');
    console.log('   ✓ mark_messages_as_read()');
    console.log('\n🎉 Live chat system database is ready!');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\nError details:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runChatMigration();
