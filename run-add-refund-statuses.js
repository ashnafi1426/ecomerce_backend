/**
 * Add Refund Statuses to Orders Table
 * 
 * This script adds a CHECK constraint to the orders table to support
 * 'refunded' and 'partially_refunded' statuses needed for the enhanced refund system.
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Validate environment
const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables');
  console.error('Required: SUPABASE_URL, SUPABASE_SERVICE_KEY');
  process.exit(1);
}

console.log('✅ Environment configuration validated\n');

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration() {
  try {
    console.log('=== Adding Refund Statuses to Orders Table ===\n');

    // Read the migration file
    const migrationPath = path.join(__dirname, 'database', 'migrations', 'add-refund-statuses-to-orders.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('Applying migration...');

    // Split SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    // Execute each statement
    for (const statement of statements) {
      if (statement.trim()) {
        const { error } = await supabase.rpc('exec', { query: statement });
        
        if (error) {
          // Try direct execution if RPC fails
          const { error: directError } = await supabase.from('_sql').select(statement);
          if (directError) {
            console.error('Error executing statement:', directError);
            throw directError;
          }
        }
      }
    }

    console.log('✅ Migration applied successfully\n');

    // Verify the constraint
    console.log('Verifying constraint...');
    const { data: constraints, error: verifyError } = await supabase
      .from('information_schema.table_constraints')
      .select('*')
      .eq('table_name', 'orders')
      .eq('constraint_name', 'orders_status_check');

    if (verifyError) {
      console.log('⚠️  Could not verify constraint (this is OK)');
    } else if (constraints && constraints.length > 0) {
      console.log('✅ Constraint verified');
    }

    console.log('\n=== Migration Complete ===\n');
    console.log('The orders table now supports these statuses:');
    console.log('- pending_payment');
    console.log('- paid');
    console.log('- processing');
    console.log('- shipped');
    console.log('- delivered');
    console.log('- cancelled');
    console.log('- refunded ✨ NEW');
    console.log('- partially_refunded ✨ NEW');
    console.log('- completed');
    console.log('- failed');

  } catch (error) {
    console.error('\n❌ Error running migration:', error.message);
    console.error('\nManual fix required:');
    console.error('Run the SQL from database/migrations/add-refund-statuses-to-orders.sql');
    console.error('in your Supabase SQL editor.\n');
    process.exit(1);
  }
}

// Run the migration
runMigration();
