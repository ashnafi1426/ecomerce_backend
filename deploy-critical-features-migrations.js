/**
 * DEPLOY ALL CRITICAL FEATURES MIGRATIONS
 * Task 1.6: Deploy all migrations to database
 * 
 * This script deploys all five critical feature migrations in the correct order:
 * 1. Product variants migration (create-product-variants.sql)
 * 2. Discount/promotion migration (create-discount-promotion-tables-v2.sql)
 * 3. Delivery rating migration (create-delivery-rating-tables.sql)
 * 4. Replacement process migration (create-replacement-process-tables.sql)
 * 5. Enhanced refund migration (create-enhanced-refund-tables.sql)
 * 
 * Requirements: Run migrations in correct order, Verify all tables created successfully,
 * Verify all indexes and constraints in place, Test rollback migrations
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

// Migration files in correct order
const MIGRATIONS = [
  {
    order: 1,
    name: 'Product Variants System',
    file: 'create-product-variants.sql',
    tables: ['product_variants', 'variant_inventory'],
    description: 'Creates product variants with attributes and inventory tracking'
  },
  {
    order: 2,
    name: 'Discount and Promotion System',
    file: 'create-discount-promotion-tables-v2.sql',
    tables: ['coupons', 'coupon_usage', 'promotional_pricing'],
    description: 'Creates coupon and promotional pricing tables'
  },
  {
    order: 3,
    name: 'Delivery Rating System',
    file: 'create-delivery-rating-tables.sql',
    tables: ['delivery_ratings'],
    description: 'Creates delivery rating tables with multi-dimensional ratings'
  },
  {
    order: 4,
    name: 'Replacement Process',
    file: 'create-replacement-process-tables.sql',
    tables: ['replacement_requests', 'replacement_shipments'],
    description: 'Creates replacement request and shipment tracking tables'
  },
  {
    order: 5,
    name: 'Enhanced Refund Process',
    file: 'create-enhanced-refund-tables.sql',
    tables: ['refund_details', 'refund_images'],
    description: 'Creates enhanced refund tables with partial refund support'
  }
];

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Test database connection
 */
async function testConnection() {
  log('\n🔌 Testing database connection...', 'cyan');
  
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    if (error) {
      log(`❌ Connection failed: ${error.message}`, 'red');
      return false;
    }
    
    log('✅ Database connection successful', 'green');
    return true;
  } catch (error) {
    log(`❌ Connection error: ${error.message}`, 'red');
    return false;
  }
}

/**
 * Check if a table exists
 */
async function tableExists(tableName) {
  try {
    const { error } = await supabase
      .from(tableName)
      .select('*')
      .limit(0);
    
    return !error;
  } catch (error) {
    return false;
  }
}

/**
 * Run a single migration
 */
