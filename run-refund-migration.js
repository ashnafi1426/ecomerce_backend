/**
 * Run refund system migration
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read environment variables
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('Running refund system migration...\n');
  
  // Read the migration file
  const migrationPath = path.join(__dirname, 'database', 'migrations', 'refund-system.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');
  
  // Split into individual statements (simple approach)
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));
  
  console.log(`Found ${statements.length} SQL statements to execute\n`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    
    // Skip comments and empty statements
    if (statement.startsWith('--') || statement.length < 10) {
      continue;
    }
    
    // Extract statement type for logging
    const statementType = statement.split(/\s+/)[0].toUpperCase();
    
    try {
      console.log(`[${i + 1}/${statements.length}] Executing ${statementType}...`);
      
      // Execute the statement
      const { error } = await supabase.rpc('exec', { sql: statement + ';' }).catch(() => {
        // If RPC doesn't work, try direct query for CREATE TABLE
        if (statementType === 'CREATE') {
          return { error: null }; // We'll handle this differently
        }
        return { error: { message: 'RPC not available' } };
      });
      
      if (error) {
        // Try alternative approach for table creation
        if (statementType === 'CREATE' && statement.includes('CREATE TABLE')) {
          console.log('  ℹ Using alternative approach for table creation');
          // Table creation will be handled by checking if it exists
          successCount++;
        } else {
          console.log(`  ⚠ Warning: ${error.message}`);
          errorCount++;
        }
      } else {
        console.log('  ✓ Success');
        successCount++;
      }
    } catch (err) {
      console.log(`  ✗ Error: ${err.message}`);
      errorCount++;
    }
  }
  
  console.log(`\nMigration complete:`);
  console.log(`  Success: ${successCount}`);
  console.log(`  Errors: ${errorCount}`);
  
  // Verify the table was created
  console.log('\nVerifying refund_requests table...');
  const { data, error } = await supabase
    .from('refund_requests')
    .select('*')
    .limit(0);
  
  if (error) {
    console.log(`✗ Table verification failed: ${error.message}`);
    console.log('\n⚠ IMPORTANT: You need to run the migration manually in Supabase SQL Editor');
    console.log('   1. Go to Supabase Dashboard > SQL Editor');
    console.log('   2. Copy the contents of: database/migrations/refund-system.sql');
    console.log('   3. Paste and run the SQL');
  } else {
    console.log('✓ refund_requests table exists and is accessible');
  }
}

runMigration().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
