/**
 * Seed Categories and Test Homepage Display
 * This script creates sample categories and tests the API
 */

const { Pool } = require('pg');
const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000';
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:Ashu%402005@localhost:5432/ecommerce_db'
});

const sampleCategories = [
  { 
    name: 'Electronics', 
    description: 'Phones, Laptops, Tablets & More', 
    icon: '📱',
    parent_id: null
  },
  { 
    name: 'Fashion', 
    description: 'Clothing, Shoes & Accessories', 
    icon: '👗',
    parent_id: null
  },
  { 
    name: 'Home & Kitchen', 
    description: 'Furniture, Appliances & Decor', 
    icon: '🏠',
    parent_id: null
  },
  { 
    name: 'Books', 
    description: 'Fiction, Non-Fiction & Educational', 
    icon: '📚',
    parent_id: null
  },
  { 
    name: 'Sports & Outdoors', 
    description: 'Fitness, Outdoor & Equipment', 
    icon: '⚽',
    parent_id: null
  },
  { 
    name: 'Beauty & Personal Care', 
    description: 'Cosmetics, Skincare & Fragrances', 
    icon: '💄',
    parent_id: null
  },
  { 
    name: 'Toys & Games', 
    description: 'Games, Puzzles & Kids Items', 
    icon: '🧸',
    parent_id: null
  },
  { 
    name: 'Automotive', 
    description: 'Car Parts & Accessories', 
    icon: '🚗',
    parent_id: null
  }
];

async function seedCategories() {
  console.log('🌱 Seeding Categories...\n');
  console.log('='.repeat(60));

  try {
    // Check if categories table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'categories'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      console.log('\n⚠️ Categories table does not exist!');
      console.log('Creating categories table...');
      
      await pool.query(`
        CREATE TABLE IF NOT EXISTS categories (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE,
          description TEXT,
          icon VARCHAR(50),
          parent_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      console.log('✅ Categories table created!');
    }

    // Check existing categories
    const existingResult = await pool.query('SELECT COUNT(*) FROM categories');
    const existingCount = parseInt(existingResult.rows[0].count);

    console.log(`\n📊 Current categories in database: ${existingCount}`);

    if (existingCount === 0) {
      console.log('\n💡 Inserting sample categories...');
      
      for (const category of sampleCategories) {
        await pool.query(
          'INSERT INTO categories (name, description, icon, parent_id) VALUES ($1, $2, $3, $4) ON CONFLICT (name) DO NOTHING',
          [category.name, category.description, category.icon, category.parent_id]
        );
        console.log(`   ✓ Added: ${category.name}`);
      }

      console.log('\n✅ Sample categories inserted!');
    } else {
      console.log('\n✓ Categories already exist in database');
    }

    // Fetch all categories
    const result = await pool.query('SELECT * FROM categories ORDER BY name');
    console.log(`\n📋 Total categories: ${result.rows.length}`);
    console.log('\nCategories in database:');
    result.rows.forEach((cat, index) => {
      console.log(`  ${index + 1}. ${cat.icon || '📦'} ${cat.name}`);
      if (cat.description) console.log(`     ${cat.description}`);
    });

  } catch (error) {
    console.error('\n❌ Error seeding categories:', error.message);
    throw error;
  }
}

async function testCategoryAPI() {
  console.log('\n\n🧪 Testing Category API...\n');
  console.log('='.repeat(60));

  try {
    console.log('\n📡 Fetching categories from API: GET /api/categories');
    const response = await axios.get(`${API_BASE_URL}/api/categories`);
    
    console.log('\n✅ API Response Status:', response.status);
    console.log('Response structure:', {
      hasData: !!response.data,
      dataType: typeof response.data,
      isArray: Array.isArray(response.data),
      hasDataProperty: response.data && !!response.data.data
    });

    let categories = [];
    if (response.data && response.data.data && Array.isArray(response.data.data)) {
      categories = response.data.data;
    } else if (Array.isArray(response.data)) {
      categories = response.data;
    }

    console.log(`\n📊 Categories returned: ${categories.length}`);
    
    if (categories.length > 0) {
      console.log('\n📋 Categories from API:');
      categories.forEach((cat, index) => {
        console.log(`  ${index + 1}. ${cat.icon || '📦'} ${cat.name} (ID: ${cat.id})`);
        if (cat.description) console.log(`     ${cat.description}`);
      });
    } else {
      console.log('\n⚠️ No categories returned from API');
    }

  } catch (error) {
    console.error('\n❌ Error testing API:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    if (error.code === 'ECONNREFUSED') {
      console.error('\n⚠️ Backend server is not running!');
      console.error('💡 Start the backend with:');
      console.error('   cd .kiro/specs/fastshop-ecommerce-platform/ecomerce_backend');
      console.error('   npm start');
    }
    throw error;
  }
}

async function main() {
  try {
    await seedCategories();
    await testCategoryAPI();
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Categories seeded and tested successfully!');
    console.log('\n💡 Next steps:');
    console.log('   1. Restart your backend server if it was running');
    console.log('   2. Open http://localhost:3001 in your browser');
    console.log('   3. Categories should now display on the homepage!');
    console.log('\n🔄 To restart backend:');
    console.log('   cd .kiro/specs/fastshop-ecommerce-platform/ecomerce_backend');
    console.log('   npm start');
    
  } catch (error) {
    console.error('\n❌ Script failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
