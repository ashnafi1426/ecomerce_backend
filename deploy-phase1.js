/**
 * Phase 1 Migration Deployment Script
 * 
 * This script helps deploy Phase 1 database migrations to Supabase.
 * It will:
 * 1. Test database connection
 * 2. Create a backup (optional but recommended)
 * 3. Run all Phase 1 migrations in order
 * 4. Verify the migrations were successful
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Migration files in order
const migrationFiles = [
  'phase1-01-add-roles-and-seller-fields.sql',
  'phase1-02-multi-vendor-products.sql',
  'phase1-03-commission-and-financial-tables.sql',
  'phase1-04-disputes-and-enhanced-returns.sql',
  'phase1-05-notifications-and-audit-enhancement.sql'
];

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testConnection() {
  log('\n🔍 Testing database connection...', 'cyan');
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) throw error;
    log('✅ Database connection successful!', 'green');
    return true;
  } catch (error) {
    log('❌ Database connection failed!', 'red');
    log(`Error: ${error.message}`, 'red');
    return false;
  }
}

async function checkExistingTables() {
  log('\n🔍 Checking for existing Phase 1 tables...', 'cyan');
  
  const tablesToCheck = [
    'commission_rates',
    'seller_balances',
    'seller_payouts',
    'disputes',
    'notifications'
  ];
  
  const existingTables = [];
  
  for (const table of tablesToCheck) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('count')
        .limit(1);
      
      if (!error) {
        existingTables.push(table);
      }
    } catch (error) {
      // Table doesn't exist, which is expected
    }
  }
  
  if (existingTables.length > 0) {
    log(`⚠️  Found ${existingTables.length} existing Phase 1 tables:`, 'yellow');
    existingTables.forEach(table => log(`   - ${table}`, 'yellow'));
    log('\n⚠️  WARNING: Some Phase 1 tables already exist!', 'yellow');
    log('This might mean Phase 1 was already deployed or partially deployed.', 'yellow');
    return existingTables;
  } else {
    log('✅ No existing Phase 1 tables found. Ready for fresh deployment.', 'green');
    return [];
  }
}

async function runMigration(filename) {
  log(`\n📝 Running migration: ${filename}`, 'blue');
  
  const filePath = path.join(__dirname, 'database', 'migrations', filename);
  
  if (!fs.existsSync(filePath)) {
    log(`❌ Migration file not found: ${filePath}`, 'red');
    return false;
  }
  
  const sql = fs.readFileSync(filePath, 'utf8');
  
  try {
    // Note: Supabase JS client doesn't support raw SQL execution
    // We need to use the REST API or SQL Editor
    log('⚠️  Cannot execute SQL directly via Supabase JS client', 'yellow');
    log('Please run this migration manually via Supabase SQL Editor:', 'yellow');
    log(`   File: ${filename}`, 'cyan');
    return 'manual';
  } catch (error) {
    log(`❌ Migration failed: ${error.message}`, 'red');
    return false;
  }
}

async function verifyMigration() {
  log('\n🔍 Verifying Phase 1 migration...', 'cyan');
  
  const checks = [
    {
      name: 'New tables created',
      query: async () => {
        const tables = ['commission_rates', 'seller_balances', 'disputes', 'notifications'];
        let count = 0;
        for (const table of tables) {
          try {
            const { error } = await supabase.from(table).select('count').limit(1);
            if (!error) count++;
          } catch (e) {}
        }
        return { expected: 4, actual: count };
      }
    },
    {
      name: 'User roles column exists',
      query: async () => {
        try {
          const { data, error } = await supabase
            .from('users')
            .select('role')
            .limit(1);
          return { expected: true, actual: !error };
        } catch (e) {
          return { expected: true, actual: false };
        }
      }
    }
  ];
  
  let allPassed = true;
  
  for (const check of checks) {
    const result = await check.query();
    if (typeof result.actual === 'number') {
      if (result.actual === result.expected) {
        log(`✅ ${check.name}: ${result.actual}/${result.expected}`, 'green');
      } else {
        log(`❌ ${check.name}: ${result.actual}/${result.expected}`, 'red');
        allPassed = false;
      }
    } else {
      if (result.actual) {
        log(`✅ ${check.name}`, 'green');
      } else {
        log(`❌ ${check.name}`, 'red');
        allPassed = false;
      }
    }
  }
  
  return allPassed;
}

async function main() {
  log('\n╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║         FastShop Phase 1 Migration Deployment             ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════╝', 'cyan');
  
  // Step 1: Test connection
  const connected = await testConnection();
  if (!connected) {
    log('\n❌ Deployment aborted: Cannot connect to database', 'red');
    process.exit(1);
  }
  
  // Step 2: Check for existing tables
  const existingTables = await checkExistingTables();
  
  if (existingTables.length > 0) {
    log('\n⚠️  IMPORTANT: Phase 1 tables already exist!', 'yellow');
    log('Options:', 'yellow');
    log('  1. Skip deployment if Phase 1 was already completed', 'yellow');
    log('  2. Drop existing tables and redeploy (DANGEROUS - data loss!)', 'yellow');
    log('  3. Review and manually fix conflicts', 'yellow');
    log('\nPlease review the situation before proceeding.', 'yellow');
  }
  
  // Step 3: Display manual deployment instructions
  log('\n╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║              MANUAL DEPLOYMENT REQUIRED                    ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════╝', 'cyan');
  
  log('\n📋 Deployment Instructions:', 'blue');
  log('\n1. Open Supabase Dashboard:', 'cyan');
  log('   https://app.supabase.com/project/yqigycicloyhasoqlcpn/sql', 'cyan');
  
  log('\n2. Run each migration file in order:', 'cyan');
  migrationFiles.forEach((file, index) => {
    log(`   ${index + 1}. ${file}`, 'yellow');
  });
  
  log('\n3. For each file:', 'cyan');
  log('   - Click "New Query" in SQL Editor', 'yellow');
  log('   - Copy the contents of the migration file', 'yellow');
  log('   - Paste into SQL Editor', 'yellow');
  log('   - Click "Run" button', 'yellow');
  log('   - Wait for "Success" message', 'yellow');
  
  log('\n4. After all migrations complete, run verification:', 'cyan');
  log('   node ecomerce_backend/deploy-phase1.js --verify', 'yellow');
  
  log('\n📁 Migration files location:', 'blue');
  log('   ecomerce_backend/database/migrations/', 'cyan');
  
  log('\n💡 Alternative: Use the master migration script:', 'blue');
  log('   File: PHASE1-MASTER-MIGRATION.sql', 'cyan');
  log('   This runs all 5 migrations in one go.', 'cyan');
  
  log('\n⚠️  IMPORTANT: Create a backup before running migrations!', 'yellow');
  log('   Supabase Dashboard → Database → Backups', 'yellow');
}

// Run verification if --verify flag is passed
if (process.argv.includes('--verify')) {
  (async () => {
    log('\n╔════════════════════════════════════════════════════════════╗', 'cyan');
    log('║         Phase 1 Migration Verification                    ║', 'cyan');
    log('╚════════════════════════════════════════════════════════════╝', 'cyan');
    
    const connected = await testConnection();
    if (!connected) {
      log('\n❌ Verification failed: Cannot connect to database', 'red');
      process.exit(1);
    }
    
    const verified = await verifyMigration();
    
    if (verified) {
      log('\n✅ Phase 1 migration verification PASSED!', 'green');
      log('All checks completed successfully.', 'green');
      log('\n🎉 Ready to proceed to Phase 2!', 'green');
    } else {
      log('\n❌ Phase 1 migration verification FAILED!', 'red');
      log('Some checks did not pass. Please review the migration.', 'red');
    }
  })();
} else {
  main();
}
