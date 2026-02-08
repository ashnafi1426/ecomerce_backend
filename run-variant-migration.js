/**
 * Run Product Variants Migration
 * 
 * This script applies the product variants tables migration to the database.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runMigration() {
  console.log('🚀 Running Product Variants Migration...\n');

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, 'database', 'migrations', 'create-product-variants.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration file loaded:', migrationPath);
    console.log('📏 SQL length:', migrationSQL.length, 'characters\n');

    // Split the SQL into individual statements
    // We need to handle this carefully because of the function definitions
    const statements = migrationSQL
      .split(/;\s*(?=CREATE|ALTER|COMMENT|DO|--)/g)
      .filter(stmt => stmt.trim() && !stmt.trim().startsWith('--'))
      .map(stmt => stmt.trim() + (stmt.trim().endsWith(';') ? '' : ';'));

    console.log('📊 Found', statements.length, 'SQL statements to execute\n');

    // Execute each statement
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip empty statements and comments
      if (!statement || statement.trim().startsWith('--')) {
        continue;
      }

      // Get a preview of the statement
      const preview = statement.substring(0, 80).replace(/\s+/g, ' ');
      console.log(`${i + 1}/${statements.length} Executing: ${preview}...`);

      try {
        // For Supabase, we need to use the REST API to execute raw SQL
        // This is a workaround since Supabase doesn't expose direct SQL execution
        const { data, error } = await supabase.rpc('exec_sql', {
          sql: statement
        }).catch(async (err) => {
          // If exec_sql doesn't exist, we'll need to use a different approach
          // Try using the SQL editor endpoint directly
          const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
              'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
            },
            body: JSON.stringify({ sql: statement })
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${await response.text()}`);
          }

          return { data: await response.json(), error: null };
        });

        if (error) {
          console.log(`   ⚠️  Warning: ${error.message}`);
          errorCount++;
        } else {
          console.log('   ✅ Success');
          successCount++;
        }
      } catch (error) {
        console.log(`   ⚠️  Error: ${error.message}`);
        errorCount++;
        
        // Continue with other statements even if one fails
        // (some might fail if tables already exist)
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('Migration Execution Summary:');
    console.log(`  ✅ Successful: ${successCount}`);
    console.log(`  ⚠️  Warnings/Errors: ${errorCount}`);
    console.log('='.repeat(60));

    console.log('\n📝 Note: Some errors are expected if tables already exist.');
    console.log('   Run the verification script to confirm the migration:');
    console.log('   node verify-variant-migration.js\n');

  } catch (error) {
    console.error('\n❌ Migration failed with error:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Alternative: Direct SQL execution via Supabase SQL Editor
async function runMigrationDirect() {
  console.log('\n💡 Alternative Method: Manual Migration');
  console.log('='.repeat(60));
  console.log('If the automatic migration fails, you can run it manually:');
  console.log('');
  console.log('1. Go to your Supabase Dashboard');
  console.log('2. Navigate to SQL Editor');
  console.log('3. Copy the contents of:');
  console.log('   database/migrations/create-product-variants.sql');
  console.log('4. Paste and run in the SQL Editor');
  console.log('5. Run: node verify-variant-migration.js');
  console.log('='.repeat(60));
}

// Run migration
console.log('Product Variants Migration Runner');
console.log('='.repeat(60));
console.log('This will create the following tables:');
console.log('  • product_variants');
console.log('  • variant_inventory');
console.log('And update:');
console.log('  • cart_items (add variant_id column)');
console.log('='.repeat(60));
console.log('');

runMigration().then(() => {
  runMigrationDirect();
});
