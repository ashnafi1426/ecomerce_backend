/**
 * Check Commission Settings Table Schema
 * Verify what columns exist in the commission_settings table
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkCommissionSettingsSchema() {
  try {
    console.log('🔍 Checking commission_settings table schema...\n');

    // Get table schema information
    const { data, error } = await supabase
      .from('commission_settings')
      .select('*')
      .limit(1);

    if (error) {
      console.error('Error querying table:', error);
      return;
    }

    if (data && data.length > 0) {
      console.log('✅ Table exists with columns:');
      const columns = Object.keys(data[0]);
      columns.forEach(col => {
        console.log(`   - ${col}: ${typeof data[0][col]} (${data[0][col]})`);
      });
    } else {
      console.log('📝 Table exists but is empty');
    }

    console.log('\n💡 Expected columns for commission settings:');
    console.log('   - id (uuid)');
    console.log('   - default_rate (numeric)');
    console.log('   - category_rates (jsonb)');
    console.log('   - seller_tier_rates (jsonb) - MISSING');
    console.log('   - tier_thresholds (jsonb) - MISSING');
    console.log('   - updated_at (timestamp)');
    console.log('   - updated_by (uuid)');

  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkCommissionSettingsSchema();