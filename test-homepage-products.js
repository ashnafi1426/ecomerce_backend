const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function testHomepageProducts() {
  console.log('🔍 Testing Homepage Products from Database...\n');

  try {
    // Test 1: Check total products
    console.log('📦 Test 1: Checking all products...');
    const allProductsQuery = await pool.query('SELECT COUNT(*) as total FROM products');
    console.log(`Total products in database: ${allProductsQuery.rows[0].total}`);

    // Test 2: Check approved products
    console.log('\n✅ Test 2: Checking approved products...');
    const approvedQuery = await pool.query(`
      SELECT COUNT(*) as total 
      FROM products 
      WHERE approval_status = 'approved'
    `);
    console.log(`Approved products: ${approvedQuery.rows[0].total}`);

    // Test 3: Check active products
    console.log('\n🟢 Test 3: Checking active products...');
    const activeQuery = await pool.query(`
      SELECT COUNT(*) as total 
      FROM products 
      WHERE status = 'active'
    `);
    console.log(`Active products: ${activeQuery.rows[0].total}`);

    // Test 4: Check approved AND active products (what homepage shows)
    console.log('\n🎯 Test 4: Checking approved AND active products...');
    const displayableQuery = await pool.query(`
      SELECT COUNT(*) as total 
      FROM products 
      WHERE approval_status = 'approved' AND status = 'active'
    `);
    const displayableCount = displayableQuery.rows[0].total;
    console.log(`Approved AND Active products: ${displayableCount}`);

    // Test 5: Get sample products with details
    console.log('\n📋 Test 5: Sample products...');
    const sampleQuery = await pool.query(`
      SELECT id, title, price, approval_status, status, image_url, category_id
      FROM products
      LIMIT 5
    `);
    
    console.log('\nSample products:');
    sampleQuery.rows.forEach((product, index) => {
      console.log(`\n${index + 1}. ${product.title}`);
      console.log(`   ID: ${product.id}`);
      console.log(`   Price: $${product.price}`);
      console.log(`   Approval Status: ${product.approval_status}`);
      console.log(`   Status: ${product.status}`);
      console.log(`   Has Image: ${product.image_url ? 'Yes' : 'No'}`);
      console.log(`   Category ID: ${product.category_id}`);
    });

    // Test 6: Status breakdown
    console.log('\n📊 Test 6: Status breakdown...');
    const statusQuery = await pool.query(`
      SELECT 
        approval_status,
        status,
        COUNT(*) as count
      FROM products
      GROUP BY approval_status, status
      ORDER BY count DESC
    `);
    
    console.log('\nStatus combinations:');
    statusQuery.rows.forEach(row => {
      console.log(`  ${row.approval_status} + ${row.status}: ${row.count} products`);
    });

    // Test 7: Check categories
    console.log('\n📂 Test 7: Checking categories...');
    const categoriesQuery = await pool.query('SELECT id, name FROM categories');
    console.log(`Total categories: ${categoriesQuery.rows.length}`);
    
    if (categoriesQuery.rows.length > 0) {
      console.log('\nCategories with product counts:');
      for (const category of categoriesQuery.rows) {
        const productCountQuery = await pool.query(`
          SELECT COUNT(*) as count
          FROM products
          WHERE category_id = $1 AND approval_status = 'approved' AND status = 'active'
        `, [category.id]);
        console.log(`  ${category.name}: ${productCountQuery.rows[0].count} products`);
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📋 SUMMARY');
    console.log('='.repeat(60));
    
    if (displayableCount === 0) {
      console.log('❌ ISSUE FOUND: No products are both approved AND active!');
      console.log('');
      console.log('🔧 POSSIBLE FIXES:');
      console.log('');
      console.log('Option 1: Update existing products to be approved and active');
      console.log('  Run this SQL:');
      console.log('  UPDATE products SET approval_status = \'approved\', status = \'active\';');
      console.log('');
      console.log('Option 2: Check if products need manager/admin approval');
      console.log('  - Login as admin/manager');
      console.log('  - Go to product approvals page');
      console.log('  - Approve pending products');
    } else {
      console.log(`✅ ${displayableCount} products should display on homepage`);
      console.log('');
      console.log('If products still don\'t show:');
      console.log('1. Check frontend API URL in .env');
      console.log('2. Check backend is running');
      console.log('3. Check browser console for errors');
      console.log('4. Clear browser cache');
    }

    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\n🔧 TROUBLESHOOTING:');
    console.error('1. Check DATABASE_URL in .env file');
    console.error('2. Ensure database is running');
    console.error('3. Check database connection');
    await pool.end();
    process.exit(1);
  }
}

testHomepageProducts();
