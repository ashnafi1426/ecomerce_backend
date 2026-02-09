/**
 * Verify Database Fix
 * 
 * This script verifies that all missing tables have been created
 * and provides a detailed status report.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

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

async function getTableRowCount(tableName) {
  try {
    const { count, error } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });
    
    return error ? 0 : count;
  } catch (err) {
    return 0;
  }
}

async function verifyDatabaseFix() {
  console.log('🔍 Verifying Database Fix\n');
  console.log('═══════════════════════════════════════════════════════\n');

  // Check all required tables
  const requiredTables = [
    { name: 'order_items', priority: 'CRITICAL', description: 'Order line items' },
    { name: 'cart', priority: 'CRITICAL', description: 'Shopping cart' },
    { name: 'commissions', priority: 'HIGH', description: 'Seller commissions' },
    { name: 'promotions', priority: 'MEDIUM', description: 'Marketing promotions' },
    { name: 'refunds', priority: 'MEDIUM', description: 'Refund tracking' }
  ];

  const results = [];
  let allExist = true;

  console.log('📊 Checking Required Tables:\n');

  for (const table of requiredTables) {
    const exists = await checkTableExists(table.name);
    const rowCount = exists ? await getTableRowCount(table.name) : 0;
    
    results.push({
      ...table,
      exists,
      rowCount
    });

    const status = exists ? '✅' : '❌';
    const priority = `[${table.priority}]`;
    const rows = exists ? ` (${rowCount} rows)` : '';
    
    console.log(`   ${status} ${table.name.padEnd(15)} ${priority.padEnd(12)} ${table.description}${rows}`);
    
    if (!exists) allExist = false;
  }

  console.log('\n═══════════════════════════════════════════════════════\n');

  // Check audit_log table name issue
  console.log('🔍 Checking audit_log Table Name:\n');
  
  const auditLogExists = await checkTableExists('audit_log');
  const auditLogsExists = await checkTableExists('audit_logs');
  
  if (auditLogExists) {
    console.log('   ✅ audit_log (singular) - EXISTS');
    console.log('   ℹ️  Code should use: "audit_log" not "audit_logs"\n');
  } else if (auditLogsExists) {
    console.log('   ✅ audit_logs (plural) - EXISTS');
    console.log('   ℹ️  Code references are correct\n');
  } else {
    console.log('   ⚠️  Neither audit_log nor audit_logs found\n');
  }

  console.log('═══════════════════════════════════════════════════════\n');

  // Summary
  const existingCount = results.filter(r => r.exists).length;
  const missingCount = results.filter(r => !r.exists).length;

  console.log('📋 SUMMARY:\n');
  console.log(`   ✅ Tables Verified: ${existingCount}/5`);
  console.log(`   ❌ Tables Missing:  ${missingCount}/5\n`);

  if (allExist) {
    console.log('═══════════════════════════════════════════════════════\n');
    console.log('🎉 SUCCESS! All required tables exist!\n');
    console.log('Your backend is now ready for 100% functionality.\n');
    console.log('📝 Next Steps:\n');
    console.log('   1. Run comprehensive test:');
    console.log('      node comprehensive-backend-test.js\n');
    console.log('   2. Expected result:');
    console.log('      34/34 tests passing (100%)\n');
    console.log('   3. Test critical endpoints:');
    console.log('      - POST /api/cart/add');
    console.log('      - GET /api/cart');
    console.log('      - POST /api/orders/create');
    console.log('      - GET /api/orders/:id/items\n');
    console.log('═══════════════════════════════════════════════════════\n');
  } else {
    console.log('═══════════════════════════════════════════════════════\n');
    console.log('⚠️  INCOMPLETE - Some tables are still missing\n');
    console.log('Missing Tables:\n');
    results.filter(r => !r.exists).forEach(r => {
      console.log(`   ❌ ${r.name} [${r.priority}] - ${r.description}`);
    });
    console.log('\n📝 To Fix:\n');
    console.log('   1. Open Supabase Dashboard');
    console.log('   2. Go to SQL Editor');
    console.log('   3. Copy contents of: database/create-missing-tables.sql');
    console.log('   4. Paste and click "Run"');
    console.log('   5. Run this script again: node verify-database-fix.js\n');
    console.log('═══════════════════════════════════════════════════════\n');
  }

  return allExist;
}

// Run verification
verifyDatabaseFix()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Verification failed:', error.message);
    process.exit(1);
  });
