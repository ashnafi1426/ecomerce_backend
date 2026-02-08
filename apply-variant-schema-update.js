/**
 * Apply Product Variants Schema Update
 * 
 * This script applies the update migration programmatically
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyUpdate() {
  console.log('🔄 Applying Product Variants Schema Update...\n');

  try {
    const migrationPath = path.join(__dirname, 'database', 'migrations', 'update-product-variants-schema.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration file loaded');
    console.log('📏 SQL length:', migrationSQL.length, 'characters\n');

    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log('📝 Found', statements.length, 'SQL statements\n');
    console.log('⏳ Executing migration...\n');

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip comments and empty statements
      if (statement.startsWith('--') || statement.trim().length === 0) {
        continue;
      }

      try {
        const { error } = await supabase.rpc('exec_sql', { 
          sql_query: statement + ';' 
        });

        if (error) {
          // Some errors are expected (like "column already exists")
          if (error.message.includes('already exists') || 
              error.message.includes('does not exist')) {
            console.log(`⚠️  Statement ${i + 1}: ${error.message.substring(0, 80)}...`);
          } else {
            console.log(`❌ Statement ${i + 1} failed:`, error.message);
            errorCount++;
          }
        } else {
          successCount++;
        }
      } catch (err) {
        console.log(`❌ Statement ${i + 1} error:`, err.message);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('Migration Summary:');
    console.log(`  ✅ Successful: ${successCount}`);
    console.log(`  ⚠️  Warnings/Skipped: ${statements.length - successCount - errorCount}`);
    console.log(`  ❌ Errors: ${errorCount}`);
    console.log('='.repeat(60));

    if (errorCount === 0) {
      console.log('\n✅ Migration applied successfully!');
      console.log('\n📝 Next steps:');
      console.log('   1. Run: node refresh-schema-cache.js');
      console.log('   2. Run: node verify-variant-migration.js');
      console.log('   3. Test with: node test-variant-crud.js');
    } else {
      console.log('\n⚠️  Migration completed with some errors');
      console.log('   Please review the errors above');
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

applyUpdate()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
