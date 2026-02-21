/**
 * Test Script: Refund System Migration
 * 
 * This script tests the refund system database migration to ensure:
 * 1. The refund_requests table is created successfully
 * 2. All columns exist with correct data types
 * 3. All indexes are created
 * 4. All constraints are enforced
 * 5. The updated_at trigger works correctly
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database configuration
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'fastshop',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'your_password'
});

// ANSI color codes for output
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

async function runMigration() {
  log('\n========================================', 'cyan');
  log('Running Refund System Migration', 'cyan');
  log('========================================\n', 'cyan');

  try {
    const migrationPath = path.join(__dirname, 'database', 'migrations', 'refund-system.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    await pool.query(migrationSQL);
    log('✓ Migration executed successfully', 'green');
    return true;
  } catch (error) {
    log(`✗ Migration failed: ${error.message}`, 'red');
    return false;
  }
}

async function testTableExists() {
  log('\n1. Testing table existence...', 'blue');
  
  try {
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'refund_requests'
      ) as exists
    `);
    
    if (result.rows[0].exists) {
      log('   ✓ refund_requests table exists', 'green');
      return true;
    } else {
      log('   ✗ refund_requests table does not exist', 'red');
      return false;
    }
  } catch (error) {
    log(`   ✗ Error checking table: ${error.message}`, 'red');
    return false;
  }
}

async function testColumns() {
  log('\n2. Testing columns...', 'blue');
  
  const expectedColumns = [
    { name: 'id', type: 'uuid' },
    { name: 'order_id', type: 'uuid' },
    { name: 'product_id', type: 'uuid' },
    { name: 'customer_id', type: 'uuid' },
    { name: 'seller_id', type: 'uuid' },
    { name: 'reason', type: 'character varying' },
    { name: 'description', type: 'text' },
    { name: 'photo_urls', type: 'jsonb' },
    { name: 'product_price', type: 'numeric' },
    { name: 'shipping_cost', type: 'numeric' },
    { name: 'refund_amount', type: 'numeric' },
    { name: 'status', type: 'character varying' },
    { name: 'reviewed_by', type: 'uuid' },
    { name: 'reviewed_at', type: 'timestamp without time zone' },
    { name: 'rejection_reason', type: 'text' },
    { name: 'stripe_refund_id', type: 'character varying' },
    { name: 'stripe_refund_status', type: 'character varying' },
    { name: 'refund_processed_at', type: 'timestamp without time zone' },
    { name: 'seller_comments', type: 'text' },
    { name: 'created_at', type: 'timestamp without time zone' },
    { name: 'updated_at', type: 'timestamp without time zone' }
  ];
  
  try {
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'refund_requests'
      ORDER BY ordinal_position
    `);
    
    let allColumnsExist = true;
    
    for (const expected of expectedColumns) {
      const found = result.rows.find(col => col.column_name === expected.name);
      if (found) {
        if (found.data_type === expected.type) {
          log(`   ✓ Column '${expected.name}' exists with correct type (${expected.type})`, 'green');
        } else {
          log(`   ✗ Column '${expected.name}' has wrong type: ${found.data_type} (expected ${expected.type})`, 'red');
          allColumnsExist = false;
        }
      } else {
        log(`   ✗ Column '${expected.name}' is missing`, 'red');
        allColumnsExist = false;
      }
    }
    
    return allColumnsExist;
  } catch (error) {
    log(`   ✗ Error checking columns: ${error.message}`, 'red');
    return false;
  }
}

async function testIndexes() {
  log('\n3. Testing indexes...', 'blue');
  
  const expectedIndexes = [
    'idx_refund_requests_order',
    'idx_refund_requests_customer',
    'idx_refund_requests_seller',
    'idx_refund_requests_status',
    'idx_refund_requests_created_at',
    'idx_refund_requests_reviewed_by'
  ];
  
  try {
    const result = await pool.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'refund_requests'
    `);
    
    let allIndexesExist = true;
    
    for (const indexName of expectedIndexes) {
      const found = result.rows.find(idx => idx.indexname === indexName);
      if (found) {
        log(`   ✓ Index '${indexName}' exists`, 'green');
      } else {
        log(`   ✗ Index '${indexName}' is missing`, 'red');
        allIndexesExist = false;
      }
    }
    
    return allIndexesExist;
  } catch (error) {
    log(`   ✗ Error checking indexes: ${error.message}`, 'red');
    return false;
  }
}

async function testConstraints() {
  log('\n4. Testing constraints...', 'blue');
  
  try {
    // Test unique constraint
    const uniqueConstraint = await pool.query(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'refund_requests' 
      AND constraint_type = 'UNIQUE'
      AND constraint_name = 'unique_product_refund'
    `);
    
    if (uniqueConstraint.rows.length > 0) {
      log('   ✓ Unique constraint (unique_product_refund) exists', 'green');
    } else {
      log('   ✗ Unique constraint (unique_product_refund) is missing', 'red');
      return false;
    }
    
    // Test check constraint for refund_amount
    const checkConstraint = await pool.query(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'refund_requests' 
      AND constraint_type = 'CHECK'
      AND constraint_name = 'valid_refund_amount'
    `);
    
    if (checkConstraint.rows.length > 0) {
      log('   ✓ Check constraint (valid_refund_amount) exists', 'green');
    } else {
      log('   ✗ Check constraint (valid_refund_amount) is missing', 'red');
      return false;
    }
    
    return true;
  } catch (error) {
    log(`   ✗ Error checking constraints: ${error.message}`, 'red');
    return false;
  }
}

async function testTrigger() {
  log('\n5. Testing updated_at trigger...', 'blue');
  
  try {
    // First, check if we have test data (users, products, orders)
    const usersCheck = await pool.query(`SELECT id FROM users WHERE role = 'customer' LIMIT 1`);
    const sellersCheck = await pool.query(`SELECT id FROM users WHERE role = 'seller' LIMIT 1`);
    const productsCheck = await pool.query(`SELECT id FROM products LIMIT 1`);
    const ordersCheck = await pool.query(`SELECT id FROM orders LIMIT 1`);
    
    if (usersCheck.rows.length === 0 || sellersCheck.rows.length === 0 || 
        productsCheck.rows.length === 0 || ordersCheck.rows.length === 0) {
      log('   ⚠ Skipping trigger test - missing test data (users, products, or orders)', 'yellow');
      return true;
    }
    
    const customerId = usersCheck.rows[0].id;
    const sellerId = sellersCheck.rows[0].id;
    const productId = productsCheck.rows[0].id;
    const orderId = ordersCheck.rows[0].id;
    
    // Insert a test refund request
    const insertResult = await pool.query(`
      INSERT INTO refund_requests (
        order_id, product_id, customer_id, seller_id,
        reason, description, product_price, shipping_cost, refund_amount
      ) VALUES ($1, $2, $3, $4, 'quality_issue', 'Test refund request', 100.00, 10.00, 110.00)
      RETURNING id, created_at, updated_at
    `, [orderId, productId, customerId, sellerId]);
    
    const refundId = insertResult.rows[0].id;
    const initialUpdatedAt = insertResult.rows[0].updated_at;
    
    log('   ✓ Test refund request created', 'green');
    
    // Wait a moment to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Update the refund request
    await pool.query(`
      UPDATE refund_requests 
      SET status = 'approved' 
      WHERE id = $1
    `, [refundId]);
    
    // Check if updated_at changed
    const updateResult = await pool.query(`
      SELECT updated_at 
      FROM refund_requests 
      WHERE id = $1
    `, [refundId]);
    
    const newUpdatedAt = updateResult.rows[0].updated_at;
    
    // Clean up test data
    await pool.query(`DELETE FROM refund_requests WHERE id = $1`, [refundId]);
    
    if (new Date(newUpdatedAt) > new Date(initialUpdatedAt)) {
      log('   ✓ updated_at trigger works correctly', 'green');
      return true;
    } else {
      log('   ✗ updated_at trigger did not update timestamp', 'red');
      return false;
    }
  } catch (error) {
    log(`   ✗ Error testing trigger: ${error.message}`, 'red');
    return false;
  }
}

async function testConstraintEnforcement() {
  log('\n6. Testing constraint enforcement...', 'blue');
  
  try {
    // Check if we have test data
    const usersCheck = await pool.query(`SELECT id FROM users WHERE role = 'customer' LIMIT 1`);
    const sellersCheck = await pool.query(`SELECT id FROM users WHERE role = 'seller' LIMIT 1`);
    const productsCheck = await pool.query(`SELECT id FROM products LIMIT 1`);
    const ordersCheck = await pool.query(`SELECT id FROM orders LIMIT 1`);
    
    if (usersCheck.rows.length === 0 || sellersCheck.rows.length === 0 || 
        productsCheck.rows.length === 0 || ordersCheck.rows.length === 0) {
      log('   ⚠ Skipping constraint enforcement test - missing test data', 'yellow');
      return true;
    }
    
    const customerId = usersCheck.rows[0].id;
    const sellerId = sellersCheck.rows[0].id;
    const productId = productsCheck.rows[0].id;
    const orderId = ordersCheck.rows[0].id;
    
    // Test 1: Try to insert with negative refund_amount (should fail)
    try {
      await pool.query(`
        INSERT INTO refund_requests (
          order_id, product_id, customer_id, seller_id,
          reason, description, product_price, shipping_cost, refund_amount
        ) VALUES ($1, $2, $3, $4, 'quality_issue', 'Test', 100.00, 10.00, -10.00)
      `, [orderId, productId, customerId, sellerId]);
      
      log('   ✗ Constraint failed: negative refund_amount was allowed', 'red');
      return false;
    } catch (error) {
      if (error.message.includes('valid_refund_amount')) {
        log('   ✓ Constraint enforced: negative refund_amount rejected', 'green');
      } else {
        log(`   ✗ Unexpected error: ${error.message}`, 'red');
        return false;
      }
    }
    
    // Test 2: Try to insert duplicate (order_id, product_id) (should fail)
    try {
      // First insert
      const firstInsert = await pool.query(`
        INSERT INTO refund_requests (
          order_id, product_id, customer_id, seller_id,
          reason, description, product_price, shipping_cost, refund_amount
        ) VALUES ($1, $2, $3, $4, 'quality_issue', 'Test 1', 100.00, 10.00, 110.00)
        RETURNING id
      `, [orderId, productId, customerId, sellerId]);
      
      const firstId = firstInsert.rows[0].id;
      
      // Try duplicate insert
      try {
        await pool.query(`
          INSERT INTO refund_requests (
            order_id, product_id, customer_id, seller_id,
            reason, description, product_price, shipping_cost, refund_amount
          ) VALUES ($1, $2, $3, $4, 'quality_issue', 'Test 2', 100.00, 10.00, 110.00)
        `, [orderId, productId, customerId, sellerId]);
        
        // Clean up
        await pool.query(`DELETE FROM refund_requests WHERE id = $1`, [firstId]);
        
        log('   ✗ Constraint failed: duplicate (order_id, product_id) was allowed', 'red');
        return false;
      } catch (error) {
        // Clean up
        await pool.query(`DELETE FROM refund_requests WHERE id = $1`, [firstId]);
        
        if (error.message.includes('unique_product_refund')) {
          log('   ✓ Constraint enforced: duplicate (order_id, product_id) rejected', 'green');
        } else {
          log(`   ✗ Unexpected error: ${error.message}`, 'red');
          return false;
        }
      }
    } catch (error) {
      log(`   ✗ Error during constraint test: ${error.message}`, 'red');
      return false;
    }
    
    return true;
  } catch (error) {
    log(`   ✗ Error testing constraint enforcement: ${error.message}`, 'red');
    return false;
  }
}

async function runTests() {
  try {
    // Run migration
    const migrationSuccess = await runMigration();
    if (!migrationSuccess) {
      log('\n✗ Migration failed. Aborting tests.', 'red');
      process.exit(1);
    }
    
    // Run tests
    const tableExists = await testTableExists();
    const columnsCorrect = await testColumns();
    const indexesExist = await testIndexes();
    const constraintsExist = await testConstraints();
    const triggerWorks = await testTrigger();
    const constraintsEnforced = await testConstraintEnforcement();
    
    // Summary
    log('\n========================================', 'cyan');
    log('Test Summary', 'cyan');
    log('========================================\n', 'cyan');
    
    const allPassed = tableExists && columnsCorrect && indexesExist && 
                      constraintsExist && triggerWorks && constraintsEnforced;
    
    if (allPassed) {
      log('✓ All tests passed!', 'green');
      log('\nThe refund system migration is working correctly.', 'green');
    } else {
      log('✗ Some tests failed.', 'red');
      log('\nPlease review the errors above and fix the migration.', 'red');
    }
    
    log('\n========================================\n', 'cyan');
    
    process.exit(allPassed ? 0 : 1);
  } catch (error) {
    log(`\n✗ Fatal error: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the tests
runTests();
