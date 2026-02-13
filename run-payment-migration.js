const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://your-project.supabase.co',
  process.env.SUPABASE_ANON_KEY || 'your-anon-key'
);

async function runPaymentMigration() {
  console.log('🔧 Running Payment System Migration...');
  
  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, 'database/migrations/simple-payment-columns-fix.sql');
    
    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Migration file not found:', migrationPath);
      return;
    }
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log('📄 Migration file loaded');
    console.log('📝 SQL Preview:');
    console.log(migrationSQL.substring(0, 200) + '...');
    
    // Split SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`\n🔄 Executing ${statements.length} SQL statements...`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      if (statement.includes('DO $$')) {
        // Handle DO blocks specially
        const fullBlock = statements.slice(i, i + 3).join(';');
        console.log(`\n📝 Executing DO block...`);
        
        try {
          const { error } = await supabase.rpc('exec_sql', {
            sql_query: fullBlock
          });
          
          if (error) {
            console.error(`❌ Error in DO block:`, error.message);
            errorCount++;
          } else {
            console.log(`✅ DO block executed successfully`);
            successCount++;
          }
        } catch (err) {
          console.error(`❌ Exception in DO block:`, err.message);
          errorCount++;
        }
        
        i += 2; // Skip the next statements as they're part of the DO block
        continue;
      }
      
      if (statement.length < 10) continue; // Skip very short statements
      
      console.log(`\n📝 Executing statement ${i + 1}/${statements.length}:`);
      console.log(statement.substring(0, 100) + (statement.length > 100 ? '...' : ''));
      
      try {
        const { data, error } = await supabase.rpc('exec_sql', {
          sql_query: statement + ';'
        });
        
        if (error) {
          console.error(`❌ Error:`, error.message);
          errorCount++;
        } else {
          console.log(`✅ Success`);
          successCount++;
        }
      } catch (err) {
        console.error(`❌ Exception:`, err.message);
        errorCount++;
      }
    }
    
    console.log('\n📊 Migration Results:');
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${errorCount}`);
    
    if (errorCount === 0) {
      console.log('\n🎉 Migration completed successfully!');
      
      // Test the new tables
      await testNewTables();
    } else {
      console.log('\n⚠️  Migration completed with errors. Please check the logs.');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  }
}

async function testNewTables() {
  console.log('\n🔍 Testing new payment system tables...');
  
  const tablesToTest = [
    'payments',
    'seller_earnings', 
    'sub_orders',
    'payouts',
    'commission_settings'
  ];
  
  for (const table of tablesToTest) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
      } else {
        console.log(`✅ ${table}: Table accessible`);
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err.message}`);
    }
  }
  
  // Test commission settings data
  try {
    const { data: commissionData, error: commissionError } = await supabase
      .from('commission_settings')
      .select('*');
    
    if (commissionError) {
      console.log('❌ Commission settings: No data found');
    } else if (commissionData && commissionData.length > 0) {
      console.log('✅ Commission settings: Default data inserted');
      console.log(`   Default rate: ${commissionData[0].default_rate}%`);
    }
  } catch (err) {
    console.log('❌ Commission settings test failed:', err.message);
  }
}

// Run migration if called directly
if (require.main === module) {
  runPaymentMigration().catch(console.error);
}

module.exports = { runPaymentMigration };