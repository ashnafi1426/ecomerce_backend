/**
 * Phase 1 Status Check Script
 * 
 * Comprehensive check of Phase 1 deployment status
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function checkTable(tableName) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('count')
      .limit(1);
    
    if (error) {
      return { exists: false, error: error.message };
    }
    return { exists: true };
  } catch (error) {
    return { exists: false, error: error.message };
  }
}

async function getTableCount(tableName) {
  try {
    const { count, error } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });
    
    if (error) return 0;
    return count || 0;
  } catch (error) {
    return 0;
  }
}

async function checkUserRoles() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('role')
      .limit(10);
    
    if (error) return { exists: false, roles: [] };
    
    const uniqueRoles = [...new Set(data.map(u => u.role))];
    return { exists: true, roles: uniqueRoles };
  } catch (error) {
    return { exists: false, roles: [] };
  }
}

async function checkProductFields() {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('seller_id, approval_status')
      .limit(1);
    
    if (error) return { seller_id: false, approval_status: false };
    
    return {
      seller_id: data.length > 0 && 'seller_id' in data[0],
      approval_status: data.length > 0 && 'approval_status' in data[0]
    };
  } catch (error) {
    return { seller_id: false, approval_status: false };
  }
}

async function main() {
  log('\n╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║         Phase 1 Deployment Status Check                   ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════╝', 'cyan');
  
  // Check connection
  log('\n🔍 Database Connection:', 'blue');
  const { data: connTest, error: connError } = await supabase
    .from('users')
    .select('count')
    .limit(1);
  
  if (connError) {
    log('❌ Connection failed!', 'red');
    log(`   Error: ${connError.message}`, 'red');
    return;
  }
  log('✅ Connected successfully', 'green');
  
  // Check Phase 1 tables
  log('\n📊 Phase 1 Tables Status:', 'blue');
  
  const phase1Tables = [
    { name: 'commission_rates', description: 'Commission configuration' },
    { name: 'seller_balances', description: 'Seller financial tracking' },
    { name: 'seller_payouts', description: 'Payout history' },
    { name: 'payment_transactions', description: 'Transaction log' },
    { name: 'sub_orders', description: 'Multi-vendor order splitting' },
    { name: 'disputes', description: 'Dispute resolution' },
    { name: 'dispute_messages', description: 'Dispute communication' },
    { name: 'returns', description: 'Enhanced returns' },
    { name: 'return_messages', description: 'Return communication' },
    { name: 'notifications', description: 'Notification system' },
    { name: 'notification_preferences', description: 'User preferences' },
    { name: 'security_events', description: 'Security audit' },
    { name: 'system_logs', description: 'Application logs' }
  ];
  
  let existingCount = 0;
  const tableStatus = [];
  
  for (const table of phase1Tables) {
    const result = await checkTable(table.name);
    const count = result.exists ? await getTableCount(table.name) : 0;
    
    tableStatus.push({
      name: table.name,
      description: table.description,
      exists: result.exists,
      count: count
    });
    
    if (result.exists) {
      existingCount++;
      log(`✅ ${table.name.padEnd(30)} (${count} records) - ${table.description}`, 'green');
    } else {
      log(`❌ ${table.name.padEnd(30)} - ${table.description}`, 'red');
    }
  }
  
  log(`\n📈 Tables Found: ${existingCount}/${phase1Tables.length}`, existingCount === phase1Tables.length ? 'green' : 'yellow');
  
  // Check enhanced existing tables
  log('\n🔧 Enhanced Existing Tables:', 'blue');
  
  // Check users table for role column
  const userRoles = await checkUserRoles();
  if (userRoles.exists) {
    log(`✅ users.role column exists`, 'green');
    log(`   Roles found: ${userRoles.roles.join(', ') || 'none yet'}`, 'cyan');
  } else {
    log(`❌ users.role column missing`, 'red');
  }
  
  // Check products table for seller fields
  const productFields = await checkProductFields();
  if (productFields.seller_id) {
    log(`✅ products.seller_id column exists`, 'green');
  } else {
    log(`❌ products.seller_id column missing`, 'red');
  }
  
  if (productFields.approval_status) {
    log(`✅ products.approval_status column exists`, 'green');
  } else {
    log(`❌ products.approval_status column missing`, 'red');
  }
  
  // Overall status
  log('\n╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║                    Overall Status                          ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════╝', 'cyan');
  
  const allTablesExist = existingCount === phase1Tables.length;
  const userRoleExists = userRoles.exists;
  const productFieldsExist = productFields.seller_id && productFields.approval_status;
  
  const deploymentComplete = allTablesExist && userRoleExists && productFieldsExist;
  
  if (deploymentComplete) {
    log('\n✅ Phase 1 is FULLY DEPLOYED!', 'green');
    log('   All tables created: ✅', 'green');
    log('   User roles added: ✅', 'green');
    log('   Product fields added: ✅', 'green');
    log('\n🎉 Ready to proceed to Phase 2!', 'green');
  } else if (existingCount > 0) {
    log('\n⚠️  Phase 1 is PARTIALLY DEPLOYED', 'yellow');
    log(`   Tables: ${existingCount}/${phase1Tables.length}`, 'yellow');
    log(`   User roles: ${userRoleExists ? '✅' : '❌'}`, userRoleExists ? 'green' : 'red');
    log(`   Product fields: ${productFieldsExist ? '✅' : '❌'}`, productFieldsExist ? 'green' : 'red');
    log('\n📋 Action Required:', 'yellow');
    log('   Run remaining migrations to complete Phase 1', 'yellow');
  } else {
    log('\n❌ Phase 1 is NOT DEPLOYED', 'red');
    log('   No Phase 1 tables found', 'red');
    log('\n📋 Action Required:', 'yellow');
    log('   Follow DEPLOY-PHASE1-GUIDE.md to deploy Phase 1', 'yellow');
  }
  
  // Data summary
  log('\n📊 Data Summary:', 'blue');
  const userCount = await getTableCount('users');
  const productCount = await getTableCount('products');
  const orderCount = await getTableCount('orders');
  
  log(`   Users: ${userCount}`, 'cyan');
  log(`   Products: ${productCount}`, 'cyan');
  log(`   Orders: ${orderCount}`, 'cyan');
  
  if (existingCount > 0) {
    log(`   Commission Rates: ${tableStatus.find(t => t.name === 'commission_rates')?.count || 0}`, 'cyan');
    log(`   Disputes: ${tableStatus.find(t => t.name === 'disputes')?.count || 0}`, 'cyan');
    log(`   Notifications: ${tableStatus.find(t => t.name === 'notifications')?.count || 0}`, 'cyan');
  }
  
  log('\n');
}

main();
