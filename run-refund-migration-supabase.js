/**
 * Run Refund System Migration using Supabase
 */

require('dotenv').config();
const supabase = require('./config/supabase');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  console.log('='.repeat(60));
  console.log('RUNNING REFUND SYSTEM MIGRATION');
  console.log('='.repeat(60));
  console.log('');
  
  try {
    // Read migration file
    const migrationPath = path.join(__dirname, 'database', 'migrations', 'refund-system.sql');
    
    if (!fs.existsSync(migrationPath)) {
      throw new Error('Migration file not found: ' + migrationPath);
    }
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log('✓ Read migration file');
    console.log('  File size:', migrationSQL.length, 'bytes');
    console.log('');
    
    // Split SQL into individual statements (simple split by semicolon)
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`Found ${statements.length} SQL statements to execute`);
    console.log('');
    
    // Execute each statement using Supabase RPC
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip comments and empty statements
      if (statement.startsWith('--') || statement.trim().length === 0) {
        continue;
      }
      
      try {
        console.log(`Executing statement ${i + 1}/${statements.length}...`);
        
        // Use Supabase's rpc to execute raw SQL
        const { data, error } = await supabase.rpc('exec_sql', { 
          sql_query: statement + ';' 
        });
        
        if (error) {
          // Check if it's a "already exists" error which is okay
          if (error.message && error.message.includes('already exists')) {
            console.log(`  ⚠ Already exists (skipping)`);
          } else {
            console.error(`  ✗ Error:`, error.message);
            errorCount++;
          }
        } else {
          console.log(`  ✓ Success`);
          successCount++;
        }
      } catch (err) {
        console.error(`  ✗ Exception:`, err.message);
        errorCount++;
      }
    }
    
    console.log('');
    console.log('='.repeat(60));
    console.log(`Executed: ${successCount} successful, ${errorCount} errors`);
    console.log('='.repeat(60));
    console.log('');
    
    // Verify table was created
    console.log('Verifying table creation...');
    const { data, error } = await supabase
      .from('refund_requests')
      .select('id')
      .limit(1);
    
    if (error) {
      if (error.code === 'PGRST205' || error.code === '42P01') {
        console.log('❌ Table was not created. Manual migration required.');
        console.log('');
        console.log('Please run the SQL migration manually:');
        console.log('1. Open Supabase Dashboard');
        console.log('2. Go to SQL Editor');
        console.log('3. Copy and paste the contents of:');
        console.log('   database/migrations/refund-system.sql');
        console.log('4. Execute the SQL');
      } else {
        console.error('❌ Error verifying table:', error.message);
      }
    } else {
      console.log('✅ Table verified successfully!');
    }
    
  } catch (error) {
    console.error('');
    console.error('='.repeat(60));
    console.error('❌ MIGRATION FAILED');
    console.error('='.repeat(60));
    console.error('Error:', error.message);
    console.error('');
    console.error('Please run the migration manually in Supabase SQL Editor:');
    console.error('File: database/migrations/refund-system.sql');
  }
}

runMigration();
