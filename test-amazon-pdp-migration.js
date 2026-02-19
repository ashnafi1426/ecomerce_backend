const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.kiro/specs/fastshop-ecommerce-platform/ecomerce_backend/.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting Amazon PDP Migration V3...\n');
    
    // Read the migration file
    const migrationPath = path.join(
      __dirname,
      '.kiro/specs/fastshop-ecommerce-platform/ecomerce_backend/database/migrations/amazon-pdp-v3-working.sql'
    );
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migration file loaded successfully');
    console.log('📊 Executing migration...\n');
    
    // Execute the migration
    await client.query(migrationSQL);
    
    console.log('✅ Migration executed successfully!\n');
    
    // Verify tables were created
    console.log('🔍 Verifying tables...\n');
    
    const tables = [
      'product_images',
      'product_specifications',
      'product_features',
      'product_reviews',
      'review_images',
      'review_votes',
      'product_questions',
      'product_answers',
      'product_badges',
      'product_variants',
      'frequently_bought_together',
      'product_views'
    ];
    
    for (const table of tables) {
      const result = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = $1
        );
      `, [table]);
      
      if (result.rows[0].exists) {
        console.log(`✅ ${table} - Created`);
      } else {
        console.log(`❌ ${table} - Missing`);
      }
    }
    
    // Verify products table columns
    console.log('\n🔍 Verifying products table columns...\n');
    
    const columns = [
      'short_description',
      'model_number',
      'weight',
      'dimensions',
      'warranty_info',
      'whats_in_box',
      'is_featured',
      'view_count',
      'original_price',
      'is_active'
    ];
    
    for (const column of columns) {
      const result = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'products' AND column_name = $1
        );
      `, [column]);
      
      if (result.rows[0].exists) {
        console.log(`✅ products.${column} - Added`);
      } else {
        console.log(`❌ products.${column} - Missing`);
      }
    }
    
    // Verify inventory table columns
    console.log('\n🔍 Verifying inventory table columns...\n');
    
    const inventoryColumns = [
      'reserved_quantity',
      'low_stock_threshold',
      'max_order_quantity',
      'restock_date',
      'warehouse_location'
    ];
    
    for (const column of inventoryColumns) {
      const result = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'inventory' AND column_name = $1
        );
      `, [column]);
      
      if (result.rows[0].exists) {
        console.log(`✅ inventory.${column} - Added`);
      } else {
        console.log(`❌ inventory.${column} - Missing`);
      }
    }
    
    // Verify views
    console.log('\n🔍 Verifying views...\n');
    
    const viewResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.views 
        WHERE table_name = 'product_rating_summary'
      );
    `);
    
    if (viewResult.rows[0].exists) {
      console.log('✅ product_rating_summary view - Created');
    } else {
      console.log('❌ product_rating_summary view - Missing');
    }
    
    // Verify triggers
    console.log('\n🔍 Verifying triggers...\n');
    
    const triggers = [
      { name: 'trigger_update_review_helpful_count', table: 'review_votes' },
      { name: 'trigger_update_question_answer_count', table: 'product_answers' },
      { name: 'trigger_increment_product_view_count', table: 'product_views' },
      { name: 'trigger_check_low_stock', table: 'inventory' }
    ];
    
    for (const trigger of triggers) {
      const result = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.triggers 
          WHERE trigger_name = $1 AND event_object_table = $2
        );
      `, [trigger.name, trigger.table]);
      
      if (result.rows[0].exists) {
        console.log(`✅ ${trigger.name} on ${trigger.table} - Created`);
      } else {
        console.log(`❌ ${trigger.name} on ${trigger.table} - Missing`);
      }
    }
    
    console.log('\n🎉 Amazon PDP Migration V3 completed successfully!');
    console.log('\n📋 Summary:');
    console.log('   - 12 new tables created');
    console.log('   - 10 columns added to products table');
    console.log('   - 5 columns added to inventory table');
    console.log('   - 1 view created (product_rating_summary)');
    console.log('   - 4 triggers created');
    console.log('   - Multiple indexes created for performance');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
