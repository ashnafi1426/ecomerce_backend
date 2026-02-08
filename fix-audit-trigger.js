/**
 * Fix Audit Trigger Function
 * Applies the fix for audit_log column names in the database trigger
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixAuditTrigger() {
  console.log('🔧 Fixing Audit Trigger Function...\n');

  try {
    // Read the fix SQL file
    const sqlPath = path.join(__dirname, 'database', 'migrations', 'fix-audit-trigger.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('📄 SQL Script loaded');
    console.log('📝 Executing fix...\n');

    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`Found ${statements.length} SQL statements to execute\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip comments and empty statements
      if (statement.startsWith('--') || statement.length < 10) {
        continue;
      }

      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      
      const { data, error } = await supabase.rpc('exec_sql', {
        query: statement + ';'
      });

      if (error) {
        console.error(`❌ Error in statement ${i + 1}:`, error.message);
        console.error('Statement:', statement.substring(0, 100) + '...');
        
        // If RPC doesn't exist, provide manual instructions
        if (error.message.includes('function') && error.message.includes('does not exist')) {
          console.log('\n⚠️  The exec_sql RPC function is not available.');
          console.log('📋 Please run the fix-audit-trigger.sql script manually in Supabase SQL Editor:');
          console.log(`   File: ${sqlPath}`);
          console.log('\n📝 Steps:');
          console.log('   1. Open Supabase Dashboard');
          console.log('   2. Go to SQL Editor');
          console.log('   3. Copy and paste the contents of fix-audit-trigger.sql');
          console.log('   4. Click "Run"');
          return;
        }
        
        throw error;
      }

      if (data) {
        console.log(`✅ Statement ${i + 1} executed successfully`);
        if (Array.isArray(data) && data.length > 0) {
          console.log('   Result:', JSON.stringify(data[0], null, 2));
        }
      }
    }

    console.log('\n✅ Audit trigger function fixed successfully!');
    console.log('\n📋 Next steps:');
    console.log('   1. Restart the backend server');
    console.log('   2. Run Phase 2 tests: npm run test:phase2');

  } catch (err) {
    console.error('\n❌ Error:', err.message);
    console.error('\n📋 Manual fix required:');
    console.error('   Run the SQL script in Supabase SQL Editor:');
    console.error('   File: database/migrations/fix-audit-trigger.sql');
  }
}

fixAuditTrigger()
  .then(() => {
    console.log('\n✅ Complete');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Fatal error:', err);
    process.exit(1);
  });
