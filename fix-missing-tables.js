/**
 * FIX MISSING TABLES
 * 
 * This script identifies missing tables and provides solutions
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTableExists(tableName) {
  try {
    const { data, error } = await supabase.from(tableName).select('*').limit(1);
    return { exists: !error, error: error?.message };
  } catch (err) {
    return { exists: false, error: err.message };
  }
}

async function findCorrectTableName(possibleNames) {
  for (const name of possibleNames) {
    const result = await checkTableExists(name);
    if (result.exists) {
      return { found: true, tableName: name };
    }
  }
  return { found: false };
}

async function main() {
  console.log('🔍 Checking Missing Tables...\n');
  
  const missingTables = {
    'order_items': ['order_items', 'orderitems', 'items'],
    'cart': ['cart', 'carts', 'shopping_cart'],
    'commissions': ['commissions', 'commission', 'seller_commissions'],
    'promotions': ['promotions', 'promotion', 'product_promotions'],
    'audit_logs': ['audit_logs', 'auditlogs', 'audit_log'],
    'refunds': ['refunds', 'refund', 'order_refunds']
  };
  
  const results = [];
  
  for (const [expectedName, possibleNames] of Object.entries(missingTables)) {
    console.log(`Checking: ${expectedName}`);
    const result = await findCorrectTableName(possibleNames);
    
    if (result.found) {
      console.log(`  ✅ Found as: ${result.tableName}`);
      results.push({ expected: expectedName, actual: result.tableName, status: 'found' });
    } else {
      console.log(`  ❌ Not found - Table may not exist`);
      results.push({ expected: expectedName, actual: null, status: 'missing' });
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  
  const found = results.filter(r => r.status === 'found');
  const missing = results.filter(r => r.status === 'missing');
  
  if (found.length > 0) {
    console.log('\n✅ Tables Found (with different names):');
    found.forEach(r => {
      console.log(`   ${r.expected} → ${r.actual}`);
    });
  }
  
  if (missing.length > 0) {
    console.log('\n❌ Tables Truly Missing:');
    missing.forEach(r => {
      console.log(`   - ${r.expected}`);
    });
    
    console.log('\n💡 Solutions:');
    console.log('   1. These tables may need to be created');
    console.log('   2. Run the appropriate migration scripts');
    console.log('   3. Check if functionality uses different table structures');
  }
  
  console.log('\n');
}

main().catch(console.error);
