/**
 * RUN SELLER PAYMENT SYSTEM MIGRATION
 * 
 * This script runs the seller payment system migration
 * and verifies all tables are created correctly
 */

const fs = require('fs');
const path = require('path');
const supabase = require('./config/supabase');

async function runMigration() {
  console.log('🚀 RUNNING SELLER PAYMENT SYSTEM MIGRATION\n');
  console.log('='.repeat(60));
  
  try {
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, 'database', 'migrations', 'seller-payment-system.sql');
    
    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Migration file not found:', migrationPath);
      return false;
    }
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('\n📋 Step 1: Running migration SQL...');
    console.log('   File:', migrationPath);
    
    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: migrationSQL
    });
    
    if (error) {
      // If RPC doesn't exist, try direct execution (this won't work with Supabase client)
      console.log('⚠️  RPC method not available, migration must be run in Supabase SQL Editor');
      console.log('\n📝 INSTRUCTIONS:');
      console.log('1. Open your Supabase Dashboard');
      console.log('2. Go to SQL Editor');
      console.log('3. Copy and paste the contents of:');
      console.log(`   ${migrationPath}`);
      console.log('4. Click "Run"');
      console.log('\n✅ After running the migration, run this script again to verify');
      return false;
    }
    
    console.log('✅ Migration executed successfully');
    
    // Verify tables were created
    console.log('\n📋 Step 2: Verifying tables...');
    
    const tablesToCheck = [
      'sub_orders',
      'seller_earnings',
      'payouts',
      'seller_bank_accounts',
      'commission_settings'
    ];
    
    for (const tableName of tablesToCheck) {
      const { data: testData, error: testError } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (testError && testError.message.includes('relation') && testError.message.includes('does not exist')) {
        console.log(`❌ Table ${tableName} does not exist`);
        return false;
      } else {
        console.log(`✅ Table ${tableName} exists`);
      }
    }
    
    // Check for status columns
    console.log('\n📋 Step 3: Verifying status columns...');
    
    const statusTables = [
      { table: 'sub_orders', column: 'status' },
      { table: 'seller_earnings', column: 'status' },
      { table: 'payouts', column: 'status' }
    ];
    
    for (const { table, column } of statusTables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select(column)
          .limit(1);
        
        if (error && error.message.includes('column') && error.message.includes('does not exist')) {
          console.log(`❌ Column ${column} missing in ${table}`);
          return false;
        } else {
          console.log(`✅ Column ${column} exists in ${table}`);
        }
      } catch (err) {
        console.log(`⚠️  Could not verify ${column} in ${table}:`, err.message);
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ MIGRATION COMPLETED SUCCESSFULLY');
    console.log('='.repeat(60));
    
    return true;
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('Stack:', error.stack);
    return false;
  }
}

// Run the migration
runMigration()
  .then((success) => {
    if (success) {
      console.log('\n✅ All seller payment tables are ready!');
      console.log('\n📝 Next steps:');
      console.log('1. Test seller payment APIs');
      console.log('2. Implement seller payment dashboard');
      console.log('3. Implement admin payout management');
    } else {
      console.log('\n⚠️  Migration needs to be run manually in Supabase SQL Editor');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('\n❌ Script failed:', error.message);
    process.exit(1);
  });
