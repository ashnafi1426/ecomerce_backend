/**
 * Seed Categories using Supabase and Test Homepage Display
 */

const supabase = require('./config/supabase');
const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000';

const sampleCategories = [
  { 
    name: 'Electronics', 
    description: 'Phones, Laptops, Tablets & More', 
    icon: '📱'
  },
  { 
    name: 'Fashion', 
    description: 'Clothing, Shoes & Accessories', 
    icon: '👗'
  },
  { 
    name: 'Home & Kitchen', 
    description: 'Furniture, Appliances & Decor', 
    icon: '🏠'
  },
  { 
    name: 'Books', 
    description: 'Fiction, Non-Fiction & Educational', 
    icon: '📚'
  },
  { 
    name: 'Sports & Outdoors', 
    description: 'Fitness, Outdoor & Equipment', 
    icon: '⚽'
  },
  { 
    name: 'Beauty & Personal Care', 
    description: 'Cosmetics, Skincare & Fragrances', 
    icon: '💄'
  },
  { 
    name: 'Toys & Games', 
    description: 'Games, Puzzles & Kids Items', 
    icon: '🧸'
  },
  { 
    name: 'Automotive', 
    description: 'Car Parts & Accessories', 
    icon: '🚗'
  }
];

async function seedCategories() {
  console.log('🌱 Seeding Categories with Supabase...\n');
  console.log('='.repeat(60));

  try {
    // Check existing categories
    const { data: existingCategories, error: fetchError } = await supabase
      .from('categories')
      .select('*');

    if (fetchError) {
      console.error('❌ Error fetching categories:', fetchError.message);
      throw fetchError;
    }

    console.log(`\n📊 Current categories in database: ${existingCategories?.length || 0}`);

    if (!existingCategories || existingCategories.length === 0) {
      console.log('\n💡 Inserting sample categories...');
      
      for (const category of sampleCategories) {
        const { data, error } = await supabase
          .from('categories')
          .insert([category])
          .select();

        if (error) {
          // Check if it's a duplicate error
          if (error.code === '23505') {
            console.log(`   ⚠️ ${category.name} already exists, skipping...`);
          } else {
            console.error(`   ❌ Error inserting ${category.name}:`, error.message);
          }
        } else {
          console.log(`   ✓ Added: ${category.name}`);
        }
      }

      console.log('\n✅ Sample categories inserted!');
    } else {
      console.log('\n✓ Categories already exist in database');
    }

    // Fetch all categories to display
    const { data: allCategories, error: finalError } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (finalError) throw finalError;

    console.log(`\n📋 Total categories: ${allCategories?.length || 0}`);
    console.log('\nCategories in database:');
    allCategories?.forEach((cat, index) => {
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
  }
}

main();
