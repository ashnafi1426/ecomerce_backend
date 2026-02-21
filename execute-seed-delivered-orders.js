/**
 * Execute Seed Delivered Orders SQL Script
 * 
 * This script creates test data with delivered orders for refund and replacement testing.
 * It updates existing sub-orders to 'delivered' status for the test customer account.
 */

const { Pool } = require('pg');
require('dotenv').config();

// Database configuration
const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'ecommerce_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres'
};

async function executeSeedScript() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║  Execute Seed Delivered Orders Script                         ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
  
  const pool = new Pool(DB_CONFIG);
  
  try {
    // Step 1: Verify test accounts exist
    console.log('Step 1: Verifying test accounts...\n');
    const customerCheck = await pool.query("SELECT id, email FROM users WHERE email = 'customer@test.com'");
    const sellerCheck = await pool.query("SELECT id, email FROM users WHERE email = 'seller@test.com'");
    
    if (customerCheck.rows.length === 0) {
      console.log('✗ WARNING: customer@test.com not found in database');
    } else {
      console.log(`✓ Found customer@test.com (ID: ${customerCheck.rows[0].id})`);
    }
    
    if (sellerCheck.rows.length === 0) {
      console.log('✗ WARNING: seller@test.com not found in database');
    } else {
      console.log(`✓ Found seller@test.com (ID: ${sellerCheck.rows[0].id})`);
    }
    
    // Step 2: Check current order status distribution
    console.log('\nStep 2: Current order status distribution...\n');
    const statusDist = await pool.query(`
      SELECT 
        fulfillment_status,
        COUNT(*) as count
      FROM sub_orders so
      JOIN orders o ON so.parent_order_id = o.id
      JOIN users u ON o.user_id = u.id
      WHERE u.email = 'customer@test.com'
      GROUP BY fulfillment_status
      ORDER BY fulfillment_status
    `);
    
    if (statusDist.rows.length > 0) {
      console.log('Current status distribution:');
      statusDist.rows.forEach(row => {
        console.log(`  ${row.fulfillment_status}: ${row.count}`);
      });
    } else {
      console.log('  No orders found for customer@test.com');
    }
    
    // Step 3: Update 3 sub-orders to 'delivered' status
    console.log('\nStep 3: Updating sub-orders to delivered status...\n');
    const updateResult = await pool.query(`
      WITH eligible_orders AS (
        SELECT 
          so.id as sub_order_id,
          so.order_id,
          so.product_id,
          p.name as product_name,
          so.fulfillment_status as current_status
        FROM sub_orders so
        JOIN orders o ON so.parent_order_id = o.id
        JOIN users u ON o.user_id = u.id
        JOIN products p ON so.product_id = p.id
        WHERE u.email = 'customer@test.com'
          AND so.fulfillment_status IN ('shipped', 'processing', 'pending')
          AND so.delivered_at IS NULL
        ORDER BY so.created_at DESC
        LIMIT 3
      ),
      updated_orders AS (
        UPDATE sub_orders
        SET 
          fulfillment_status = 'delivered',
          delivered_at = NOW() - INTERVAL '2 days',
          updated_at = NOW()
        WHERE id IN (SELECT sub_order_id FROM eligible_orders)
        RETURNING id, order_id, product_id, fulfillment_status, delivered_at
      )
      SELECT 
        uo.id as sub_order_id,
        uo.order_id,
        p.name as product_name,
        uo.fulfillment_status,
        uo.delivered_at
      FROM updated_orders uo
      JOIN products p ON uo.product_id = p.id
    `);
    
    if (updateResult.rows.length > 0) {
      console.log(`✓ Updated ${updateResult.rows.length} sub-orders to delivered status:\n`);
      updateResult.rows.forEach((order, idx) => {
        console.log(`${idx + 1}. Sub-order ID: ${order.sub_order_id}`);
        console.log(`   Order ID: ${order.order_id}`);
        console.log(`   Product: ${order.product_name}`);
        console.log(`   Status: ${order.fulfillment_status}`);
        console.log(`   Delivered: ${order.delivered_at}\n`);
      });
    } else {
      console.log('⚠ No orders were updated (may already be delivered or no eligible orders exist)');
    }
    
    // Step 4: Verify delivered orders were created
    console.log('Step 4: Verifying delivered orders...\n');
    const verifyResult = await pool.query(`
      SELECT 
        so.id as sub_order_id,
        so.order_id,
        p.name as product_name,
        so.fulfillment_status,
        so.delivered_at,
        u.email as customer_email,
        seller_user.email as seller_email
      FROM sub_orders so
      JOIN orders o ON so.parent_order_id = o.id
      JOIN users u ON o.user_id = u.id
      JOIN products p ON so.product_id = p.id
      LEFT JOIN users seller_user ON so.seller_id = seller_user.id
      WHERE u.email = 'customer@test.com'
        AND so.fulfillment_status = 'delivered'
      ORDER BY so.delivered_at DESC
      LIMIT 5
    `);
    
    if (verifyResult.rows.length > 0) {
      console.log(`✓ Found ${verifyResult.rows.length} delivered orders:\n`);
      verifyResult.rows.forEach((order, idx) => {
        console.log(`${idx + 1}. Sub-order ID: ${order.sub_order_id}`);
        console.log(`   Order ID: ${order.order_id}`);
        console.log(`   Product: ${order.product_name}`);
        console.log(`   Status: ${order.fulfillment_status}`);
        console.log(`   Delivered: ${order.delivered_at}`);
        console.log(`   Customer: ${order.customer_email}`);
        console.log(`   Seller: ${order.seller_email || 'N/A'}\n`);
      });
    } else {
      console.log('⚠ WARNING: No delivered orders found after script execution');
    }
    
    // Step 5: Summary report
    console.log('Step 5: Summary report...\n');
    const summaryResult = await pool.query(`
      SELECT 
        COUNT(*) as total_delivered_orders,
        COUNT(DISTINCT so.order_id) as unique_orders,
        COUNT(DISTINCT so.product_id) as unique_products,
        MIN(so.delivered_at) as earliest_delivery,
        MAX(so.delivered_at) as latest_delivery
      FROM sub_orders so
      JOIN orders o ON so.parent_order_id = o.id
      JOIN users u ON o.user_id = u.id
      WHERE u.email = 'customer@test.com'
        AND so.fulfillment_status = 'delivered'
    `);
    
    if (summaryResult.rows.length > 0) {
      const summary = summaryResult.rows[0];
      console.log('Summary:');
      console.log(`  Total delivered orders: ${summary.total_delivered_orders}`);
      console.log(`  Unique orders: ${summary.unique_orders}`);
      console.log(`  Unique products: ${summary.unique_products}`);
      console.log(`  Earliest delivery: ${summary.earliest_delivery}`);
      console.log(`  Latest delivery: ${summary.latest_delivery}\n`);
    }
    
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║  ✓ SUCCESS: Test data created                                  ║');
    console.log('║  Delivered orders are ready for refund/replacement testing     ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n✗ ERROR executing script:');
    console.error(error.message);
    console.error('\nDetails:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the script
executeSeedScript();
