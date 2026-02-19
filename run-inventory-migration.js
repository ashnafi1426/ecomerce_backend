/**
 * Run Inventory Migration - Add created_at Column
 * 
 * This script adds the missing created_at column to the inventory table
 */

const fs = require('fs');
const path = require('path');
const supabase = require('./config/supabase');

async function runMigration() {
  console.log('🔧 Running Inventory Migration\n');
  console.log('=' .repeat(60));

  try {
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, 'database', 'migrations', 'add-inventory-created-at.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('\n📄 Migration SQL:');
    console.log(migrationSQL);
    console.log('\n' + '='.repeat(60));

    // Execute the migration
    console.log('\n⚙️  Executing migration...\n');

    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: migrationSQL
    });

    if (error) {
      // Try direct query if RPC doesn't work
      console.log('⚠️  RPC method not available, trying direct query...\n');
      
      // Split SQL into individual statements
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        if (statement.toLowerCase().includes('select')) {
          const { data: selectData, error: selectError } = await supabase
            .from('inventory')
            .select('created_at')
            .limit(1);
          
          if (selectError) {
            console.log('❌ Column check failed:', selectError.message);
          } else {
            console.log('✅ created_at column exists');
          }
        }
      }
    } else {
      console.log('✅ Migration executed successfully');
      if (data) {
        console.log('   Result:', data);
      }
    }

    // Verify the column was added
    console.log('\n🔍 Verifying migration...\n');
    
    const { data: verifyData, error: verifyError } = await supabase
      .from('inventory')
      .select('id, product_id, quantity, created_at, updated_at')
      .limit(1);

    if (verifyError) {
      console.error('❌ Verification failed:', verifyError.message);
      console.error('   Code:', verifyError.code);
      
      if (verifyError.message.includes('created_at')) {
        console.log('\n❌ MIGRATION FAILED: created_at column still missing');
        console.log('\n📋 Manual Fix Required:');
        console.log('   Run this SQL in your Supabase SQL Editor:');
        console.log('\n   ALTER TABLE inventory ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();');
        console.log('   UPDATE inventory SET created_at = updated_at WHERE created_at IS NULL;');
      }
    } else {
      console.log('✅ Migration verified successfully');
      console.log('\n📋 Sample inventory record:');
      if (verifyData && verifyData.length > 0) {
        console.log(JSON.stringify(verifyData[0], null, 2));
      } else {
        console.log('   No inventory records found');
      }
    }

  } catch (error) {
    console.error('\n❌ Migration error:', error.message);
    console.error('   Stack:', error.stack);
  }

  console.log('\n' + '='.repeat(60));
  console.log('🏁 Migration Complete\n');
}

// Run the migration
runMigration();
