/**
 * RUN SELLER COLUMNS MIGRATION
 * Adds seller verification columns to users table
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
  console.log('🚀 Seller Columns Migration Instructions\n');

  const supabaseUrl = process.env.SUPABASE_URL;
  const projectRef = supabaseUrl.replace('https://', '').split('.')[0];

  console.log('📄 Loading migration file...');
  const migrationPath = path.join(__dirname, 'database', 'migrations', 'add-seller-columns-simple.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

  console.log('\n💡 Please run this SQL manually in Supabase Dashboard:\n');
  console.log('1. Go to: https://supabase.com/dashboard/project/' + projectRef + '/sql/new');
  console.log('2. Copy and paste the following SQL:\n');
  console.log('─'.repeat(60));
  console.log(migrationSQL);
  console.log('─'.repeat(60));
  console.log('\n3. Click "Run" to execute');
  console.log('4. Then run: node refresh-schema-cache.js');
  console.log('5. Finally run: node test-phase5-comprehensive.js\n');
}

runMigration()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  });
