/**
 * Fix Placeholder Images - Immediate Fix
 * Replaces via.placeholder.com URLs with inline SVG
 */

const { Pool } = require('pg');
require('dotenv').config({ path: '.kiro/specs/fastshop-ecommerce-platform/ecomerce_backend/.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Inline SVG placeholder (no network request needed)
const INLINE_SVG_PLACEHOLDER = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect width="400" height="400" fill="%23f0f0f0"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="24" fill="%23999"%3EProduct%3C/text%3E%3C/svg%3E';

async function fixPlaceholderImages() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking for via.placeholder.com URLs...\n');
    
    // Check current count
    const checkResult = await client.query(`
      SELECT COUNT(*) as count 
      FROM products 
      WHERE image_url LIKE '%via.placeholder.com%'
    `);
    
    const count = parseInt(checkResult.rows[0].count);
    console.log(`📊 Found ${count} products with via.placeholder.com URLs\n`);
    
    if (count === 0) {
      console.log('✅ No placeholder URLs to fix!');
      return;
    }
    
    // Show examples before fix
    const examplesResult = await client.query(`
      SELECT id, title, image_url 
      FROM products 
      WHERE image_url LIKE '%via.placeholder.com%'
      LIMIT 3
    `);
    
    console.log('📝 Examples of URLs to be fixed:');
    examplesResult.rows.forEach(row => {
      console.log(`   - ${row.title}: ${row.image_url.substring(0, 60)}...`);
    });
    console.log('');
    
    // Update all via.placeholder.com URLs
    console.log('🔧 Updating placeholder URLs...\n');
    
    const updateResult = await client.query(`
      UPDATE products 
      SET image_url = $1
      WHERE image_url LIKE '%via.placeholder.com%'
      RETURNING id, title
    `, [INLINE_SVG_PLACEHOLDER]);
    
    console.log(`✅ Updated ${updateResult.rowCount} products\n`);
    
    // Verify fix
    const verifyResult = await client.query(`
      SELECT COUNT(*) as count 
      FROM products 
      WHERE image_url LIKE '%via.placeholder.com%'
    `);
    
    const remaining = parseInt(verifyResult.rows[0].count);
    
    if (remaining === 0) {
      console.log('🎉 SUCCESS! All placeholder URLs have been fixed!');
      console.log('✅ No more via.placeholder.com URLs in database');
      console.log('✅ Using inline SVG placeholders (no network requests)');
      console.log('\n💡 The ERR_NAME_NOT_RESOLVED errors should now be gone!');
    } else {
      console.log(`⚠️  Warning: ${remaining} URLs still remain`);
    }
    
  } catch (error) {
    console.error('❌ Error fixing placeholder images:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the fix
console.log('🚀 Starting Placeholder Image Fix...\n');
console.log('📍 Target: via.placeholder.com URLs');
console.log('🎯 Solution: Inline SVG data URLs\n');

fixPlaceholderImages()
  .then(() => {
    console.log('\n✨ Fix completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fix failed:', error);
    process.exit(1);
  });
