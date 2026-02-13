/**
 * Run Commission Settings Migration
 * Adds missing seller_tier_rates and tier_thresholds columns
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runCommissionMigration() {
  try {
    console.log('🚀 Running commission settings migration...\n');

    // Read the migration SQL file
    const migrationPath = path.join(__dirname, 'database', 'migrations', 'add-commission-tier-columns.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📝 Executing migration SQL...');
    
    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: migrationSQL
    });

    if (error) {
      console.error('❌ Migration failed:', error);
      return;
    }

    console.log('✅ Migration executed successfully');

    // Verify the migration by checking the updated schema
    console.log('\n🔍 Verifying migration...');
    
    const { data: verifyData, error: verifyError } = await supabase
      .from('commission_settings')
      .select('*')
      .limit(1);

    if (verifyError) {
      console.error('❌ Verification failed:', verifyError);
      return;
    }

    if (verifyData && verifyData.length > 0) {
      console.log('✅ Migration verified successfully');
      console.log('📊 Updated schema columns:');
      const columns = Object.keys(verifyData[0]);
      columns.forEach(col => {
        console.log(`   - ${col}`);
      });
      
      console.log('\n📋 Sample data:');
      console.log('   seller_tier_rates:', verifyData[0].seller_tier_rates);
      console.log('   tier_thresholds:', verifyData[0].tier_thresholds);
    }

    console.log('\n🎉 Commission settings migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration error:', error.message);
  }
}

runCommissionMigration();