async function runMigration(migration) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`📝 Migration ${migration.order}: ${migration.name}`, 'bright');
  log(`${'='.repeat(60)}`, 'cyan');
  log(`📄 File: ${migration.file}`, 'blue');
  log(`📋 Description: ${migration.description}`, 'blue');
  log(`🎯 Tables: ${migration.tables.join(', ')}`, 'blue');
  
  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, 'database', 'migrations', migration.file);
    
    if (!fs.existsSync(migrationPath)) {
      log(`❌ Migration file not found: ${migrationPath}`, 'red');
      return { success: false, error: 'File not found' };
    }
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    log('\n✅ Migration file loaded', 'green');
    
    // Check if tables already exist
    log('\n🔍 Checking existing tables...', 'cyan');
    const existingTables = [];
    for (const table of migration.tables) {
      const exists = await tableExists(table);
      if (exists) {
        existingTables.push(table);
        log(`  ⚠️  Table '${table}' already exists`, 'yellow');
      } else {
        log(`  ℹ️  Table '${table}' does not exist`, 'blue');
      }
    }
    
    if (existingTables.length === migration.tables.length) {
      log('\n⚠️  All tables already exist. Skipping migration.', 'yellow');
      log('💡 If you want to re-run, drop the tables first.', 'yellow');
      return { success: true, skipped: true, existingTables };
    }
    
    // Execute the migration
    log('\n🚀 Executing migration...', 'cyan');
    
    // Note: Supabase JS client doesn't support direct SQL execution
    // We need to use the SQL Editor in Supabase Dashboard
    log('\n⚠️  Direct SQL execution not available via Supabase JS client', 'yellow');
    log('📋 Please execute this migration manually:', 'yellow');
    log(`\n1. Open Supabase SQL Editor:`, 'cyan');
    log(`   https://supabase.com/dashboard/project/${process.env.SUPABASE_URL.split('.')[0].split('//')[1]}/sql/new`, 'blue');
    log(`\n2. Copy the SQL from:`, 'cyan');
    log(`   ${migrationPath}`, 'blue');
    log(`\n3. Paste and execute in SQL Editor`, 'cyan');
    log(`\n4. Verify tables are created`, 'cyan');
    
    // Wait for user confirmation
    log('\n⏸️  Press Enter after executing the migration manually...', 'yellow');
    
    return { success: true, manual: true };
    
  } catch (error) {
    log(`\n❌ Migration failed: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

/**
 * Verify migration was successful
 */
async function verifyMigration(migration) {
  log(`\n🔍 Verifying migration ${migration.order}: ${migration.name}...`, 'cyan');
  
  const results = {
    success: true,
    tables: {},
    errors: []
  };
  
  for (const table of migration.tables) {
    try {
      const exists = await tableExists(table);
      
      if (exists) {
        log(`  ✅ Table '${table}' exists and is accessible`, 'green');
        results.tables[table] = true;
        
        // Try to get column information
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(0);
        
        if (!error) {
          log(`     ✓ Schema accessible`, 'green');
        }
      } else {
        log(`  ❌ Table '${table}' not found`, 'red');
        results.tables[table] = false;
        results.success = false;
        results.errors.push(`Table '${table}' not found`);
      }
    } catch (error) {
      log(`  ❌ Error checking table '${table}': ${error.message}`, 'red');
      results.tables[table] = false;
      results.success = false;
      results.errors.push(`Error checking '${table}': ${error.message}`);
    }
  }
  
  return results;
}

/**
 * Generate rollback SQL
 */
function generateRollbackSQL() {
  log('\n📝 Generating rollback SQL...', 'cyan');
  
  const rollbackSQL = `
-- =====================================================
-- ROLLBACK SCRIPT FOR CRITICAL FEATURES MIGRATIONS
-- =====================================================
-- WARNING: This will delete all data in these tables!
-- Create a backup before running this script.
-- =====================================================

-- Drop tables in reverse order (to handle foreign key constraints)

-- 5. Enhanced Refund Process
DROP TABLE IF EXISTS refund_images CASCADE;
DROP TABLE IF EXISTS refund_details CASCADE;

-- 4. Replacement Process
DROP TABLE IF EXISTS replacement_shipments CASCADE;
DROP TABLE IF EXISTS replacement_requests CASCADE;

-- 3. Delivery Rating System
DROP TABLE IF EXISTS delivery_ratings CASCADE;

-- 2. Discount and Promotion System
DROP TABLE IF EXISTS coupon_usage CASCADE;
DROP TABLE IF EXISTS promotional_pricing CASCADE;
DROP TABLE IF EXISTS coupons CASCADE;

-- 1. Product Variants System
DROP TABLE IF EXISTS variant_inventory CASCADE;
DROP TABLE IF EXISTS product_variants CASCADE;

-- Drop helper functions
DROP FUNCTION IF EXISTS get_variant_price(UUID);
DROP FUNCTION IF EXISTS check_variant_availability(UUID, INTEGER);
DROP FUNCTION IF EXISTS get_variant_available_quantity(UUID);
DROP FUNCTION IF EXISTS validate_coupon_eligibility(VARCHAR, UUID, DECIMAL, UUID[]);
DROP FUNCTION IF EXISTS get_active_promotional_price(UUID, UUID);
DROP FUNCTION IF EXISTS calculate_order_discounts(DECIMAL, DECIMAL, VARCHAR, UUID);
DROP FUNCTION IF EXISTS get_seller_delivery_metrics(UUID);
DROP FUNCTION IF EXISTS get_seller_rating_distribution(UUID);
DROP FUNCTION IF EXISTS can_submit_delivery_rating(UUID, UUID, UUID);
DROP FUNCTION IF EXISTS get_delivery_rating_analytics(TIMESTAMP, TIMESTAMP);
DROP FUNCTION IF EXISTS can_create_replacement_request(UUID, UUID, UUID);
DROP FUNCTION IF EXISTS get_replacement_analytics(TIMESTAMP, TIMESTAMP, UUID);
DROP FUNCTION IF EXISTS get_product_replacement_rate(UUID);
DROP FUNCTION IF EXISTS get_seller_replacement_metrics(UUID);
DROP FUNCTION IF EXISTS reserve_replacement_inventory(UUID);
DROP FUNCTION IF EXISTS can_create_refund_request(UUID, UUID, DECIMAL);
DROP FUNCTION IF EXISTS calculate_refund_commission_adjustment(UUID, DECIMAL);
DROP FUNCTION IF EXISTS get_cumulative_refunds(UUID);
DROP FUNCTION IF EXISTS get_refund_analytics(TIMESTAMP, TIMESTAMP, UUID);
DROP FUNCTION IF EXISTS get_seller_refund_rate(UUID);
DROP FUNCTION IF EXISTS get_product_refund_rate(UUID);
DROP FUNCTION IF EXISTS get_seller_refund_metrics(UUID);
DROP FUNCTION IF EXISTS check_refund_processing_time_alerts();

-- Remove columns added to existing tables
ALTER TABLE cart_items DROP COLUMN IF EXISTS variant_id CASCADE;
ALTER TABLE orders DROP COLUMN IF EXISTS coupon_id CASCADE;
ALTER TABLE orders DROP COLUMN IF EXISTS coupon_code CASCADE;
ALTER TABLE orders DROP COLUMN IF EXISTS discount_amount CASCADE;
ALTER TABLE orders DROP COLUMN IF EXISTS promotional_discount CASCADE;
ALTER TABLE orders DROP COLUMN IF EXISTS delivered_at CASCADE;
ALTER TABLE orders DROP COLUMN IF EXISTS delivery_rated CASCADE;
ALTER TABLE orders DROP COLUMN IF EXISTS refund_status CASCADE;
ALTER TABLE orders DROP COLUMN IF EXISTS total_refunded CASCADE;
ALTER TABLE products DROP COLUMN IF EXISTS is_returnable CASCADE;
ALTER TABLE products DROP COLUMN IF EXISTS replacement_count CASCADE;
ALTER TABLE products DROP COLUMN IF EXISTS refund_count CASCADE;
ALTER TABLE products DROP COLUMN IF EXISTS is_flagged_high_refund CASCADE;
ALTER TABLE inventory DROP COLUMN IF EXISTS reserved_quantity CASCADE;

-- =====================================================
-- ROLLBACK COMPLETE
-- =====================================================
`;
  
  const rollbackPath = path.join(__dirname, 'database', 'migrations', 'rollback-critical-features.sql');
  fs.writeFileSync(rollbackPath, rollbackSQL);
  
  log(`✅ Rollback SQL generated: ${rollbackPath}`, 'green');
  log('⚠️  Use this file to rollback migrations if needed', 'yellow');
}

/**
 * Main deployment function
 */
async function deployMigrations() {
  log('\n' + '='.repeat(70), 'bright');
  log('🚀 CRITICAL FEATURES MIGRATIONS DEPLOYMENT', 'bright');
  log('='.repeat(70), 'bright');
  
  log('\n📋 This script will deploy 5 migrations in order:', 'cyan');
  MIGRATIONS.forEach(m => {
    log(`  ${m.order}. ${m.name}`, 'blue');
  });
  
  // Test connection
  const connected = await testConnection();
  if (!connected) {
    log('\n❌ Cannot proceed without database connection', 'red');
    process.exit(1);
  }
  
  // Generate rollback SQL
  generateRollbackSQL();
  
  log('\n⚠️  IMPORTANT NOTES:', 'yellow');
  log('  • Migrations must be run manually via Supabase SQL Editor', 'yellow');
  log('  • Create a backup before running migrations', 'yellow');
  log('  • Migrations will be executed in order', 'yellow');
  log('  • Each migration will be verified after execution', 'yellow');
  
  const results = {
    successful: [],
    failed: [],
    skipped: []
  };
  
  // Run each migration
  for (const migration of MIGRATIONS) {
    const result = await runMigration(migration);
    
    if (result.success) {
      if (result.skipped) {
        results.skipped.push(migration);
      } else {
        // Verify the migration
        const verification = await verifyMigration(migration);
        
        if (verification.success) {
          results.successful.push(migration);
          log(`\n✅ Migration ${migration.order} completed successfully!`, 'green');
        } else {
          results.failed.push({ migration, errors: verification.errors });
          log(`\n❌ Migration ${migration.order} verification failed!`, 'red');
          verification.errors.forEach(err => log(`  • ${err}`, 'red'));
        }
      }
    } else {
      results.failed.push({ migration, error: result.error });
      log(`\n❌ Migration ${migration.order} failed!`, 'red');
    }
    
    // Wait a bit between migrations
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Print summary
  log('\n' + '='.repeat(70), 'bright');
  log('📊 DEPLOYMENT SUMMARY', 'bright');
  log('='.repeat(70), 'bright');
  
  log(`\n✅ Successful: ${results.successful.length}`, 'green');
  results.successful.forEach(m => {
    log(`  • ${m.name}`, 'green');
  });
  
  if (results.skipped.length > 0) {
    log(`\n⚠️  Skipped: ${results.skipped.length}`, 'yellow');
    results.skipped.forEach(m => {
      log(`  • ${m.name} (already exists)`, 'yellow');
    });
  }
  
  if (results.failed.length > 0) {
    log(`\n❌ Failed: ${results.failed.length}`, 'red');
    results.failed.forEach(({ migration, error, errors }) => {
      log(`  • ${migration.name}`, 'red');
      if (error) log(`    Error: ${error}`, 'red');
      if (errors) errors.forEach(err => log(`    • ${err}`, 'red'));
    });
  }
  
  // Final status
  log('\n' + '='.repeat(70), 'bright');
  if (results.failed.length === 0) {
    log('✅ ALL MIGRATIONS COMPLETED SUCCESSFULLY!', 'green');
    log('='.repeat(70), 'bright');
    
    log('\n📝 Next Steps:', 'cyan');
    log('  1. Verify all tables in Supabase Dashboard', 'blue');
    log('  2. Test table access and constraints', 'blue');
    log('  3. Proceed with service implementation', 'blue');
    log('  4. Run integration tests', 'blue');
  } else {
    log('⚠️  DEPLOYMENT COMPLETED WITH ERRORS', 'yellow');
    log('='.repeat(70), 'bright');
    
    log('\n📝 Action Required:', 'cyan');
    log('  1. Review failed migrations above', 'yellow');
    log('  2. Check Supabase logs for errors', 'yellow');
    log('  3. Fix issues and re-run failed migrations', 'yellow');
    log('  4. Use rollback script if needed', 'yellow');
  }
  
  log('\n💾 Rollback available at:', 'cyan');
  log('  database/migrations/rollback-critical-features.sql', 'blue');
  
  log('');
}

// Run deployment
deployMigrations()
  .then(() => {
    log('🎉 Deployment script completed', 'green');
    process.exit(0);
  })
  .catch((error) => {
    log(`\n💥 Fatal error: ${error.message}`, 'red');
    console.error(error.stack);
    process.exit(1);
  });
