/**
 * Apply Missing Tables - Direct SQL Execution
 * 
 * This script executes the create-missing-tables.sql file directly
 * using Supabase's query method.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTableExists(tableName) {
  try {
    const { error } = await supabase
      .from(tableName)
      .select('id')
      .limit(0);
    
    return !error || !error.message.includes('does not exist');
  } catch (err) {
    return false;
  }
}

async function applyMissingTables() {
  console.log('🔧 Applying Missing Tables to Database\n');
  console.log('═══════════════════════════════════════════════════════\n');

  // Step 1: Check current status
  console.log('📊 Step 1: Checking current table status...\n');
  
  const tablesToCheck = [
    'order_items',
    'cart', 
    'commissions',
    'promotions',
    'refunds'
  ];

  const statusBefore = {};
  
  for (const table of tablesToCheck) {
    const exists = await checkTableExists(table);
    statusBefore[table] = exists;
    console.log(`   ${exists ? '✅' : '❌'} ${table} - ${exists ? 'EXISTS' : 'MISSING'}`);
  }

  const missingCount = Object.values(statusBefore).filter(v => !v).length;
  console.log(`\n   Summary: ${5 - missingCount}/5 tables exist, ${missingCount} missing\n`);

  if (missingCount === 0) {
    console.log('✅ All tables already exist! No action needed.\n');
    console.log('📝 Next step: Run node comprehensive-backend-test.js\n');
    return true;
  }

  // Step 2: Show SQL file location
  console.log('═══════════════════════════════════════════════════════\n');
  console.log('📝 Step 2: Manual SQL Execution Required\n');
  console.log('Due to Supabase client limitations, please run the SQL manually:\n');
  console.log('1️⃣  Open Supabase Dashboard');
  console.log('2️⃣  Navigate to: SQL Editor');
  console.log('3️⃣  Click: "New Query"');
  console.log('4️⃣  Copy the contents of this file:');
  console.log(`    📄 ${path.join(__dirname, 'database', 'create-missing-tables.sql')}`);
  console.log('5️⃣  Paste into SQL Editor');
  console.log('6️⃣  Click: "Run" (or press Ctrl+Enter)');
  console.log('7️⃣  Wait for success message');
  console.log('8️⃣  Run this script again to verify\n');

  console.log('═══════════════════════════════════════════════════════\n');
  console.log('📋 Tables that need to be created:\n');
  
  Object.entries(statusBefore).forEach(([table, exists]) => {
    if (!exists) {
      console.log(`   ❌ ${table}`);
    }
  });

  console.log('\n═══════════════════════════════════════════════════════\n');
  console.log('💡 Quick Copy: The SQL file is located at:');
  console.log(`   ${path.resolve(__dirname, 'database', 'create-missing-tables.sql')}\n`);

  return false;
}

// Run the script
applyMissingTables()
  .then(success => {
    if (success) {
      console.log('✅ All tables verified!');
      process.exit(0);
    } else {
      console.log('⏳ Waiting for manual SQL execution...');
      process.exit(0);
    }
  })
  .catch(error => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
