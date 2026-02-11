/**
 * Phase 2: Enhanced Inventory System - Test Script
 * 
 * This script tests all inventory endpoints to verify Phase 2 is working
 * 
 * Usage:
 *   node test-phase-2-inventory.js
 */

const supabase = require('./config/supabase.js');

// ANSI color codes for pretty output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function success(message) {
  log(`✅ ${message}`, 'green');
}

function error(message) {
  log(`❌ ${message}`, 'red');
}

function info(message) {
  log(`ℹ️  ${message}`, 'cyan');
}

function section(message) {
  log(`\n${'='.repeat(60)}`, 'blue');
  log(`${message}`, 'bold');
  log(`${'='.repeat(60)}`, 'blue');
}

// Test data
let testProductId = null;
let testReservationId = null;
const testSessionId = `test-session-${Date.now()}`;

/**
 * Test 1: Check if database migration was run
 */
async function testDatabaseMigration() {
  section('TEST 1: Database Migration Check');
  
  try {
    // Check if inventory_reservations table exists
    info('Checking if inventory_reservations table exists...');
    const { data: tables, error: tableError } = await supabase
      .from('inventory_reservations')
      .select('id')
      .limit(1);
    
    if (tableError && tableError.code === '42P01') {
      error('inventory_reservations table does not exist');
      error('Please run the migration: enhanced-inventory-system-v2.sql');
      return false;
    }
    
    success('inventory_reservations table exists');
    
    // Check if inventory_status view exists
    info('Checking if inventory_status view exists...');
    const { data: viewData, error: viewError } = await supabase
      .from('inventory_status')
      .select('*')
      .limit(1);
    
    if (viewError && viewError.code === '42P01') {
      error('inventory_status view does not exist');
      error('Please run the migration: enhanced-inventory-system-v2.sql');
      return false;
    }
    
    success('inventory_status view exists');
    
    // Check if functions exist
    info('Checking if database functions exist...');
    const { data: functions, error: funcError } = await supabase
      .rpc('check_product_availability', {
        p_product_id: '00000000-0000-0000-0000-000000000000',
        p_quantity: 1
      });
    
    if (funcError && funcError.code === '42883') {
      error('Database functions do not exist');
      error('Please run the migration: enhanced-inventory-system-v2.sql');
      return false;
    }
    
    success('Database functions exist');
    
    return true;
  } catch (err) {
    error(`Migration check failed: ${err.message}`);
    return false;
  }
}

/**
 * Test 2: Get a test product
 */
