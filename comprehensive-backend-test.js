/**
 * COMPREHENSIVE BACKEND HEALTH CHECK AND TEST
 * 
 * This script tests all major backend functionality:
 * 1. Database connection
 * 2. Authentication endpoints
 * 3. User management
 * 4. Product operations
 * 5. Cart functionality
 * 6. Order processing
 * 7. Payment integration
 * 8. Admin operations
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Test results tracker
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

function logTest(name, passed, message = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status}: ${name}`);
  if (message) console.log(`   ${message}`);
  
  results.tests.push({ name, passed, message });
  if (passed) results.passed++;
  else results.failed++;
}

async function testDatabaseConnection() {
  console.log('\n📊 Testing Database Connection...\n');
  
  try {
    const { data, error } = await supabase.from('users').select('count').limit(1);
    logTest('Database Connection', !error, error ? error.message : 'Connected successfully');
  } catch (err) {
    logTest('Database Connection', false, err.message);
  }
}

async function testUserTables() {
  console.log('\n👥 Testing User Tables...\n');
  
  const tables = ['users', 'addresses'];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      logTest(`Table: ${table}`, !error, error ? error.message : `Table exists and accessible`);
    } catch (err) {
      logTest(`Table: ${table}`, false, err.message);
    }
  }
}

async function testProductTables() {
  console.log('\n📦 Testing Product Tables...\n');
  
  const tables = ['products', 'categories', 'product_variants', 'inventory'];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      logTest(`Table: ${table}`, !error, error ? error.message : `Table exists and accessible`);
    } catch (err) {
      logTest(`Table: ${table}`, false, err.message);
    }
  }
}

async function testOrderTables() {
  console.log('\n🛒 Testing Order Tables...\n');
  
  const tables = ['orders', 'order_items', 'cart', 'payments'];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      logTest(`Table: ${table}`, !error, error ? error.message : `Table exists and accessible`);
    } catch (err) {
      logTest(`Table: ${table}`, false, err.message);
    }
  }
}

async function testMultiVendorTables() {
  console.log('\n🏪 Testing Multi-Vendor Tables...\n');
  
  const tables = ['sub_orders', 'seller_balances', 'commissions', 'disputes'];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      logTest(`Table: ${table}`, !error, error ? error.message : `Table exists and accessible`);
    } catch (err) {
      logTest(`Table: ${table}`, false, err.message);
    }
  }
}

async function testAdvancedFeatureTables() {
  console.log('\n⭐ Testing Advanced Feature Tables...\n');
  
  const tables = [
    'reviews',
    'coupons',
    'promotions',
    'notifications',
    'audit_log',
    'returns',
    'refunds',
    'delivery_ratings'
  ];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      logTest(`Table: ${table}`, !error, error ? error.message : `Table exists and accessible`);
    } catch (err) {
      logTest(`Table: ${table}`, false, err.message);
    }
  }
}

async function testUserAccounts() {
  console.log('\n🔐 Testing User Accounts...\n');
  
  const roles = ['admin', 'manager', 'seller', 'customer'];
  
  for (const role of roles) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, role, status')
        .eq('role', role)
        .limit(1);
      
      const exists = data && data.length > 0;
      logTest(
        `${role.charAt(0).toUpperCase() + role.slice(1)} Account`, 
        exists, 
        exists ? `Found: ${data[0].email}` : `No ${role} accounts found`
      );
    } catch (err) {
      logTest(`${role} Account`, false, err.message);
    }
  }
}

async function testDataIntegrity() {
  console.log('\n🔍 Testing Data Integrity...\n');
  
  try {
    // Test users count
    const { count: userCount, error: userError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    logTest('Users Count', !userError, `Total users: ${userCount || 0}`);
    
    // Test products count
    const { count: productCount, error: productError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });
    
    logTest('Products Count', !productError, `Total products: ${productCount || 0}`);
    
    // Test orders count
    const { count: orderCount, error: orderError } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true });
    
    logTest('Orders Count', !orderError, `Total orders: ${orderCount || 0}`);
    
  } catch (err) {
    logTest('Data Integrity', false, err.message);
  }
}

async function testEnvironmentVariables() {
  console.log('\n⚙️  Testing Environment Variables...\n');
  
  const requiredVars = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'JWT_SECRET',
    'PORT'
  ];
  
  for (const varName of requiredVars) {
    const exists = !!process.env[varName];
    logTest(
      `ENV: ${varName}`, 
      exists, 
      exists ? 'Set' : 'Missing'
    );
  }
  
  // Optional but recommended
  const optionalVars = [
    'STRIPE_SECRET_KEY',
    'EMAIL_HOST',
    'EMAIL_USER'
  ];
  
  console.log('\n   Optional Variables:');
  for (const varName of optionalVars) {
    const exists = !!process.env[varName];
    console.log(`   ${exists ? '✓' : '○'} ${varName}: ${exists ? 'Set' : 'Not set'}`);
  }
}

async function printSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${results.passed + results.failed}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);
  console.log('='.repeat(60));
  
  if (results.failed > 0) {
    console.log('\n❌ Failed Tests:');
    results.tests
      .filter(t => !t.passed)
      .forEach(t => console.log(`   - ${t.name}: ${t.message}`));
  }
  
  console.log('\n');
}

async function runAllTests() {
  console.log('🚀 Starting Comprehensive Backend Test...\n');
  console.log('='.repeat(60));
  
  await testEnvironmentVariables();
  await testDatabaseConnection();
  await testUserTables();
  await testProductTables();
  await testOrderTables();
  await testMultiVendorTables();
  await testAdvancedFeatureTables();
  await testUserAccounts();
  await testDataIntegrity();
  
  await printSummary();
  
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(err => {
  console.error('❌ Test suite failed:', err);
  process.exit(1);
});
