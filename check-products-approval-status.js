const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkProducts() {
  try {
    console.log('🔍 Checking products in database...\n');

    // Get all products with their approval status
    const result = await pool.query(`
      SELECT 
        id,
        title,
        status,
        approval_status,
        seller_id,
        created_at
      FROM products
      ORDER BY created_at DESC
      LIMIT 20
    `);

    console.log(`📊 Found ${result.rows.length} products:\n`);

    result.rows.forEach((product, index) => {
      console.log(`${index + 1}. ${product.title}`);
      console.log(`   ID: ${product.id}`);
      console.log(`   Status: ${product.status}`);
      console.log(`   Approval Status: ${product.approval_status}`);
      console.log(`   Seller ID: ${product.seller_id}`);
      console.log(`   Created: ${product.created_at}`);
      console.log('');
    });

    // Count by status
    const statusCount = await pool.query(`
      SELECT 
        status,
        approval_status,
        COUNT(*) as count
      FROM products
      GROUP BY status, approval_status
      ORDER BY count DESC
    `);

    console.log('\n📈 Product counts by status:');
    statusCount.rows.forEach(row => {
      console.log(`   ${row.status} + ${row.approval_status}: ${row.count} products`);
    });

    // Check what the API would return
    const apiResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM products
      WHERE approval_status = 'approved' AND status = 'active'
    `);

    console.log(`\n✅ Products that would be returned to HomePage: ${apiResult.rows[0].count}`);

    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error);
    await pool.end();
    process.exit(1);
  }
}

checkProducts();