async function getTestProduct() {
  section('TEST 2: Get Test Product');
  
  try {
    info('Fetching a product with inventory...');
    
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        id,
        title,
        sku,
        price,
        inventory:inventory(quantity, reserved_quantity)
      `)
      .eq('status', 'active')
      .limit(1)
      .single();
    
    if (error) {
      error(`Failed to fetch product: ${error.message}`);
      return false;
    }
    
    if (!products) {
      error('No active products found in database');
      info('Please add some products first');
      return false;
    }
    
    testProductId = products.id;
    success(`Found test product: ${products.title} (${products.sku})`);
    info(`Product ID: ${testProductId}`);
    info(`Price: $${products.price}`);
    
    if (products.inventory && products.inventory.length > 0) {
      info(`Inventory: ${products.inventory[0].quantity} total, ${products.inventory[0].reserved_quantity || 0} reserved`);
    }
    
    return true;
  } catch (err) {
    error(`Get product failed: ${err.message}`);
    return false;
  }
}

/**
 * Test 3: Check product availability
 */
async function testCheckAvailability() {
  section('TEST 3: Check Product Availability');
  
  try {
    info(`Checking availability for product: ${testProductId}`);
    
    const { data, error } = await supabase.rpc('check_product_availability', {
      p_product_id: testProductId,
      p_quantity: 1
    });
    
    if (error) {
      error(`Availability check failed: ${error.message}`);
      return false;
    }
    
    success('Availability check successful');
    info(`Available: ${data.available}`);
    info(`Total Stock: ${data.total_stock}`);
    info(`Reserved Stock: ${data.reserved_stock}`);
    info(`Available Stock: ${data.available_stock}`);
    info(`Can Fulfill: ${data.can_fulfill}`);
    
    return true;
  } catch (err) {
    error(`Availability check failed: ${err.message}`);
    return false;
  }
}

/**
 * Test 4: Reserve inventory
 */
async function testReserveInventory() {
  section('TEST 4: Reserve Inventory');
  
  try {
    info(`Reserving 1 unit of product: ${testProductId}`);
    
    const { data, error } = await supabase.rpc('reserve_inventory', {
      p_product_id: testProductId,
      p_quantity: 1,
      p_user_id: null,
      p_session_id: testSessionId,
      p_expiration_minutes: 30
    });
    
    if (error) {
      error(`Reservation failed: ${error.message}`);
      return false;
    }
    
    testReservationId = data;
    success('Inventory reserved successfully');
    info(`Reservation ID: ${testReservationId}`);
    info(`Expires in: 30 minutes`);
    
    return true;
  } catch (err) {
    error(`Reserve inventory failed: ${err.message}`);
    return false;
  }
}

/**
 * Test 5: View inventory status
 */
async function testInventoryStatus() {
  section('TEST 5: View Inventory Status');
  
  try {
    info('Fetching inventory status...');
    
    const { data, error } = await supabase
      .from('inventory_status')
      .select('*')
      .eq('product_id', testProductId)
      .single();
    
    if (error) {
      error(`Inventory status check failed: ${error.message}`);
      return false;
    }
    
    success('Inventory status retrieved');
    info(`Product: ${data.product_name}`);
    info(`Total Quantity: ${data.total_quantity}`);
    info(`Reserved Quantity: ${data.reserved_quantity}`);
    info(`Available Quantity: ${data.available_quantity}`);
    info(`Stock Status: ${data.stock_status}`);
    info(`Active Reservations: ${data.active_reservations}`);
    
    return true;
  } catch (err) {
    error(`Inventory status check failed: ${err.message}`);
    return false;
  }
}

/**
 * Test 6: View active reservations
 */
async function testActiveReservations() {
  section('TEST 6: View Active Reservations');
  
  try {
    info('Fetching active reservations...');
    
    const { data, error } = await supabase
      .from('inventory_reservations')
      .select(`
        *,
        products:product_id (
          id,
          title,
          sku
        )
      `)
      .eq('status', 'active')
      .order('reserved_at', { ascending: false });
    
    if (error) {
      error(`Active reservations check failed: ${error.message}`);
      return false;
    }
    
    success(`Found ${data.length} active reservation(s)`);
    
    if (data.length > 0) {
      data.forEach((reservation, index) => {
        info(`\nReservation ${index + 1}:`);
        info(`  ID: ${reservation.id}`);
        info(`  Product: ${reservation.products?.title || 'N/A'}`);
        info(`  Quantity: ${reservation.quantity}`);
        info(`  Session: ${reservation.session_id || 'N/A'}`);
        info(`  Reserved At: ${new Date(reservation.reserved_at).toLocaleString()}`);
        info(`  Expires At: ${new Date(reservation.expires_at).toLocaleString()}`);
      });
    }
    
    return true;
  } catch (err) {
    error(`Active reservations check failed: ${err.message}`);
    return false;
  }
}

/**
 * Test 7: Release reservation
 */
async function testReleaseReservation() {
  section('TEST 7: Release Reservation');
  
  try {
    info(`Releasing reservation: ${testReservationId}`);
    
    const { error } = await supabase.rpc('release_reservation', {
      p_reservation_id: testReservationId
    });
    
    if (error) {
      error(`Release reservation failed: ${error.message}`);
      return false;
    }
    
    success('Reservation released successfully');
    
    // Verify it was released
    const { data: reservation } = await supabase
      .from('inventory_reservations')
      .select('status, released_at')
      .eq('id', testReservationId)
      .single();
    
    if (reservation) {
      info(`Status: ${reservation.status}`);
      info(`Released At: ${new Date(reservation.released_at).toLocaleString()}`);
    }
    
    return true;
  } catch (err) {
    error(`Release reservation failed: ${err.message}`);
    return false;
  }
}

/**
 * Test 8: Test insufficient inventory
 */
async function testInsufficientInventory() {
  section('TEST 8: Test Insufficient Inventory');
  
  try {
    info('Attempting to reserve more than available...');
    
    const { data, error } = await supabase.rpc('reserve_inventory', {
      p_product_id: testProductId,
      p_quantity: 999999,
      p_user_id: null,
      p_session_id: `${testSessionId}-fail`,
      p_expiration_minutes: 30
    });
    
    if (error) {
      success('Correctly rejected insufficient inventory');
      info(`Error message: ${error.message}`);
      return true;
    }
    
    error('Should have failed but succeeded - this is a problem!');
    return false;
  } catch (err) {
    success('Correctly rejected insufficient inventory');
    info(`Error: ${err.message}`);
    return true;
  }
}

/**
 * Test 9: Test expiration (simulation)
 */
async function testExpiration() {
  section('TEST 9: Test Expiration Function');
  
  try {
    info('Running expiration function...');
    
    const { data: expiredCount, error } = await supabase.rpc('expire_old_reservations');
    
    if (error) {
      error(`Expiration function failed: ${error.message}`);
      return false;
    }
    
    success(`Expiration function executed successfully`);
    info(`Expired ${expiredCount} old reservation(s)`);
    
    return true;
  } catch (err) {
    error(`Expiration test failed: ${err.message}`);
    return false;
  }
}

/**
 * Main test runner
 */
async function runTests() {
  log('\n' + '='.repeat(60), 'bold');
  log('PHASE 2: ENHANCED INVENTORY SYSTEM - TEST SUITE', 'bold');
  log('='.repeat(60) + '\n', 'bold');
  
  const results = {
    passed: 0,
    failed: 0,
    total: 9
  };
  
  // Run tests
  const tests = [
    { name: 'Database Migration', fn: testDatabaseMigration },
    { name: 'Get Test Product', fn: getTestProduct },
    { name: 'Check Availability', fn: testCheckAvailability },
    { name: 'Reserve Inventory', fn: testReserveInventory },
    { name: 'Inventory Status', fn: testInventoryStatus },
    { name: 'Active Reservations', fn: testActiveReservations },
    { name: 'Release Reservation', fn: testReleaseReservation },
    { name: 'Insufficient Inventory', fn: testInsufficientInventory },
    { name: 'Expiration Function', fn: testExpiration }
  ];
  
  for (const test of tests) {
    const result = await test.fn();
    if (result) {
      results.passed++;
    } else {
      results.failed++;
      // Stop on critical failures
      if (test.name === 'Database Migration' || test.name === 'Get Test Product') {
        log('\n❌ Critical test failed. Stopping test suite.', 'red');
        break;
      }
    }
  }
  
  // Summary
  section('TEST SUMMARY');
  log(`\nTotal Tests: ${results.total}`, 'bold');
  log(`Passed: ${results.passed}`, 'green');
  log(`Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'green');
  
  if (results.failed === 0) {
    log('\n🎉 ALL TESTS PASSED! Phase 2 is working correctly!', 'green');
    log('\n✅ Next Steps:', 'cyan');
    log('   1. Test the API endpoints via HTTP', 'cyan');
    log('   2. Integrate with frontend checkout', 'cyan');
    log('   3. Set up cron job for expiration', 'cyan');
    log('   4. Monitor reservation conversion rates\n', 'cyan');
  } else {
    log('\n⚠️  SOME TESTS FAILED', 'yellow');
    log('\nPlease check the errors above and:', 'yellow');
    log('   1. Ensure database migration was run', 'yellow');
    log('   2. Verify Supabase connection', 'yellow');
    log('   3. Check that products exist in database', 'yellow');
    log('   4. Review error messages for details\n', 'yellow');
  }
  
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(err => {
  error(`\nTest suite crashed: ${err.message}`);
  console.error(err);
  process.exit(1);
});
