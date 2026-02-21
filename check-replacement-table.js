/**
 * Check if replacement_requests table exists and run migration if needed
 */

const supabase = require('./config/supabase');
const fs = require('fs');
const path = require('path');

async function checkAndCreateTable() {
  console.log('🔍 Checking replacement_requests table...\n');
  
  try {
    // Try to query the table
    const { data, error } = await supabase
      .from('replacement_requests')
      .select('id')
      .limit(1);
    
    if (error) {
      if (error.message.includes('does not exist') || error.code === '42P01') {
        console.log('❌ Table does not exist. Running migration...\n');
        
        // Read and execute migration
        const migrationPath = path.join(__dirname, 'database', 'migrations', 'replacement-system.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
        
        console.log('📝 Executing migration SQL...');
        
        // Execute via Supabase RPC or direct SQL
        const { error: migrationError } = await supabase.rpc('exec_sql', { sql: migrationSQL });
        
        if (migrationError) {
          console.error('❌ Migration failed:', migrationError.message);
          console.log('\n💡 Please run the migration manually:');
          console.log(`   File: ${migrationPath}`);
          process.exit(1);
        }
        
        console.log('✅ Migration completed successfully!');
      } else {
        console.error('❌ Error querying table:', error.message);
        process.exit(1);
      }
    } else {
      console.log('✅ Table exists!');
      console.log(`   Found ${data ? data.length : 0} records`);
      
      // Check table schema
      const { data: schemaData, error: schemaError } = await supabase
        .from('replacement_requests')
        .select('*')
        .limit(0);
      
      if (!schemaError) {
        console.log('\n✅ Table schema is accessible');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
  
  process.exit(0);
}

checkAndCreateTable();
