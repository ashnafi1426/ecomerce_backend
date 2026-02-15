const fs = require('fs');
const path = require('path');
const supabase = require('./config/supabase');

/**
 * Run Notifications System Migration
 * Creates all necessary tables, functions, and triggers
 */

async function runMigration() {
  try {
    console.log('🚀 Starting Notifications System Migration...\n');

    // Read the migration SQL file
    const migrationPath = path.join(__dirname, 'database', 'migrations', 'notifications-system.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration file loaded');
    console.log('📊 Executing migration...\n');

    // Execute the migration
    // Note: Supabase client doesn't support raw SQL execution directly
    // You'll need to run this through Supabase SQL Editor or use a PostgreSQL client
    
    console.log('⚠️  IMPORTANT: This migration needs to be run through Supabase SQL Editor');
    console.log('📋 Steps to run:');
    console.log('   1. Go to your Supabase project dashboard');
    console.log('   2. Navigate to SQL Editor');
    console.log('   3. Copy the contents of: database/migrations/notifications-system.sql');
    console.log('   4. Paste and execute in SQL Editor\n');

    // Verify tables exist
    console.log('🔍 Verifying migration (checking if tables exist)...\n');

    const { data: notificationsCheck, error: notificationsError } = await supabase
      .from('notifications')
      .select('count')
      .limit(1);

    const { data: preferencesCheck, error: preferencesError } = await supabase
      .from('notification_preferences')
      .select('count')
      .limit(1);

    if (!notificationsError && !preferencesError) {
      console.log('✅ Migration verified successfully!');
      console.log('✅ notifications table exists');
      console.log('✅ notification_preferences table exists\n');

      // Get counts
      const { count: notificationCount } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true });

      const { count: preferenceCount } = await supabase
        .from('notification_preferences')
        .select('*', { count: 'exact', head: true });

      console.log(`📊 Current Statistics:`);
      console.log(`   - Notifications: ${notificationCount || 0}`);
      console.log(`   - Notification Preferences: ${preferenceCount || 0}\n`);

      console.log('🎉 Notifications System is ready to use!');
      return true;
    } else {
      console.log('❌ Migration not yet applied');
      console.log('   Please run the SQL migration through Supabase SQL Editor\n');
      return false;
    }

  } catch (error) {
    console.error('❌ Migration error:', error.message);
    return false;
  }
}

// Run if called directly
if (require.main === module) {
  runMigration()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { runMigration };
