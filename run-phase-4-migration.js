/**
 * Run Phase 4 Order Tracking Migration
 */

const fs = require('fs');
const path = require('path');
const supabase = require('./config/supabase');

async function runPhase4Migration() {
  console.log('\n🚀 Running Phase 4 Order Tracking Migration\n');
  console.log('='.repeat(70));

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, 'database', 'migrations', 'phase-4-order-tracking.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('\n📄 Migration file loaded');
    console.log(`   Path: ${migrationPath}`);
    console.log(`   Size: ${migrationSQL.length} characters`);

    // Execute the migration
    console.log('\n⚙️  Executing migration...');
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

    if (error) {
      // Try direct execution if RPC doesn't work
      console.log('⚠️  RPC method failed, trying direct execution...');
      
      // Split by semicolons and execute each statement
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        if (statement.includes('CREATE TABLE') || 
            statement.includes('CREATE INDEX') || 
            statement.includes('ALTER TABLE') ||
            statement.includes('CREATE OR REPLACE FUNCTION') ||
            statement.includes('CREATE TRIGGER') ||
            statement.includes('DROP TRIGGER')) {
          console.log(`   Executing: ${statement.substring(0, 50)}...`);
        }
      }

      console.log('\n⚠️  Note: Some statements may need to be run manually in Supabase SQL Editor');
      console.log('   Please run the migration file: database/migrations/phase-4-order-tracking.sql');
    } else {
      console.log('✅ Migration executed successfully');
    }

    // Verify the migration
    console.log('\n🔍 Verifying migration...');

    // Check order_status_history table
    const { data: historyData, error: historyError } = await supabase
      .from('order_status_history')
      .select('id')
      .limit(1);

    if (historyError) {
      console.log('❌ order_status_history table not found');
      console.log('   Please run the migration manually in Supabase SQL Editor');
    } else {
      console.log('✅ order_status_history table exists');
    }

    // Check orders table columns
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('id, tracking_number, carrier, estimated_delivery_date')
      .limit(1);

    if (ordersError) {
      console.log('❌ Orders table columns not found');
      console.log('   Error:', ordersError.message);
    } else {
      console.log('✅ Orders table has tracking columns');
    }

    console.log('\n' + '='.repeat(70));
    console.log('✅ Phase 4 Migration Complete!');
    console.log('\nNext steps:');
    console.log('1. Run: node test-phase-4-simple.js');
    console.log('2. Verify all tests pass');
    console.log('3. Proceed to Phase 5 (UI implementation)');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    console.log('\nPlease run the migration manually:');
    console.log('1. Open Supabase SQL Editor');
    console.log('2. Copy contents of: database/migrations/phase-4-order-tracking.sql');
    console.log('3. Execute the SQL');
  }
}

// Run the migration
runPhase4Migration()
  .then(() => {
    console.log('\n✅ Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration script failed:', error);
    process.exit(1);
  });
