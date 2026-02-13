const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.error('Required: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runPhase1PaymentMigrationFixed() {
  try {
    console.log('🚀 STARTING PHASE 1: PAYMENT SYSTEM DATABASE MIGRATION (FIXED)');
    console.log('==============================================================\n');

    // Read the FIXED migration SQL file
    const migrationPath = path.join(__dirname, 'database', 'migrations', 'phase-1-payment-system-tables-fixed.sql');
    
    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Fixed migration file not found:', migrationPath);
      process.exit(1);
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Fixed migration file loaded:', migrationPath);
    console.log('📊 SQL size:', (migrationSQL.length / 1024).toFixed(2), 'KB\n');

    // Split SQL into individual statements to avoid issues
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log('📝 Found', statements.length, 'SQL statements to execute\n');

    // Execute statements one by one
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip comments and empty statements
      if (statement.startsWith('--') || statement.trim().length === 0) {
        continue;
      }

      try {
        console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
        
        // Use raw SQL execution
        const { error } = await supabase.rpc('exec_sql', { 
          sql: statement + ';' 
        });

        if (error) {
          // Some errors are expected (like table already exists)
          if (error.message.includes('already exists') || 
              error.message.includes('duplicate') ||
              error.message.includes('does not exist')) {
            console.log(`   ⚠️  Expected: ${error.message.substring(0, 100)}...`);
          } else {
            console.log(`   ❌ Error: ${error.message.substring(0, 100)}...`);
            errorCount++;
          }
        } else {
          console.log(`   ✅ Success`);
          successCount++;
        }
      } catch (err) {
        console.log(`   ❌ Exception: ${err.message.substring(0, 100)}...`);
        errorCount++;
      }
    }

    console.log(`\n📊 EXECUTION SUMMARY:`);
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📝 Total: ${statements.length}`);

    // Verify tables were created/updated
    console.log('\n🔍 Verifying table status...');
    
    const tablesToCheck = [
      'payments',
      'seller_earnings', 
      'payouts',
      'seller_bank_accounts',
      'commission_settings',
      'payout_settings',
      'payment_methods_config',
      'refunds',
      'returns',
      'disputes'
    ];

    let tablesOk = 0;
    for (const table of tablesToCheck) {
      try {
        const { error: checkError } = await supabase
          .from(table)
          .select('*')
          .limit(1);

        if (!checkError) {
          console.log(`   ✅ Table '${table}' accessible`);
          tablesOk++;
        } else {
          console.log(`   ❌ Table '${table}' error: ${checkError.message.substring(0, 50)}...`);
        }
      } catch (err) {
        console.log(`   ❌ Table '${table}' exception: ${err.message.substring(0, 50)}...`);
      }
    }

    // Check sub_orders payment columns
    console.log('\n🔍 Checking sub_orders payment columns...');
    try {
      const { data: subOrderSample } = await supabase
        .from('sub_orders')
        .select('commission_rate, commission_amount, seller_payout, payment_status, payout_status')
        .limit(1);

      if (subOrderSample !== null) {
        console.log('   ✅ Sub_orders payment columns accessible');
      }
    } catch (err) {
      console.log('   ❌ Sub_orders payment columns issue:', err.message.substring(0, 50));
    }

    console.log('\n🎉 PHASE 1 MIGRATION COMPLETED!');
    console.log('===============================');
    console.log(`   📊 Tables accessible: ${tablesOk}/${tablesToCheck.length}`);
    
    if (tablesOk === tablesToCheck.length) {
      console.log('   🚀 READY FOR PHASE 2: Payment Processing Implementation');
      console.log('\n📝 NEXT STEPS:');
      console.log('   1. Run: node test-phase-1-database.js');
      console.log('   2. Continue with seller dashboard fixes');
      console.log('   3. Implement payment processing controllers');
    } else {
      console.log('   ⚠️  Some tables may need manual fixes');
      console.log('   🔧 Check the errors above and fix manually if needed');
    }

  } catch (error) {
    console.error('💥 MIGRATION FAILED:', error.message);
    console.error('');
    console.error('🔧 TROUBLESHOOTING:');
    console.error('   1. Check Supabase credentials in .env file');
    console.error('   2. Ensure database is accessible');
    console.error('   3. Check for SQL syntax errors');
    console.error('   4. Verify table permissions');
    process.exit(1);
  }
}

// Run the migration
runPhase1PaymentMigrationFixed();